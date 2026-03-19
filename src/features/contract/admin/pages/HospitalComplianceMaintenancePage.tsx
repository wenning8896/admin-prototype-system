import { App, Button, Card, Modal, Space, Steps, Table, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadProps } from "antd";
import { useEffect, useState } from "react";
import type { HospitalComplianceRecord } from "../services/hospitalComplianceMaintenance.mock-service";
import {
  batchDeleteHospitalComplianceRecords,
  downloadHospitalComplianceTemplate,
  exportHospitalComplianceRecords,
  importHospitalComplianceRecords,
  listHospitalComplianceRecords,
} from "../services/hospitalComplianceMaintenance.mock-service";

export function HospitalComplianceMaintenancePage() {
  const { message, modal } = App.useApp();
  const [items, setItems] = useState<HospitalComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      setItems(await listHospitalComplianceRecords());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<HospitalComplianceRecord> = [
    { title: "使用产品医院ETMS-ID", dataIndex: "etmsId", width: 240 },
    { title: "创建时间", dataIndex: "createdAt", width: 180 },
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
      const result = await importHospitalComplianceRecords(selectedFile);
      void message.success(`导入完成，成功 ${result.successCount} 条，跳过 ${result.skippedCount} 条。`);
      setImportOpen(false);
      setSelectedFile(null);
      await loadData();
    } finally {
      setImporting(false);
    }
  }

  function handleBatchDelete() {
    if (selectedRowKeys.length === 0) {
      void message.warning("请先选择需要删除的记录。");
      return;
    }

    modal.confirm({
      title: "确认批量删除医院合规记录？",
      content: `确认删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      okText: "确认删除",
      cancelText: "取消",
      onOk: async () => {
        const result = await batchDeleteHospitalComplianceRecords(selectedRowKeys.map((item) => String(item)));
        void message.success(result);
        setSelectedRowKeys([]);
        await loadData();
      },
    });
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
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
            <Button onClick={handleBatchDelete} danger>
              批量删除
            </Button>
            <Button
              onClick={() => {
                exportHospitalComplianceRecords(items);
                void message.success("医院合规维护已导出为 .xlsx 文件。");
              }}
            >
              导出
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="导入医院合规维护"
        open={importOpen}
        onCancel={() => {
          if (importing) {
            return;
          }

          setImportOpen(false);
          setSelectedFile(null);
        }}
        footer={[
          <Button key="cancel" disabled={importing} onClick={() => { setImportOpen(false); setSelectedFile(null); }}>
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
              { title: "下载模板", description: "必填字段：使用产品医院ETMS-ID" },
              { title: "上传文件", description: "仅支持 .xlsx 文件" },
              { title: "完成导入", description: "已存在 ETMS-ID 会跳过" },
            ]}
          />

          <Space>
            <Button onClick={() => downloadHospitalComplianceTemplate()}>
              下载导入模板（医院合规维护导入模板.xlsx）
            </Button>
            <Upload {...uploadProps}>
              <Button>选择文件</Button>
            </Upload>
          </Space>

          <div>当前文件：{selectedFile?.name ?? "未选择文件"}</div>
        </Space>
      </Modal>
    </Space>
  );
}
