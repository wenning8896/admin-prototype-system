import { App, Button, Card, Descriptions, Form, Input, Space, Table, Tag, Timeline, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import type {
  InterceptionReleaseApplicationRecord,
  InterceptionReleaseApplicationStatus,
  InterceptionReleaseEffectiveStatus,
  InterceptionReleaseProductItem,
} from "../mocks/interceptionReleaseApplication.mock";
import {
  getInterceptionReleaseApplicationById,
  invalidateInterceptionReleaseApplication,
  reviewInterceptionReleaseApplication,
} from "../services/interceptionReleaseApplication.mock-service";

type ReviewFormValues = {
  remark: string;
};

const statusColorMap: Record<InterceptionReleaseApplicationStatus, string> = {
  待审批: "processing",
  审批通过: "success",
  审批驳回: "error",
};

const effectiveStatusColorMap: Record<InterceptionReleaseEffectiveStatus, string> = {
  有效: "success",
  失效: "default",
};

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

export function InterceptionReleaseApprovalDetailPage() {
  const [form] = Form.useForm<ReviewFormValues>();
  const { message, modal } = App.useApp();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<InterceptionReleaseApplicationRecord | null>(null);

  useEffect(() => {
    if (!detailId) {
      return;
    }

    setLoading(true);
    setRecord(getInterceptionReleaseApplicationById(detailId));
    setLoading(false);
  }, [detailId]);

  async function handleReview(action: "approve" | "reject") {
    if (!record) {
      return;
    }

    const values = await form.validateFields();
    modal.confirm({
      title: action === "approve" ? "确认审批通过？" : "确认审批驳回？",
      content: action === "approve" ? "通过后将结束解除拦截审批流程。" : "驳回后该申请将回退为审批驳回状态。",
      okText: action === "approve" ? "确认通过" : "确认驳回",
      cancelText: "取消",
      onOk: async () => {
        setSubmitting(true);
        try {
          reviewInterceptionReleaseApplication({
            id: record.id,
            action,
            remark: values.remark,
            reviewerAccount: user?.account ?? "admin",
            reviewerName: user?.name ?? "管理员",
          });
          void message.success(action === "approve" ? "解除拦截申请已审批通过。" : "解除拦截申请已驳回。");
          navigate("/admin/order/interception-release-approval");
        } finally {
          setSubmitting(false);
        }
      },
    });
  }

  if (!record && !loading) {
    return (
      <Card className="page-card">
        <Typography.Text>未找到当前解除拦截审批记录。</Typography.Text>
      </Card>
    );
  }

  const productColumns: ColumnsType<InterceptionReleaseProductItem> = [
    { title: "ShipTo编码", dataIndex: "shipToCode", width: 160 },
    { title: "ShipTo名称", dataIndex: "shipToName", width: 200 },
    { title: "产品编码", dataIndex: "productCode", width: 160 },
    { title: "产品名称", dataIndex: "productName", width: 260 },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate("/admin/order/interception-release-approval")}>返回列表</Button>
            <Space align="center" size={12}>
              <Typography.Title level={4} className="agreement-detail__title">
                解除拦截审批详情
              </Typography.Title>
              {record ? <Tag color={statusColorMap[record.approvalStatus]}>{record.approvalStatus}</Tag> : null}
              {record ? <Tag color={effectiveStatusColorMap[record.effectiveStatus]}>{record.effectiveStatus}</Tag> : null}
            </Space>
          </Space>
          {record?.effectiveStatus === "有效" ? (
            <Button
              danger
              onClick={() => {
                modal.confirm({
                  title: "确认将该申请置为失效？",
                  content: "失效后该申请的生效状态会更新为失效。",
                  okText: "确认失效",
                  cancelText: "取消",
                  onOk: async () => {
                    invalidateInterceptionReleaseApplication({
                      id: record.id,
                      reviewerAccount: user?.account ?? "admin",
                      reviewerName: user?.name ?? "管理员",
                    });
                    void message.success("解除拦截申请已置为失效。");
                    navigate("/admin/order/interception-release-approval");
                  },
                });
              }}
            >
              置为失效
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="page-card" title="基础信息" loading={loading}>
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="申请单号">{record.applicationNo}</Descriptions.Item>
            <Descriptions.Item label="审批节点">{record.approvalNode}</Descriptions.Item>
            <Descriptions.Item label="业务单元">{record.businessUnit}</Descriptions.Item>
            <Descriptions.Item label="大区">{record.region}</Descriptions.Item>
            <Descriptions.Item label="CG">{record.cg}</Descriptions.Item>
            <Descriptions.Item label="经销商编码">{record.dealerCode}</Descriptions.Item>
            <Descriptions.Item label="经销商名称">{record.dealerName}</Descriptions.Item>
            <Descriptions.Item label="经销商类型">{record.dealerType}</Descriptions.Item>
            <Descriptions.Item label="申请时间">{record.appliedAt}</Descriptions.Item>
            <Descriptions.Item label="审批状态">
              <Tag color={statusColorMap[record.approvalStatus]}>{record.approvalStatus}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="生效状态">
              <Tag color={effectiveStatusColorMap[record.effectiveStatus]}>{record.effectiveStatus}</Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="产品信息">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={record?.products ?? []}
          columns={productColumns}
          tableLayout="fixed"
          pagination={false}
          scroll={{ x: 960 }}
        />
      </Card>

      <Card className="page-card" title="申请信息">
        {record ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="申请原因">{record.applyReason || "-"}</Descriptions.Item>
            <Descriptions.Item label="申请附件">{renderDownloadLink(record.attachmentName)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="审批流转记录">
        {record ? (
          <Timeline
            items={[
              ...record.approvalHistory.map((item) => ({
                color: item.decision === "审批驳回" ? "red" : item.decision === "审批通过" ? "green" : "blue",
                children: (
                  <Space direction="vertical" size={4}>
                    <Typography.Text strong>{item.nodeName}</Typography.Text>
                    <Typography.Text type="secondary">
                      {item.role} · {item.operatorName}（{item.account}） · {item.operatedAt}
                    </Typography.Text>
                    <Typography.Text>{item.decision}</Typography.Text>
                    <Typography.Text type="secondary">{item.remark}</Typography.Text>
                  </Space>
                ),
              })),
              ...(record.approvalStatus === "待审批"
                ? [
                    {
                      color: "blue" as const,
                      children: (
                        <Space direction="vertical" size={12} className="agreement-detail__pending-node">
                          <Typography.Text strong>{record.approvalNode}</Typography.Text>
                          <Typography.Text type="secondary" className="agreement-detail__pending-copy">
                            当前节点待审批，请填写审批备注后执行通过或驳回。
                          </Typography.Text>
                          <Form form={form} layout="vertical" initialValues={{ remark: "" }}>
                            <Form.Item name="remark" label="审批备注" rules={[{ required: true, message: "请输入审批备注" }]}>
                              <Input.TextArea rows={4} placeholder="请输入审批意见" />
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
