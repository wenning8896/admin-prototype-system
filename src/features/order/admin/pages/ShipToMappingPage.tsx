import { App, Button, Card, Form, Input, Modal, Space, Steps, Table, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadProps } from "antd";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { ShipToMappingRecord } from "../mocks/shipToMapping.mock";
import {
  downloadShipToMappingCreateTemplate,
  downloadShipToMappingDeleteTemplate,
  exportShipToMappingRecords,
  importShipToMappingRecords,
  listShipToMappingRecords,
  type ShipToMappingFilters,
} from "../services/shipToMapping.mock-service";

type ImportMode = "create" | "delete";

export function ShipToMappingPage() {
  const [form] = Form.useForm<ShipToMappingFilters>();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ShipToMappingRecord[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>("create");
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadData(filters: ShipToMappingFilters = {}) {
    setLoading(true);
    try {
      setItems(await listShipToMappingRecords(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<ShipToMappingRecord> = [
    { title: "老ShipTo编码", dataIndex: "oldShipToCode", width: 220 },
    { title: "新ShipTo编码", dataIndex: "newShipToCode", width: 220 },
    { title: "创建时间", dataIndex: "createdAt", width: 200 },
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
      const result = await importShipToMappingRecords(selectedFile, importMode);
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
              <Form.Item key="oldShipToCode" name="oldShipToCode" label="老ShipTo编码">
                <Input allowClear placeholder="请输入老ShipTo编码" />
              </Form.Item>,
              <Form.Item key="newShipToCode" name="newShipToCode" label="新ShipTo编码">
                <Input allowClear placeholder="请输入新ShipTo编码" />
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
                exportShipToMappingRecords(items);
                void message.success("ShipTo Mapping列表已导出为 .xlsx 文件。");
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
        title={importMode === "create" ? "导入新增 ShipTo Mapping" : "导入删除 ShipTo Mapping"}
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
                    ? "老ShipTo仅允许映射到一个新ShipTo，冲突数据会被跳过"
                    : "系统会按老ShipTo编码和新ShipTo编码匹配删除映射",
              },
            ]}
          />
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Button onClick={() => (importMode === "create" ? downloadShipToMappingCreateTemplate() : downloadShipToMappingDeleteTemplate())}>
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
