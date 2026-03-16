import { App, Button, Card, Descriptions, Form, Input, Modal, Space, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  canInvalidatePurchaseAgreement,
  type AgreementClauseItem,
  getPurchaseAgreementById,
  invalidatePurchaseAgreement,
  signServiceProviderAgreement,
  submitServiceProviderAgreement,
  type AgreementStage,
  type PurchaseAgreementRecord,
} from "../../../agreement/shared/services/purchaseAgreementFlow.mock-service";
import { useAuth } from "../../../../auth/useAuth";

const stageColorMap: Record<AgreementStage, string> = {
  待签约审批: "processing",
  待服务商补充: "warning",
  待分销商签署: "purple",
  待服务商签署: "gold",
  已签署完成: "success",
  已作废: "default",
  审批驳回: "error",
};

type AgreementDetailForm = {
  partyBName: string;
  partyBContact: string;
  partyBPhone: string;
  partyBAddress: string;
  clauseItems: Array<
    AgreementClauseItem & {
      primaryValue?: string;
      secondaryValue?: string;
    }
  >;
};

const clauseTemplates: Array<
  AgreementClauseItem & {
    primaryPrefix?: string;
    primarySuffix?: string;
    secondaryPrefix?: string;
    secondarySuffix?: string;
  }
> = [
  {
    id: "clause-template-1",
    clauseTitle: "月度进货额月度指标",
    defaultRule: "100%完成，月返利 1%",
    editable: true,
    description: "百分比需支持编辑",
    primaryPrefix: "",
    primarySuffix: "%完成，月返利 ",
    secondaryPrefix: "",
    secondarySuffix: "%",
  },
  {
    id: "clause-template-2",
    clauseTitle: "季度进货额季度指标",
    defaultRule: "100%完成，季返利 1%",
    editable: true,
    description: "原描述为“季度进货额月度指标”，建议产品和业务统一口径",
    primaryPrefix: "",
    primarySuffix: "%完成，季返利 ",
    secondaryPrefix: "",
    secondarySuffix: "%",
  },
  {
    id: "clause-template-3",
    clauseTitle: "订单系统维护及数据准确度",
    defaultRule: "无误，月返 1%",
    editable: true,
    description: "百分比需支持编辑",
    secondaryPrefix: "无误，月返 ",
    secondarySuffix: "%",
  },
  {
    id: "clause-template-4",
    clauseTitle: "市场秩序管理规则",
    defaultRule: "季度无投诉，季返 1%",
    editable: true,
    description: "百分比需支持编辑",
    secondaryPrefix: "季度无投诉，季返 ",
    secondarySuffix: "%",
  },
];

function parseClauseValues(defaultRule: string, template: (typeof clauseTemplates)[number]) {
  if (template.primarySuffix && template.secondarySuffix) {
    const escapedPrimarySuffix = template.primarySuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedSecondarySuffix = template.secondarySuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = defaultRule.match(new RegExp(`^(\\d+)${escapedPrimarySuffix}(\\d+)${escapedSecondarySuffix}$`));

    return {
      primaryValue: match?.[1],
      secondaryValue: match?.[2],
    };
  }

  if (template.secondaryPrefix && template.secondarySuffix) {
    const escapedPrefix = template.secondaryPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedSuffix = template.secondarySuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = defaultRule.match(new RegExp(`^${escapedPrefix}(\\d+)${escapedSuffix}$`));

    return {
      primaryValue: undefined,
      secondaryValue: match?.[1],
    };
  }

  return {};
}

function normalizeClauseItems(items?: AgreementClauseItem[]) {
  return clauseTemplates.map((template, index) => {
    const currentRule = items?.[index]?.defaultRule ?? template.defaultRule;
    const parsed = parseClauseValues(currentRule, template);

    return {
      ...template,
      defaultRule: currentRule,
      primaryValue: parsed.primaryValue,
      secondaryValue: parsed.secondaryValue,
    };
  });
}

function buildClausePayload(items: Array<AgreementClauseItem & { primaryValue?: string; secondaryValue?: string }>) {
  return clauseTemplates.map((template, index) => {
    const current = items[index];
    const primaryValue = current?.primaryValue?.trim();
    const secondaryValue = current?.secondaryValue?.trim();

    return {
      id: current?.id ?? template.id,
      clauseTitle: template.clauseTitle,
      editable: template.editable,
      description: template.description,
      defaultRule: template.primarySuffix && template.secondarySuffix
        ? `${template.primaryPrefix ?? ""}${primaryValue ?? ""}${template.primarySuffix}${secondaryValue ?? ""}${template.secondarySuffix}`
        : template.secondaryPrefix && template.secondarySuffix
          ? `${template.secondaryPrefix}${secondaryValue ?? ""}${template.secondarySuffix}`
          : current?.defaultRule ?? template.defaultRule,
    };
  });
}

