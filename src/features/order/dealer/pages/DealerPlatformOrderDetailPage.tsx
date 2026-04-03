import { App, Button, Card, Descriptions, Form, Input, Modal, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import type {
  EDistributionOrderRecord,
  EDistributionOrderStatus,
  OrderFulfillmentItem,
  OrderProductItem,
} from "../../shared/mocks/eDistributionOrderFlow.mock";
import {
  getEDistributionOrderById,
  requestOrderCancellation,
  reviewOrderReceipt,
  shipEDistributionOrder,
} from "../../shared/services/eDistributionOrderFlow.mock-service";

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

export function DealerPlatformOrderDetailPage() {
  const [cancelForm] = Form.useForm<{ remark: string }>();
  const [receiptReviewForm] = Form.useForm<{ remark: string }>();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [record, setRecord] = useState<EDistributionOrderRecord | null>(null);
  const [shipOpen, setShipOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

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

  async function handleShip(type: "full" | "partial") {
    if (!record) {
      return;
    }
    setShipping(true);
    try {
      await shipEDistributionOrder({
        id: record.id,
        shipmentType: type,
        remark: type === "full" ? "服务商已完成全部发货。" : "已调用第三方同步部分发货结果。",
        account: user?.account ?? "dealer",
        actorName: user?.name ?? "服务商",
      });
      void message.success(type === "full" ? "订单已全部发货，状态更新为待收货。" : "已同步部分发货结果，订单仍保持待发货。");
      setShipOpen(false);
      await reloadRecord();
    } finally {
      setShipping(false);
    }
  }

  async function handleCancel() {
    if (!record) {
      return;
    }
    const values = await cancelForm.validateFields();
    setCanceling(true);
    try {
      await requestOrderCancellation({
        id: record.id,
        remark: values.remark,
        account: user?.account ?? "dealer",
        actorName: user?.name ?? "服务商",
      });
      void message.success("取消订单申请已提交，待分销商确认。");
      setCancelOpen(false);
      cancelForm.resetFields();
      await reloadRecord();
    } finally {
      setCanceling(false);
    }
  }

  async function handleReceiptReview(decision: "approve" | "reject") {
    if (!record) {
      return;
    }
    const values = await receiptReviewForm.validateFields();
    modal.confirm({
      title: decision === "approve" ? "确认通过收货？" : "确认驳回收货？",
      okText: decision === "approve" ? "确认通过" : "确认驳回",
      cancelText: "取消",
      onOk: async () => {
        setReviewing(true);
        try {
          await reviewOrderReceipt({
            id: record.id,
            decision,
            remark: values.remark,
            account: user?.account ?? "dealer",
            actorName: user?.name ?? "服务商",
          });
          void message.success(decision === "approve" ? "收货确认通过，订单已完成。" : "已驳回收货，待分销商重新提交。");
          setReceiptOpen(false);
          receiptReviewForm.resetFields();
          await reloadRecord();
        } finally {
          setReviewing(false);
        }
      },
    });
  }

  const productColumns: ColumnsType<OrderProductItem> = [
    { title: "产品编码", dataIndex: "productCode", width: 150 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    { title: "效期类型", dataIndex: "healthType", width: 120 },
    { title: "单价", dataIndex: "unitPrice", width: 120, render: (value: number) => `¥ ${value.toFixed(2)}` },
    { title: "数量", dataIndex: "quantity", width: 100 },
    { title: "金额", dataIndex: "amount", width: 120, render: (value: number) => `¥ ${value.toFixed(2)}` },
  ];

  const fulfillmentColumns: ColumnsType<OrderFulfillmentItem> = [
    { title: "产品编码", dataIndex: "productCode", width: 150 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    { title: "效期类型", dataIndex: "healthType", width: 140 },
    { title: "批次号", dataIndex: "batchNo", width: 180 },
    { title: "数量", dataIndex: "quantity", width: 100 },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate("/dealer/order/dealer-platform-order-list")}>返回列表</Button>
            <Space align="center" size={12}>
              <Typography.Title level={4} className="agreement-detail__title">
                订单详情
              </Typography.Title>
              {record ? <Tag color={statusColorMap[record.status]}>{record.status}</Tag> : null}
            </Space>
          </Space>
          <Space>
            {record?.status === "待发货" ? (
              <>
                <Button onClick={() => setShipOpen(true)}>去发货</Button>
                <Button danger onClick={() => setCancelOpen(true)}>申请取消</Button>
              </>
            ) : null}
            {record?.status === "收货待确认" ? (
              <Button type="primary" onClick={() => setReceiptOpen(true)}>
                确认收货
              </Button>
            ) : null}
          </Space>
        </div>
      </Card>

      <Card className="page-card" title="订单信息" loading={loading}>
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="订单编号">{record.orderNo}</Descriptions.Item>
            <Descriptions.Item label="平台">{record.platformName}</Descriptions.Item>
            <Descriptions.Item label="分销商名称">{record.distributorName}</Descriptions.Item>
            <Descriptions.Item label="分销商编码">{record.distributorCode}</Descriptions.Item>
            <Descriptions.Item label="商品总数">{record.totalQuantity}</Descriptions.Item>
            <Descriptions.Item label="订单总金额">¥ {record.orderAmount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{record.createdAt}</Descriptions.Item>
            <Descriptions.Item label="订单状态">
              <Tag color={statusColorMap[record.status]}>{record.status}</Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="付款信息">
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="付款证明">{renderDownloadLink(record.paymentProof)}</Descriptions.Item>
            <Descriptions.Item label="付款备注">-</Descriptions.Item>
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
        <Table rowKey="id" loading={loading} dataSource={record?.products ?? []} columns={productColumns} tableLayout="fixed" pagination={false} scroll={{ x: 920 }} />
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
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="收货信息">
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="发货时间">{record.shippedAt ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="签收提交时间">{record.receipt?.submittedAt ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="签收单附件">{renderDownloadLink(record.receipt?.receiptDocumentNo)}</Descriptions.Item>
            <Descriptions.Item label="收货明细附件">{renderDownloadLink(record.receipt?.receiptDetails)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="发货明细">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={record?.shipmentDetails ?? []}
          columns={fulfillmentColumns}
          tableLayout="fixed"
          pagination={false}
          locale={{ emptyText: "暂无发货明细" }}
          scroll={{ x: 920 }}
        />
      </Card>

      <Card className="page-card" title="收货明细">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={record?.receivingDetails ?? []}
          columns={fulfillmentColumns}
          tableLayout="fixed"
          pagination={false}
          locale={{ emptyText: "暂无收货明细" }}
          scroll={{ x: 920 }}
        />
      </Card>

      <Modal
        title={record ? `${record.orderNo} · 发货` : "发货"}
        open={shipOpen}
        footer={null}
        onCancel={() => setShipOpen(false)}
        destroyOnHidden
      >
        <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="分销商">{record?.distributorName}</Descriptions.Item>
          <Descriptions.Item label="服务商">{record?.serviceProviderName}</Descriptions.Item>
        </Descriptions>
        <Space>
          <Button type="primary" loading={shipping} onClick={() => void handleShip("full")}>
            全部发货成功
          </Button>
          <Button loading={shipping} onClick={() => void handleShip("partial")}>
            查询部分发货结果
          </Button>
        </Space>
      </Modal>

      <Modal
        title={record ? `${record.orderNo} · 申请取消订单` : "申请取消订单"}
        open={cancelOpen}
        okText="提交申请"
        cancelText="取消"
        onCancel={() => {
          setCancelOpen(false);
          cancelForm.resetFields();
        }}
        onOk={() => void handleCancel()}
        confirmLoading={canceling}
        destroyOnHidden
      >
        <Form form={cancelForm} layout="vertical">
          <Form.Item name="remark" label="取消原因" rules={[{ required: true, message: "请输入取消原因" }]}>
            <Input.TextArea rows={4} placeholder="请输入取消原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={record ? `${record.orderNo} · 确认收货` : "确认收货"}
        open={receiptOpen}
        footer={null}
        onCancel={() => {
          setReceiptOpen(false);
          receiptReviewForm.resetFields();
        }}
        destroyOnHidden
      >
        {record ? (
          <Space direction="vertical" size={16} className="page-stack">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="签收单附件">{renderDownloadLink(record.receipt?.receiptDocumentNo)}</Descriptions.Item>
              <Descriptions.Item label="收货明细附件">{renderDownloadLink(record.receipt?.receiptDetails)}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{record.receipt?.submittedAt ?? "-"}</Descriptions.Item>
            </Descriptions>
            <Form form={receiptReviewForm} layout="vertical">
              <Form.Item name="remark" label="审核备注" rules={[{ required: true, message: "请输入审核备注" }]}>
                <Input.TextArea rows={4} placeholder="请输入审核意见" />
              </Form.Item>
              <Space>
                <Button type="primary" loading={reviewing} onClick={() => void handleReceiptReview("approve")}>
                  通过
                </Button>
                <Button danger loading={reviewing} onClick={() => void handleReceiptReview("reject")}>
                  驳回
                </Button>
              </Space>
            </Form>
          </Space>
        ) : null}
      </Modal>
    </Space>
  );
}
