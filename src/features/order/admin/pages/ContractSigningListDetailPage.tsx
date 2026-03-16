import { App, Button, Card, Descriptions, Form, Input, Modal, Space, Table, Tag, Timeline, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import {
  canInvalidatePurchaseAgreement,
  getPurchaseAgreementById,
  invalidatePurchaseAgreement,
  type AgreementClauseItem,
  type AgreementStage,
  type PurchaseAgreementRecord,
} from "../../../agreement/shared/services/purchaseAgreementFlow.mock-service";

const stageColorMap: Record<AgreementStage, string> = {
  待签约审批: "processing",
  待服务商补充: "warning",
  待分销商签署: "purple",
  待服务商签署: "gold",
  已签署完成: "success",
  已作废: "default",
  审批驳回: "error",
};

export function ContractSigningListDetailPage() {
  const [form] = Form.useForm<{ reason: string }>();
  const { message } = App.useApp();
  const { user } = useAuth();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<PurchaseAgreementRecord | null>(null);
  const [invalidateOpen, setInvalidateOpen] = useState(false);

  async function loadRecord() {
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
  }

  useEffect(() => {
    void loadRecord();
  }, [detailId]);

  async function handleInvalidate() {
    if (!record || !user) {
      return;
    }

    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await invalidatePurchaseAgreement({
        id: record.id,
        reason: values.reason,
        operatorAccount: user.account,
        operatorName: user.name,
        source: "admin-signing-detail",
      });
      void message.success("平台协议已作废。");
      setInvalidateOpen(false);
      form.resetFields();
      await loadRecord();
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "作废协议失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (!record && !loading) {
    return (
      <Card className="page-card">
        <Typography.Text>未找到当前协议记录。</Typography.Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space>
            <Button onClick={() => navigate("/admin/order/contract-signing-list")}>返回列表</Button>
            <Typography.Title level={4} className="agreement-detail__title">
              签约详情
            </Typography.Title>
            {record ? <Tag color={stageColorMap[record.status]}>{record.status}</Tag> : null}
          </Space>
          <Space>
            {record && canInvalidatePurchaseAgreement(record.status) ? (
              <Button
                danger
                onClick={() => {
                  form.resetFields();
                  setInvalidateOpen(true);
                }}
              >
                作废协议
              </Button>
            ) : null}
          </Space>
        </div>
      </Card>

      <Card className="page-card" loading={loading}>
        {record ? (
          <Descriptions column={2} className="agreement-detail__descriptions">
            <Descriptions.Item label="协议编号">{record.agreementNo ?? record.applicationNo}</Descriptions.Item>
            <Descriptions.Item label="申请编号">{record.applicationNo}</Descriptions.Item>
            <Descriptions.Item label="分销商名称">{record.distributorName}</Descriptions.Item>
            <Descriptions.Item label="分销商编码">{record.distributorCode}</Descriptions.Item>
            <Descriptions.Item label="服务商">{record.serviceProviderName}</Descriptions.Item>
            <Descriptions.Item label="服务商负责人">{record.serviceProviderOwner}</Descriptions.Item>
            <Descriptions.Item label="当前节点">
              <Tag>{record.currentApprovalNode}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="审批时间">{record.approvalAt ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="协议主体信息">
        {record ? (
          <Descriptions column={2} className="agreement-detail__descriptions">
            <Descriptions.Item label="乙方名称">{record.serviceProviderSupplement?.partyBName ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="乙方联系人">{record.serviceProviderSupplement?.partyBContact ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="乙方联系电话">{record.serviceProviderSupplement?.partyBPhone ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="乙方联系地址" span={2}>
              {record.serviceProviderSupplement?.partyBAddress ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="甲方名称">{record.distributorContract?.partyAName ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="甲方联系人">{record.distributorContract?.partyAContact ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="甲方联系电话">{record.distributorContract?.partyAPhone ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="收货人">{record.distributorContract?.consigneeName ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="收货人电话">{record.distributorContract?.consigneePhone ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="收货地址" span={2}>
              {record.distributorContract?.consigneeAddress ?? "-"}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="条款信息">
        {record?.serviceProviderSupplement?.clauseItems?.length ? (
          <Table<AgreementClauseItem>
            rowKey="id"
            pagination={false}
            dataSource={record.serviceProviderSupplement.clauseItems}
            tableLayout="fixed"
            columns={[
              { title: "条款项", dataIndex: "clauseTitle", width: 280 },
              { title: "默认规则", dataIndex: "defaultRule", width: 420 },
              { title: "说明", dataIndex: "description", width: 260, render: (value?: string) => value || "-" },
            ]}
            scroll={{ x: 960 }}
          />
        ) : (
          <Typography.Text type="secondary">服务商尚未补充条款信息。</Typography.Text>
        )}
      </Card>

      {record?.status === "已作废" ? (
        <Card className="page-card" title="作废信息">
          <Descriptions column={2} className="agreement-detail__descriptions">
            <Descriptions.Item label="作废时间">{record.invalidatedAt ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="作废人">
              {record.invalidatedBy ? `${record.invalidatedBy}（${record.invalidatedByAccount ?? "-"}）` : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="作废来源">{record.invalidateSource ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="作废原因" span={2}>
              {record.invalidateReason ?? "-"}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ) : null}

      <Modal
        title="作废平台协议"
        open={invalidateOpen}
        okText="确认作废"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: submitting }}
        onCancel={() => {
          setInvalidateOpen(false);
          form.resetFields();
        }}
        onOk={() => void handleInvalidate()}
      >
        <Space direction="vertical" size={12} className="page-stack">
          <div>作废后当前平台协议流程终止，如需继续合作，请重新发起协议。</div>
          <div>该功能仅适用于腾讯电子签正式协议生成前的协议流程终止。</div>
          <Form form={form} layout="vertical">
            <Form.Item
              name="reason"
              label="作废原因"
              rules={[{ required: true, message: "请输入作废原因" }]}
            >
              <Input.TextArea rows={4} placeholder="请输入作废原因" maxLength={200} showCount />
            </Form.Item>
          </Form>
        </Space>
      </Modal>

      <Card className="page-card" title="流转记录">
        <Timeline
          items={(record?.approvalHistory ?? []).map((item) => ({
            color:
              item.decision === "审批驳回"
                ? "red"
                : item.decision === "审批通过"
                  ? "green"
                  : item.decision === "协议作废"
                    ? "gray"
                    : "blue",
            children: (
              <Space direction="vertical" size={2}>
                <Typography.Text strong>
                  {item.roleLabel} · {item.operatorName}（{item.account}）
                </Typography.Text>
                <Typography.Text type="secondary">{item.actedAt}</Typography.Text>
                <Typography.Text>{item.decision}</Typography.Text>
                <Typography.Text type="secondary">备注：{item.remark}</Typography.Text>
              </Space>
            ),
          }))}
        />
      </Card>
    </Space>
  );
}
