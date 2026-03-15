import { App, Button, Card, Descriptions, Form, Input, Space, Tag, Timeline, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import {
  getPurchaseAgreementById,
  reviewPurchaseAgreement,
  type AgreementStage,
  type PurchaseAgreementRecord,
} from "../../../agreement/shared/services/purchaseAgreementFlow.mock-service";

const stageColorMap: Record<AgreementStage, string> = {
  待签约审批: "processing",
  待服务商补充: "warning",
  待分销商签署: "purple",
  待服务商签署: "gold",
  已签署完成: "success",
  审批驳回: "error",
};

type ReviewFormValues = {
  remark: string;
};

export function ContractSigningApprovalDetailPage() {
  const [form] = Form.useForm<ReviewFormValues>();
  const { message, modal } = App.useApp();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<PurchaseAgreementRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!detailId) {
        return;
      }

      setLoading(true);
      try {
        const next = await getPurchaseAgreementById(detailId);
        setRecord(next ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [detailId]);

  async function handleReview(action: "approve" | "reject") {
    if (!record || !user) {
      return;
    }

    const values = await form.validateFields();
    modal.confirm({
      title: action === "approve" ? "确认审批通过？" : "确认审批驳回？",
      content: action === "approve" ? "通过后将生成购销协议并流转到服务商侧。" : "驳回后当前申请将结束审批流程。",
      okText: action === "approve" ? "确认通过" : "确认驳回",
      cancelText: "取消",
      onOk: async () => {
        setSubmitting(true);
        try {
          await reviewPurchaseAgreement({
            id: record.id,
            action,
            remark: values.remark,
            reviewerAccount: user.account,
            reviewerName: user.name,
          });
          void message.success(action === "approve" ? "审批已通过。" : "审批已驳回。");
          navigate("/admin/order/contract-signing-approval");
        } finally {
          setSubmitting(false);
        }
      },
    });
  }

  if (!record && !loading) {
    return (
      <Card className="page-card">
        <Typography.Text>未找到当前审批记录。</Typography.Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space>
            <Button onClick={() => navigate("/admin/order/contract-signing-approval")}>返回列表</Button>
            <Typography.Title level={4} className="agreement-detail__title">
              签约审批详情
            </Typography.Title>
          </Space>
        </div>
      </Card>

      <Card className="page-card" loading={loading}>
        {record ? (
          <Descriptions column={2} className="agreement-detail__descriptions">
            <Descriptions.Item label="申请编号">{record.applicationNo}</Descriptions.Item>
            <Descriptions.Item label="当前节点">
              <Tag>{record.currentApprovalNode}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="分销商名称">{record.distributorName}</Descriptions.Item>
            <Descriptions.Item label="分销商编码">{record.distributorCode}</Descriptions.Item>
            <Descriptions.Item label="服务商">{record.serviceProviderName}</Descriptions.Item>
            <Descriptions.Item label="服务商负责人">{record.serviceProviderOwner}</Descriptions.Item>
            <Descriptions.Item label="发起时间">{record.createdAt}</Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <Tag color={stageColorMap[record.status]}>{record.status}</Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="审批记录">
        <Timeline
          items={[
            ...(record?.approvalHistory ?? []).map((item) => ({
              color: item.decision === "审批驳回" ? "red" : item.decision === "审批通过" ? "green" : "blue",
              children: (
                <Space direction="vertical" size={2}>
                  <Typography.Text strong>
                    {item.roleLabel} · {item.operatorName}（{item.account}）
                  </Typography.Text>
                  <Typography.Text type="secondary">{item.actedAt}</Typography.Text>
                  <Typography.Text>{item.decision}</Typography.Text>
                  <Typography.Text type="secondary">审批备注：{item.remark}</Typography.Text>
                </Space>
              ),
            })),
            ...(record?.status === "待签约审批"
              ? [
                  {
                    color: "blue" as const,
                    children: (
                      <div className="agreement-detail__pending-node">
                        <Space direction="vertical" size={12} className="page-stack">
                          <div>
                            <Typography.Text strong>当前节点 · {record.currentApprovalNode}</Typography.Text>
                            <Typography.Paragraph className="agreement-detail__pending-copy">
                              你可以在当前节点直接填写审批备注，并执行通过或驳回。
                            </Typography.Paragraph>
                          </div>
                          <Form form={form} layout="vertical" initialValues={{ remark: "" }}>
                            <Form.Item name="remark" label="审批备注" rules={[{ required: true, message: "请输入审批备注" }]}>
                              <Input.TextArea rows={4} placeholder="请输入本次审批备注" />
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
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>
    </Space>
  );
}
