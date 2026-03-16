import { App, Button, Card, Descriptions, Form, Input, Space, Tag, Timeline, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import type { SignReceiptRecord } from "../../shared/mocks/signReceipt.mock";
import { getSignReceiptById, reviewSignReceipt } from "../../shared/services/signReceipt.mock-service";

const statusColorMap: Record<string, string> = {
  待审批: "processing",
  审批通过: "success",
  审批驳回: "error",
};

type ReviewForm = {
  remark: string;
  attachmentName?: string;
};

export function SignReceiptApprovalDetailPage() {
  const [form] = Form.useForm<ReviewForm>();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<SignReceiptRecord | null>(null);

  const loadRecord = useCallback(async () => {
    if (!detailId) {
      return;
    }
    setLoading(true);
    try {
      setRecord(await getSignReceiptById(detailId));
    } finally {
      setLoading(false);
    }
  }, [detailId]);

  useEffect(() => {
    void loadRecord();
  }, [loadRecord]);

  async function handleReview(decision: "approve" | "reject") {
    const values = await form.validateFields();
    if (!record) {
      return;
    }
    modal.confirm({
      title: decision === "approve" ? "确认通过审批？" : "确认驳回审批？",
      okText: decision === "approve" ? "确认通过" : "确认驳回",
      cancelText: "取消",
      onOk: async () => {
        setSubmitting(true);
        try {
          await reviewSignReceipt({
            id: record.id,
            decision,
            remark: values.remark,
            attachmentName: values.attachmentName,
            actor: {
              name: user?.name ?? "管理员",
              account: user?.account ?? "admin",
              roleLabel: "管理员",
            },
          });
          void message.success(decision === "approve" ? "签收单审批已通过。" : "签收单审批已驳回。");
          form.resetFields();
          await loadRecord();
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

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate("/admin/contract/sign-receipt-approval")}>返回列表</Button>
            <Typography.Title level={4} className="agreement-detail__title">
              签收单审批详情
            </Typography.Title>
            {record ? <Tag color={statusColorMap[record.status]}>{record.status}</Tag> : null}
          </Space>
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
            <Descriptions.Item label="提交时间">{record.uploadedAt ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="审批节点">{record.approvalNode ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="签收单附件">{renderDownloadLink(record.receiptAttachmentName)}</Descriptions.Item>
            <Descriptions.Item label="收货明细附件">{renderDownloadLink(record.detailAttachmentName)}</Descriptions.Item>
            <Descriptions.Item label="备注" span={3}>{record.remark || "-"}</Descriptions.Item>
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
                      {item.roleLabel} · {item.operatorName}（{item.account}） · {item.actedAt}
                    </Typography.Text>
                    <Typography.Text>{item.decision}</Typography.Text>
                    <Typography.Text type="secondary">{item.remark ?? "-"}</Typography.Text>
                    {item.attachmentName ? <Typography.Link>{item.attachmentName}</Typography.Link> : null}
                  </Space>
                ),
              })),
              ...(record.status === "待审批"
                ? [
                    {
                      color: "blue" as const,
                      children: (
                        <Space direction="vertical" size={12} className="agreement-detail__pending-node">
                          <Typography.Text strong>{record.approvalNode}</Typography.Text>
                          <Form form={form} layout="vertical">
                            <Form.Item name="remark" label="审批备注" rules={[{ required: true, message: "请输入审批备注" }]}>
                              <Input.TextArea rows={4} placeholder="请输入审批备注" />
                            </Form.Item>
                            <Form.Item name="attachmentName" label="审批附件">
                              <Input placeholder="请输入审批附件名称" />
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
