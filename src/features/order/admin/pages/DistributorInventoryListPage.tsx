import { App, Button, Card, Form, Input, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { DistributorInventoryRecord } from "../mocks/distributorInventory.mock";
import {
  exportDistributorInventory,
  listDistributorInventory,
  type DistributorInventoryFilters,
} from "../services/distributorInventory.mock-service";

export function DistributorInventoryListPage() {
  const [form] = Form.useForm<DistributorInventoryFilters>();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DistributorInventoryRecord[]>([]);

  async function loadData(filters: DistributorInventoryFilters = {}) {
    setLoading(true);
    try {
      setItems(await listDistributorInventory(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<DistributorInventoryRecord> = [
    {
      title: "分销商编码",
      dataIndex: "distributorCode",
      width: 160,
      fixed: "left",
    },
    {
      title: "分销商名称",
      dataIndex: "distributorName",
      width: 220,
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    { title: "产品编码", dataIndex: "productCode", width: 150 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    { title: "批次号", dataIndex: "batchNo", width: 180 },
    { title: "数量", dataIndex: "quantity", width: 100 },
    { title: "生产日期", dataIndex: "productionDate", width: 140 },
    { title: "有效期（天）", dataIndex: "validDays", width: 120 },
  ];

  function handleExport() {
    exportDistributorInventory(items);
    void message.success("分销商库存列表已导出为 .xlsx 文件。");
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="distributorCode" name="distributorCode" label="分销商编码">
                <Input allowClear placeholder="请输入分销商编码" />
              </Form.Item>,
              <Form.Item key="distributorName" name="distributorName" label="分销商名称">
                <Input allowClear placeholder="请输入分销商名称" />
              </Form.Item>,
              <Form.Item key="productCode" name="productCode" label="产品编码">
                <Input allowClear placeholder="请输入产品编码" />
              </Form.Item>,
              <Form.Item key="productName" name="productName" label="产品名称">
                <Input allowClear placeholder="请输入产品名称" />
              </Form.Item>,
              <Form.Item key="batchNo" name="batchNo" label="批次号">
                <Input allowClear placeholder="请输入批次号" />
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
          <Button onClick={handleExport}>导出</Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 1380 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
