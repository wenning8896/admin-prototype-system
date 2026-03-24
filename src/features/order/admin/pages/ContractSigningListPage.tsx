import { App, Button, Card, Form, Input, Modal, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import {
  canInvalidatePurchaseAgreement,
  invalidatePurchaseAgreement,
  listPurchaseAgreements,
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

type SigningListFilters = {
  keyword?: string;
  serviceProviderName?: string;
  status?: AgreementStage;
};

export function ContractSigningListPage() {
  const [form] = Form.useForm<SigningListFilters>();
  const [invalidateForm] = Form.useForm<{ reason: string }>();
  const { message } = App.useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PurchaseAgreementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalidating, setInvalidating] = useState(false);
  const [invalidateTarget, setInvalidateTarget] = useState<PurchaseAgreementRecord | null>(null);

  async function loadData(filters: SigningListFilters = {}) {
    setLoading(true);
    try {
      const all = await listPurchaseAgreements();
      const keyword = filters.keyword?.trim().toLowerCase();
      const serviceProviderName = filters.serviceProviderName?.trim().toLowerCase();

      const next = all.filter((item) => {
        const agreementKeyword = item.agreementNo ?? item.applicationNo;
        const matchesKeyword =
          !keyword ||
          agreementKeyword.toLowerCase().includes(keyword) ||
          item.applicationNo.toLowerCase().includes(keyword) ||
          item.distributorName.toLowerCase().includes(keyword) ||
          item.distributorCode.toLowerCase().includes(keyword);
        const matchesServiceProviderName =
          !serviceProviderName || item.serviceProviderName.toLowerCase().includes(serviceProviderName);
        const matchesStatus = !filters.status || item.status === filters.status;

        return matchesKeyword && matchesServiceProviderName && matchesStatus;
      });

      setItems(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleInvalidateSubmit() {
    if (!invalidateTarget || !user) {
      return;
    }

    const values = await invalidateForm.validateFields();
    setInvalidating(true);
    try {
      await invalidatePurchaseAgreement({
        id: invalidateTarget.id,
        reason: values.reason,
        operatorAccount: user.account,
        operatorName: user.name,
        source: "admin-signing-list",
      });
      void message.success("平台协议已作废。");
      setInvalidateTarget(null);
      invalidateForm.resetFields();
      await loadData(form.getFieldsValue());
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "作废协议失败");
    } finally {
      setInvalidating(false);
    }
  }

  const columns: ColumnsType<PurchaseAgreementRecord> = [
    {
      title: "协议编号",
      dataIndex: "agreementNo",
      width: 180,
      render: (value: string | undefined, record) => value ?? record.applicationNo,
    },
    { title: "申请编号", dataIndex: "applicationNo", width: 180 },
    { title: "分销商名称", dataIndex: "distributorName", width: 220 },
    { title: "分销商编码", dataIndex: "distributorCode", width: 140 },
    { title: "服务商", dataIndex: "serviceProviderName", width: 180 },
    {
      title: "当前节点",
      dataIndex: "currentApprovalNode",
      width: 160,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: "当前状态",
      dataIndex: "status",
      width: 140,
      render: (value: AgreementStage) => <Tag color={stageColorMap[value]}>{value}</Tag>,
    },
    { title: "发起时间", dataIndex: "createdAt", width: 160 },
    { title: "审批时间", dataIndex: "approvalAt", width: 160, render: (value?: string) => value ?? "-" },
    { title: "作废时间", dataIndex: "invalidatedAt", width: 160, render: (value?: string) => value ?? "-" },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => (
        <Space size={12}>
          <Button type="link" onClick={() => navigate(`/admin/order/contract-signing-list/detail/${record.id}`)}>
            查看详情
          </Button>
          {canInvalidatePurchaseAgreement(record.status) ? (
            <Button
              type="link"
              danger
              onClick={() => {
                invalidateForm.resetFields();
                setInvalidateTarget(record);
              }}
            >
              作废协议
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="keyword" name="keyword" label="协议编号 / 申请编号 / 分销商">
                <Input allowClear placeholder="请输入关键词" />
              </Form.Item>,
              <Form.Item key="serviceProviderName" name="serviceProviderName" label="服务商">
                <Input allowClear placeholder="请输入服务商名称" />
              </Form.Item>,
              <Form.Item key="status" name="status" label="当前状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={Object.keys(stageColorMap).map((item) => ({ label: item, value: item }))}
                />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue())}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                    void loadData();
                  }}
                >
                  重置
                </Button>
              </>
            }
          />
        </Form>
      </Card>

      <Card className="page-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 1680 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="作废平台协议"
        open={Boolean(invalidateTarget)}
        okText="确认作废"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: invalidating }}
        onCancel={() => {
          setInvalidateTarget(null);
          invalidateForm.resetFields();
        }}
        onOk={() => void handleInvalidateSubmit()}
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
