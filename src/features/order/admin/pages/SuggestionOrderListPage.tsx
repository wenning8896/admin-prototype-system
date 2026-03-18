import { App, Button, Card, Form, Input, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import type { SuggestionOrderRecord, SuggestionOrderStatus } from "../mocks/suggestionOrder.mock";
import {
  listSuggestionOrders,
  quickApproveSuggestionOrder,
  revokeSuggestionOrder,
  type SuggestionOrderFilters,
} from "../services/suggestionOrder.mock-service";

const statusColorMap: Record<SuggestionOrderStatus, string> = {
  待审批: "processing",
  审批通过: "success",
  审批驳回: "error",
  已撤销: "default",
};

export function SuggestionOrderListPage() {
  const [form] = Form.useForm<SuggestionOrderFilters>();
  const { message, modal } = App.useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SuggestionOrderRecord[]>([]);

  async function loadData(filters: SuggestionOrderFilters = {}) {
    setLoading(true);
    try {
      setItems(await listSuggestionOrders(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function handleQuickApprove(record: SuggestionOrderRecord) {
    modal.confirm({
      title: "确认一键通过该订单？",
      content: "通过后该建议订单将结束审批并进入已通过状态。",
      okText: "确认通过",
      cancelText: "取消",
      onOk: async () => {
        quickApproveSuggestionOrder({
          id: record.id,
          remark: "列表一键通过",
          reviewerAccount: user?.account ?? "admin",
          reviewerName: user?.name ?? "管理员",
        });
        void message.success("建议订单已一键通过。");
        await loadData(form.getFieldsValue());
      },
    });
  }

  function handleRevoke(record: SuggestionOrderRecord) {
    modal.confirm({
      title: "确认一键撤销该订单？",
      content: "撤销后该建议订单会结束当前流转，状态变为已撤销。",
      okText: "确认撤销",
      cancelText: "取消",
      onOk: async () => {
        revokeSuggestionOrder({
          id: record.id,
          remark: "列表一键撤销",
          reviewerAccount: user?.account ?? "admin",
          reviewerName: user?.name ?? "管理员",
        });
        void message.success("建议订单已撤销。");
        await loadData(form.getFieldsValue());
      },
    });
  }

  const columns: ColumnsType<SuggestionOrderRecord> = [
    { title: "订单编号", dataIndex: "orderNo", width: 180, fixed: "left" },
    { title: "订单产品总数（箱）", dataIndex: "orderProductTotalBoxes", width: 150 },
    {
      title: "NPS金额（元）",
      dataIndex: "orderNpsAmount",
      width: 140,
      render: (value: number) => value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
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
    { title: "经销商编码", dataIndex: "dealerCode", width: 150 },
    { title: "经销商名称", dataIndex: "dealerName", width: 240 },
    { title: "ShipTo编码", dataIndex: "shipToCode", width: 150 },
    { title: "ShipTo名称", dataIndex: "shipToName", width: 220 },
    { title: "审批节点", dataIndex: "approvalNode", width: 150 },
    { title: "创建时间", dataIndex: "createdAt", width: 170 },
    { title: "是否订单日", dataIndex: "isOrderDay", width: 110 },
    {
      title: "订单状态",
      dataIndex: "orderStatus",
      width: 120,
      render: (value: SuggestionOrderStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    { title: "更新时间", dataIndex: "updatedAt", width: 170 },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 240,
      render: (_, record) => (
        <Space size={0} wrap>
          <Button type="link" onClick={() => navigate(`/admin/order/suggestion-order-list/detail/${record.id}`)}>
            查看详情
          </Button>
          <Button type="link" disabled={record.orderStatus !== "待审批"} onClick={() => handleQuickApprove(record)}>
            一键通过
          </Button>
          <Button type="link" disabled={record.orderStatus === "已撤销"} onClick={() => handleRevoke(record)}>
            一键撤销
          </Button>
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
              <Form.Item key="orderNo" name="orderNo" label="订单编号">
                <Input allowClear placeholder="请输入订单编号" />
              </Form.Item>,
              <Form.Item key="dealerCode" name="dealerCode" label="经销商编码">
                <Input allowClear placeholder="请输入经销商编码" />
              </Form.Item>,
              <Form.Item key="dealerName" name="dealerName" label="经销商名称">
                <Input allowClear placeholder="请输入经销商名称" />
              </Form.Item>,
              <Form.Item key="shipToCode" name="shipToCode" label="ShipTo编码">
                <Input allowClear placeholder="请输入ShipTo编码" />
              </Form.Item>,
              <Form.Item key="shipToName" name="shipToName" label="ShipTo名称">
                <Input allowClear placeholder="请输入ShipTo名称" />
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
              <Form.Item key="approvalNode" name="approvalNode" label="审批节点">
                <Input allowClear placeholder="请输入审批节点" />
              </Form.Item>,
              <Form.Item key="isOrderDay" name="isOrderDay" label="是否订单日">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={[
                    { label: "是", value: "是" },
                    { label: "否", value: "否" },
                  ]}
                />
              </Form.Item>,
              <Form.Item key="orderStatus" name="orderStatus" label="订单状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={Object.keys(statusColorMap).map((item) => ({ label: item, value: item }))}
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
          <Space wrap />
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 2780 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
