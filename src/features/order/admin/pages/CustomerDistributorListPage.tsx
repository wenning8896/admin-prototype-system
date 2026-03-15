import { SearchOutlined } from "@ant-design/icons";
import { App, Button, Card, Form, Input, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { getMaskedPhone } from "../services/eDistributorList.mock-service";
import {
  exportCustomerDistributors,
  getCustomerDistributorDisplayStatus,
  listCustomerDistributors,
  type CustomerDistributorFilters,
  type CustomerDistributorRecord,
  type CustomerDistributorDisplayStatus,
  type CustomerDistributorStatus,
  updateCustomerDistributorsStatus,
} from "./CustomerDistributor.shared";

export function CustomerDistributorListPage() {
  const [form] = Form.useForm<CustomerDistributorFilters>();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CustomerDistributorRecord[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  async function loadData(filters: CustomerDistributorFilters = {}) {
    setLoading(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      setItems(listCustomerDistributors(filters));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSearch() {
    const values = await form.validateFields();
    await loadData(values);
  }

  async function handleReset() {
    form.resetFields();
    await loadData();
  }

  function handleBatchStatus(status: CustomerDistributorStatus) {
    if (selectedRowKeys.length === 0) {
      void message.warning("请先选择需要处理的分销商。");
      return;
    }

    const invalidItems = items.filter(
      (item) => selectedRowKeys.includes(item.id) && item.approvalStatus !== "已通过",
    );
    if (invalidItems.length > 0) {
      void message.warning("仅审批通过的分销商支持批量启用或停用。");
      return;
    }

    modal.confirm({
      title: `确认批量${status}`,
      content: `确认将选中的 ${selectedRowKeys.length} 条记录设置为${status}吗？`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        updateCustomerDistributorsStatus(
          selectedRowKeys.map((item) => String(item)),
          status,
        );
        setSelectedRowKeys([]);
        void message.success(`已批量${status}。`);
        await loadData(form.getFieldsValue());
      },
    });
  }

  const statusColorMap: Record<CustomerDistributorDisplayStatus, string> = {
    草稿: "default",
    待审批: "processing",
    已驳回: "error",
    启用: "success",
    停用: "default",
  };

  const columns: ColumnsType<CustomerDistributorRecord> = [
    {
      title: "分销商名称",
      dataIndex: "distributorName",
      width: 220,
      fixed: "left",
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    { title: "分销商编码", dataIndex: "distributorCode", width: 150 },
    { title: "企业主体类型", dataIndex: "companyType", width: 120 },
    { title: "统一社会信用代码", dataIndex: "socialCreditCode", width: 200 },
    { title: "法定代表人", dataIndex: "legalRepresentative", width: 120 },
    { title: "负责人姓名", dataIndex: "ownerName", width: 120 },
    { title: "负责人手机号", dataIndex: "ownerPhone", width: 140, render: (value: string) => getMaskedPhone(value) },
    {
      title: "负责人邮箱",
      dataIndex: "ownerEmail",
      width: 220,
      ellipsis: { showTitle: false },
      render: (value: string) => (
        <Typography.Text ellipsis={{ tooltip: value }} style={{ maxWidth: 180 }}>
          {value}
        </Typography.Text>
      ),
    },
    { title: "创建时间", dataIndex: "createdAt", width: 160 },
    { title: "更新时间", dataIndex: "updatedAt", width: 160 },
    {
      title: "状态",
      key: "status",
      width: 110,
      render: (_, record) => {
        const status = getCustomerDistributorDisplayStatus(record);
        return <Tag color={statusColorMap[status]}>{status}</Tag>;
      },
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => (
        <Space size={12} wrap={false}>
          <Button type="link" onClick={() => navigate(`/admin/order/distributor-list/detail/${record.id}?mode=view`)}>
            查看
          </Button>
          {record.approvalStatus === "待审批" ? null : (
            <Button type="link" onClick={() => navigate(`/admin/order/distributor-list/detail/${record.id}?mode=edit`)}>
              编辑
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="keyword" name="keyword" label="分销商名称 / 信用代码 / 法定代表人">
                <Input allowClear placeholder="请输入关键词" prefix={<SearchOutlined />} />
              </Form.Item>,
              <Form.Item key="distributorCode" name="distributorCode" label="分销商编码">
                <Input allowClear placeholder="请输入分销商编码" />
              </Form.Item>,
              <Form.Item key="companyType" name="companyType" label="企业主体类型">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={[
                    { label: "企业", value: "企业" },
                    { label: "个体工商户", value: "个体工商户" },
                  ]}
                />
              </Form.Item>,
              <Form.Item key="status" name="status" label="状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={[
                    { label: "草稿", value: "草稿" },
                    { label: "待审批", value: "待审批" },
                    { label: "已驳回", value: "已驳回" },
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
          <Space wrap>
            <Button type="primary" onClick={() => navigate("/admin/order/distributor-list/detail/new?mode=create")}>
              新增
            </Button>
            <Button
              onClick={() => {
                exportCustomerDistributors(items);
                void message.success("分销商列表已导出为 .xlsx 文件。");
              }}
            >
              导出
            </Button>
            <Button onClick={() => handleBatchStatus("启用")}>批量启用</Button>
            <Button danger onClick={() => handleBatchStatus("停用")}>
              批量停用
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 1900 }}
          tableLayout="fixed"
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
