import { App, Button, Card, Cascader, Form, Input, Modal, Popconfirm, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { ReceivingAddressRecord } from "../mocks/receivingAddress.mock";
import {
  deleteReceivingAddress,
  listReceivingAddresses,
  saveReceivingAddress,
  type ReceivingAddressFilters,
} from "../services/receivingAddress.mock-service";

type AddressFormValues = Omit<ReceivingAddressRecord, "id">;

const districtOptions = {
  长春市: ["朝阳区", "南关区", "宽城区", "二道区", "绿园区", "双阳区", "九台区"],
  吉林市: ["船营区", "昌邑区", "龙潭区", "丰满区"],
  四平市: ["铁西区", "铁东区"],
  延边州: ["延吉市", "图们市", "敦化市"],
};

const regionOptions = [
  {
    value: "吉林省",
    label: "吉林省",
    children: Object.entries(districtOptions).map(([city, districts]) => ({
      value: city,
      label: city,
      children: districts.map((district) => ({
        value: district,
        label: district,
      })),
    })),
  },
];

export function DistributorReceivingAddressListPage() {
  const [filterForm] = Form.useForm<ReceivingAddressFilters>();
  const [editorForm] = Form.useForm<AddressFormValues>();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ReceivingAddressRecord[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ReceivingAddressRecord | null>(null);

  async function loadData(filters: ReceivingAddressFilters = {}) {
    setLoading(true);
    try {
      setItems(await listReceivingAddresses(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function openCreateModal() {
    setEditingRecord(null);
    editorForm.resetFields();
    setEditorOpen(true);
  }

  function openEditModal(record: ReceivingAddressRecord) {
    setEditingRecord(record);
    editorForm.setFieldsValue({
      name: record.name,
      phone: record.phone,
      region: [record.province, record.city, record.district] as never,
      detailAddress: record.detailAddress,
      postalCode: record.postalCode,
    } as never);
    setEditorOpen(true);
  }

  async function handleSave() {
    const values = await editorForm.validateFields();
    const region = (values as typeof values & { region?: string[] }).region ?? [];
    setSaving(true);
    try {
      await saveReceivingAddress({
        id: editingRecord?.id,
        name: values.name,
        phone: values.phone,
        province: region[0] ?? "吉林省",
        city: region[1] ?? "",
        district: region[2] ?? "",
        detailAddress: values.detailAddress,
        postalCode: values.postalCode,
      });
      void message.success(editingRecord ? "收货地址已更新。" : "收货地址已新增。");
      setEditorOpen(false);
      setEditingRecord(null);
      editorForm.resetFields();
      await loadData(filterForm.getFieldsValue());
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record: ReceivingAddressRecord) {
    await deleteReceivingAddress(record.id);
    void message.success("收货地址已删除。");
    await loadData(filterForm.getFieldsValue());
  }

  const columns: ColumnsType<ReceivingAddressRecord> = [
    { title: "收货人姓名", dataIndex: "name", width: 140 },
    { title: "电话", dataIndex: "phone", width: 140 },
    {
      title: "省市区",
      width: 220,
      render: (_, record) => `${record.province} / ${record.city} / ${record.district}`,
    },
    { title: "详细地址", dataIndex: "detailAddress", width: 260 },
    { title: "邮编", dataIndex: "postalCode", width: 120 },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => (
        <Space size={12}>
          <Button type="link" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除这个收货地址？" okText="确认" cancelText="取消" onConfirm={() => void handleDelete(record)}>
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={filterForm} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="keyword" name="keyword" label="收货人 / 电话 / 地址">
                <Input allowClear placeholder="请输入关键词" />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(filterForm.getFieldsValue())}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    filterForm.resetFields();
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
          <Button type="primary" onClick={openCreateModal}>
            新增
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 1080 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title={editingRecord ? "编辑收货地址" : "新增收货地址"}
        open={editorOpen}
        okText="保存"
        cancelText="取消"
        onCancel={() => {
          setEditorOpen(false);
          setEditingRecord(null);
          editorForm.resetFields();
        }}
        onOk={() => void handleSave()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={editorForm} layout="vertical">
          <Form.Item name="name" label="收货人姓名" rules={[{ required: true, message: "请输入收货人姓名" }]}>
            <Input placeholder="请输入收货人姓名" />
          </Form.Item>
          <Form.Item name="phone" label="电话" rules={[{ required: true, message: "请输入电话" }]}>
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name="region" label="省市区" rules={[{ required: true, message: "请选择省市区" }]}>
            <Cascader placeholder="请选择省市区" options={regionOptions} />
          </Form.Item>
          <Form.Item name="detailAddress" label="详细地址" rules={[{ required: true, message: "请输入详细地址" }]}>
            <Input.TextArea rows={3} placeholder="请输入详细地址" />
          </Form.Item>
          <Form.Item name="postalCode" label="邮编">
            <Input placeholder="请输入邮编" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
