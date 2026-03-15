import { App, Button, Card, Descriptions, Form, Input, Space, Table, Tag, Timeline, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import type { EDistributionOrderRecord, EDistributionOrderStatus, OrderProductItem } from "../../shared/mocks/eDistributionOrderFlow.mock";
import { getEDistributionOrderById, reviewEDistributionOrder } from "../../shared/services/eDistributionOrderFlow.mock-service";

type ReviewFormValues = {
  remark: string;
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

export function PlatformOrderApprovalDetailPage() {
  const [form] = Form.useForm<ReviewFormValues>();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<EDistributionOrderRecord | null>(null);

  useEffect(() => {
    if (!detailId) {
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        setRecord(await getEDistributionOrderById(detailId));
      } finally {
        setLoading(false);
      }
    })();
  }, [detailId]);

  async function reloadRecord() {
    if (!detailId) {
      return;
    }
    setRecord(await getEDistributionOrderById(detailId));
  }

  async function handleReview(decision: "approve" | "reject") {
    const values = await form.validateFields();
    if (!record) {
      return;
    }

    modal.confirm({
      title: decision === "approve" ? "确认通过审批？" : "确认驳回审批？",
      content:
        decision === "approve"
          ? "通过后订单会进入下一节点或服务商待发货。"
          : record.currentApprovalType === "取消订单"
            ? "驳回后订单会回到服务商待发货。"
            : "驳回后订单会结束当前审批流。",
      okText: decision === "approve" ? "确认通过" : "确认驳回",
      cancelText: "取消",
      onOk: async () => {
        setSubmitting(true);
        try {
          await reviewEDistributionOrder({
            id: record.id,
            decision,
            remark: values.remark,
            account: user?.account ?? "admin",
            actorName: user?.name ?? "管理员",
          });
          void message.success(decision === "approve" ? "审批已通过。" : "审批已驳回。");
          form.resetFields();
          await reloadRecord();
        } finally {
          setSubmitting(false);
        }
      },
    });
  }

  function renderDownloadLink(fileName?: string) {
    if (!fileName) {
      return "-";
    }

    return (
      <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(fileName)}`} download={fileName}>
        {fileName}
      </a>
    );
  }

  const productColumns: ColumnsType<OrderProductItem> = [
    { title: "产品编码", dataIndex: "productCode", width: 150 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    { title: "效期类型", dataIndex: "healthType", width: 120 },
    { title: "单价", dataIndex: "unitPrice", width: 120, render: (value: number) => `¥ ${value.toFixed(2)}` },
    { title: "数量", dataIndex: "quantity", width: 100 },
    { title: "金额", dataIndex: "amount", width: 120, render: (value: number) => `¥ ${value.toFixed(2)}` },
  ];

  const isPending = Boolean(record?.currentApprovalType && record?.currentApprovalNode);

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate("/admin/order/platform-order-approval")}>返回列表</Button>
            <Space align="center" size={12}>
              <Typography.Title level={4} className="agreement-detail__title">
                订单审批详情
              </Typography.Title>
              {record ? <Tag color={statusColorMap[record.status]}>{record.status}</Tag> : null}
            </Space>
          </Space>
        </div>
      </Card>

      <Card className="page-card" title="订单信息" loading={loading}>
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="订单编号">{record.orderNo}</Descriptions.Item>
            <Descriptions.Item label="审批类型">{record.currentApprovalType ?? "已处理"}</Descriptions.Item>
            <Descriptions.Item label="分销商名称">{record.distributorName}</Descriptions.Item>
            <Descriptions.Item label="分销商编码">{record.distributorCode}</Descriptions.Item>
            <Descriptions.Item label="平台">{record.platformName}</Descriptions.Item>
            <Descriptions.Item label="商品总数">{record.totalQuantity}</Descriptions.Item>
            <Descriptions.Item label="订单总金额">¥ {record.orderAmount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{record.createdAt}</Descriptions.Item>
            <Descriptions.Item label="当前节点">{record.currentApprovalNode ?? "-"}</Descriptions.Item>
            {record.cancelReason ? <Descriptions.Item label="取消原因" span={2}>{record.cancelReason}</Descriptions.Item> : null}
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="服务商信息">
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="服务商名称">{record.serviceProviderName}</Descriptions.Item>
            <Descriptions.Item label="服务商编码">{record.serviceProviderCode}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="产品模块">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={record?.products ?? []}
          columns={productColumns}
          tableLayout="fixed"
          pagination={false}
          scroll={{ x: 920 }}
        />
        {record ? (
          <div style={{ marginTop: 16 }}>
            <Space size={40}>
              <Typography.Text>商品总数：{record.totalQuantity}</Typography.Text>
              <Typography.Text>订单总金额：¥ {record.orderAmount.toFixed(2)}</Typography.Text>
            </Space>
          </div>
        ) : null}
      </Card>

      <Card className="page-card" title="收货人信息">
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="收货人">{record.consigneeName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{record.consigneePhone}</Descriptions.Item>
            <Descriptions.Item label="省市区">
              {record.consigneeProvince} / {record.consigneeCity} / {record.consigneeDistrict}
            </Descriptions.Item>
            <Descriptions.Item label="邮编">{record.consigneePostalCode || "-"}</Descriptions.Item>
            <Descriptions.Item label="详细地址" span={2}>
              {record.consigneeAddress}
            </Descriptions.Item>
            {record.receipt ? (
              <>
                <Descriptions.Item label="签收单附件">{renderDownloadLink(record.receipt.receiptDocumentNo)}</Descriptions.Item>
                <Descriptions.Item label="提交时间">{record.receipt.submittedAt}</Descriptions.Item>
                <Descriptions.Item label="收货明细附件" span={2}>
                  {renderDownloadLink(record.receipt.receiptDetails)}
                </Descriptions.Item>
              </>
            ) : null}
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="审批记录">
        {record ? (
          <Timeline
            items={[
              ...record.approvalHistory.map((item) => ({
                children: (
                  <Space direction="vertical" size={4}>
                    <Typography.Text strong>{item.nodeName}</Typography.Text>
                    <Typography.Text type="secondary">
                      {item.role} · {item.actorName}（{item.account}） · {item.operatedAt}
                    </Typography.Text>
                    <Typography.Text>{item.decision}</Typography.Text>
                    <Typography.Text type="secondary">{item.remark}</Typography.Text>
                  </Space>
                ),
              })),
              ...(isPending
                ? [
                    {
                      color: "blue" as const,
                      children: (
                        <Space direction="vertical" size={12} className="agreement-detail__pending-node">
                          <Typography.Text strong>{record.currentApprovalNode}</Typography.Text>
                          <Typography.Text type="secondary" className="agreement-detail__pending-copy">
                            当前节点待审批，请填写审批备注后执行通过或驳回。
                          </Typography.Text>
                          <Form form={form} layout="vertical" initialValues={{ remark: "" }}>
                            <Form.Item name="remark" label="审批备注" rules={[{ required: true, message: "请输入审批备注" }]}>
                              <Input.TextArea rows={4} placeholder="请输入审批意见" />
                            </Form.Item>
                            <Space>
                              <Button type="primary" loading={submitting} onClick={() => void handleReview("approve")}>
                                通过
                              </Button>
                              <Button danger loading={submitting} onClick={() => void handleReview("reject")}>
                                驳回
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
