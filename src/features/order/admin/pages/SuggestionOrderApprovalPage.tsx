import { Button, Card, Form, Input, Segmented, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import type { SuggestionOrderRecord, SuggestionOrderStatus } from "../mocks/suggestionOrder.mock";
import {
  hasSuggestionOrderReviewedByAccount,
  listSuggestionOrders,
  type SuggestionOrderFilters,
} from "../services/suggestionOrder.mock-service";

type ReviewTab = "pending" | "reviewed";

const statusColorMap: Record<SuggestionOrderStatus, string> = {
  待审批: "processing",
  审批通过: "success",
  审批驳回: "error",
  已撤销: "default",
};

export function SuggestionOrderApprovalPage() {
  const [form] = Form.useForm<SuggestionOrderFilters>();
  const [tab, setTab] = useState<ReviewTab>("pending");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SuggestionOrderRecord[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  async function loadData(filters: SuggestionOrderFilters = {}, nextTab: ReviewTab = tab) {
    setLoading(true);
    try {
      const all = await listSuggestionOrders(filters);
      setItems(
        all.filter((item) => {
          if (nextTab === "pending") {
            return item.orderStatus === "待审批";
          }

          return hasSuggestionOrderReviewedByAccount(item, user?.account);
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
        const all = await listSuggestionOrders();
        setItems(all.filter((item) => item.orderStatus === "待审批"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: ColumnsType<SuggestionOrderRecord> = [
    { title: "订单编号", dataIndex: "orderNo", width: 180 },
    { title: "需审批产品总数（箱）", dataIndex: "approvalProductTotalBoxes", width: 170 },
    {
      title: "需审批产品NPS总金额（元）",
      dataIndex: "approvalProductNpsAmount",
      width: 200,
      render: (value: number) => value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    { title: "业务单元", dataIndex: "businessUnit", width: 120 },
    { title: "大区", dataIndex: "region", width: 140 },
    { title: "CG", dataIndex: "cg", width: 120 },
    { title: "经销商名称", dataIndex: "dealerName", width: 220 },
    { title: "ShipTo名称", dataIndex: "shipToName", width: 220 },
    { title: "审批节点", dataIndex: "approvalNode", width: 150 },
    { title: "创建时间", dataIndex: "createdAt", width: 170 },
    {
      title: "订单状态",
      dataIndex: "orderStatus",
      width: 120,
      render: (value: SuggestionOrderStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/admin/order/suggestion-order-approval/detail/${record.id}`)}>
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
              <Form.Item key="orderNo" name="orderNo" label="订单编号">
                <Input allowClear placeholder="请输入订单编号" />
              </Form.Item>,
              <Form.Item key="dealerName" name="dealerName" label="经销商名称">
                <Input allowClear placeholder="请输入经销商名称" />
              </Form.Item>,
              <Form.Item key="dealerCode" name="dealerCode" label="经销商编码">
                <Input allowClear placeholder="请输入经销商编码" />
              </Form.Item>,
              <Form.Item key="businessUnit" name="businessUnit" label="业务单元">
                <Input allowClear placeholder="请输入业务单元" />
              </Form.Item>,
              <Form.Item key="region" name="region" label="大区">
                <Input allowClear placeholder="请输入大区" />
              </Form.Item>,
              <Form.Item key="cg" name="cg" label="CG">
                <Input allowClear placeholder="请输入CG" />
              </Form.Item>,
              <Form.Item key="shipToName" name="shipToName" label="ShipTo名称">
                <Input allowClear placeholder="请输入ShipTo名称" />
              </Form.Item>,
              <Form.Item key="orderStatus" name="orderStatus" label="订单状态">
                <Select
                  allowClear
                  placeholder={tab === "pending" ? "待审批" : "请选择"}
                  disabled={tab === "pending"}
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
          scroll={{ x: 1700 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
