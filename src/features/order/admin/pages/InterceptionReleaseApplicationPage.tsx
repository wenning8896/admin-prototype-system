import { App, Button, Card, Drawer, Form, Input, Radio, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { InterceptionReleaseApplicationRecord, InterceptionReleaseApplicationStatus } from "../mocks/interceptionReleaseApplication.mock";
import {
  exportInterceptionReleaseApplications,
  listInterceptEligibleDealers,
  listInterceptionReleaseApplications,
  type InterceptionDealerOption,
  type InterceptionReleaseApplicationFilters,
} from "../services/interceptionReleaseApplication.mock-service";

const statusColorMap: Record<InterceptionReleaseApplicationStatus, string> = {
  待审批: "processing",
  审批通过: "success",
  审批驳回: "error",
};

export function InterceptionReleaseApplicationPage() {
  const [form] = Form.useForm<InterceptionReleaseApplicationFilters>();
  const [dealerForm] = Form.useForm<{ dealerCode?: string }>();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InterceptionReleaseApplicationRecord[]>([]);
  const [dealerDrawerOpen, setDealerDrawerOpen] = useState(false);
  const [dealerOptions, setDealerOptions] = useState<InterceptionDealerOption[]>([]);

  async function loadData(filters: InterceptionReleaseApplicationFilters = {}) {
    setLoading(true);
    try {
      setItems(await listInterceptionReleaseApplications(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    setDealerOptions(listInterceptEligibleDealers());
  }, []);

  const columns: ColumnsType<InterceptionReleaseApplicationRecord> = [
    { title: "申请单号", dataIndex: "applicationNo", width: 180 },
    { title: "业务单元", dataIndex: "businessUnit", width: 120 },
    { title: "大区", dataIndex: "region", width: 140 },
    { title: "CG", dataIndex: "cg", width: 100 },
    { title: "经销商编码", dataIndex: "dealerCode", width: 160 },
    { title: "经销商名称", dataIndex: "dealerName", width: 260 },
    { title: "申请原因", dataIndex: "applyReason", width: 240, ellipsis: true },
    {
      title: "审批状态",
      dataIndex: "approvalStatus",
      width: 120,
      render: (value: InterceptionReleaseApplicationStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    { title: "审批节点", dataIndex: "approvalNode", width: 160 },
    { title: "申请时间", dataIndex: "appliedAt", width: 180 },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/admin/order/interception-release-application/detail/${record.id}?mode=view`)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="applicationNo" name="applicationNo" label="申请单号">
                <Input allowClear placeholder="请输入申请单号" />
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
              <Form.Item key="dealerCode" name="dealerCode" label="经销商编码">
                <Input allowClear placeholder="请输入经销商编码" />
              </Form.Item>,
              <Form.Item key="dealerName" name="dealerName" label="经销商名称">
                <Input allowClear placeholder="请输入经销商名称" />
              </Form.Item>,
              <Form.Item key="approvalStatus" name="approvalStatus" label="审批状态">
                <Radio.Group
                  options={[
                    { label: "待审批", value: "待审批" },
                    { label: "审批通过", value: "审批通过" },
                    { label: "审批驳回", value: "审批驳回" },
                  ]}
                  optionType="button"
                  buttonStyle="solid"
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
        <div className="e-distributor-page__toolbar">
          <Space wrap>
            <Button
              type="primary"
              onClick={() => {
                dealerForm.resetFields();
                setDealerDrawerOpen(true);
              }}
            >
              发起申请
            </Button>
            <Button
              onClick={() => {
                exportInterceptionReleaseApplications(items);
                void message.success("解除拦截申请列表已导出为 .xlsx 文件。");
              }}
            >
              导出
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 1840 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Drawer
        title="选择经销商"
        open={dealerDrawerOpen}
        onClose={() => setDealerDrawerOpen(false)}
        width={720}
        extra={
          <Space>
            <Button onClick={() => setDealerDrawerOpen(false)}>取消</Button>
            <Button
              type="primary"
              onClick={async () => {
                const values = await dealerForm.validateFields();
                const target = dealerOptions.find((item) => item.dealerCode === values.dealerCode);
                if (!target) {
                  return;
                }
                setDealerDrawerOpen(false);
                navigate(
                  `/admin/order/interception-release-application/detail/new?mode=create&dealerCode=${encodeURIComponent(
                    target.dealerCode,
                  )}`,
                );
              }}
            >
              确认选择
            </Button>
          </Space>
        }
      >
        <Form form={dealerForm} layout="vertical">
          <Form.Item name="dealerCode" rules={[{ required: true, message: "请选择一个经销商" }]}>
            <Radio.Group style={{ width: "100%" }}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {dealerOptions.map((item) => (
                  <Radio key={item.dealerCode} value={item.dealerCode} style={{ width: "100%" }}>
                    <div>
                      <div>
                        {item.businessUnit} / {item.region} / {item.cg}
                      </div>
                      <div>
                        {item.dealerCode} / {item.dealerName}
                      </div>
                    </div>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}
