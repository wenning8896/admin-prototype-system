import { App, Button, Card, Form, Input, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { HospitalContractProduct } from "../../shared/mocks/hospitalContract.mock";
import { exportHospitalContractList, listHospitalContracts } from "../../shared/services/hospitalContract.mock-service";

type ProductFilters = {
  keyword?: string;
};

export function HospitalProcurementProductListPage() {
  const [form] = Form.useForm<ProductFilters>();
  const [items, setItems] = useState<HospitalContractProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();

  async function loadData(filters: ProductFilters = {}) {
    setLoading(true);
    try {
      const all = await listHospitalContracts();
      const keyword = filters.keyword?.trim().toLowerCase();
      const products = all.flatMap((item) => item.products);
      setItems(products.filter((item) => !keyword || item.productCode.toLowerCase().includes(keyword) || item.productName.toLowerCase().includes(keyword)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<HospitalContractProduct> = [
    { title: "产品编码", dataIndex: "productCode", width: 180 },
    { title: "产品名称", dataIndex: "productName", width: 260 },
    { title: "建议价格", dataIndex: "suggestedPrice", width: 140, render: (value: number) => `¥ ${value.toFixed(2)}` },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="keyword" name="keyword" label="产品编码 / 产品名称">
                <Input allowClear placeholder="请输入产品编码或产品名称" />
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
      <Card className="page-card" extra={<Space><Button onClick={() => void message.info("导入模板会在下一轮补为按产品编码更新建议价格。")}>导入</Button><Button onClick={() => { exportHospitalContractList([], "院采产品列表"); void message.success("院采产品列表已导出为 .xlsx 文件。"); }}>导出</Button></Space>}>
        <Table rowKey="id" loading={loading} dataSource={items} columns={columns} tableLayout="fixed" scroll={{ x: 680 }} pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }} />
      </Card>
    </Space>
  );
}
