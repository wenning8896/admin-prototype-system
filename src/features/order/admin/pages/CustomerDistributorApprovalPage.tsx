import { Button, Card, Form, Input, Segmented, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import {
  getCustomerDistributorDisplayStatus,
  getMergedCustomerDistributors,
  type CustomerDistributorApprovalStatus,
  type CustomerDistributorRecord,
} from "./CustomerDistributor.shared";

type ReviewTab = "pending" | "reviewed";
type ApprovalFilters = {
  distributorCode?: string;
  distributorName?: string;
  socialCreditCode?: string;
  status?: CustomerDistributorApprovalStatus;
};

const statusColorMap: Record<CustomerDistributorApprovalStatus, string> = {
  草稿: "default",
  待审批: "processing",
  已驳回: "error",
  已通过: "success",
};

export function CustomerDistributorApprovalPage() {
  const [form] = Form.useForm<ApprovalFilters>();
  const [tab, setTab] = useState<ReviewTab>("pending");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CustomerDistributorRecord[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  async function loadData(filters: ApprovalFilters = {}, nextTab: ReviewTab = tab) {
    setLoading(true);
    try {
      const code = filters.distributorCode?.trim().toLowerCase();
      const name = filters.distributorName?.trim().toLowerCase();
      const socialCreditCode = filters.socialCreditCode?.trim().toLowerCase();

      const next = getMergedCustomerDistributors().filter((item) => {
        const matchesCode = !code || item.distributorCode.toLowerCase().includes(code);
        const matchesName = !name || item.distributorName.toLowerCase().includes(name);
        const matchesSocialCreditCode = !socialCreditCode || item.socialCreditCode.toLowerCase().includes(socialCreditCode);
        const matchesStatus = !filters.status || item.approvalStatus === filters.status;

        if (nextTab === "pending") {
          return matchesCode && matchesName && matchesSocialCreditCode && item.approvalStatus === "待审批";
        }

        return (
          matchesCode &&
          matchesName &&
          matchesSocialCreditCode &&
          matchesStatus &&
          item.approvalHistory.some(
            (history) =>
              history.account === user?.account &&
              (history.decision === "审批通过" || history.decision === "审批驳回"),
          )
        );
      });

      setItems(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    setItems(getMergedCustomerDistributors().filter((item) => item.approvalStatus === "待审批"));
    setLoading(false);
  }, []);

  const columns: ColumnsType<CustomerDistributorRecord> = [
    {
      title: "分销商编码",
      dataIndex: "distributorCode",
      width: 180,
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    { title: "分销商名称", dataIndex: "distributorName", width: 220 },
    { title: "统一社会信用代码", dataIndex: "socialCreditCode", width: 220 },
    { title: "负责人名称", dataIndex: "ownerName", width: 140 },
    { title: "负责人电话", dataIndex: "ownerPhone", width: 150 },
    { title: "提交时间", dataIndex: "submittedAt", width: 160, render: (value?: string) => value || "-" },
    {
      title: "当前状态",
      width: 120,
      render: (_, record) => {
        const status = tab === "pending" ? "待审批" : getCustomerDistributorDisplayStatus(record);
        return <Tag color={statusColorMap[record.approvalStatus] ?? "default"}>{status}</Tag>;
      },
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/admin/order/distributor-approval/detail/${record.id}`)}>
          {tab === "pending" ? "去审批" : "查看详情"}
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
              <Form.Item key="distributorCode" name="distributorCode" label="分销商编码">
                <Input allowClear placeholder="请输入分销商编码" />
              </Form.Item>,
              <Form.Item key="distributorName" name="distributorName" label="分销商名称">
                <Input allowClear placeholder="请输入分销商名称" />
              </Form.Item>,
              <Form.Item key="socialCreditCode" name="socialCreditCode" label="统一社会信用代码">
                <Input allowClear placeholder="请输入统一社会信用代码" />
              </Form.Item>,
              <Form.Item key="status" name="status" label="审批状态">
                <Select
                  allowClear
                  placeholder={tab === "pending" ? "待审批" : "请选择"}
                  disabled={tab === "pending"}
                  options={[
                    { label: "待审批", value: "待审批" },
                    { label: "已驳回", value: "已驳回" },
                    { label: "已通过", value: "已通过" },
                  ]}
                />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue(), tab)}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                    void loadData({}, tab);
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
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 1320 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
