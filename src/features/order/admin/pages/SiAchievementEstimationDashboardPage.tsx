import dayjs from "dayjs";
import { App, Button, Card, DatePicker, Drawer, Form, Input, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { SiAchievementEstimationRecord, SiAchievementOrderDailyRecord } from "../mocks/siAchievementEstimation.mock";
import {
  exportSiAchievementEstimations,
  listSiAchievementEstimations,
  type SiAchievementEstimationFilters,
} from "../services/siAchievementEstimation.mock-service";

function getRateTagColor(rate: number) {
  if (rate >= 0.95) {
    return "success";
  }
  if (rate >= 0.8) {
    return "processing";
  }
  return "warning";
}

function getOrderStatusTagColor(status: "已执行" | "未执行" | "未来订单日") {
  if (status === "已执行") {
    return "success";
  }
  if (status === "未执行") {
    return "warning";
  }
  return "default";
}

function getOrderStatus(record: SiAchievementOrderDailyRecord) {
  const today = dayjs().startOf("day");
  const orderDay = dayjs(record.orderDate).startOf("day");

  if (orderDay.isAfter(today)) {
    return "未来订单日" as const;
  }

  return record.hasOrdered ? ("已执行" as const) : ("未执行" as const);
}

function getFutureSimulatedAmount(record: SiAchievementEstimationRecord) {
  return record.monthlyOrderDailyData.reduce((sum, item) => {
    return getOrderStatus(item) === "未来订单日" ? sum + item.orderAmount : sum;
  }, 0);
}

export function SiAchievementEstimationDashboardPage() {
  type SiAchievementEstimationFormValues = Omit<SiAchievementEstimationFilters, "month"> & {
    month?: Dayjs;
  };

  const [form] = Form.useForm<SiAchievementEstimationFormValues>();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SiAchievementEstimationRecord[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<SiAchievementEstimationRecord>();

  const currentMonth = dayjs();

  function normalizeFilters(values: SiAchievementEstimationFormValues): SiAchievementEstimationFilters {
    return {
      ...values,
      month: values.month?.format("YYYY-MM"),
    };
  }

  async function loadData(filters: SiAchievementEstimationFilters = {}) {
    setLoading(true);
    try {
      setItems(await listSiAchievementEstimations(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    form.setFieldsValue({ month: currentMonth });
    void loadData({ month: currentMonth.format("YYYY-MM") });
  }, []);

  const detailColumns: ColumnsType<SiAchievementOrderDailyRecord> = [
    { title: "订单日", dataIndex: "orderDate", width: 140 },
    {
      title: "状态",
      width: 140,
      render: (_, record) => {
        const status = getOrderStatus(record);
        return <Tag color={getOrderStatusTagColor(status)}>{status}</Tag>;
      },
    },
    { title: "下单金额", dataIndex: "orderAmount", width: 160, render: (value: number) => `¥ ${value.toLocaleString()}` },
  ];

  const columns: ColumnsType<SiAchievementEstimationRecord> = [
    { title: "业务单元", dataIndex: "businessUnit", width: 120, fixed: "left" },
    { title: "大区", dataIndex: "region", width: 140 },
    { title: "CG", dataIndex: "cg", width: 100 },
    { title: "经销商编码", dataIndex: "dealerCode", width: 160 },
    { title: "经销商名称", dataIndex: "dealerName", width: 260 },
    { title: "ShipTo编码", dataIndex: "shipToCode", width: 160 },
    { title: "ShipTo名称", dataIndex: "shipToName", width: 200 },
    { title: "产品编码", dataIndex: "productCode", width: 160 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    { title: "月度目标(元)", dataIndex: "monthlyTarget", width: 150, render: (value: number) => `¥ ${value.toLocaleString()}` },
    { title: "当月达成(元)", dataIndex: "monthlyAchieved", width: 150, render: (value: number) => `¥ ${value.toLocaleString()}` },
    {
      title: "未来模拟金额(元)",
      key: "futureSimulatedAmount",
      width: 160,
      render: (_, record) => `¥ ${getFutureSimulatedAmount(record).toLocaleString()}`,
    },
    {
      title: "预估达成率",
      dataIndex: "estimatedAchievementRate",
      width: 140,
      render: (value: number) => <Tag color={getRateTagColor(value)}>{`${(value * 100).toFixed(2)}%`}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          style={{ paddingInline: 0 }}
          onClick={() => {
            setActiveRecord(record);
            setDetailOpen(true);
          }}
        >
          查看明细
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
              <Form.Item key="month" name="month" label="月份">
                <DatePicker picker="month" allowClear={false} style={{ width: "100%" }} />
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
              <Form.Item key="shipToCode" name="shipToCode" label="ShipTo编码">
                <Input allowClear placeholder="请输入ShipTo编码" />
              </Form.Item>,
              <Form.Item key="productCode" name="productCode" label="产品编码">
                <Input allowClear placeholder="请输入产品编码" />
              </Form.Item>,
              <Form.Item key="productName" name="productName" label="产品名称">
                <Input allowClear placeholder="请输入产品名称" />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(normalizeFilters(form.getFieldsValue()))}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                    form.setFieldsValue({ month: currentMonth });
                    void loadData({ month: currentMonth.format("YYYY-MM") });
                  }}
                >
                  重置
                </Button>
              </>
            }
          />
        </Form>
      </Card>

      <Card
        className="page-card"
        extra={
          <Button
            onClick={() => {
              exportSiAchievementEstimations(items);
              void message.success("SI达成预估看版已导出为 .xlsx 文件。");
            }}
          >
            导出
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 2540 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Drawer
        title={activeRecord ? `${activeRecord.productName} - 本月订单日数据` : "本月订单日数据"}
        width={920}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setActiveRecord(undefined);
        }}
      >
        {activeRecord ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Table
              rowKey={(record) => `${record.orderDate}-${record.hasOrdered}-${record.orderAmount}`}
              columns={detailColumns}
              dataSource={activeRecord.monthlyOrderDailyData}
              pagination={false}
              tableLayout="fixed"
            />
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}
