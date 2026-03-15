import { Button, Card, Form, Input, Segmented, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import type { ApprovalType, EDistributionOrderRecord, EDistributionOrderStatus } from "../../shared/mocks/eDistributionOrderFlow.mock";
import { listEDistributionOrders } from "../../shared/services/eDistributionOrderFlow.mock-service";

type ReviewTab = "pending" | "reviewed";
type ApprovalFilters = {
  keyword?: string;
  approvalType?: ApprovalType;
  status?: EDistributionOrderStatus;
};

const statusColorMap: Record<EDistributionOrderStatus, string> = {
  待审批: "processing",
  待发货: "gold",
  待收货: "blue",
  收货待确认: "cyan",
  收货待重新提交: "warning",
  已完成: "success",
  取消确认中: "orange",
  取消待审批: "volcano",
  已取消: "default",
};

export function PlatformOrderApprovalPage() {
  const [form] = Form.useForm<ApprovalFilters>();
  const [tab, setTab] = useState<ReviewTab>("pending");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EDistributionOrderRecord[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  async function loadData(filters: ApprovalFilters = {}, nextTab: ReviewTab = tab) {
    setLoading(true);
    try {
      const keyword = filters.keyword?.trim().toLowerCase();
      const all = await listEDistributionOrders();
      setItems(
        all.filter((item) => {
          const matchesKeyword =
            !keyword ||
            item.orderNo.toLowerCase().includes(keyword) ||
            item.distributorName.toLowerCase().includes(keyword) ||
            item.serviceProviderName.toLowerCase().includes(keyword);
          const matchesType = !filters.approvalType || item.currentApprovalType === filters.approvalType;
          const matchesStatus = !filters.status || item.status === filters.status;

          if (nextTab === "pending") {
            return matchesKeyword && matchesType && matchesStatus && Boolean(item.currentApprovalType);
          }

          return (
            matchesKeyword &&
            matchesType &&
            matchesStatus &&
            item.approvalHistory.some(
              (history) =>
                history.role === "管理员" &&
                history.account === user?.account &&
                (history.decision === "审批通过" || history.decision === "审批驳回"),
            )
          );
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const all = await listEDistributionOrders();
        setItems(all.filter((item) => Boolean(item.currentApprovalType)));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: ColumnsType<EDistributionOrderRecord> = [
    { title: "订单编号", dataIndex: "orderNo", width: 180 },
    {
      title: "审批类型",
      dataIndex: "currentApprovalType",
      width: 120,
      render: (value: ApprovalType | undefined) => value ?? "已处理",
    },
    { title: "分销商名称", dataIndex: "distributorName", width: 220 },
    { title: "服务商", dataIndex: "serviceProviderName", width: 180 },
    { title: "订单金额", dataIndex: "orderAmount", width: 120, render: (value: number) => `¥ ${value.toFixed(2)}` },
    { title: "当前节点", dataIndex: "currentApprovalNode", width: 160, render: (value?: string) => value ? <Tag>{value}</Tag> : "-" },
    {
      title: "订单状态",
      dataIndex: "status",
      width: 140,
      render: (value: EDistributionOrderStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 140,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/admin/order/platform-order-approval/detail/${record.id}`)}>
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
              <Form.Item key="keyword" name="keyword" label="订单编号 / 分销商 / 服务商">
                <Input allowClear placeholder="请输入关键词" />
              </Form.Item>,
              <Form.Item key="approvalType" name="approvalType" label="审批类型">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={[
                    { label: "新建订单", value: "新建订单" },
                    { label: "取消订单", value: "取消订单" },
                  ]}
                />
              </Form.Item>,
              <Form.Item key="status" name="status" label="订单状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={Object.keys(statusColorMap).map((item) => ({ label: item, value: item }))}
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
          scroll={{ x: 1380 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
