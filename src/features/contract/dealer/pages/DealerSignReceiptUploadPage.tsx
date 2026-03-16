import { App, Button, Card, Form, Input, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { SignReceiptRecord } from "../../shared/mocks/signReceipt.mock";
import { listDealerSignReceiptRecords, type SignReceiptFilters } from "../../shared/services/signReceipt.mock-service";

const statusColorMap: Record<string, string> = {
  待上传: "default",
  待审批: "processing",
  审批通过: "success",
  审批驳回: "error",
};

export function DealerSignReceiptUploadPage() {
  const [form] = Form.useForm<SignReceiptFilters>();
  const [items, setItems] = useState<SignReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { message } = App.useApp();

  async function loadData(filters: SignReceiptFilters = {}) {
    setLoading(true);
    try {
      setItems(await listDealerSignReceiptRecords(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<SignReceiptRecord> = [
    { title: "合同编号", dataIndex: "contractNo", width: 180 },
    { title: "DMS医院编码", dataIndex: "dmsHospitalCode", width: 180 },
    { title: "DMS医院名称", dataIndex: "dmsHospitalName", width: 220 },
    { title: "收货人姓名", dataIndex: "receiverName", width: 160 },
    { title: "收货人ID", dataIndex: "receiverId", width: 140 },
    { title: "审批状态", dataIndex: "status", width: 120, render: (value: string) => <Tag color={statusColorMap[value]}>{value}</Tag> },
    { title: "上传时间", dataIndex: "uploadedAt", width: 170, render: (value?: string) => value ?? "-" },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" onClick={() => navigate(`/dealer/contract/dealer-sign-receipt-upload/detail/${record.id}`)}>
            查看
          </Button>
          {(record.status === "待上传" || record.status === "审批驳回") ? (
            <Button type="link" onClick={() => navigate(`/dealer/contract/dealer-sign-receipt-upload/detail/${record.id}`, { state: { mode: "edit" } })}>
              {record.status === "审批驳回" ? "重新上传" : "去上传"}
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="contractNo" name="contractNo" label="合同编号">
                <Input allowClear placeholder="请输入合同编号" />
              </Form.Item>,
              <Form.Item key="dealerCode" name="dealerCode" label="经销商编码">
                <Input allowClear placeholder="请输入经销商编码" />
              </Form.Item>,
              <Form.Item key="hospitalCode" name="hospitalCode" label="DMS医院编码">
                <Input allowClear placeholder="请输入DMS医院编码" />
              </Form.Item>,
              <Form.Item key="status" name="status" label="审批状态">
                <Select allowClear placeholder="请选择" options={["待上传", "待审批", "审批通过", "审批驳回"].map((item) => ({ label: item, value: item }))} />
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

      <Card className="page-card" extra={<Button onClick={() => void message.info("签收单上传页会从审批通过的合同自动带出。")}>上传规则说明</Button>}>
        <Table rowKey="id" loading={loading} dataSource={items} columns={columns} tableLayout="fixed" scroll={{ x: 1380 }} pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }} />
      </Card>
    </Space>
  );
}
