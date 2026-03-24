import { App, Button, Card, Descriptions, Form, Input, Space, Table, Tag, Timeline, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import type { HospitalContractProduct, HospitalContractReceiver, HospitalContractRecord } from "../../shared/mocks/hospitalContract.mock";
import { exportContractVersion, getHospitalContractById, reviewHospitalContract } from "../../shared/services/hospitalContract.mock-service";

type ReviewForm = {
  remark: string;
  attachmentName?: string;
};

export function ContractApprovalDetailPage() {
  const [form] = Form.useForm<ReviewForm>();
  const { message, modal } = App.useApp();
  const { user } = useAuth();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<HospitalContractRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadRecord = useCallback(async () => {
    if (!detailId) {
      return;
    }

    setLoading(true);
    try {
      setRecord(await getHospitalContractById(detailId));
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
      content: decision === "approve" ? "通过后合同将流转到下一节点或生效。" : "驳回后合同将回到发起人重新修改。",
      okText: decision === "approve" ? "确认通过" : "确认驳回",
      cancelText: "取消",
      onOk: async () => {
        setSubmitting(true);
        try {
          await reviewHospitalContract({
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
          void message.success(decision === "approve" ? "审批已通过。" : "审批已驳回。");
          form.resetFields();
          await loadRecord();
        } finally {
          setSubmitting(false);
        }
      },
    });
  }

  const receiverColumns: ColumnsType<HospitalContractReceiver> = [
    { title: "收货人姓名", dataIndex: "receiverName", width: 180 },
    { title: "收货人ID", dataIndex: "receiverCode", width: 180 },
  ];

  const productColumns: ColumnsType<HospitalContractProduct> = [
    { title: "产品编码", dataIndex: "productCode", width: 160 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    { title: "供货价格", dataIndex: "price", width: 160, render: (_: number, row: HospitalContractProduct) => `¥ ${(row.price ?? row.suggestedPrice).toFixed(2)}` },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate("/admin/contract/contract-approval")}>返回列表</Button>
            <Typography.Title level={4} className="agreement-detail__title">
              合同审批详情
            </Typography.Title>
            {record ? <Tag color={record.lifeStatus === "有效" ? "success" : record.lifeStatus === "待生效" ? "processing" : record.lifeStatus === "失效" ? "warning" : "default"}>{record.lifeStatus}</Tag> : null}
          </Space>
        </div>
      </Card>

      <Card className="page-card" title="合同信息" loading={loading}>
        {record ? (
          <Descriptions column={3} size="small">
            <Descriptions.Item label="合同编号">{record.contractNo}</Descriptions.Item>
            <Descriptions.Item label="提交类型">{record.latestActionType ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="当前审批节点">{record.currentApprovalNode ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="提交人">{record.submitterName}</Descriptions.Item>
            <Descriptions.Item label="经销商编码">{record.dealerCode}</Descriptions.Item>
            <Descriptions.Item label="经销商名称">{record.dealerName}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{record.createdAt}</Descriptions.Item>
            <Descriptions.Item label="DMS医院编码">{record.dmsHospitalCode}</Descriptions.Item>
            <Descriptions.Item label="DMS医院名称">{record.dmsHospitalName}</Descriptions.Item>
            <Descriptions.Item label="合同形式">{record.contractForm}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="医院指定收货人信息">
        <Table rowKey="id" pagination={false} columns={receiverColumns} dataSource={record?.receivers ?? []} scroll={{ x: 420 }} />
      </Card>

      <Card className="page-card" title="产品信息">
        <Table rowKey="id" pagination={false} columns={productColumns} dataSource={record?.products ?? []} scroll={{ x: 680 }} />
      </Card>

      <Card className="page-card" title="合同版本">
        <Table
          rowKey="id"
          pagination={false}
          dataSource={record?.versions ?? []}
          columns={[
            { title: "版本", dataIndex: "versionLabel", width: 120 },
            { title: "动作", dataIndex: "actionType", width: 120 },
            { title: "生成时间", dataIndex: "createdAt", width: 180 },
            { title: "操作人", dataIndex: "operatorName", width: 120 },
            {
              title: "操作",
              width: 120,
              render: (_, version) => (
                <Button type="link" onClick={() => record ? exportContractVersion(record, version) : undefined}>
                  导出版本
                </Button>
              ),
            },
          ]}
        />
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
              ...(record.approvalStatus === "审核中" && record.currentApprovalNode
                ? [
                    {
                      color: "blue" as const,
                      children: (
                        <Space direction="vertical" size={12} className="agreement-detail__pending-node">
                          <Typography.Text strong>{record.currentApprovalNode}</Typography.Text>
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
