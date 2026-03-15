import { App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { PlatformConfigRecord, PlatformConfigStatus } from "../mocks/platformConfig.mock";
import {
  listPlatformConfigs,
  savePlatformConfig,
  type PlatformConfigFilters,
} from "../services/platformConfig.mock-service";

type PlatformConfigFormValues = {
  platformName: string;
  platformShortName: string;
  sort: number;
  status: PlatformConfigStatus;
};

const statusColorMap: Record<PlatformConfigStatus, string> = {
  启用: "success",
  停用: "default",
};

export function PlatformConfigPage() {
  const [filterForm] = Form.useForm<PlatformConfigFilters>();
  const [editorForm] = Form.useForm<PlatformConfigFormValues>();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<PlatformConfigRecord[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PlatformConfigRecord | null>(null);

  async function loadData(filters: PlatformConfigFilters = {}) {
    setLoading(true);
    try {
      setItems(await listPlatformConfigs(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function openCreateModal() {
    setEditingRecord(null);
    editorForm.setFieldsValue({
      platformName: "",
      platformShortName: "",
      sort: items.length * 10 + 10,
      status: "启用",
    });
    setEditorOpen(true);
  }

  function openEditModal(record: PlatformConfigRecord) {
    setEditingRecord(record);
    editorForm.setFieldsValue({
      platformName: record.platformName,
      platformShortName: record.platformShortName,
      sort: record.sort,
      status: record.status,
    });
    setEditorOpen(true);
  }

  async function handleSearch() {
    const values = await filterForm.validateFields();
    await loadData(values);
  }

  async function handleReset() {
    filterForm.resetFields();
    await loadData();
  }

  async function handleSave() {
    const values = await editorForm.validateFields();
    setSaving(true);
    try {
      await savePlatformConfig({
        id: editingRecord?.id,
        ...values,
      });
      void message.success(editingRecord ? "平台配置已更新。" : "平台配置已新增。");
      setEditorOpen(false);
      setEditingRecord(null);
      editorForm.resetFields();
      await loadData(filterForm.getFieldsValue());
    } finally {
      setSaving(false);
    }
  }

  const columns: ColumnsType<PlatformConfigRecord> = [
    { title: "平台编码", dataIndex: "platformCode", width: 160 },
    { title: "平台名称", dataIndex: "platformName", width: 240 },
    { title: "平台缩写", dataIndex: "platformShortName", width: 160 },
    { title: "排序", dataIndex: "sort", width: 100 },
    { title: "创建时间", dataIndex: "createdAt", width: 180 },
    {
      title: "状态",
      dataIndex: "status",
      width: 120,
      render: (value: PlatformConfigStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 140,
      render: (_, record) => (
        <Button type="link" onClick={() => openEditModal(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={filterForm} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="keyword" name="keyword" label="平台编码 / 平台名称 / 平台缩写">
                <Input allowClear placeholder="请输入关键词" />
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
                <Button type="primary" onClick={() => void handleSearch()}>
                  查询
                </Button>
                <Button onClick={() => void handleReset()}>重置</Button>
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
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title={editingRecord ? "编辑平台配置" : "新增平台配置"}
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
          {editingRecord ? (
            <Form.Item label="平台编码">
              <Input value={editingRecord.platformCode} disabled />
            </Form.Item>
          ) : null}
          <Form.Item name="platformName" label="平台名称" rules={[{ required: true, message: "请输入平台名称" }]}>
            <Input placeholder="请输入平台名称" />
          </Form.Item>
          <Form.Item
            name="platformShortName"
            label="平台缩写"
            rules={[{ required: true, message: "请输入平台缩写" }]}
          >
            <Input placeholder="请输入平台缩写" />
          </Form.Item>
          <Form.Item name="sort" label="排序" rules={[{ required: true, message: "请输入排序" }]}>
            <InputNumber min={1} precision={0} style={{ width: "100%" }} placeholder="请输入排序" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: "请选择状态" }]}>
            <Select
              placeholder="请选择"
              options={[
                { label: "启用", value: "启用" },
                { label: "停用", value: "停用" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
