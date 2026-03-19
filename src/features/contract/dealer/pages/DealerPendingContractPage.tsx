import { App, Button, Card, Form, Input, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import type { HospitalContractRecord } from "../../shared/mocks/hospitalContract.mock";
import {
  deleteHospitalContractApproval,
  listDealerContractApprovalQueue,
  type HospitalContractFilters,
} from "../../shared/services/hospitalContract.mock-service";

export function DealerPendingContractPage() {
  const [form] = Form.useForm<HospitalContractFilters>();
  const [items, setItems] = useState<HospitalContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { user } = useAuth();

  const loadData = useCallback(async (filters: HospitalContractFilters = {}) => {
    setLoading(true);
    try {
      setItems(await listDealerContractApprovalQueue(user?.account ?? "dealer", filters));
    } finally {
      setLoading(false);
    }
  }, [user?.account]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const columns: ColumnsType<HospitalContractRecord> = [
    { title: "合同编号", dataIndex: "contractNo", width: 180 },
    { title: "提交类型", dataIndex: "latestActionType", width: 120, render: (value?: string) => value ?? "-" },
    {
      title: "审批状态",
      dataIndex: "approvalStatus",
      width: 120,
      render: (value: string) => <Tag color={value === "审核驳回" ? "error" : "processing"}>{value}</Tag>,
    },
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
      width: 220,
      render: (_, record) => (
        <Space size={4}>
          {record.approvalStatus === "审核中" ? (
            <Button
              type="link"
              onClick={() =>
                navigate(`/dealer/contract/dealer-contract-list/detail/${record.id}`, {
                  state: { mode: "view", returnPath: "/dealer/contract/dealer-pending-contract-list" },
                })
              }
            >
              查看
            </Button>
          ) : null}
          {record.approvalStatus === "审核驳回" ? (
            <>
              <Button
                type="link"
                onClick={() =>
                  navigate(`/dealer/contract/dealer-contract-list/detail/${record.id}`, {
                    state: { mode: "edit", returnPath: "/dealer/contract/dealer-pending-contract-list" },
                  })
                }
              >
                编辑
              </Button>
              <Button
                type="link"
                danger
                onClick={() => {
                  modal.confirm({
                    title: "确认删除驳回合同？",
                    content: "删除后该条驳回记录将不再出现在待审批合同模块。",
                    okText: "确认删除",
                    cancelText: "取消",
                    onOk: async () => {
                      await deleteHospitalContractApproval(record.id);
                      void message.success("驳回合同已删除。");
                      await loadData(form.getFieldsValue());
                    },
                  });
                }}
              >
                删除
              </Button>
            </>
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
              <Form.Item key="contractNo" name="contractNo" label="合同编号">
                <Input allowClear placeholder="请输入合同编号" />
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
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue())}>
                  查询
                </Button>
                <Button onClick={() => { form.resetFields(); void loadData({}); }}>
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
