import { App, Button, Card, Descriptions, Form, Input, Space, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  type AgreementClauseItem,
  getPurchaseAgreementById,
  signServiceProviderAgreement,
  submitServiceProviderAgreement,
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

type AgreementDetailForm = {
  partyBName: string;
  partyBContact: string;
  partyBPhone: string;
  partyBAddress: string;
  clauseItems: AgreementClauseItem[];
};

const defaultClauseItems: AgreementClauseItem[] = [
  {
    id: "clause-template-1",
    clauseTitle: "月度进货额月度指标",
    defaultRule: "100%完成，月返利 1%",
    editable: true,
    description: "百分比需支持编辑",
  },
  {
    id: "clause-template-2",
    clauseTitle: "季度进货额季度指标",
    defaultRule: "100%完成，季返利 1%",
    editable: true,
    description: "原描述为“季度进货额月度指标”，建议产品和业务统一口径",
  },
  {
    id: "clause-template-3",
    clauseTitle: "订单系统维护及数据准确度",
    defaultRule: "无误，月返 1%",
    editable: true,
    description: "百分比需支持编辑",
  },
  {
    id: "clause-template-4",
    clauseTitle: "市场秩序管理规则",
    defaultRule: "季度无投诉，季返 1%",
    editable: true,
    description: "百分比需支持编辑",
  },
];

function normalizeClauseItems(items?: AgreementClauseItem[]) {
  return defaultClauseItems.map((template, index) => ({
    ...template,
    defaultRule: items?.[index]?.defaultRule ?? template.defaultRule,
  }));
}

export function DealerPurchaseSaleAgreementDetailPage() {
  const [form] = Form.useForm<AgreementDetailForm>();
  const { message } = App.useApp();
  const { detailId } = useParams();
  const navigate = useNavigate();
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
    })();
  }, [detailId, form]);

  async function handleSubmit() {
    if (!record) {
      return;
    }

    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await submitServiceProviderAgreement(record.id, values);
      void message.success("协议补充完成，已流转到分销商合同列表。");
      navigate("/dealer/order/dealer-purchase-sale-agreement-list");
    } finally {
      setSubmitting(false);
    }
  }

  const watchedClauseItems = Form.useWatch("clauseItems", form) ?? normalizeClauseItems();

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
                width: 420,
                render: (value: string, _: AgreementClauseItem, index: number) =>
                  record?.status === "待服务商补充" ? (
                    <Form.Item name={["clauseItems", index, "defaultRule"]} noStyle rules={[{ required: true, message: "请输入默认规则" }]}>
                      <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="请输入默认规则" />
                    </Form.Item>
                  ) : (
                    value
                  ),
              },
            ]}
            scroll={{ x: 740 }}
          />
        </Form>
      </Card>
    </Space>
  );
}
