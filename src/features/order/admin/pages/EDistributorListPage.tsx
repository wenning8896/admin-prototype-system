import {
  SearchOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { CertificationStatus, EDistributorRecord } from "../mocks/eDistributorList.mock";
import {
  exportEDistributors,
  getMaskedPhone,
  listEDistributors,
  type EDistributorFilters,
} from "../services/eDistributorList.mock-service";
import {
  getDistributorAgreementOverview,
  initiatePurchaseAgreement,
  serviceProviderOptions,
} from "../../../agreement/shared/services/purchaseAgreementFlow.mock-service";
import { useAuth } from "../../../../auth/useAuth";

const statusColorMap: Record<CertificationStatus, string> = {
  未认证: "default",
  认证中: "processing",
  已认证: "success",
  认证驳回: "error",
};

const agreementStatusColorMap: Record<string, string> = {
  未发起: "default",
  待签约审批: "processing",
  待服务商补充: "warning",
  待分销商签署: "purple",
  待服务商签署: "gold",
  已签署完成: "success",
  审批驳回: "error",
};

const productScopeOptions = ["奶品", "咖啡", "糖果", "RTD", "星巴克"];

export function EDistributorListPage() {
  const [form] = Form.useForm<EDistributorFilters>();
  const [agreementForm] = Form.useForm<{ serviceProviderId: string }>();
  const { message } = App.useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EDistributorRecord[]>([]);
  const [serviceProviderTarget, setServiceProviderTarget] = useState<EDistributorRecord | null>(null);
  const [launchTarget, setLaunchTarget] = useState<EDistributorRecord | null>(null);
  const [launching, setLaunching] = useState(false);
  const [agreementOverview, setAgreementOverview] = useState<
    Record<string, ReturnType<typeof getDistributorAgreementOverview>[string]>
  >({});

  async function loadData(filters: EDistributorFilters = {}) {
    setLoading(true);
    try {
      const result = await listEDistributors(filters);
      setItems(result.items);
      setAgreementOverview(getDistributorAgreementOverview());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const result = await listEDistributors();
        setItems(result.items);
        setAgreementOverview(getDistributorAgreementOverview());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSearch() {
    const values = await form.validateFields();
    await loadData(values);
  }

  async function handleReset() {
    form.resetFields();
    await loadData();
  }

  async function handleCreateAgreement(record: EDistributorRecord) {
    if (record.certificationStatus !== "已认证") {
      void message.warning("只有已认证的分销商才可以发起协议。");
      return;
    }
    if (agreementOverview[record.id]?.hasAgreement) {
      void message.info("该分销商已有签约记录，当前不能重复发起协议。");
      return;
    }
    agreementForm.resetFields();
    setLaunchTarget(record);
  }

  async function handleLaunchSubmit() {
    if (!launchTarget) {
      return;
    }

    const values = await agreementForm.validateFields();
    setLaunching(true);
    try {
      await initiatePurchaseAgreement({
        distributorId: launchTarget.id,
        distributorName: launchTarget.distributorName,
        distributorCode: launchTarget.distributorCode,
        serviceProviderId: values.serviceProviderId,
        initiatorAccount: user?.account ?? "admin",
        initiatorName: user?.name ?? "管理员",
      });
      void message.success("已发起购销协议，并进入签约审批列表。");
      setLaunchTarget(null);
      await loadData(form.getFieldsValue());
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "发起协议失败");
    } finally {
      setLaunching(false);
    }
  }

  function handleExport() {
    exportEDistributors(items);
    void message.success("分销商列表已导出为 .xlsx 文件。");
  }

  const columns: ColumnsType<EDistributorRecord> = [
    {
      title: "分销商名称",
      dataIndex: "distributorName",
      fixed: "left",
      width: 220,
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    { title: "分销商编码", dataIndex: "distributorCode", width: 140 },
    { title: "企业主体类型", dataIndex: "companyType", width: 120 },
    { title: "统一社会信用代码", dataIndex: "socialCreditCode", width: 190 },
    { title: "法定代表人", dataIndex: "legalRepresentative", width: 110 },
    { title: "手机号", dataIndex: "phone", width: 130, render: (value: string) => getMaskedPhone(value) },
    { title: "电签人", dataIndex: "eSignName", width: 110 },
    { title: "业务负责人", dataIndex: "businessOwnerName", width: 120 },
    {
      title: "邮箱",
      dataIndex: "email",
      width: 220,
      ellipsis: {
        showTitle: false,
      },
      render: (value: string) => (
        <Typography.Text ellipsis={{ tooltip: value }} style={{ maxWidth: 180 }}>
          {value}
        </Typography.Text>
      ),
    },
    {
      title: "经营产品范围",
      dataIndex: "productScopes",
      width: 220,
      render: (value: string[]) => (
        <Space size={[4, 6]} wrap>
          {value.map((item) => (
            <Tag key={item} bordered={false} color="blue">
              {item}
            </Tag>
          ))}
        </Space>
      ),
    },
    { title: "注册时间", dataIndex: "registeredAt", width: 160 },
    {
      title: "腾讯电子签认证状态",
      dataIndex: "certificationStatus",
      width: 150,
      render: (value: CertificationStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    {
      title: "签约状态",
      key: "agreementStatus",
      width: 150,
      render: (_, record) => {
        const agreementStatus = agreementOverview[record.id]?.latestAgreementStatus ?? "未发起";
        return <Tag color={agreementStatusColorMap[agreementStatus]}>{agreementStatus}</Tag>;
      },
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 240,
      render: (_, record) => {
        const agreementStatus = agreementOverview[record.id]?.latestAgreementStatus ?? "未发起";

        return (
          <Space size={12} wrap={false} className="e-distributor-page__actions">
            {record.certificationStatus === "已认证" && agreementStatus === "未发起" ? (
              <Button type="link" onClick={() => void handleCreateAgreement(record)}>
                发起协议
              </Button>
            ) : null}
            {agreementStatus === "已签署完成" ? (
              <Button type="link" onClick={() => setServiceProviderTarget(record)}>
                查看已关联服务商
              </Button>
            ) : null}
            {(record.certificationStatus !== "已认证" || (agreementStatus !== "未发起" && agreementStatus !== "已签署完成")) ? (
              <Typography.Text type="secondary">-</Typography.Text>
            ) : null}
          </Space>
        );
      },
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
              <Form.Item key="certificationStatus" name="certificationStatus" label="认证状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={Object.keys(statusColorMap).map((item) => ({ label: item, value: item }))}
                />
              </Form.Item>,
              <Form.Item key="agreementStatus" name="agreementStatus" label="签约状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={Object.keys(agreementStatusColorMap).map((item) => ({ label: item, value: item }))}
                />
              </Form.Item>,
              <Form.Item key="productScope" name="productScope" label="经营产品范围">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={productScopeOptions.map((item) => ({ label: item, value: item }))}
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
          <Button onClick={handleExport}>导出</Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          scroll={{ x: 2200 }}
          tableLayout="fixed"
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Drawer
        title={serviceProviderTarget ? `${serviceProviderTarget.distributorName} · 已关联服务商` : "已关联服务商"}
        open={Boolean(serviceProviderTarget)}
        width={520}
        onClose={() => setServiceProviderTarget(null)}
      >
        {serviceProviderTarget ? (
          (() => {
            const providers = agreementOverview[serviceProviderTarget.id]?.relatedServiceProviders.length
              ? agreementOverview[serviceProviderTarget.id].relatedServiceProviders
              : serviceProviderTarget.relatedServiceProviders;

            if (!providers.length) {
              return (
                <Empty description="暂无已关联服务商" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                  <Button type="primary" onClick={() => void message.info("服务商关联流程可在后续页面继续接入。")}>
                    去关联服务商
                  </Button>
                </Empty>
              );
            }

            return (
          <>
            <Descriptions column={1} size="small" className="e-distributor-page__drawer-summary">
              <Descriptions.Item label="分销商编码">{serviceProviderTarget.distributorCode}</Descriptions.Item>
              <Descriptions.Item label="认证状态">
                <Tag color={statusColorMap[serviceProviderTarget.certificationStatus]}>
                  {serviceProviderTarget.certificationStatus}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Space direction="vertical" size={12} className="page-stack">
              {providers.map((provider) => (
                <Card key={provider.id} className="page-card e-distributor-page__provider-card">
                  <Space direction="vertical" size={4}>
                    <Typography.Text strong>{provider.name}</Typography.Text>
                    <Typography.Text type="secondary">负责人：{provider.owner}</Typography.Text>
                    <Tag color={provider.status === "已关联" ? "success" : "warning"}>{provider.status}</Tag>
                  </Space>
                </Card>
              ))}
            </Space>
          </>
            );
          })()
        ) : (
          <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Drawer>

      <Modal
        title={launchTarget ? `为 ${launchTarget.distributorName} 发起购销协议` : "发起购销协议"}
        open={Boolean(launchTarget)}
        confirmLoading={launching}
        onOk={() => void handleLaunchSubmit()}
        onCancel={() => setLaunchTarget(null)}
        okText="确认发起"
      >
        <Form form={agreementForm} layout="vertical">
          <Form.Item
            label="选择服务商"
            name="serviceProviderId"
            rules={[{ required: true, message: "请选择一个服务商" }]}
            extra="单次只能选择一个服务商发起购销协议。"
          >
            <Select
              placeholder="请选择服务商"
              options={serviceProviderOptions.map((item) => ({
                label: `${item.name} / ${item.region}`,
                value: item.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
