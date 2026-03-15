import { App, Button, Card, Form, Input, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { ServiceProviderRecord } from "../mocks/serviceProvider.mock";
import {
  exportServiceProviders,
  listServiceProviders,
  type ServiceProviderFilters,
} from "../services/serviceProvider.mock-service";

const statusColorMap: Record<ServiceProviderRecord["status"], string> = {
  启用: "success",
  停用: "default",
};

export function ServiceProviderListPage() {
  const [form] = Form.useForm<ServiceProviderFilters>();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ServiceProviderRecord[]>([]);

  async function loadData(filters: ServiceProviderFilters = {}) {
    setLoading(true);
    try {
      setItems(await listServiceProviders(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<ServiceProviderRecord> = [
    { title: "服务商编码", dataIndex: "serviceProviderCode", width: 160, fixed: "left" },
    {
      title: "服务商名称",
      dataIndex: "serviceProviderName",
      width: 220,
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    { title: "负责人", dataIndex: "ownerName", width: 120 },
    { title: "联系电话", dataIndex: "ownerPhone", width: 140 },
    { title: "覆盖区域", dataIndex: "region", width: 140 },
    { title: "已关联分销商数", dataIndex: "linkedDistributorCount", width: 150 },
    {
      title: "状态",
      dataIndex: "status",
      width: 120,
      render: (value: ServiceProviderRecord["status"]) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    { title: "创建时间", dataIndex: "createdAt", width: 160 },
  ];

  function handleExport() {
    exportServiceProviders(items);
    void message.success("服务商列表已导出为 .xlsx 文件。");
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="serviceProviderCode" name="serviceProviderCode" label="服务商编码">
                <Input allowClear placeholder="请输入服务商编码" />
              </Form.Item>,
              <Form.Item key="serviceProviderName" name="serviceProviderName" label="服务商名称">
                <Input allowClear placeholder="请输入服务商名称" />
              </Form.Item>,
              <Form.Item key="ownerName" name="ownerName" label="负责人">
                <Input allowClear placeholder="请输入负责人" />
              </Form.Item>,
              <Form.Item key="status" name="status" label="状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={[
                    { label: "启用", value: "启用" },
                    { label: "停用", value: "停用" },
                  ]}
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
          <Button onClick={handleExport}>导出</Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 1320 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
