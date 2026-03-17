import { App, Button, Card, Form, Input, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { SiAchievementEstimationRecord } from "../mocks/siAchievementEstimation.mock";
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

export function SiAchievementEstimationDashboardPage() {
  const [form] = Form.useForm<SiAchievementEstimationFilters>();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SiAchievementEstimationRecord[]>([]);

  async function loadData(filters: SiAchievementEstimationFilters = {}) {
    setLoading(true);
    try {
      setItems(await listSiAchievementEstimations(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

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
    { title: "预估达成明细(by订单日)", dataIndex: "estimatedAchievedDetail", width: 360, ellipsis: true },
    {
      title: "预估达成率",
      dataIndex: "estimatedAchievementRate",
      width: 140,
      fixed: "right",
      render: (value: number) => <Tag color={getRateTagColor(value)}>{`${(value * 100).toFixed(2)}%`}</Tag>,
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
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
          scroll={{ x: 2480 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
