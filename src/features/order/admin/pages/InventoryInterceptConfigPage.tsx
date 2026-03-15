import { App, Button, Card, Form, Input, Modal, Space, Steps, Table, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadProps } from "antd";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { InventoryInterceptConfigRecord } from "../mocks/inventoryInterceptConfig.mock";
import {
  downloadInventoryInterceptCreateTemplate,
  downloadInventoryInterceptDeleteTemplate,
  exportInventoryInterceptConfigs,
  importInventoryInterceptConfigs,
  listInventoryInterceptConfigs,
  type InventoryInterceptConfigFilters,
} from "../services/inventoryInterceptConfig.mock-service";

type ImportMode = "create" | "delete";

export function InventoryInterceptConfigPage() {
  const [form] = Form.useForm<InventoryInterceptConfigFilters>();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryInterceptConfigRecord[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>("create");
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadData(filters: InventoryInterceptConfigFilters = {}) {
    setLoading(true);
    try {
      setItems(await listInventoryInterceptConfigs(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<InventoryInterceptConfigRecord> = [
    { title: "业务单元", dataIndex: "businessUnit", width: 120 },
    { title: "经销商编码", dataIndex: "dealerCode", width: 150 },
    { title: "经销商名称", dataIndex: "dealerName", width: 240 },
    { title: "ShipTo编码", dataIndex: "shipToCode", width: 160 },
    { title: "ShipTo名称", dataIndex: "shipToName", width: 180 },
    { title: "产品编码", dataIndex: "productCode", width: 160 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    { title: "创建时间", dataIndex: "createdAt", width: 180 },
  ];

  const uploadProps: UploadProps = {
    accept: ".xlsx",
    beforeUpload: (file) => {
      setSelectedFile(file);
      return false;
    },
    showUploadList: false,
  };

  async function handleImportSubmit() {
    if (!selectedFile) {
      void message.warning("请先选择需要导入的 .xlsx 文件。");
      return;
    }

    setImporting(true);
    try {
      const result = await importInventoryInterceptConfigs(selectedFile, importMode);
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
              <Form.Item key="businessUnit" name="businessUnit" label="业务单元">
                <Input allowClear placeholder="请输入业务单元" />
              </Form.Item>,
              <Form.Item key="dealerCode" name="dealerCode" label="经销商编码">
                <Input allowClear placeholder="请输入经销商编码" />
              </Form.Item>,
              <Form.Item key="dealerName" name="dealerName" label="经销商名称">
                <Input allowClear placeholder="请输入经销商名称" />
              </Form.Item>,
              <Form.Item key="shipToCode" name="shipToCode" label="ShipTo编码">
                <Input allowClear placeholder="请输入ShipTo编码" />
              </Form.Item>,
              <Form.Item key="shipToName" name="shipToName" label="ShipTo名称">
                <Input allowClear placeholder="请输入ShipTo名称" />
              </Form.Item>,
              <Form.Item key="productCode" name="productCode" label="产品编码">
                <Input allowClear placeholder="请输入产品编码" />
              </Form.Item>,
              <Form.Item key="productName" name="productName" label="产品名称">
                <Input allowClear placeholder="请输入产品名称" />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue())}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                    void loadData();
                  }}
                >
                  重置
                </Button>
              </>
            }
          />
        </Form>
      </Card>

      <Card className="page-card">
        <div className="e-distributor-page__toolbar">
          <Space wrap>
            <Button
              onClick={() => {
                setImportMode("create");
                setSelectedFile(null);
                setImportOpen(true);
              }}
            >
              导入新增
            </Button>
            <Button
              onClick={() => {
                setImportMode("delete");
                setSelectedFile(null);
                setImportOpen(true);
              }}
            >
              导入删除
            </Button>
            <Button
              onClick={() => {
                exportInventoryInterceptConfigs(items);
                void message.success("库存拦截配置已导出为 .xlsx 文件。");
              }}
            >
              导出
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title={importMode === "create" ? "导入新增库存拦截配置" : "导入删除库存拦截配置"}
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
          <Button key="submit" type="primary" onClick={() => void handleImportSubmit()} loading={importing}>
            上传并导入
          </Button>,
        ]}
        destroyOnHidden
      >
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <Steps
            current={0}
            items={[
              { title: "上传文件", description: "下载模板并填写后上传" },
              {
                title: "写入数据",
                description:
                  importMode === "create"
                    ? "按业务单元、经销商、ShipTo、产品组合写入或更新配置"
                    : "按业务单元、经销商、ShipTo、产品组合精确匹配删除",
              },
            ]}
          />
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Button onClick={() => (importMode === "create" ? downloadInventoryInterceptCreateTemplate() : downloadInventoryInterceptDeleteTemplate())}>
              下载导入模板（{importMode === "create" ? "导入新增模板.xlsx" : "导入删除模板.xlsx"}）
            </Button>
            <Space wrap>
              <Upload {...uploadProps}>
                <Button>选择文件</Button>
              </Upload>
              <span>{selectedFile ? selectedFile.name : "暂未选择文件"}</span>
            </Space>
          </Space>
        </Space>
      </Modal>
    </Space>
  );
}
