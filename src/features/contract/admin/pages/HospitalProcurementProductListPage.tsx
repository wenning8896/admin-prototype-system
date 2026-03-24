import { App, Button, Card, Form, Input, Modal, Select, Space, Steps, Table, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadProps } from "antd";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { HospitalContractProduct } from "../../shared/mocks/hospitalContract.mock";
import {
  downloadHospitalProcurementProductTemplate,
  exportHospitalProcurementProducts,
  importHospitalProcurementProducts,
  listHospitalProcurementProducts,
  type HospitalProcurementProductFilters,
} from "../services/hospitalProcurementProduct.mock-service";

export function HospitalProcurementProductListPage() {
  const [form] = Form.useForm<HospitalProcurementProductFilters>();
  const [items, setItems] = useState<HospitalContractProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadData(filters: HospitalProcurementProductFilters = {}) {
    setLoading(true);
    try {
      setItems(await listHospitalProcurementProducts(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<HospitalContractProduct> = [
    { title: "产品编码", dataIndex: "productCode", width: 180 },
    { title: "产品名称", dataIndex: "productName", width: 260 },
    { title: "品牌", dataIndex: "brand", width: 180, render: (value?: string) => value || "-" },
    { title: "是否维护到合同", dataIndex: "maintainToContract", width: 160, render: (value?: string) => value || "-" },
    { title: "是否维护到签收单", dataIndex: "maintainToSignReceipt", width: 180, render: (value?: string) => value || "-" },
    { title: "建议价格", dataIndex: "suggestedPrice", width: 140, render: (value: number) => `¥ ${value.toFixed(2)}` },
  ];

  const uploadProps: UploadProps = {
    accept: ".xlsx",
    beforeUpload: (file) => {
      setSelectedFile(file);
      return false;
    },
    showUploadList: false,
    maxCount: 1,
  };

  async function handleImportSubmit() {
    if (!selectedFile) {
      void message.warning("请先选择需要导入的 .xlsx 文件。");
      return;
    }

    setImporting(true);
    try {
      const result = await importHospitalProcurementProducts(selectedFile);
      void message.success(`导入完成，成功 ${result.successCount} 条，跳过 ${result.skippedCount} 条。`);
      setImportOpen(false);
      setSelectedFile(null);
      await loadData(form.getFieldsValue());
    } finally {
      setImporting(false);
    }
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="productCode" name="productCode" label="产品编码">
                <Input allowClear placeholder="请输入产品编码" />
              </Form.Item>,
              <Form.Item key="productName" name="productName" label="产品名称">
                <Input allowClear placeholder="请输入产品名称" />
              </Form.Item>,
              <Form.Item key="brand" name="brand" label="品牌">
                <Input allowClear placeholder="请输入品牌" />
              </Form.Item>,
              <Form.Item key="maintainToContract" name="maintainToContract" label="是否维护到合同">
                <Select allowClear placeholder="请选择" options={["Y", "N"].map((item) => ({ label: item, value: item }))} />
              </Form.Item>,
              <Form.Item key="maintainToSignReceipt" name="maintainToSignReceipt" label="是否维护到签收单">
                <Select allowClear placeholder="请选择" options={["Y", "N"].map((item) => ({ label: item, value: item }))} />
              </Form.Item>,
              <Form.Item key="spacer" style={{ marginBottom: 0 }}>
                <span />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue())}>查询</Button>
                <Button onClick={() => { form.resetFields(); void loadData(); }}>重置</Button>
              </>
            }
          />
        </Form>
      </Card>
      <Card
        className="page-card"
        extra={
          <Space>
            <Button
              onClick={() => {
                setSelectedFile(null);
                setImportOpen(true);
              }}
            >
              导入
            </Button>
            <Button
              onClick={() => {
                exportHospitalProcurementProducts(items);
                void message.success("院采产品列表已导出为 .xlsx 文件。");
              }}
            >
              导出
            </Button>
          </Space>
        }
      >
        <Table rowKey="id" loading={loading} dataSource={items} columns={columns} tableLayout="fixed" scroll={{ x: 980 }} pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }} />
      </Card>

      <Modal
        title="导入院采产品"
        open={importOpen}
        onCancel={() => {
          if (importing) {
            return;
          }

          setImportOpen(false);
          setSelectedFile(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setImportOpen(false);
              setSelectedFile(null);
            }}
            disabled={importing}
          >
            取消
          </Button>,
          <Button key="submit" type="primary" loading={importing} onClick={() => void handleImportSubmit()}>
            上传并导入
          </Button>,
        ]}
        destroyOnHidden
      >
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <Steps
            current={0}
            items={[
              { title: "下载模板", description: "模板字段：产品编码、产品名称、品牌、是否维护到合同、是否维护到签收单、建议价格" },
              { title: "上传文件", description: "仅支持 .xlsx 文件" },
              { title: "完成导入", description: "按导入文件全量覆盖院采产品列表" },
            ]}
          />

          <Space>
            <Button onClick={() => downloadHospitalProcurementProductTemplate()}>
              下载导入模板（院采产品列表导入模板.xlsx）
            </Button>
            <Upload {...uploadProps}>
              <Button>选择文件</Button>
            </Upload>
          </Space>

          <div>
            <div>当前文件：{selectedFile?.name ?? "未选择文件"}</div>
          </div>
        </Space>
      </Modal>
    </Space>
  );
}
