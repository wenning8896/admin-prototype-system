import { App, Button, Card, Form, Input, Segmented, Select, Space, Table, Tag, Timeline, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useAuth } from "../../../../auth/useAuth";
import type { DealerDistributorSupplyRelationRecord, DealerDistributorSupplyRelationStatus } from "../mocks/dealerDistributorSupplyRelation.mock";
import {
  listDealerDistributorSupplyRelations,
  reviewDealerDistributorSupplyRelation,
  type DealerDistributorSupplyRelationFilters,
} from "../services/dealerDistributorSupplyRelation.mock-service";
import { FilterPanel } from "../../../../app/components/FilterPanel";

type ReviewTab = "pending" | "reviewed";

const statusColorMap: Record<DealerDistributorSupplyRelationStatus, string> = {
  待审批: "processing",
  启用: "success",
  已驳回: "error",
};

export function DealerDistributorSupplyRelationApprovalPage() {
  const [form] = Form.useForm<DealerDistributorSupplyRelationFilters>();
  const [reviewForm] = Form.useForm<{ remark: string }>();
  const { message, modal } = App.useApp();
  const { user } = useAuth();
  const [tab, setTab] = useState<ReviewTab>("pending");
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string>();
  const [items, setItems] = useState<DealerDistributorSupplyRelationRecord[]>([]);

  async function loadData(filters: DealerDistributorSupplyRelationFilters = {}, nextTab: ReviewTab = tab) {
    setLoading(true);
    try {
      const all = await listDealerDistributorSupplyRelations(filters);
      const next = all.filter((item) => {
        if (nextTab === "pending") {
          return item.status === "待审批";
        }

        return item.approvalHistory.some(
          (history) =>
            history.account === user?.account &&
            (history.decision === "审批通过" || history.decision === "审批驳回"),
        );
      });
      setItems(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void (async () => {
      const next = await listDealerDistributorSupplyRelations({ status: "待审批" });
      setItems(next);
      setLoading(false);
    })();
  }, []);

  async function handleReview(record: DealerDistributorSupplyRelationRecord, action: "approve" | "reject") {
    if (!user) {
      return;
    }

    const values = await reviewForm.validateFields();
    modal.confirm({
      title: action === "approve" ? "确认审批通过？" : "确认审批驳回？",
      content: action === "approve" ? "通过后该经分供货关系将正式启用。" : "驳回后该关系将保持驳回状态，不会启用。",
      okText: action === "approve" ? "确认通过" : "确认驳回",
      cancelText: "取消",
      onOk: async () => {
        setSubmittingId(record.id);
        try {
          await reviewDealerDistributorSupplyRelation({
            id: record.id,
            action,
            remark: values.remark,
            reviewerAccount: user.account,
            reviewerName: user.name,
          });
          reviewForm.resetFields();
          void message.success(action === "approve" ? "审批已通过。" : "审批已驳回。");
          await loadData(form.getFieldsValue(), tab);
        } finally {
          setSubmittingId(undefined);
        }
      },
    });
  }

  const columns: ColumnsType<DealerDistributorSupplyRelationRecord> = [
    { title: "业务单元", dataIndex: "businessUnit", width: 120, fixed: "left" },
    { title: "经销商编码", dataIndex: "dealerCode", width: 140 },
    { title: "经销商名称", dataIndex: "dealerName", width: 200 },
    { title: "经销商类型", dataIndex: "dealerType", width: 120 },
    { title: "分销商编码", dataIndex: "distributorCode", width: 140 },
    { title: "分销商名称", dataIndex: "distributorName", width: 220 },
    {
      title: "状态",
      dataIndex: "status",
      width: 120,
      render: (value: DealerDistributorSupplyRelationStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: tab === "pending" ? 160 : 80,
      render: (_, record) =>
        tab === "pending" ? (
          <Space size={8} wrap={false}>
            <Button type="link" danger loading={submittingId === record.id} onClick={() => void handleReview(record, "reject")}>
              驳回
            </Button>
            <Button type="link" loading={submittingId === record.id} onClick={() => void handleReview(record, "approve")}>
              通过
            </Button>
          </Space>
        ) : (
          <Typography.Text type="secondary">查看记录</Typography.Text>
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

      {tab === "pending" ? (
        <Card className="page-card" title="审批备注">
          <Form form={reviewForm} layout="vertical" initialValues={{ remark: "" }}>
            <Form.Item name="remark" label="审批备注" rules={[{ required: true, message: "请输入审批备注" }]}>
              <Input.TextArea rows={3} placeholder="请输入本次审批备注" />
            </Form.Item>
          </Form>
        </Card>
      ) : null}

      <Card className="page-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 1320 }}
          expandable={
            tab === "reviewed"
              ? {
                  expandedRowRender: (record) => (
                    <Timeline
                      items={record.approvalHistory.map((item) => ({
                        color: item.decision === "审批驳回" ? "red" : item.decision === "审批通过" ? "green" : "blue",
                        children: (
                          <Space direction="vertical" size={2}>
                            <Typography.Text strong>
                              {item.operatorName}（{item.account}）
                            </Typography.Text>
                            <Typography.Text type="secondary">{item.actedAt}</Typography.Text>
                            <Typography.Text>{item.decision}</Typography.Text>
                            <Typography.Text type="secondary">审批备注：{item.remark || "-"}</Typography.Text>
                          </Space>
                        ),
                      }))}
                    />
                  ),
                }
              : undefined
          }
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
