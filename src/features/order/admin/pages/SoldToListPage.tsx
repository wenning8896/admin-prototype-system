import { App, Button, Card, Form, Input, Modal, Select, Space, Steps, Table, Tag, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadProps } from "antd";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { SoldToRecord, SoldToStatus } from "../mocks/soldTo.mock";
import {
  downloadSoldToCreateTemplate,
  downloadSoldToDisableTemplate,
  exportSoldToRecords,
  importSoldToRecords,
  listSoldToRecords,
  type SoldToFilters,
} from "../services/soldTo.mock-service";

const statusColorMap: Record<SoldToStatus, string> = {
  启用: "success",
  停用: "default",
};

type ImportMode = "create" | "disable";

export function SoldToListPage() {
  const [form] = Form.useForm<SoldToFilters>();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SoldToRecord[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>("create");
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadData(filters: SoldToFilters = {}) {
    setLoading(true);
    try {
      setItems(await listSoldToRecords(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<SoldToRecord> = [
    {
      title: "业务单元",
      dataIndex: "businessUnit",
      width: 140,
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    { title: "大区", dataIndex: "region", width: 160 },
    { title: "CG", dataIndex: "cg", width: 120 },
    { title: "经销商编码", dataIndex: "dealerCode", width: 160 },
    { title: "经销商名称", dataIndex: "dealerName", width: 320 },
    {
      title: "状态",
      dataIndex: "status",
      width: 120,
      render: (value: SoldToStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
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
      const result = await importSoldToRecords(selectedFile, importMode);
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
              <Form.Item key="region" name="region" label="大区">
                <Input allowClear placeholder="请输入大区" />
              </Form.Item>,
              <Form.Item key="cg" name="cg" label="CG">
                <Input allowClear placeholder="请输入CG" />
              </Form.Item>,
              <Form.Item key="dealerCode" name="dealerCode" label="经销商编码">
                <Input allowClear placeholder="请输入经销商编码" />
              </Form.Item>,
              <Form.Item key="dealerName" name="dealerName" label="经销商名称">
                <Input allowClear placeholder="请输入经销商名称" />
              </Form.Item>,
              <Form.Item key="status" name="status" label="状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={[
                    { label: "启用", value: "启用" },
                    { label: "停用", value: "停用" },
                  ]}
                />
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
                setImportMode("disable");
                setSelectedFile(null);
                setImportOpen(true);
              }}
            >
              导入停用
            </Button>
            <Button
              onClick={() => {
                exportSoldToRecords(items);
                void message.success("SoldTo列表已导出为 .xlsx 文件。");
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
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title={importMode === "create" ? "导入新增 SoldTo" : "导入停用 SoldTo"}
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
              { title: "写入数据", description: importMode === "create" ? "数据将写入新增 SoldTo 列表" : "数据将按模板内容写入停用状态" },
            ]}
          />
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Button onClick={() => (importMode === "create" ? downloadSoldToCreateTemplate() : downloadSoldToDisableTemplate())}>
              下载导入模板（{importMode === "create" ? "导入新增模板.xlsx" : "导入停用模板.xlsx"}）
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
