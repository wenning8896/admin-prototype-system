import { Button, Card, Form, Input, Segmented, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import type { SignReceiptRecord } from "../../shared/mocks/signReceipt.mock";
import { listSignReceiptApprovals, type SignReceiptFilters } from "../../shared/services/signReceipt.mock-service";

type ReviewTab = "pending" | "reviewed";

const statusColorMap: Record<string, string> = {
  待上传: "default",
  待审批: "processing",
  审批通过: "success",
  审批驳回: "error",
};

export function SignReceiptApprovalPage() {
  const [form] = Form.useForm<SignReceiptFilters>();
  const [tab, setTab] = useState<ReviewTab>("pending");
  const [items, setItems] = useState<SignReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const actorAccount = useMemo(() => user?.account ?? "admin", [user?.account]);

  const loadData = useCallback(async (filters: SignReceiptFilters = {}, nextTab: ReviewTab = tab) => {
    setLoading(true);
    try {
      setItems(await listSignReceiptApprovals(nextTab, actorAccount, filters));
    } finally {
      setLoading(false);
    }
  }, [actorAccount, tab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const columns: ColumnsType<SignReceiptRecord> = [
    { title: "合同编号", dataIndex: "contractNo", width: 180 },
    { title: "经销商编码", dataIndex: "dealerCode", width: 160 },
    { title: "经销商名称", dataIndex: "dealerName", width: 220 },
    { title: "DMS医院编码", dataIndex: "dmsHospitalCode", width: 180 },
    { title: "DMS医院名称", dataIndex: "dmsHospitalName", width: 220 },
    { title: "收货人姓名", dataIndex: "receiverName", width: 160 },
    { title: "审批状态", dataIndex: "status", width: 120, render: (value: string) => <Tag color={statusColorMap[value]}>{value}</Tag> },
    { title: "审批节点", dataIndex: "approvalNode", width: 140, render: (value?: string) => value ? <Tag color="processing">{value}</Tag> : "-" },
    { title: "申请时间", dataIndex: "uploadedAt", width: 170, render: (value?: string) => value ?? "-" },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/admin/contract/sign-receipt-approval/detail/${record.id}`)}>
          {tab === "pending" ? "去审批" : "查看"}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <Segmented
          value={tab}
          options={[
            { label: "待我审批", value: "pending" },
            { label: "我已审批", value: "reviewed" },
          ]}
          onChange={(value) => {
            const nextTab = value as ReviewTab;
            setTab(nextTab);
            void loadData(form.getFieldsValue(), nextTab);
          }}
        />
      </Card>

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
                <Select allowClear placeholder="请选择" options={["待审批", "审批通过", "审批驳回"].map((item) => ({ label: item, value: item }))} />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue(), tab)}>查询</Button>
                <Button onClick={() => { form.resetFields(); void loadData({}, tab); }}>重置</Button>
              </>
            }
          />
        </Form>
      </Card>

      <Card className="page-card">
        <Table rowKey="id" loading={loading} dataSource={items} columns={columns} tableLayout="fixed" scroll={{ x: 1680 }} pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }} />
      </Card>
    </Space>
  );
}
