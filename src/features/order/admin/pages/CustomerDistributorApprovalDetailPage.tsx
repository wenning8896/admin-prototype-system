import { App, Button, Card, Descriptions, Form, Input, Space, Table, Tag, Timeline, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import {
  getCustomerDistributorById,
  getCustomerDistributorDisplayStatus,
  reviewCustomerDistributor,
  type CustomerDistributorApprovalHistory,
  type CustomerDistributorRecord,
  type SupplyRelation,
} from "./CustomerDistributor.shared";

type ReviewFormValues = {
  remark: string;
};

const statusColorMap = {
  草稿: "default",
  待审批: "processing",
  已驳回: "error",
  启用: "success",
  停用: "default",
} as const;

export function CustomerDistributorApprovalDetailPage() {
  const [form] = Form.useForm<ReviewFormValues>();
  const { message, modal } = App.useApp();
  const { user } = useAuth();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CustomerDistributorRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!detailId) {
      return;
    }

    setLoading(true);
    const next = getCustomerDistributorById(detailId);
    setRecord(next);
    setLoading(false);
  }, [detailId]);

  async function handleReview(action: "approve" | "reject") {
    if (!record || !user) {
      return;
    }

    const values = await form.validateFields();
    modal.confirm({
      title: action === "approve" ? "确认审批通过？" : "确认审批驳回？",
      content: action === "approve" ? "通过后该分销商将直接变更为启用状态。" : "驳回后该分销商将回到可编辑并可重新提交状态。",
      okText: action === "approve" ? "确认通过" : "确认驳回",
      cancelText: "取消",
      onOk: async () => {
        setSubmitting(true);
        try {
          reviewCustomerDistributor({
            id: record.id,
            action,
            remark: values.remark,
            reviewerAccount: user.account,
            reviewerName: user.name,
          });
          void message.success(action === "approve" ? "审批已通过。" : "审批已驳回。");
          navigate("/admin/order/distributor-approval");
        } finally {
          setSubmitting(false);
        }
      },
    });
  }

  const relationColumns: ColumnsType<SupplyRelation> = [
    { title: "经销商类型", dataIndex: "dealerType", width: 120 },
    { title: "经销商编码", dataIndex: "dealerCode", width: 140 },
    { title: "经销商名称", dataIndex: "dealerName", width: 180 },
    { title: "ShipTo编码", dataIndex: "shipToCode", width: 140 },
    { title: "ShipTo名称", dataIndex: "shipToName", width: 180 },
    { title: "是否合作", dataIndex: "cooperationStatus", width: 120 },
    { title: "合作开始时间", dataIndex: "cooperationStartDate", width: 140 },
    { title: "合作结束时间", dataIndex: "cooperationEndDate", width: 140, render: (value?: string) => value || "-" },
  ];

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
          <Space align="center" size={12}>
            <Button onClick={() => navigate("/admin/order/distributor-approval")}>返回列表</Button>
            <Space align="center" size={12}>
              <Typography.Title level={4} className="agreement-detail__title">
                分销商审批详情
              </Typography.Title>
              {record ? (
                <Tag color={statusColorMap[getCustomerDistributorDisplayStatus(record)]}>
                  {getCustomerDistributorDisplayStatus(record)}
                </Tag>
              ) : null}
            </Space>
          </Space>
        </div>
      </Card>

      <Card className="page-card" title="基础信息" loading={loading}>
        {record ? (
          <Descriptions column={2} className="agreement-detail__descriptions">
            <Descriptions.Item label="雀巢分销商编码">{record.distributorCode}</Descriptions.Item>
            <Descriptions.Item label="统一社会信用代码">{record.socialCreditCode}</Descriptions.Item>
            <Descriptions.Item label="分销商名称">{record.distributorName}</Descriptions.Item>
            <Descriptions.Item label="负责人名称">{record.ownerName}</Descriptions.Item>
            <Descriptions.Item label="负责人电话">{record.ownerPhone}</Descriptions.Item>
            <Descriptions.Item label="负责人邮箱">{record.ownerEmail}</Descriptions.Item>
            <Descriptions.Item label="省市区">{record.provinceCityDistrict.join(" / ")}</Descriptions.Item>
            <Descriptions.Item label="街道">{record.street}</Descriptions.Item>
            <Descriptions.Item label="企业地址" span={2}>
              {record.companyAddress}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      {(record?.businessUnits ?? []).map((unit) => (
        <Card key={unit.id} className="page-card" title={`业务单元信息 · ${unit.businessUnit}`}>
          <Space direction="vertical" size={16} className="page-stack">
            <Descriptions column={2} className="agreement-detail__descriptions">
              <Descriptions.Item label="业务单元">{unit.businessUnit}</Descriptions.Item>
              <Descriptions.Item label="渠道名称">{unit.channelName}</Descriptions.Item>
              <Descriptions.Item label="City_Master">{unit.cityMaster}</Descriptions.Item>
              <Descriptions.Item label="是否为重点客户">{unit.isKeyCustomer ? "是" : "否"}</Descriptions.Item>
              <Descriptions.Item label="电签人姓名">{unit.eSignName}</Descriptions.Item>
              <Descriptions.Item label="电签人电话">{unit.eSignPhone}</Descriptions.Item>
            </Descriptions>

            <div>
              <Typography.Title level={5} className="customer-distributor-detail__section-title">
                经销商供货关系
              </Typography.Title>
              <Table
                rowKey="id"
                dataSource={unit.supplyRelations}
                columns={relationColumns}
                pagination={false}
                tableLayout="fixed"
                scroll={{ x: 1200 }}
              />
            </div>
          </Space>
        </Card>
      ))}

      <Card className="page-card" title="审批记录">
        <Timeline
          items={[
            ...((record?.approvalHistory ?? []) as CustomerDistributorApprovalHistory[]).map((item) => ({
              color: item.decision === "审批驳回" ? "red" : item.decision === "审批通过" ? "green" : "blue",
              children: (
                <Space direction="vertical" size={2}>
                  <Typography.Text strong>
                    {item.roleLabel} · {item.operatorName}（{item.account}）
                  </Typography.Text>
                  <Typography.Text type="secondary">{item.actedAt}</Typography.Text>
                  <Typography.Text>{item.decision}</Typography.Text>
                  <Typography.Text type="secondary">审批备注：{item.remark || "-"}</Typography.Text>
                </Space>
              ),
            })),
            ...(record?.approvalStatus === "待审批"
              ? [
                  {
                    color: "blue" as const,
                    children: (
                      <div className="agreement-detail__pending-node">
                        <Space direction="vertical" size={12} className="page-stack">
                          <div>
                            <Typography.Text strong>当前节点 · 分销商准入审批</Typography.Text>
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
