import { Button, Card, Form, Input, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { EDistributionOrderRecord, EDistributionOrderStatus } from "../../shared/mocks/eDistributionOrderFlow.mock";
import { listEDistributionOrders } from "../../shared/services/eDistributionOrderFlow.mock-service";

type OrderFilters = {
  keyword?: string;
  status?: EDistributionOrderStatus;
  platformCode?: string;
};

const statusColorMap: Record<EDistributionOrderStatus, string> = {
  待审批: "processing",
  待发货: "gold",
  待收货: "blue",
  收货待确认: "cyan",
  收货待重新提交: "warning",
  已完成: "success",
  取消确认中: "orange",
  取消待审批: "volcano",
  已取消: "default",
};

export function PlatformOrderListPage() {
  const [form] = Form.useForm<OrderFilters>();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EDistributionOrderRecord[]>([]);
  const navigate = useNavigate();

  async function loadData(filters: OrderFilters = {}) {
    setLoading(true);
    try {
      const keyword = filters.keyword?.trim().toLowerCase();
      const all = await listEDistributionOrders();
      setItems(
        all.filter((item) => {
          const matchesKeyword =
            !keyword ||
            item.orderNo.toLowerCase().includes(keyword) ||
            item.distributorName.toLowerCase().includes(keyword) ||
            item.serviceProviderName.toLowerCase().includes(keyword);
          const matchesStatus = !filters.status || item.status === filters.status;
          const matchesPlatform = !filters.platformCode || item.platformCode === filters.platformCode;
          return matchesKeyword && matchesStatus && matchesPlatform;
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<EDistributionOrderRecord> = [
    { title: "订单编号", dataIndex: "orderNo", width: 180, fixed: "left" },
    { title: "平台", dataIndex: "platformName", width: 120 },
    { title: "分销商名称", dataIndex: "distributorName", width: 200 },
    { title: "服务商名称", dataIndex: "serviceProviderName", width: 180 },
    { title: "商品总数", dataIndex: "totalQuantity", width: 120 },
    { title: "订单总金额", dataIndex: "orderAmount", width: 140, render: (value: number) => `¥ ${value.toFixed(2)}` },
    { title: "提交时间", dataIndex: "createdAt", width: 160 },
    {
      title: "订单状态",
      dataIndex: "status",
      width: 140,
      render: (value: EDistributionOrderStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/admin/order/platform-order-list/detail/${record.id}`)}>
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
              <Form.Item key="keyword" name="keyword" label="订单编号 / 分销商 / 服务商">
                <Input allowClear placeholder="请输入关键词" />
              </Form.Item>,
              <Form.Item key="platformCode" name="platformCode" label="平台编码">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={[
                    { label: "京东", value: "PLAT-001" },
                    { label: "淘宝", value: "PLAT-002" },
                    { label: "天猫", value: "PLAT-003" },
                    { label: "拼多多", value: "PLAT-004" },
                  ]}
                />
              </Form.Item>,
              <Form.Item key="status" name="status" label="订单状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={Object.keys(statusColorMap).map((item) => ({ label: item, value: item }))}
                />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue())}>
                  查询
                </Button>
                <Button onClick={() => { form.resetFields(); void loadData(); }}>
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
          scroll={{ x: 1760 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
