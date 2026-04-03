import { App, Button, Card, Descriptions, Form, Input, Modal, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import type { EDistributionOrderRecord, EDistributionOrderStatus } from "../../shared/mocks/eDistributionOrderFlow.mock";
import {
  listEDistributionOrders,
  requestOrderCancellation,
  reviewOrderReceipt,
  shipEDistributionOrder,
} from "../../shared/services/eDistributionOrderFlow.mock-service";

type DealerFilters = {
  keyword?: string;
  status?: EDistributionOrderStatus;
};

type ReviewValues = {
  remark: string;
};

const statusColorMap: Record<EDistributionOrderStatus, string> = {
  待审批: "processing",
  待发货: "gold",
  待收货: "blue",
  收货待确认: "cyan",
  收货异常待确认: "magenta",
  收货待重新提交: "warning",
  已完成: "success",
  取消确认中: "orange",
  取消待审批: "volcano",
  已取消: "default",
};

export function DealerPlatformOrderListPage() {
  const [filterForm] = Form.useForm<DealerFilters>();
  const [cancelForm] = Form.useForm<ReviewValues>();
  const [receiptReviewForm] = Form.useForm<ReviewValues>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [items, setItems] = useState<EDistributionOrderRecord[]>([]);
  const [shipmentTarget, setShipmentTarget] = useState<EDistributionOrderRecord | null>(null);
  const [cancelTarget, setCancelTarget] = useState<EDistributionOrderRecord | null>(null);
  const [receiptTarget, setReceiptTarget] = useState<EDistributionOrderRecord | null>(null);

  async function loadData(filters: DealerFilters = {}) {
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
            item.productSummary.toLowerCase().includes(keyword);
          const matchesStatus = !filters.status || item.status === filters.status;
          return matchesKeyword && matchesStatus && item.status !== "待审批";
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleShip() {
    if (!shipmentTarget) {
      return;
    }
    setShipping(true);
    try {
      await shipEDistributionOrder({
        id: shipmentTarget.id,
        shipmentType: "full",
        remark: "服务商已完成全部发货。",
        account: user?.account ?? "dealer",
        actorName: user?.name ?? "服务商",
      });
      void message.success("订单已全部发货，订单状态更新为待收货。");
      setShipmentTarget(null);
      await loadData(filterForm.getFieldsValue());
    } finally {
      setShipping(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) {
      return;
    }
    const values = await cancelForm.validateFields();
    setCanceling(true);
    try {
      await requestOrderCancellation({
        id: cancelTarget.id,
        remark: values.remark,
        account: user?.account ?? "dealer",
        actorName: user?.name ?? "服务商",
      });
      void message.success("取消订单申请已提交，待分销商确认。");
      setCancelTarget(null);
      cancelForm.resetFields();
      await loadData(filterForm.getFieldsValue());
    } finally {
      setCanceling(false);
    }
  }

  async function handleReceiptReview(decision: "approve" | "reject") {
    if (!receiptTarget) {
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
            id: receiptTarget.id,
            decision,
            remark: values.remark,
            account: user?.account ?? "dealer",
            actorName: user?.name ?? "服务商",
          });
          void message.success(decision === "approve" ? "收货确认通过，订单已完成。" : "已驳回收货，待分销商重新提交。");
          setReceiptTarget(null);
          receiptReviewForm.resetFields();
          await loadData(filterForm.getFieldsValue());
        } finally {
          setReviewing(false);
        }
      },
    });
  }

  const columns: ColumnsType<EDistributionOrderRecord> = [
    { title: "订单编号", dataIndex: "orderNo", width: 180, fixed: "left" },
    { title: "分销商名称", dataIndex: "distributorName", width: 200 },
    { title: "商品总数", dataIndex: "totalQuantity", width: 120 },
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
      width: 220,
      render: (_, record) => (
        <Space size={12} wrap>
          <Button type="link" onClick={() => navigate(`/dealer/order/dealer-platform-order-list/detail/${record.id}`)}>
            查看详情
          </Button>
          {record.status === "待发货" ? (
            <>
              <Button type="link" onClick={() => setShipmentTarget(record)}>
                发货
              </Button>
              <Button type="link" danger onClick={() => setCancelTarget(record)}>
                申请取消
              </Button>
            </>
          ) : null}
          {record.status === "收货待确认" ? (
            <Button
              type="link"
              onClick={() => {
                setReceiptTarget(record);
                receiptReviewForm.setFieldsValue({ remark: "" });
              }}
            >
              确认收货
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={filterForm} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="keyword" name="keyword" label="订单编号 / 分销商">
                <Input allowClear placeholder="请输入关键词" />
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
                <Button type="primary" onClick={() => void loadData(filterForm.getFieldsValue())}>
                  查询
                </Button>
                <Button onClick={() => { filterForm.resetFields(); void loadData(); }}>
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
          scroll={{ x: 1580 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title={shipmentTarget ? `${shipmentTarget.orderNo} · 发货` : "发货"}
        open={Boolean(shipmentTarget)}
        footer={null}
        onCancel={() => { setShipmentTarget(null); }}
        destroyOnHidden
      >
        <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="分销商">{shipmentTarget?.distributorName}</Descriptions.Item>
          <Descriptions.Item label="商品总数">{shipmentTarget?.totalQuantity}</Descriptions.Item>
        </Descriptions>
        <Space>
          <Button type="primary" loading={shipping} onClick={() => void handleShip()}>
            全部发货成功
          </Button>
          <Button
            loading={shipping}
            onClick={async () => {
              if (!shipmentTarget) {
                return;
              }
              setShipping(true);
              try {
                await shipEDistributionOrder({
                  id: shipmentTarget.id,
                  shipmentType: "partial",
                  remark: "已调用第三方同步部分发货结果。",
                  account: user?.account ?? "dealer",
                  actorName: user?.name ?? "服务商",
                });
                void message.success("已同步部分发货结果，订单仍保持待发货。");
                setShipmentTarget(null);
                await loadData(filterForm.getFieldsValue());
              } finally {
                setShipping(false);
              }
            }}
          >
            查询部分发货结果
          </Button>
        </Space>
      </Modal>

      <Modal
        title={cancelTarget ? `${cancelTarget.orderNo} · 申请取消订单` : "申请取消订单"}
        open={Boolean(cancelTarget)}
        okText="提交申请"
        cancelText="取消"
        onCancel={() => { setCancelTarget(null); cancelForm.resetFields(); }}
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
        title={receiptTarget ? `${receiptTarget.orderNo} · 确认收货` : "确认收货"}
        open={Boolean(receiptTarget)}
        footer={null}
        onCancel={() => { setReceiptTarget(null); receiptReviewForm.resetFields(); }}
        destroyOnHidden
      >
        {receiptTarget ? (
          <Space direction="vertical" size={16} className="page-stack">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="签收单编号">{receiptTarget.receipt?.receiptDocumentNo}</Descriptions.Item>
              <Descriptions.Item label="收货明细">{receiptTarget.receipt?.receiptDetails}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{receiptTarget.receipt?.submittedAt}</Descriptions.Item>
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
