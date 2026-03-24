import { Button, Card, Form, Input, Segmented, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import {
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

type ReviewTab = "pending" | "reviewed";
type ApprovalFilters = {
  applicationNo?: string;
  distributorName?: string;
  distributorCode?: string;
  serviceProviderName?: string;
  status?: AgreementStage;
};

export function ContractSigningApprovalPage() {
  const [form] = Form.useForm<ApprovalFilters>();
  const [tab, setTab] = useState<ReviewTab>("pending");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PurchaseAgreementRecord[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  async function loadData(filters: ApprovalFilters = {}, nextTab: ReviewTab = tab) {
    setLoading(true);
    try {
      const all = await listPurchaseAgreements();
      const applicationNo = filters.applicationNo?.trim().toLowerCase();
      const distributorName = filters.distributorName?.trim().toLowerCase();
      const distributorCode = filters.distributorCode?.trim().toLowerCase();
      const serviceProviderName = filters.serviceProviderName?.trim().toLowerCase();

      const next = all.filter((item) => {
        const matchesApplicationNo = !applicationNo || item.applicationNo.toLowerCase().includes(applicationNo);
        const matchesDistributorName = !distributorName || item.distributorName.toLowerCase().includes(distributorName);
        const matchesDistributorCode = !distributorCode || item.distributorCode.toLowerCase().includes(distributorCode);
        const matchesServiceProviderName =
          !serviceProviderName || item.serviceProviderName.toLowerCase().includes(serviceProviderName);
        const matchesStatus = !filters.status || item.status === filters.status;

        if (nextTab === "pending") {
          return (
            matchesApplicationNo &&
            matchesDistributorName &&
            matchesDistributorCode &&
            matchesServiceProviderName &&
            matchesStatus &&
            item.status === "待签约审批"
          );
        }

        return (
          matchesApplicationNo &&
          matchesDistributorName &&
          matchesDistributorCode &&
          matchesServiceProviderName &&
          matchesStatus &&
          item.approvalHistory.some(
            (history) =>
              history.account === user?.account &&
              (history.decision === "审批通过" || history.decision === "审批驳回"),
          )
        );
      });

      setItems(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const all = await listPurchaseAgreements();
        setItems(all.filter((item) => item.status === "待签约审批"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: ColumnsType<PurchaseAgreementRecord> = [
    { title: "申请编号", dataIndex: "applicationNo", width: 180 },
    { title: "分销商名称", dataIndex: "distributorName", width: 220 },
    { title: "分销商编码", dataIndex: "distributorCode", width: 140 },
    { title: "服务商", dataIndex: "serviceProviderName", width: 180 },
    { title: "服务商负责人", dataIndex: "serviceProviderOwner", width: 140 },
    { title: "发起时间", dataIndex: "createdAt", width: 160 },
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
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 140,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/admin/order/contract-signing-approval/detail/${record.id}`)}
        >
          {tab === "pending" ? "去审批" : "查看详情"}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <Segmented
          value={tab}
          options={[
            { label: "待我审批", value: "pending" },
            { label: "我已审批", value: "reviewed" },
          ]}
          onChange={(value) => {
            const nextTab = value as ReviewTab;
            setTab(nextTab);
            void loadData(form.getFieldsValue(), nextTab);
          }}
        />
      </Card>

      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="applicationNo" name="applicationNo" label="申请编号">
                <Input allowClear placeholder="请输入申请编号" />
              </Form.Item>,
              <Form.Item key="distributorName" name="distributorName" label="分销商名称">
                <Input allowClear placeholder="请输入分销商名称" />
              </Form.Item>,
              <Form.Item key="distributorCode" name="distributorCode" label="分销商编码">
                <Input allowClear placeholder="请输入分销商编码" />
              </Form.Item>,
              <Form.Item key="serviceProviderName" name="serviceProviderName" label="服务商">
                <Input allowClear placeholder="请输入服务商名称" />
              </Form.Item>,
              <Form.Item key="status" name="status" label="当前状态">
                <Select
                  allowClear
                  placeholder={tab === "pending" ? "待签约审批" : "请选择"}
                  disabled={tab === "pending"}
                  options={Object.keys(stageColorMap).map((item) => ({ label: item, value: item }))}
                />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue(), tab)}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                    void loadData({}, tab);
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
          scroll={{ x: 1340 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
