import { App, Button, Card, Descriptions, Form, Input, Modal, Space, Table, Tag, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { UploadFile, UploadProps } from "antd";
import { useAuth } from "../../../../auth/useAuth";
import type { EDistributionOrderRecord, EDistributionOrderStatus, OrderProductItem } from "../../shared/mocks/eDistributionOrderFlow.mock";
import { getEDistributionOrderById, reviewDistributorCancellation, submitOrderReceipt } from "../../shared/services/eDistributionOrderFlow.mock-service";

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

export function DistributorPlatformOrderDetailPage() {
  const [receiptForm] = Form.useForm<{
    receiptDetails: UploadFile[];
    receiptDocumentNo: UploadFile[];
    remark?: string;
  }>();
  const [cancelReviewForm] = Form.useForm<{ remark: string }>();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [reviewingCancel, setReviewingCancel] = useState(false);
  const [record, setRecord] = useState<EDistributionOrderRecord | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    maxCount: 1,
  };

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

  async function handleSubmitReceipt() {
    if (!record) {
      return;
    }
    const values = await receiptForm.validateFields();
    setSubmittingReceipt(true);
    try {
      await submitOrderReceipt({
        id: record.id,
        receiptDetails: values.receiptDetails?.[0]?.name ?? "",
        receiptDocumentNo: values.receiptDocumentNo?.[0]?.name ?? "",
        remark: values.remark ?? "",
        account: user?.account ?? "distributor",
        actorName: user?.name ?? "分销商用户",
      });
      void message.success("收货明细与签收单已提交。");
      setReceiptOpen(false);
      receiptForm.resetFields();
      await reloadRecord();
    } finally {
      setSubmittingReceipt(false);
    }
  }

  async function handleCancelReview(decision: "approve" | "reject") {
    if (!record) {
      return;
    }
    const values = await cancelReviewForm.validateFields();
    setReviewingCancel(true);
    try {
      await reviewDistributorCancellation({
        id: record.id,
        decision,
        remark: values.remark,
        account: user?.account ?? "distributor",
        actorName: user?.name ?? "分销商用户",
      });
      void message.success(decision === "approve" ? "已审批通过，订单进入管理端取消审批。" : "已驳回取消申请，订单回到待发货。");
      setCancelOpen(false);
      cancelReviewForm.resetFields();
      await reloadRecord();
    } finally {
      setReviewingCancel(false);
    }
  }

  const productColumns: ColumnsType<OrderProductItem> = [
    { title: "产品编码", dataIndex: "productCode", width: 150 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    { title: "效期类型", dataIndex: "healthType", width: 120 },
    { title: "单价", dataIndex: "unitPrice", width: 120, render: (value: number) => `¥ ${value.toFixed(2)}` },
    { title: "数量", dataIndex: "quantity", width: 100 },
    { title: "金额", dataIndex: "amount", width: 120, render: (value: number) => `¥ ${value.toFixed(2)}` },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate("/distributor/order/distributor-order-list")}>返回列表</Button>
            <Space align="center" size={12}>
              <Typography.Title level={4} className="agreement-detail__title">
                订单详情
              </Typography.Title>
              {record ? <Tag color={statusColorMap[record.status]}>{record.status}</Tag> : null}
            </Space>
          </Space>
          <Space>
            {(record?.status === "待收货" || record?.status === "收货待重新提交") ? (
              <Button type="primary" onClick={() => {
                receiptForm.setFieldsValue({
                  receiptDetails: record.receipt?.receiptDetails
                    ? [{ uid: `${record.id}-detail`, name: record.receipt.receiptDetails, status: "done" }]
                    : [],
                  receiptDocumentNo: record.receipt?.receiptDocumentNo
                    ? [{ uid: `${record.id}-doc`, name: record.receipt.receiptDocumentNo, status: "done" }]
                    : [],
                  remark: "",
                });
                setReceiptOpen(true);
              }}>
                提交收货
              </Button>
            ) : null}
            {record?.status === "取消确认中" ? (
              <Button danger onClick={() => setCancelOpen(true)}>
                审批取消
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

      <Modal
        title={record ? `${record.orderNo} · 提交收货` : "提交收货"}
        open={receiptOpen}
        okText="提交"
        cancelText="取消"
        onCancel={() => {
          setReceiptOpen(false);
          receiptForm.resetFields();
        }}
        onOk={() => void handleSubmitReceipt()}
        confirmLoading={submittingReceipt}
        destroyOnHidden
      >
        <Form form={receiptForm} layout="vertical">
          <Form.Item
            name="receiptDetails"
            label="收货明细"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList ?? []}
            rules={[{ required: true, message: "请上传收货明细附件" }]}
          >
            <Upload {...uploadProps}>
              <Button>上传附件</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            name="receiptDocumentNo"
            label="签收单"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList ?? []}
            rules={[{ required: true, message: "请上传签收单附件" }]}
          >
            <Upload {...uploadProps}>
              <Button>上传附件</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入补充说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={record ? `${record.orderNo} · 审批取消` : "审批取消"}
        open={cancelOpen}
        footer={null}
        onCancel={() => {
          setCancelOpen(false);
          cancelReviewForm.resetFields();
        }}
        destroyOnHidden
      >
        <Form form={cancelReviewForm} layout="vertical">
          <Form.Item name="remark" label="审批备注" rules={[{ required: true, message: "请输入审批备注" }]}>
            <Input.TextArea rows={4} placeholder="请输入审批意见" />
          </Form.Item>
          <Space>
            <Button type="primary" loading={reviewingCancel} onClick={() => void handleCancelReview("approve")}>
              通过
            </Button>
            <Button danger loading={reviewingCancel} onClick={() => void handleCancelReview("reject")}>
              驳回
            </Button>
          </Space>
        </Form>
      </Modal>
    </Space>
  );
}
