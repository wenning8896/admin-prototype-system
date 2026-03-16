import { App, Button, Card, Descriptions, Form, Input, Space, Tag, Timeline, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import type { SignReceiptRecord } from "../../shared/mocks/signReceipt.mock";
import { getSignReceiptById, submitSignReceipt } from "../../shared/services/signReceipt.mock-service";

const statusColorMap: Record<string, string> = {
  待上传: "default",
  待审批: "processing",
  审批通过: "success",
  审批驳回: "error",
};

type UploadForm = {
  receiptAttachmentName: string;
  detailAttachmentName: string;
  remark?: string;
};

export function DealerSignReceiptUploadDetailPage() {
  const [form] = Form.useForm<UploadForm>();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<SignReceiptRecord | null>(null);

  const canEdit = (location.state as { mode?: string } | null)?.mode === "edit";

  const loadRecord = useCallback(async () => {
    if (!detailId) {
      return;
    }
    setLoading(true);
    try {
      const next = await getSignReceiptById(detailId);
      setRecord(next);
      form.setFieldsValue({
        receiptAttachmentName: next?.receiptAttachmentName ?? "",
        detailAttachmentName: next?.detailAttachmentName ?? "",
        remark: next?.remark ?? "",
      });
    } finally {
      setLoading(false);
    }
  }, [detailId, form]);

  useEffect(() => {
    void loadRecord();
  }, [loadRecord]);

  async function handleSubmit() {
    if (!record) {
      return;
    }
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await submitSignReceipt({
        id: record.id,
        receiptAttachmentName: values.receiptAttachmentName,
        detailAttachmentName: values.detailAttachmentName,
        remark: values.remark,
        actor: {
          name: user?.name ?? "经销商",
          account: user?.account ?? "dealer",
          roleLabel: "经销商",
        },
      });
      void message.success("签收单已提交审批。");
      navigate("/dealer/contract/dealer-sign-receipt-upload");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate("/dealer/contract/dealer-sign-receipt-upload")}>返回列表</Button>
            <Typography.Title level={4} className="agreement-detail__title">
              签收单详情
            </Typography.Title>
            {record ? <Tag color={statusColorMap[record.status]}>{record.status}</Tag> : null}
          </Space>
          {record && canEdit ? (
            <Space>
              <Button onClick={() => navigate("/dealer/contract/dealer-sign-receipt-upload")}>取消</Button>
              <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
                提交
              </Button>
            </Space>
          ) : null}
        </div>
      </Card>

      <Card className="page-card" title="签收单信息" loading={loading}>
        {record ? (
          <Descriptions column={3} size="small">
            <Descriptions.Item label="合同编号">{record.contractNo}</Descriptions.Item>
            <Descriptions.Item label="经销商编码">{record.dealerCode}</Descriptions.Item>
            <Descriptions.Item label="经销商名称">{record.dealerName}</Descriptions.Item>
            <Descriptions.Item label="DMS医院编码">{record.dmsHospitalCode}</Descriptions.Item>
            <Descriptions.Item label="DMS医院名称">{record.dmsHospitalName}</Descriptions.Item>
            <Descriptions.Item label="收货人">{record.receiverName}</Descriptions.Item>
            <Descriptions.Item label="收货人ID">{record.receiverId}</Descriptions.Item>
            <Descriptions.Item label="当前状态">{record.status}</Descriptions.Item>
            <Descriptions.Item label="上传时间">{record.uploadedAt ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="上传信息">
        <Form form={form} layout="vertical" disabled={!canEdit}>
          <div className="agreement-page__filters">
            <Form.Item name="receiptAttachmentName" label="签收单附件" rules={[{ required: true, message: "请输入签收单附件名称" }]}>
              <Input placeholder="请输入签收单附件名称" />
            </Form.Item>
            <Form.Item name="detailAttachmentName" label="收货明细附件" rules={[{ required: true, message: "请输入收货明细附件名称" }]}>
              <Input placeholder="请输入收货明细附件名称" />
            </Form.Item>
          </div>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={4} placeholder="请输入备注" />
          </Form.Item>
          {!canEdit ? (
            <Descriptions column={2} size="small">
              <Descriptions.Item label="签收单附件">{renderDownloadLink(record?.receiptAttachmentName)}</Descriptions.Item>
              <Descriptions.Item label="收货明细附件">{renderDownloadLink(record?.detailAttachmentName)}</Descriptions.Item>
            </Descriptions>
          ) : null}
        </Form>
      </Card>

      <Card className="page-card" title="审批记录">
        {record ? (
          <Timeline
            items={record.approvalHistory.map((item) => ({
              children: (
                <Space direction="vertical" size={4}>
                  <Typography.Text strong>{item.nodeName}</Typography.Text>
                  <Typography.Text type="secondary">
                    {item.roleLabel} · {item.operatorName}（{item.account}） · {item.actedAt}
                  </Typography.Text>
                  <Typography.Text>{item.decision}</Typography.Text>
                  <Typography.Text type="secondary">{item.remark ?? "-"}</Typography.Text>
                  {item.attachmentName ? <Typography.Link>{item.attachmentName}</Typography.Link> : null}
                </Space>
              ),
            }))}
          />
        ) : null}
      </Card>
    </Space>
  );
}
