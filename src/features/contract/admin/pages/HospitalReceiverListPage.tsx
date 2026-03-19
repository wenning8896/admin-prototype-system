import { App, Button, Card, Modal, Space, Steps, Table, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadProps } from "antd";
import { useEffect, useState } from "react";
import type { HospitalReceiverListRecord } from "../services/hospitalReceiverList.mock-service";
import {
  downloadHospitalReceiverTemplate,
  exportHospitalReceiverRecords,
  importHospitalReceiverRecords,
  listHospitalReceiverRecords,
} from "../services/hospitalReceiverList.mock-service";

export function HospitalReceiverListPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState<HospitalReceiverListRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      setItems(await listHospitalReceiverRecords());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<HospitalReceiverListRecord> = [
    { title: "使用产品医院ETMS-ID", dataIndex: "etmsId", width: 220 },
    { title: "收货人姓名", dataIndex: "receiverName", width: 180 },
    { title: "收货人ID", dataIndex: "receiverId", width: 180 },
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
      const result = await importHospitalReceiverRecords(selectedFile);
      void message.success(`导入完成，成功 ${result.successCount} 条，跳过 ${result.skippedCount} 条。`);
      setImportOpen(false);
      setSelectedFile(null);
      await loadData();
    } finally {
      setImporting(false);
    }
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
            <Button
              onClick={() => {
                exportHospitalReceiverRecords(items);
                void message.success("医院收货人列表已导出为 .xlsx 文件。");
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
          pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="导入医院收货人列表"
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
              { title: "下载模板", description: "模板字段：使用产品医院ETMS-ID、收货人姓名、收货人ID" },
              { title: "上传文件", description: "仅支持 .xlsx 文件" },
              { title: "完成导入", description: "按 ETMS-ID 全量覆盖收货人" },
            ]}
          />

          <Space>
            <Button onClick={() => downloadHospitalReceiverTemplate()}>
              下载导入模板（医院收货人列表导入模板.xlsx）
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
