import { App, Button, Card, Descriptions, Form, Input, Space, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  type AgreementClauseItem,
  getPurchaseAgreementById,
  signDistributorAgreement,
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

const defaultClauseItems: AgreementClauseItem[] = [
  { id: "clause-template-1", clauseTitle: "月度进货额月度指标", defaultRule: "100%完成，月返利 1%", editable: true, description: "" },
  { id: "clause-template-2", clauseTitle: "季度进货额季度指标", defaultRule: "100%完成，季返利 1%", editable: true, description: "" },
  { id: "clause-template-3", clauseTitle: "订单系统维护及数据准确度", defaultRule: "无误，月返 1%", editable: true, description: "" },
  { id: "clause-template-4", clauseTitle: "市场秩序管理规则", defaultRule: "季度无投诉，季返 1%", editable: true, description: "" },
];

function normalizeClauseItems(items?: AgreementClauseItem[]) {
  return defaultClauseItems.map((template, index) => ({
    ...template,
    defaultRule: items?.[index]?.defaultRule ?? template.defaultRule,
  }));
}

type DistributorAgreementForm = {
  partyAName: string;
  partyAContact: string;
  partyAPhone: string;
  consigneeName: string;
  consigneePhone: string;
  consigneeAddress: string;
};

export function DistributorContractDetailPage() {
  const [form] = Form.useForm<DistributorAgreementForm>();
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
          partyAName: next?.distributorContract?.partyAName ?? next?.distributorName ?? "",
          partyAContact: next?.distributorContract?.partyAContact ?? "",
          partyAPhone: next?.distributorContract?.partyAPhone ?? "",
          consigneeName: next?.distributorContract?.consigneeName ?? "",
          consigneePhone: next?.distributorContract?.consigneePhone ?? "",
          consigneeAddress: next?.distributorContract?.consigneeAddress ?? "",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [detailId, form]);

  async function handleSign() {
    if (!record) {
      return;
    }
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await signDistributorAgreement(record.id, values);
      void message.success("已发起电子签，协议现已回到服务商侧等待再次签署。");
      navigate("/distributor/contract/distributor-contract-list");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space>
            <Button onClick={() => navigate("/distributor/contract/distributor-contract-list")}>返回列表</Button>
            <Typography.Title level={4} className="agreement-detail__title">
              合同详情
            </Typography.Title>
            {record ? <Tag color={stageColorMap[record.status]}>{record.status}</Tag> : null}
          </Space>
          <Space>
            {record?.status === "待分销商签署" ? (
              <Button type="primary" loading={submitting} onClick={() => void handleSign()}>
                签约签署
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
        <Form form={form} layout="vertical" disabled={record?.status !== "待分销商签署"}>
          <div className="agreement-page__filters">
            <Form.Item name="partyAName" label="甲方名称" rules={[{ required: true, message: "请输入甲方名称" }]}>
              <Input placeholder="请输入甲方名称" />
            </Form.Item>
            <Form.Item name="partyAContact" label="甲方联系人" rules={[{ required: true, message: "请输入甲方联系人" }]}>
              <Input placeholder="请输入甲方联系人" />
            </Form.Item>
            <Form.Item name="partyAPhone" label="甲方联系电话" rules={[{ required: true, message: "请输入甲方联系电话" }]}>
              <Input placeholder="请输入甲方联系电话" />
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card className="page-card" title="收货人信息">
        <Form form={form} layout="vertical" disabled={record?.status !== "待分销商签署"}>
          <div className="agreement-page__filters">
            <Form.Item name="consigneeName" label="收货人" rules={[{ required: true, message: "请输入收货人" }]}>
              <Input placeholder="请输入收货人" />
            </Form.Item>
            <Form.Item name="consigneePhone" label="收货人电话" rules={[{ required: true, message: "请输入收货人电话" }]}>
              <Input placeholder="请输入收货人电话" />
            </Form.Item>
          </div>
          <Form.Item name="consigneeAddress" label="收货地址" rules={[{ required: true, message: "请输入收货地址" }]}>
            <Input.TextArea rows={4} placeholder="请输入收货地址" />
          </Form.Item>
        </Form>
      </Card>

      <Card className="page-card" title="乙方信息">
        {record?.serviceProviderSupplement ? (
          <Descriptions column={2} className="agreement-detail__descriptions">
            <Descriptions.Item label="乙方名称">{record.serviceProviderSupplement.partyBName}</Descriptions.Item>
            <Descriptions.Item label="联系人">{record.serviceProviderSupplement.partyBContact}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{record.serviceProviderSupplement.partyBPhone}</Descriptions.Item>
            <Descriptions.Item label="联系地址" span={2}>
              {record.serviceProviderSupplement.partyBAddress}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">该模块由服务商填写，当前暂未补充。</Typography.Text>
        )}
      </Card>

      <Card className="page-card" title="条款信息">
        {record?.serviceProviderSupplement ? (
          <Table
            rowKey="id"
            pagination={false}
            tableLayout="fixed"
            dataSource={normalizeClauseItems(record.serviceProviderSupplement.clauseItems)}
            columns={[
              { title: "条款项", dataIndex: "clauseTitle", width: 320 },
              { title: "默认规则", dataIndex: "defaultRule", width: 420 },
            ]}
            scroll={{ x: 740 }}
          />
        ) : (
          <Typography.Text type="secondary">该模块由服务商填写，当前暂未补充。</Typography.Text>
        )}
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
    </Space>
  );
}