export function DealerPurchaseSaleAgreementDetailPage() {
  const [form] = Form.useForm<AgreementDetailForm>();
  const [invalidateForm] = Form.useForm<{ reason: string }>();
  const { message } = App.useApp();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<PurchaseAgreementRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invalidateOpen, setInvalidateOpen] = useState(false);

  async function loadRecord() {
    if (!detailId) {
      return;
    }

    setLoading(true);
    try {
      const next = await getPurchaseAgreementById(detailId);
      setRecord(next ?? null);
      form.setFieldsValue({
        partyBName: next?.serviceProviderSupplement?.partyBName ?? next?.serviceProviderName ?? "",
        partyBContact: next?.serviceProviderSupplement?.partyBContact ?? next?.serviceProviderOwner ?? "",
        partyBPhone: next?.serviceProviderSupplement?.partyBPhone ?? "",
        partyBAddress: next?.serviceProviderSupplement?.partyBAddress ?? "",
        clauseItems: normalizeClauseItems(next?.serviceProviderSupplement?.clauseItems),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecord();
  }, [detailId, form]);

  async function handleSubmit() {
    if (!record) {
      return;
    }

    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await submitServiceProviderAgreement(record.id, {
        ...values,
        clauseItems: buildClausePayload(values.clauseItems),
      });
      void message.success("协议补充完成，已流转到分销商合同列表。");
      navigate("/dealer/order/dealer-purchase-sale-agreement-list");
    } finally {
      setSubmitting(false);
    }
  }

  const watchedClauseItems = normalizeClauseItems(Form.useWatch("clauseItems", form));

  async function handleSign() {
    if (!record) {
      return;
    }
    setSubmitting(true);
    try {
      await signServiceProviderAgreement(record.id);
      void message.success("服务商已完成签署。");
      navigate("/dealer/order/dealer-purchase-sale-agreement-list");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInvalidate() {
    if (!record || !user) {
      return;
    }

    const values = await invalidateForm.validateFields();
    setSubmitting(true);
    try {
      await invalidatePurchaseAgreement({
        id: record.id,
        reason: values.reason,
        operatorAccount: user.account,
        operatorName: user.name,
        source: "dealer-agreement-detail",
      });
      void message.success("平台协议已作废。");
      setInvalidateOpen(false);
      invalidateForm.resetFields();
      await loadRecord();
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "作废协议失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space>
            <Button onClick={() => navigate("/dealer/order/dealer-purchase-sale-agreement-list")}>返回列表</Button>
            <Typography.Title level={4} className="agreement-detail__title">
              购销协议详情
            </Typography.Title>
            {record ? <Tag color={stageColorMap[record.status]}>{record.status}</Tag> : null}
          </Space>
          <Space>
            {record?.status === "待服务商补充" ? (
              <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
                提交
              </Button>
            ) : null}
            {record?.status === "待服务商签署" ? (
              <Button type="primary" loading={submitting} onClick={() => void handleSign()}>
                签署完成
              </Button>
            ) : null}
            {record && canInvalidatePurchaseAgreement(record.status) ? (
              <Button
                danger
                onClick={() => {
                  invalidateForm.resetFields();
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
            <Descriptions.Item label="分销商名称">{record.distributorName}</Descriptions.Item>
            <Descriptions.Item label="服务商">{record.serviceProviderName}</Descriptions.Item>
            <Descriptions.Item label="服务商负责人">{record.serviceProviderOwner}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="甲方信息">
        {record?.distributorContract ? (
          <Descriptions column={2} className="agreement-detail__descriptions">
            <Descriptions.Item label="甲方名称">{record.distributorContract.partyAName}</Descriptions.Item>
            <Descriptions.Item label="联系人">{record.distributorContract.partyAContact}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{record.distributorContract.partyAPhone}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">该模块由分销商后续填写，当前暂未补充。</Typography.Text>
        )}
      </Card>

      <Card className="page-card" title="收货人信息">
        {record?.distributorContract ? (
          <Descriptions column={2} className="agreement-detail__descriptions">
            <Descriptions.Item label="收货人">{record.distributorContract.consigneeName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{record.distributorContract.consigneePhone}</Descriptions.Item>
            <Descriptions.Item label="收货地址" span={2}>
              {record.distributorContract.consigneeAddress}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">该模块由分销商后续填写，当前暂未补充。</Typography.Text>
        )}
      </Card>

      <Card className="page-card" title="乙方信息">
        <Form form={form} layout="vertical" disabled={record?.status !== "待服务商补充"}>
          <div className="agreement-page__filters">
            <Form.Item name="partyBName" label="乙方名称" rules={[{ required: true, message: "请输入乙方名称" }]}>
              <Input placeholder="请输入乙方名称" />
            </Form.Item>
            <Form.Item name="partyBContact" label="联系人" rules={[{ required: true, message: "请输入联系人" }]}>
              <Input placeholder="请输入联系人" />
            </Form.Item>
            <Form.Item name="partyBPhone" label="联系电话" rules={[{ required: true, message: "请输入联系电话" }]}>
              <Input placeholder="请输入联系电话" />
            </Form.Item>
            <Form.Item name="partyBAddress" label="联系地址" rules={[{ required: true, message: "请输入联系地址" }]}>
              <Input placeholder="请输入联系地址" />
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card className="page-card" title="条款信息">
        <Form form={form} layout="vertical" disabled={record?.status !== "待服务商补充"}>
          <Table
            rowKey="id"
            pagination={false}
            tableLayout="fixed"
            dataSource={watchedClauseItems}
            columns={[
              {
                title: "条款项",
                dataIndex: "clauseTitle",
                width: 320,
                render: (value: string) => value,
              },
              {
                title: "默认规则",
                dataIndex: "defaultRule",
                width: 520,
                render: (value: string, _, index: number) => {
                  const template = clauseTemplates[index];
                  const isEditable = record?.status === "待服务商补充";

                  if (isEditable && template.primarySuffix && template.secondarySuffix) {
                    return (
                      <Space size={8} wrap>
                        <Form.Item
                          name={["clauseItems", index, "primaryValue"]}
                          noStyle
                          rules={[{ required: true, message: "请输入达成值" }]}
                        >
                          <Input placeholder="请输入" style={{ width: 96 }} />
                        </Form.Item>
                        <Typography.Text>{template.primarySuffix}</Typography.Text>
                        <Form.Item
                          name={["clauseItems", index, "secondaryValue"]}
                          noStyle
                          rules={[{ required: true, message: "请输入返利值" }]}
                        >
                          <Input placeholder="请输入" style={{ width: 96 }} />
                        </Form.Item>
                        <Typography.Text>{template.secondarySuffix}</Typography.Text>
                      </Space>
                    );
                  }

                  if (isEditable && template.secondaryPrefix && template.secondarySuffix) {
                    return (
                      <Space size={8} wrap>
                        <Typography.Text>{template.secondaryPrefix}</Typography.Text>
                        <Form.Item
                          name={["clauseItems", index, "secondaryValue"]}
                          noStyle
                          rules={[{ required: true, message: "请输入返利值" }]}
                        >
                          <Input placeholder="请输入" style={{ width: 96 }} />
                        </Form.Item>
                        <Typography.Text>{template.secondarySuffix}</Typography.Text>
                      </Space>
                    );
                  }

                  return value;
                },
              },
            ]}
            scroll={{ x: 740 }}
          />
        </Form>
      </Card>

      {record?.status === "已作废" ? (
        <Card className="page-card" title="作废信息">
          <Descriptions column={2} className="agreement-detail__descriptions">
            <Descriptions.Item label="作废时间">{record.invalidatedAt ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="作废人">
              {record.invalidatedBy ? `${record.invalidatedBy}（${record.invalidatedByAccount ?? "-"}）` : "-"}
            </Descriptions.Item>
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
          invalidateForm.resetFields();
        }}
        onOk={() => void handleInvalidate()}
      >
        <Space direction="vertical" size={12} className="page-stack">
          <div>作废后当前平台协议流程终止，如需继续合作，请重新发起协议。</div>
          <div>该功能仅适用于腾讯电子签正式协议生成前的协议流程终止。</div>
          <Form form={invalidateForm} layout="vertical">
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
    </Space>
  );
}
