import { App, Button, Card, Form, Input, Modal, Segmented, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { AdminOrderDealerOption, AdminOrderRecord, AdminOrderStatus, AdminOrderTabKey } from "../mocks/orderList.mock";
import {
  type AdminOrderDealerFilters,
  createDraftAdminOrder,
  exportAdminOrderList,
  exportAdminOrderPdf,
  listAdminOrders,
  listAdminOrderDealerOptions,
  previewAdminOrderPdf,
  resubmitAdminOrder,
  type AdminOrderFilters,
} from "../services/orderList.mock-service";

const statusColorMap: Record<AdminOrderStatus, string> = {
  待SA确认: "processing",
  SA驳回: "error",
  订单已提交: "blue",
  建议订单审批中: "gold",
  订单撤销: "default",
  待经销商确认: "cyan",
  经销商驳回: "volcano",
  暂存: "default",
};

export function AdminOrderListPage() {
  const [form] = Form.useForm<AdminOrderFilters>();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminOrderTabKey>("orders");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminOrderRecord[]>([]);
  const [dealerSelectOpen, setDealerSelectOpen] = useState(false);
  const [dealerFilters, setDealerFilters] = useState<AdminOrderDealerFilters>({});
  const [dealerOptions, setDealerOptions] = useState<AdminOrderDealerOption[]>([]);
  const [selectedDealerCode, setSelectedDealerCode] = useState<string>();

  async function loadData(nextTab: AdminOrderTabKey = tab, filters: AdminOrderFilters = {}) {
    setLoading(true);
    try {
      setItems(await listAdminOrders(nextTab, filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setItems(await listAdminOrders("orders"));
        setDealerOptions(listAdminOrderDealerOptions());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: ColumnsType<AdminOrderRecord> = [
    { title: "订单编号", dataIndex: "orderNo", width: 180, fixed: "left" },
    { title: "订单产品总数（箱）", dataIndex: "orderProductTotalBoxes", width: 150 },
    {
      title: "订单金额（含税/元）",
      dataIndex: "orderAmountWithTax",
      width: 160,
      render: (value: number) => value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: "NPS金额（元）",
      dataIndex: "npsAmount",
      width: 140,
      render: (value: number) => value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: "未税金额（元）",
      dataIndex: "orderAmountWithoutTax",
      width: 150,
      render: (value: number) => value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    { title: "经销商编码", dataIndex: "dealerCode", width: 140 },
    { title: "经销商名称", dataIndex: "dealerName", width: 240 },
    { title: "L4", dataIndex: "l4", width: 120 },
    { title: "L5", dataIndex: "l5", width: 120 },
    { title: "L6", dataIndex: "l6", width: 120 },
    { title: "创建时间", dataIndex: "createdAt", width: 170 },
    { title: "创建人", dataIndex: "createdBy", width: 110 },
    { title: "状态变更时间", dataIndex: "statusChangedAt", width: 170 },
    {
      title: "订单状态",
      dataIndex: "orderStatus",
      width: 120,
      render: (value: AdminOrderStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 280,
      render: (_, record) => (
        <Space size={0} wrap>
          <Button type="link" onClick={() => navigate(`/admin/order/order-list/detail/${record.id}`)}>
            查看详情
          </Button>
          <Button
            type="link"
            disabled={record.orderStatus !== "SA驳回" && record.orderStatus !== "经销商驳回" && record.orderStatus !== "暂存"}
            onClick={() => {
              modal.confirm({
                title: "确认重新提交该订单？",
                content: "重新提交后订单会进入正式订单列表。",
                okText: "确认提交",
                cancelText: "取消",
                onOk: async () => {
                  resubmitAdminOrder(record.id);
                  void message.success("订单已重新提交。");
                  await loadData(tab, form.getFieldsValue());
                },
              });
            }}
          >
            重新提交
          </Button>
          <Button type="link" onClick={() => previewAdminOrderPdf(record)}>
            预览PDF
          </Button>
          <Button type="link" onClick={() => exportAdminOrderPdf(record)}>
            导出PDF
          </Button>
        </Space>
      ),
    },
  ];

  const dealerColumns: ColumnsType<AdminOrderDealerOption> = [
    { title: "经销商编码", dataIndex: "dealerCode", width: 140 },
    { title: "经销商名称", dataIndex: "dealerName", width: 260 },
    { title: "L4", dataIndex: "l4", width: 220 },
    { title: "L5", dataIndex: "l5", width: 220 },
    { title: "L6", dataIndex: "l6", width: 240 },
    { title: "大区", dataIndex: "region", width: 100 },
    { title: "CG", dataIndex: "cg", width: 100 },
    { title: "业务单元", dataIndex: "businessUnit", width: 120 },
    { title: "经销商类型", dataIndex: "dealerType", width: 120 },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 90,
      render: (_, record) => (
        <Button type={selectedDealerCode === record.dealerCode ? "primary" : "link"} onClick={() => setSelectedDealerCode(record.dealerCode)}>
          选择
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
            { label: "订单列表", value: "orders" },
            { label: "暂存订单", value: "drafts" },
          ]}
          onChange={(value) => {
            const nextTab = value as AdminOrderTabKey;
            setTab(nextTab);
            void loadData(nextTab, form.getFieldsValue());
          }}
        />
      </Card>

      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="orderNo" name="orderNo" label="订单编号">
                <Input allowClear placeholder="请输入订单编号" />
              </Form.Item>,
              <Form.Item key="dealerCode" name="dealerCode" label="经销商编码">
                <Input allowClear placeholder="请输入经销商编码" />
              </Form.Item>,
              <Form.Item key="dealerName" name="dealerName" label="经销商名称">
                <Input allowClear placeholder="请输入经销商名称" />
              </Form.Item>,
              <Form.Item key="orderStatus" name="orderStatus" label="订单状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={Object.keys(statusColorMap).map((item) => ({ label: item, value: item }))}
                />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(tab, form.getFieldsValue())}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                    void loadData(tab);
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
                setDealerFilters({});
                setDealerOptions(listAdminOrderDealerOptions());
                setSelectedDealerCode(undefined);
                setDealerSelectOpen(true);
              }}
            >
              新建订单
            </Button>
            <Button
              onClick={() => {
                exportAdminOrderList(items, tab === "orders" ? "订单列表" : "暂存订单");
                void message.success("当前列表已导出。");
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
          scroll={{ x: 2440 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="选择经销商"
        open={dealerSelectOpen}
        onCancel={() => setDealerSelectOpen(false)}
        width={1500}
        footer={
          <Space>
            <Button onClick={() => setDealerSelectOpen(false)}>取消</Button>
            <Button
              type="primary"
              disabled={!selectedDealerCode}
              onClick={() => {
                const selectedDealer = dealerOptions.find((item) => item.dealerCode === selectedDealerCode);
                if (!selectedDealer) {
                  return;
                }
                const created = createDraftAdminOrder(selectedDealer);
                setDealerSelectOpen(false);
                void message.success("已创建暂存订单。");
                setTab("drafts");
                navigate(`/admin/order/order-list/detail/${created.id}?mode=create`);
              }}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Space wrap>
            <Input
              value={dealerFilters.dealerCode}
              placeholder="输入经销商编码"
              style={{ width: 240 }}
              onChange={(event) => setDealerFilters((current) => ({ ...current, dealerCode: event.target.value }))}
            />
            <Input
              value={dealerFilters.dealerName}
              placeholder="输入经销商名称"
              style={{ width: 240 }}
              onChange={(event) => setDealerFilters((current) => ({ ...current, dealerName: event.target.value }))}
            />
            <Input
              value={dealerFilters.hierarchyKeyword}
              placeholder="选择分配层级（可搜索）"
              style={{ width: 280 }}
              onChange={(event) => setDealerFilters((current) => ({ ...current, hierarchyKeyword: event.target.value }))}
            />
            <Button
              onClick={() => {
                setDealerOptions(listAdminOrderDealerOptions(dealerFilters));
              }}
            >
              查询
            </Button>
          </Space>

          <Table
            rowKey="dealerCode"
            dataSource={dealerOptions}
            columns={dealerColumns}
            tableLayout="fixed"
            pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `已选 ${selectedDealerCode ? 1 : 0} / ${total}` }}
            scroll={{ x: 1600 }}
          />
        </Space>
      </Modal>
    </Space>
  );
}
