import { App, Button, Card, Form, Input, Modal, Select, Space, Steps, Table, Tag, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadProps } from "antd";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { DealerDistributorSupplyRelationRecord, DealerDistributorSupplyRelationStatus } from "../mocks/dealerDistributorSupplyRelation.mock";
import {
  batchDeleteDealerDistributorSupplyRelations,
  downloadDealerDistributorSupplyRelationTemplate,
  exportDealerDistributorSupplyRelations,
  importDealerDistributorSupplyRelations,
  listDealerDistributorSupplyRelations,
  type DealerDistributorSupplyRelationFilters,
} from "../services/dealerDistributorSupplyRelation.mock-service";

const statusColorMap: Record<DealerDistributorSupplyRelationStatus, string> = {
  待审批: "processing",
  启用: "success",
  已驳回: "error",
};

export function DealerDistributorSupplyRelationPage() {
  const [form] = Form.useForm<DealerDistributorSupplyRelationFilters>();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DealerDistributorSupplyRelationRecord[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadData(filters: DealerDistributorSupplyRelationFilters = {}) {
    setLoading(true);
    try {
      setItems(await listDealerDistributorSupplyRelations(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<DealerDistributorSupplyRelationRecord> = [
    { title: "业务单元", dataIndex: "businessUnit", width: 120, fixed: "left" },
    { title: "经销商编码", dataIndex: "dealerCode", width: 150 },
    { title: "经销商名称", dataIndex: "dealerName", width: 220 },
    { title: "经销商类型", dataIndex: "dealerType", width: 120 },
    { title: "分销商编码", dataIndex: "distributorCode", width: 150 },
    { title: "分销商名称", dataIndex: "distributorName", width: 220 },
    {
      title: "状态",
      dataIndex: "status",
      width: 120,
      render: (value: DealerDistributorSupplyRelationStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
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
      const result = await importDealerDistributorSupplyRelations(selectedFile);
      void message.success(`导入完成，成功 ${result.successCount} 条，跳过 ${result.skippedCount} 条。`);
      setImportOpen(false);
      setSelectedFile(null);
      await loadData(form.getFieldsValue());
    } finally {
      setImporting(false);
    }
  }

  function handleBatchDelete() {
    if (selectedRowKeys.length === 0) {
      void message.warning("请先选择需要删除的关系。");
      return;
    }

    modal.confirm({
      title: "确认批量删除",
      content: `确认删除选中的 ${selectedRowKeys.length} 条经分供货关系吗？`,
      okText: "确认删除",
      cancelText: "取消",
      onOk: async () => {
        const result = await batchDeleteDealerDistributorSupplyRelations(selectedRowKeys.map((item) => String(item)));
        void message.success(result);
        setSelectedRowKeys([]);
        await loadData(form.getFieldsValue());
      },
    });
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
              <Form.Item key="distributorCode" name="distributorCode" label="分销商编码">
                <Input allowClear placeholder="请输入分销商编码" />
              </Form.Item>,
              <Form.Item key="distributorName" name="distributorName" label="分销商名称">
                <Input allowClear placeholder="请输入分销商名称" />
              </Form.Item>,
              <Form.Item key="dealerType" name="dealerType" label="经销商类型">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={[
                    { label: "经销商", value: "经销商" },
                    { label: "DT经销商", value: "DT经销商" },
                  ]}
                />
              </Form.Item>,
              <Form.Item key="status" name="status" label="状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={[
                    { label: "待审批", value: "待审批" },
                    { label: "启用", value: "启用" },
                    { label: "已驳回", value: "已驳回" },
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
            <Button
              onClick={() => {
                exportDealerDistributorSupplyRelations(items);
                void message.success("经分供货关系已导出为 .xlsx 文件。");
              }}
            >
              导出
            </Button>
            <Button danger onClick={handleBatchDelete}>
              批量删除
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
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="导入经分供货关系"
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
              { title: "写入数据", description: "导入后的每条关系默认进入待审批状态" },
            ]}
          />
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Button onClick={() => downloadDealerDistributorSupplyRelationTemplate()}>
              下载导入模板（经分供货关系导入模板.xlsx）
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
