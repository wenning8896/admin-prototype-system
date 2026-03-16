import { Button, Card, Form, Input, Segmented, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import type { HospitalContractRecord } from "../../shared/mocks/hospitalContract.mock";
import { listContractApprovals, type ContractReviewTab, type HospitalContractFilters } from "../../shared/services/hospitalContract.mock-service";

export function ContractApprovalPage() {
  const [form] = Form.useForm<HospitalContractFilters>();
  const [tab, setTab] = useState<ContractReviewTab>("pending");
  const [items, setItems] = useState<HospitalContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const actorAccount = useMemo(() => user?.account ?? "admin", [user?.account]);

  const loadData = useCallback(async (filters: HospitalContractFilters = {}, nextTab: ContractReviewTab = tab) => {
    setLoading(true);
    try {
      setItems(await listContractApprovals(nextTab, actorAccount, filters));
    } finally {
      setLoading(false);
    }
  }, [actorAccount, tab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const columns: ColumnsType<HospitalContractRecord> = [
    { title: "合同编号", dataIndex: "contractNo", width: 180 },
    { title: "提交类型", dataIndex: "latestActionType", width: 120, render: (value?: string) => value ?? "-" },
    { title: "经销商编码", dataIndex: "dealerCode", width: 160 },
    { title: "经销商名称", dataIndex: "dealerName", width: 220 },
    { title: "DMS医院编码", dataIndex: "dmsHospitalCode", width: 180 },
    { title: "DMS医院名称", dataIndex: "dmsHospitalName", width: 220 },
    { title: "审批节点", dataIndex: "currentApprovalNode", width: 150, render: (value?: string) => value ? <Tag color="processing">{value}</Tag> : "-" },
    { title: "提交人", dataIndex: "submitterName", width: 120 },
    { title: "提交时间", dataIndex: "createdAt", width: 170 },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/admin/contract/contract-approval/detail/${record.id}`)}>
          {tab === "pending" ? "去审批" : "查看"}
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
            const nextTab = value as ContractReviewTab;
            setTab(nextTab);
            void loadData(form.getFieldsValue(), nextTab);
          }}
        />
      </Card>

      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="contractNo" name="contractNo" label="合同编号">
                <Input allowClear placeholder="请输入合同编号" />
              </Form.Item>,
              <Form.Item key="dealerCode" name="dealerCode" label="经销商编码">
                <Input allowClear placeholder="请输入经销商编码" />
              </Form.Item>,
              <Form.Item key="hospitalCode" name="hospitalCode" label="DMS医院编码">
                <Input allowClear placeholder="请输入DMS医院编码" />
              </Form.Item>,
              <Form.Item key="actionType" name="actionType" label="提交类型">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={["新建合同", "续签", "补充SKU", "关闭合同"].map((item) => ({ label: item, value: item }))}
                />
              </Form.Item>,
              <Form.Item key="submitterName" name="submitterName" label="提交人">
                <Input allowClear placeholder="请输入提交人" />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue(), tab)}>
                  查询
                </Button>
                <Button onClick={() => { form.resetFields(); void loadData({}, tab); }}>
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
          scroll={{ x: 1620 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
