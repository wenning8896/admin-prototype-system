import { App, Button, Card, Checkbox, Form, Input, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import type { HospitalContractRecord } from "../../shared/mocks/hospitalContract.mock";
import {
  canClose,
  exportHospitalContractList,
  listHospitalContracts,
  triggerContractClose,
  type HospitalContractFilters,
} from "../../shared/services/hospitalContract.mock-service";

const lifeColorMap: Record<string, string> = {
  有效: "success",
  无效: "default",
};

export function AbnormalContractListPage() {
  const [form] = Form.useForm<HospitalContractFilters>();
  const [items, setItems] = useState<HospitalContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { message, modal } = App.useApp();
  const { user } = useAuth();

  async function loadData(filters: HospitalContractFilters = {}) {
    setLoading(true);
    try {
      const all = await listHospitalContracts(filters, "admin");
      setItems(all.filter((item) => item.dmsHospitalCooperationStatus === "N"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<HospitalContractRecord> = [
    { title: "合同ID", dataIndex: "contractId", width: 220, fixed: "left" },
    { title: "经销商名称", dataIndex: "dealerName", width: 240, fixed: "left" },
    { title: "DMS医院名称", dataIndex: "dmsHospitalName", width: 220 },
    { title: "大区", dataIndex: "region", width: 120 },
    { title: "CG", dataIndex: "cg", width: 100 },
    { title: "省份", dataIndex: "province", width: 120 },
    { title: "经销商编码", dataIndex: "dealerCode", width: 160 },
    { title: "DMS医院编码", dataIndex: "dmsHospitalCode", width: 180 },
    { title: "DMS医院合作状态", dataIndex: "dmsHospitalCooperationStatus", width: 140, render: (value: string) => <Tag color={value === "Y" ? "success" : "error"}>{value}</Tag> },
    { title: "医院地址", dataIndex: "dmsHospitalAddress", width: 260 },
    { title: "合同形式", dataIndex: "contractForm", width: 220 },
    { title: "转移类型", dataIndex: "transferType", width: 220 },
    { title: "科室合同签署方类型", dataIndex: "contractDepartmentType", width: 180 },
    { title: "合同签署方", dataIndex: "signatoryFullName", width: 220 },
    { title: "医院收货地址", dataIndex: "deliveryAddress", width: 260 },
    { title: "合同盖章名称", dataIndex: "sealName", width: 220 },
    { title: "付款账号", dataIndex: "paymentAccount", width: 180 },
    { title: "付款账号名称", dataIndex: "accountHolderName", width: 220 },
    { title: "付款开户行", dataIndex: "bankName", width: 220 },
    { title: "合同签署时间", dataIndex: "signedAt", width: 150 },
    { title: "合同到期时间", dataIndex: "expiredAt", width: 150 },
    { title: "延期类型", dataIndex: "renewalType", width: 140 },
    { title: "已延期时间", dataIndex: "renewedDuration", width: 140 },
    { title: "合同存续状态", dataIndex: "lifeStatus", width: 140, render: (value: string) => <Tag color={lifeColorMap[value]}>{value}</Tag> },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) =>
        canClose(record) ? (
          <Button
            type="link"
            danger
            onClick={() => {
              let confirmModal: ReturnType<typeof modal.confirm>;
              confirmModal = modal.confirm({
                title: "确认关闭合同？",
                content: (
                  <Space direction="vertical" size={12}>
                    <span>确认发起关闭后，合同将直接关闭。</span>
                    <Checkbox onChange={(event) => confirmModal.update({ okButtonProps: { disabled: !event.target.checked } })}>
                      我已阅读并确认关闭后不可恢复
                    </Checkbox>
                  </Space>
                ),
                okText: "确认关闭",
                cancelText: "取消",
                okButtonProps: { disabled: true },
                onOk: async () => {
                  await triggerContractClose(record.id, {
                    name: user?.name ?? "管理员",
                    account: user?.account ?? "admin",
                    roleLabel: "管理员",
                  });
                  void message.success("合同已关闭。");
                  await loadData(form.getFieldsValue());
                },
              });
            }}
          >
            关闭
          </Button>
        ) : null,
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
              <Form.Item key="dealerCode" name="dealerCode" label="经销商编码">
                <Input allowClear placeholder="请输入经销商编码" />
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
              <Form.Item key="lifeStatus" name="lifeStatus" label="合同存续状态">
                <Select allowClear placeholder="请选择" options={["有效", "无效"].map((item) => ({ label: item, value: item }))} />
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
            <Button onClick={() => { exportHospitalContractList(items, "异常合同列表"); void message.success("异常合同列表已导出为 .xlsx 文件。"); }}>
              导出
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 5200 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
