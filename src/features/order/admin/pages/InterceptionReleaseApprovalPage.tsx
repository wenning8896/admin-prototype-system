import { Button, Card, Form, Input, Segmented, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import type {
  InterceptionReleaseApplicationRecord,
  InterceptionReleaseApplicationStatus,
  InterceptionReleaseEffectiveStatus,
} from "../mocks/interceptionReleaseApplication.mock";
import {
  hasInterceptionReleaseReviewedByAccount,
  listInterceptionReleaseApplications,
  type InterceptionReleaseApplicationFilters,
} from "../services/interceptionReleaseApplication.mock-service";

type ReviewTab = "pending" | "reviewed";

const statusColorMap: Record<InterceptionReleaseApplicationStatus, string> = {
  待审批: "processing",
  审批通过: "success",
  审批驳回: "error",
};

const effectiveStatusColorMap: Record<InterceptionReleaseEffectiveStatus, string> = {
  有效: "success",
  失效: "default",
};

export function InterceptionReleaseApprovalPage() {
  const [form] = Form.useForm<InterceptionReleaseApplicationFilters>();
  const [tab, setTab] = useState<ReviewTab>("pending");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InterceptionReleaseApplicationRecord[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  async function loadData(filters: InterceptionReleaseApplicationFilters = {}, nextTab: ReviewTab = tab) {
    setLoading(true);
    try {
      const all = await listInterceptionReleaseApplications(filters);
      setItems(
        all.filter((item) => {
          if (nextTab === "pending") {
            return item.approvalStatus === "待审批";
          }

          return hasInterceptionReleaseReviewedByAccount(item, user?.account);
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const all = await listInterceptionReleaseApplications();
        setItems(all.filter((item) => item.approvalStatus === "待审批"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: ColumnsType<InterceptionReleaseApplicationRecord> = [
    { title: "申请单号", dataIndex: "applicationNo", width: 180 },
    { title: "业务单元", dataIndex: "businessUnit", width: 120 },
    { title: "大区", dataIndex: "region", width: 140 },
    { title: "CG", dataIndex: "cg", width: 120 },
    { title: "经销商编码", dataIndex: "dealerCode", width: 150 },
    { title: "经销商名称", dataIndex: "dealerName", width: 220 },
    { title: "审批节点", dataIndex: "approvalNode", width: 150 },
    { title: "申请时间", dataIndex: "appliedAt", width: 170 },
    { title: "更新时间", dataIndex: "updatedAt", width: 170 },
    {
      title: "审批状态",
      dataIndex: "approvalStatus",
      width: 120,
      render: (value: InterceptionReleaseApplicationStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    {
      title: "生效状态",
      dataIndex: "effectiveStatus",
      width: 120,
      render: (value: InterceptionReleaseEffectiveStatus) => <Tag color={effectiveStatusColorMap[value]}>{value}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/admin/order/interception-release-approval/detail/${record.id}`)}>
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
              <Form.Item key="applicationNo" name="applicationNo" label="申请单号">
                <Input allowClear placeholder="请输入申请单号" />
              </Form.Item>,
              <Form.Item key="dealerCode" name="dealerCode" label="经销商编码">
                <Input allowClear placeholder="请输入经销商编码" />
              </Form.Item>,
              <Form.Item key="dealerName" name="dealerName" label="经销商名称">
                <Input allowClear placeholder="请输入经销商名称" />
              </Form.Item>,
              <Form.Item key="businessUnit" name="businessUnit" label="业务单元">
                <Input allowClear placeholder="请输入业务单元" />
              </Form.Item>,
              <Form.Item key="region" name="region" label="大区">
                <Input allowClear placeholder="请输入大区" />
              </Form.Item>,
              <Form.Item key="cg" name="cg" label="CG">
                <Input allowClear placeholder="请输入CG" />
              </Form.Item>,
              <Form.Item key="effectiveStatus" name="effectiveStatus" label="生效状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={[
                    { label: "有效", value: "有效" },
                    { label: "失效", value: "失效" },
                  ]}
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
          scroll={{ x: 1720 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
