import { App, Button, Card, Form, Input, InputNumber, Modal, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { SalePriceRecord } from "../../admin/mocks/productPriceMaintenance.mock";
import {
  exportSalePrices,
  listSalePrices,
  saveSalePrice,
  type SalePriceFilters,
} from "../../admin/services/productPriceMaintenance.mock-service";

export function DealerProductPriceMaintenancePage() {
  const [saleFilterForm] = Form.useForm<SalePriceFilters>();
  const [editorForm] = Form.useForm<Pick<SalePriceRecord, "goodPrice" | "salePriceAboveHalf" | "salePriceAboveThird">>();
  const { message } = App.useApp();
  const [saleLoading, setSaleLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saleItems, setSaleItems] = useState<SalePriceRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<SalePriceRecord | null>(null);

  async function loadSaleData(filters: SalePriceFilters = {}) {
    setSaleLoading(true);
    try {
      setSaleItems(await listSalePrices(filters));
    } finally {
      setSaleLoading(false);
    }
  }

  useEffect(() => {
    void loadSaleData();
  }, []);

  const saleColumns: ColumnsType<SalePriceRecord> = [
    { title: "产品编码", dataIndex: "productCode", width: 150 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    {
      title: "服务商进货价",
      dataIndex: "serviceProviderPurchasePrice",
      width: 150,
      render: (value: number) => `¥ ${value.toFixed(2)}`,
    },
    {
      title: "服务商出货价（好货）",
      dataIndex: "goodPrice",
      width: 170,
      render: (value: number) => `¥ ${value.toFixed(2)}`,
    },
    {
      title: "服务商出货价（过半）",
      dataIndex: "salePriceAboveHalf",
      width: 170,
      render: (value: number) => `¥ ${value.toFixed(2)}`,
    },
    {
      title: "服务商出货价（过三）",
      dataIndex: "salePriceAboveThird",
      width: 170,
      render: (value: number) => `¥ ${value.toFixed(2)}`,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setEditingRecord(record);
            editorForm.setFieldsValue({
              goodPrice: record.goodPrice,
              salePriceAboveHalf: record.salePriceAboveHalf,
              salePriceAboveThird: record.salePriceAboveThird,
            });
          }}
        >
          编辑
        </Button>
      ),
    },
  ];

  async function handleSave() {
    if (!editingRecord) {
      return;
    }

    const values = await editorForm.validateFields();
    setSaving(true);
    try {
      await saveSalePrice({
        id: editingRecord.id,
        goodPrice: values.goodPrice,
        salePriceAboveHalf: values.salePriceAboveHalf,
        salePriceAboveThird: values.salePriceAboveThird,
      });
      void message.success("出货价已更新。");
      setEditingRecord(null);
      editorForm.resetFields();
      await loadSaleData(saleFilterForm.getFieldsValue());
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    exportSalePrices(saleItems);
    void message.success("出货价已导出为 .xlsx 文件。");
  }

  const saleFilterNode = useMemo(
    () => (
      <Card className="page-card" title="筛选条件">
        <Form form={saleFilterForm} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="keyword" name="keyword" label="产品编码 / 产品名称">
                <Input allowClear placeholder="请输入关键词" />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadSaleData(saleFilterForm.getFieldsValue())}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    saleFilterForm.resetFields();
                    void loadSaleData();
                  }}
                >
                  重置
                </Button>
              </>
            }
          />
        </Form>
      </Card>
    ),
    [saleFilterForm],
  );

  return (
    <Space direction="vertical" size={16} className="page-stack">
      {saleFilterNode}

      <Card className="page-card">
        <div className="e-distributor-page__toolbar">
          <Button onClick={handleExport}>导出</Button>
        </div>
        <Table
          rowKey="id"
          loading={saleLoading}
          dataSource={saleItems}
          columns={saleColumns}
          tableLayout="fixed"
          scroll={{ x: 1240 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title={editingRecord ? `${editingRecord.productName} · 编辑出货价` : "编辑出货价"}
        open={Boolean(editingRecord)}
        okText="保存"
        cancelText="取消"
        onCancel={() => {
          setEditingRecord(null);
          editorForm.resetFields();
        }}
        onOk={() => void handleSave()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={editorForm} layout="vertical">
          <Form.Item label="产品编码">
            <Input value={editingRecord?.productCode} disabled />
          </Form.Item>
          <Form.Item label="产品名称">
            <Input value={editingRecord?.productName} disabled />
          </Form.Item>
          <Form.Item label="服务商进货价">
            <Input value={editingRecord ? `¥ ${editingRecord.serviceProviderPurchasePrice.toFixed(2)}` : ""} disabled />
          </Form.Item>
          <Form.Item name="goodPrice" label="服务商出货价（好货）" rules={[{ required: true, message: "请输入价格" }]}>
            <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="请输入价格" />
          </Form.Item>
          <Form.Item
            name="salePriceAboveHalf"
            label="服务商出货价（过半）"
            rules={[{ required: true, message: "请输入价格" }]}
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="请输入价格" />
          </Form.Item>
          <Form.Item
            name="salePriceAboveThird"
            label="服务商出货价（过三）"
            rules={[{ required: true, message: "请输入价格" }]}
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="请输入价格" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
