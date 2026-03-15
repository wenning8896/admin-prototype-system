import { App, Button, Card, Form, Input, Modal, Select, Space, Steps, Table, Tag, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadProps } from "antd";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type {
  ServiceOwnerMaintenanceRecord,
  ServiceOwnerMaintenanceStatus,
} from "../mocks/serviceOwnerMaintenance.mock";
import {
  batchUpdateServiceOwnerMaintenanceStatus,
  downloadServiceOwnerMaintenanceTemplate,
  exportServiceOwnerMaintenance,
  importServiceOwnerMaintenance,
  listServiceOwnerMaintenance,
  type MaintenanceLabelConfig,
  type ServiceOwnerMaintenanceFilters,
} from "../services/serviceOwnerMaintenance.mock-service";

const statusColorMap: Record<ServiceOwnerMaintenanceStatus, string> = {
  启用: "success",
  停用: "default",
};

export function ServiceOwnerMaintenancePage() {
  return (
    <MaintenanceTemplate
      moduleName="服务商负责人维护"
      labels={{ codeLabel: "服务商编码", nameLabel: "服务商名称", fileBaseName: "服务商负责人维护" }}
    />
  );
}

export function LineManagerMaintenancePage() {
  return (
    <MaintenanceTemplate
      moduleName="直线经理维护"
      labels={{ codeLabel: "服务商编码", nameLabel: "服务商名称", fileBaseName: "直线经理维护" }}
    />
  );
}

export function DistributorManagerMaintenancePage() {
  return (
    <MaintenanceTemplate
      moduleName="分销经理维护"
      labels={{ codeLabel: "分销商编码", nameLabel: "分销商名称", fileBaseName: "分销经理维护" }}
    />
  );
}

function MaintenanceTemplate({
  moduleName,
  labels,
}: {
  moduleName: string;
  labels: MaintenanceLabelConfig;
}) {
  const [form] = Form.useForm<ServiceOwnerMaintenanceFilters>();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ServiceOwnerMaintenanceRecord[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadData(filters: ServiceOwnerMaintenanceFilters = {}) {
    setLoading(true);
    try {
      setItems(await listServiceOwnerMaintenance(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<ServiceOwnerMaintenanceRecord> = [
    { title: labels.codeLabel, dataIndex: "serviceProviderCode", width: 150, fixed: "left" },
    { title: labels.nameLabel, dataIndex: "serviceProviderName", width: 220 },
    { title: "负责人姓名", dataIndex: "ownerName", width: 140 },
    { title: "负责人手机号", dataIndex: "ownerPhone", width: 150 },
    { title: "雀巢账号", dataIndex: "nestleAccount", width: 160 },
    { title: "雀巢账号邮箱", dataIndex: "nestleAccountEmail", width: 240 },
    {
      title: "启用状态",
      dataIndex: "status",
      width: 120,
      render: (value: ServiceOwnerMaintenanceStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
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
      const result = await importServiceOwnerMaintenance(selectedFile, labels);
      void message.success(`导入完成，成功 ${result.successCount} 条，跳过 ${result.skippedCount} 条。`);
      setImportOpen(false);
      setSelectedFile(null);
      await loadData(form.getFieldsValue());
    } finally {
      setImporting(false);
    }
  }

  function handleBatchStatus(status: ServiceOwnerMaintenanceStatus) {
    if (selectedRowKeys.length === 0) {
      void message.warning("请先选择需要处理的记录。");
      return;
    }

    modal.confirm({
      title: `确认批量${status}`,
      content: `确认将选中的 ${selectedRowKeys.length} 条记录批量设置为${status}吗？`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        const result = await batchUpdateServiceOwnerMaintenanceStatus(
          selectedRowKeys.map((item) => String(item)),
          status,
        );
        void message.success(result);
        setSelectedRowKeys([]);
        await loadData(form.getFieldsValue());
      },
    });
  }

  function handleExport() {
    exportServiceOwnerMaintenance(items, labels);
    void message.success(`${moduleName}已导出为 .xlsx 文件。`);
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="serviceProviderCode" name="serviceProviderCode" label={labels.codeLabel}>
                <Input allowClear placeholder={`请输入${labels.codeLabel}`} />
              </Form.Item>,
              <Form.Item key="serviceProviderName" name="serviceProviderName" label={labels.nameLabel}>
                <Input allowClear placeholder={`请输入${labels.nameLabel}`} />
              </Form.Item>,
              <Form.Item key="ownerName" name="ownerName" label="负责人姓名">
                <Input allowClear placeholder="请输入负责人姓名" />
              </Form.Item>,
              <Form.Item key="status" name="status" label="启用状态">
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
                setSelectedFile(null);
                setImportOpen(true);
              }}
            >
              导入
            </Button>
            <Button onClick={handleExport}>导出</Button>
            <Button onClick={() => handleBatchStatus("启用")}>批量启用</Button>
            <Button danger onClick={() => handleBatchStatus("停用")}>
              批量停用
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          tableLayout="fixed"
          scroll={{ x: 1320 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title={`导入${moduleName}`}
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
              {
                title: "上传文件",
                description: "下载模板并填写后上传",
              },
              {
                title: "写入数据",
                description: "数据将在导入成功后写入列表",
              },
            ]}
          />
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Button onClick={() => downloadServiceOwnerMaintenanceTemplate(labels)}>
              下载导入模板（{moduleName}导入模板.xlsx）
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
