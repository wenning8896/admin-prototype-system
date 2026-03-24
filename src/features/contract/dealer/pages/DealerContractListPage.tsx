import { App, Button, Card, Checkbox, Form, Input, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import type { HospitalContractRecord } from "../../shared/mocks/hospitalContract.mock";
import {
  canClose,
  canRenew,
  canSupplement,
  exportHospitalContractList,
  listDealerHospitalContracts,
  triggerContractClose,
  type HospitalContractFilters,
} from "../../shared/services/hospitalContract.mock-service";

export function DealerContractListPage() {
  const [form] = Form.useForm<HospitalContractFilters>();
  const [items, setItems] = useState<HospitalContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { user } = useAuth();

  async function loadData(filters: HospitalContractFilters = {}) {
    setLoading(true);
    try {
      setItems(await listDealerHospitalContracts(user?.account ?? "dealer", filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<HospitalContractRecord> = [
    { title: "合同编号", dataIndex: "contractNo", width: 180, fixed: "left" },
    { title: "DMS医院编码", dataIndex: "dmsHospitalCode", width: 180 },
    { title: "DMS医院名称", dataIndex: "dmsHospitalName", width: 220 },
    { title: "经销商编码", dataIndex: "dealerCode", width: 160 },
    { title: "经销商名称", dataIndex: "dealerName", width: 220 },
    { title: "大区", dataIndex: "region", width: 120 },
    { title: "CG", dataIndex: "cg", width: 100 },
    { title: "合同签署时间", dataIndex: "signedAt", width: 150 },
    { title: "合同到期时间", dataIndex: "expiredAt", width: 150 },
    { title: "最近提交流程", dataIndex: "latestActionType", width: 140, render: (value?: string) => value ?? "-" },
    { title: "合同存续状态", dataIndex: "lifeStatus", width: 140, render: (value: string) => <Tag>{value}</Tag> },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 280,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" onClick={() => navigate(`/dealer/contract/dealer-contract-list/detail/${record.id}`, { state: { mode: "view" } })}>
            查看
          </Button>
          {canRenew(record) || canSupplement(record) ? (
            <>
              {canRenew(record) ? (
                <Button type="link" onClick={() => navigate(`/dealer/contract/dealer-contract-list/detail/${record.id}`, { state: { mode: "renew" } })}>
                  续签
                </Button>
              ) : null}
              {canSupplement(record) ? (
                <Button type="link" onClick={() => navigate(`/dealer/contract/dealer-contract-list/detail/${record.id}`, { state: { mode: "supplement" } })}>
                  补充 SKU
                </Button>
              ) : null}
            </>
          ) : null}
          {canClose(record) ? (
            <Button
              type="link"
              danger
              onClick={() => {
                let confirmModal: ReturnType<typeof modal.confirm>;
                confirmModal = modal.confirm({
                  title: "确认关闭合同？",
                  content: (
                    <Space direction="vertical" size={12}>
                      <span>确认发起关闭后，合同将直接关闭。关闭后的合同无法再进行续签、补充SKU等操作。</span>
                      <Checkbox onChange={(event) => confirmModal.update({ okButtonProps: { disabled: !event.target.checked } })}>
                        我已阅读并确认关闭后不可恢复
                      </Checkbox>
                    </Space>
                  ),
                  okButtonProps: { disabled: true },
                  onOk: async () => {
                    await triggerContractClose(record.id, {
                      name: user?.name ?? "经销商",
                      account: user?.account ?? "dealer",
                      roleLabel: "经销商",
                    });
                    void message.success("合同已关闭。");
                    await loadData(form.getFieldsValue());
                  },
                });
              }}
            >
              关闭合同
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
              <Form.Item key="contractNo" name="contractNo" label="合同编号">
                <Input allowClear placeholder="请输入合同编号" />
              </Form.Item>,
              <Form.Item key="hospitalCode" name="hospitalCode" label="DMS医院编码">
                <Input allowClear placeholder="请输入DMS医院编码" />
              </Form.Item>,
              <Form.Item key="actionType" name="actionType" label="最近提交流程">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={["新建合同", "续签", "补充SKU", "关闭合同"].map((item) => ({ label: item, value: item }))}
                />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue())}>查询</Button>
                <Button onClick={() => { form.resetFields(); void loadData(); }}>重置</Button>
              </>
            }
          />
        </Form>
      </Card>

      <Card
        className="page-card"
        extra={
          <Space>
            <Button type="primary" onClick={() => navigate("/dealer/contract/dealer-contract-list/detail/new", { state: { mode: "create" } })}>新建合同</Button>
            <Button onClick={() => { exportHospitalContractList(items, "经销商端合同列表"); void message.success("合同列表已导出为 .xlsx 文件。"); }}>导出</Button>
          </Space>
        }
      >
        <Table rowKey="id" loading={loading} dataSource={items} columns={columns} tableLayout="fixed" scroll={{ x: 2120 }} pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }} />
      </Card>
    </Space>
  );
}
