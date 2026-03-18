import { App, Button, Card, Descriptions, Empty, Form, Input, Space, Table, Tag, Timeline, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import type { SuggestionOrderAttachment, SuggestionOrderProductItem, SuggestionOrderRecord, SuggestionOrderStatus } from "../mocks/suggestionOrder.mock";
import { getSuggestionOrderById, reviewSuggestionOrder } from "../services/suggestionOrder.mock-service";

type ReviewFormValues = {
  remark: string;
};

const statusColorMap: Record<SuggestionOrderStatus, string> = {
  待审批: "processing",
  审批通过: "success",
  审批驳回: "error",
  已撤销: "default",
};

function renderDownloadLink(fileName: string) {
  return (
    <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(fileName)}`} download={fileName}>
      {fileName}
    </a>
  );
}

function SuggestionOrderDetailContent({ approvalMode }: { approvalMode: boolean }) {
  const [form] = Form.useForm<ReviewFormValues>();
  const { message, modal } = App.useApp();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<SuggestionOrderRecord | null>(null);

  useEffect(() => {
    if (!detailId) {
      return;
    }

    setLoading(true);
    const next = getSuggestionOrderById(detailId);
    setRecord(next);
    setLoading(false);
  }, [detailId]);

  async function handleReview(action: "approve" | "reject") {
    if (!record) {
      return;
    }

    const values = await form.validateFields();
    modal.confirm({
      title: action === "approve" ? "确认审批通过？" : "确认审批驳回？",
      content: action === "approve" ? "通过后建议订单将进入已通过状态。" : "驳回后建议订单将结束当前审批流。",
      okText: action === "approve" ? "确认通过" : "确认驳回",
      cancelText: "取消",
      onOk: async () => {
        setSubmitting(true);
        try {
          reviewSuggestionOrder({
            id: record.id,
            action,
            remark: values.remark,
            reviewerAccount: user?.account ?? "admin",
            reviewerName: user?.name ?? "管理员",
          });
          void message.success(action === "approve" ? "建议订单已审批通过。" : "建议订单已驳回。");
          navigate("/admin/order/suggestion-order-approval");
        } finally {
          setSubmitting(false);
        }
      },
    });
  }

  if (!record && !loading) {
    return (
      <Card className="page-card">
        <Typography.Text>未找到当前建议订单记录。</Typography.Text>
      </Card>
    );
  }

  const pendingProductColumns: ColumnsType<SuggestionOrderProductItem> = [
    {
      title: "序号",
      key: "index",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    { title: "雀巢代码", dataIndex: "nestleProductCode", width: 140 },
    { title: "产品名称", dataIndex: "productName", width: 260 },
    { title: "产品BU", dataIndex: "productBu", width: 130 },
    { title: "建议数量Avg", dataIndex: "suggestedAvgQuantity", width: 130 },
    { title: "订购数量", dataIndex: "quantity", width: 110, render: (value: number) => <span style={{ color: "#ff4d4f", fontWeight: 600 }}>{value}</span> },
    {
      title: "NPS金额（元）",
      dataIndex: "npsAmount",
      width: 140,
      render: (value: number) => value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    { title: "是否新品", dataIndex: "isNewProduct", width: 110 },
    {
      title: "订购原因分类",
      dataIndex: "orderReasonCategory",
      width: 160,
      render: (value?: string) => value ?? "-",
    },
    {
      title: "订购原因备注",
      dataIndex: "orderReasonRemark",
      width: 150,
      render: (value?: string) => value ?? "-",
    },
    { title: "建议数量Min", dataIndex: "suggestedMinQuantity", width: 130 },
    { title: "建议数量Max", dataIndex: "suggestedMaxQuantity", width: 130 },
    {
      title: "当月销量预估",
      dataIndex: "estimatedMonthlySales",
      width: 140,
      render: (value: number | null) => value ?? "--",
    },
    { title: "库存(Stock)", dataIndex: "stockQuantity", width: 120 },
    { title: "下单后预计库存天数", dataIndex: "estimatedInventoryDaysAfterOrder", width: 160 },
    {
      title: "下单时配额",
      dataIndex: "quotaOnOrder",
      width: 120,
      render: (value: number | null) => value ?? "--",
    },
  ];

  const normalProductColumns: ColumnsType<SuggestionOrderProductItem> = [
    {
      title: "序号",
      key: "index",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    { title: "雀巢代码", dataIndex: "nestleProductCode", width: 140 },
    { title: "产品名称", dataIndex: "productName", width: 260 },
    { title: "产品BU", dataIndex: "productBu", width: 130 },
    { title: "建议数量Avg", dataIndex: "suggestedAvgQuantity", width: 130 },
    { title: "订购数量", dataIndex: "quantity", width: 110 },
    {
      title: "NPS金额",
      dataIndex: "npsAmount",
      width: 140,
      render: (value: number) => value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    { title: "是否新品", dataIndex: "isNewProduct", width: 110 },
    { title: "建议数量Min", dataIndex: "suggestedMinQuantity", width: 130 },
    { title: "建议数量Max", dataIndex: "suggestedMaxQuantity", width: 130 },
    {
      title: "当月销量预估",
      dataIndex: "estimatedMonthlySales",
      width: 140,
      render: (value: number | null) => value ?? "--",
    },
    { title: "库存(Stock)", dataIndex: "stockQuantity", width: 120 },
    { title: "下单后预计库存天数", dataIndex: "estimatedInventoryDaysAfterOrder", width: 160 },
    {
      title: "下单时配额",
      dataIndex: "quotaOnOrder",
      width: 120,
      render: (value: number | null) => value ?? "--",
    },
  ];

  const attachmentColumns: ColumnsType<SuggestionOrderAttachment> = [
    {
      title: "附件名称",
      dataIndex: "fileName",
      width: 320,
      render: (value: string) => renderDownloadLink(value),
    },
    { title: "上传人", dataIndex: "uploadedBy", width: 120 },
    { title: "上传时间", dataIndex: "uploadedAt", width: 180 },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate(approvalMode ? "/admin/order/suggestion-order-approval" : "/admin/order/suggestion-order-list")}>
              返回列表
            </Button>
            <Space align="center" size={12}>
              <Typography.Title level={4} className="agreement-detail__title">
                {approvalMode ? "建议订单审批详情" : "建议订单详情"}
              </Typography.Title>
              {record ? <Tag color={statusColorMap[record.orderStatus]}>{record.orderStatus}</Tag> : null}
            </Space>
          </Space>
        </div>
      </Card>

      <Card className="page-card" title="基础信息" loading={loading}>
        {record ? (
          <Descriptions column={2} size="small" className="agreement-detail__descriptions">
            <Descriptions.Item label="订单编号">{record.orderNo}</Descriptions.Item>
            <Descriptions.Item label="订单状态">
              <Tag color={statusColorMap[record.orderStatus]}>{record.orderStatus}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="经销商客户代码 sold to">{`${record.soldToCode} | ${record.dealerName}`}</Descriptions.Item>
            <Descriptions.Item label="仓库编码 ship to">{`${record.shipToWarehouseCode} | ${record.shipToName}`}</Descriptions.Item>
            <Descriptions.Item label="大区/CG">{`${record.region} / ${record.cg}`}</Descriptions.Item>
            <Descriptions.Item label="业务单元">{record.businessUnit}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{record.createdAt}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{record.updatedAt}</Descriptions.Item>
            <Descriptions.Item label="订单NPS总金额">
              {record.orderNpsAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元
            </Descriptions.Item>
            <Descriptions.Item label="需审批产品NPS总金额">
              {record.approvalProductNpsAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元
            </Descriptions.Item>
            <Descriptions.Item label="订单产品总数">{record.orderProductTotalBoxes} 箱</Descriptions.Item>
            <Descriptions.Item label="需审批产品总数">{record.approvalProductTotalBoxes} 箱</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title={`待审批产品信息（${record?.pendingProducts.length ?? 0}）`}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={record?.pendingProducts ?? []}
          columns={pendingProductColumns}
          tableLayout="fixed"
          pagination={false}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未提交待审批产品" /> }}
          scroll={{ x: 2260 }}
        />
      </Card>

      <Card className="page-card" title={`无需审批产品信息（${record?.normalProducts.length ?? 0}）`}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={record?.normalProducts ?? []}
          columns={normalProductColumns}
          tableLayout="fixed"
          pagination={false}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未提交无需审批产品" /> }}
          scroll={{ x: 1910 }}
        />
      </Card>

      <Card className="page-card" title="订单附件信息">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={record?.attachments ?? []}
          columns={attachmentColumns}
          locale={{ emptyText: "暂无附件" }}
          tableLayout="fixed"
          pagination={false}
          scroll={{ x: 760 }}
        />
      </Card>

      <Card className="page-card" title="订单流转记录">
        {record ? (
          <Timeline
            items={[
              ...record.flowRecords.map((item) => ({
                color:
                  item.decision === "审批驳回"
                    ? "red"
                    : item.decision === "审批通过"
                      ? "green"
                      : item.decision === "一键撤销"
                        ? "gray"
                        : "blue",
                children: (
                  <Space direction="vertical" size={4}>
                    <Typography.Text strong>{item.nodeName}</Typography.Text>
                    <Typography.Text type="secondary">
                      {item.role} · {item.operatorName}（{item.account}） · {item.operatedAt}
                    </Typography.Text>
                    <Typography.Text>{item.decision}</Typography.Text>
                    <Typography.Text type="secondary">{item.remark}</Typography.Text>
                  </Space>
                ),
              })),
              ...(approvalMode && record.orderStatus === "待审批"
                ? [
                    {
                      color: "blue" as const,
                      children: (
                        <Space direction="vertical" size={12} className="agreement-detail__pending-node">
                          <Typography.Text strong>{record.approvalNode}</Typography.Text>
                          <Typography.Text type="secondary" className="agreement-detail__pending-copy">
                            当前节点待审批，请填写审批备注后执行通过或驳回。
                          </Typography.Text>
                          <Form form={form} layout="vertical" initialValues={{ remark: "" }}>
                            <Form.Item name="remark" label="审批备注" rules={[{ required: true, message: "请输入审批备注" }]}>
                              <Input.TextArea rows={4} placeholder="请输入审批意见" />
                            </Form.Item>
                            <Space>
                              <Button danger loading={submitting} onClick={() => void handleReview("reject")}>
                                驳回
                              </Button>
                              <Button type="primary" loading={submitting} onClick={() => void handleReview("approve")}>
                                通过
                              </Button>
                            </Space>
                          </Form>
                        </Space>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        ) : null}
      </Card>
    </Space>
  );
}

export function SuggestionOrderDetailPage() {
  return <SuggestionOrderDetailContent approvalMode={false} />;
}

export function SuggestionOrderApprovalDetailPage() {
  return <SuggestionOrderDetailContent approvalMode={true} />;
}
