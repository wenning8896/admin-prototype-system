import { App, Button, Card, Cascader, Descriptions, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import { useAuth } from "../../../../auth/useAuth";
import type { EDistributionOrderRecord, EDistributionOrderStatus, ProductHealthType } from "../../shared/mocks/eDistributionOrderFlow.mock";
import {
  createEDistributionOrder,
  distributorServiceProviderMap,
  listEDistributionOrders,
  orderProductOptions,
  platformOptions,
  reviewDistributorCancellation,
  submitOrderReceipt,
} from "../../shared/services/eDistributionOrderFlow.mock-service";
import { listReceivingAddresses } from "../services/receivingAddress.mock-service";
import type { ReceivingAddressRecord } from "../mocks/receivingAddress.mock";
import { saveReceivingAddress } from "../services/receivingAddress.mock-service";

type DistributorFilters = {
  keyword?: string;
  status?: EDistributionOrderStatus;
};

type OrderItemForm = {
  productCode: string;
  healthType: ProductHealthType;
  quantity: number;
};

type OrderFormValues = {
  platformCode: string;
  consigneeId: string;
  paymentProof: UploadFile[];
  products: OrderItemForm[];
};

type ReceiptFormValues = {
  receiptDetails: UploadFile[];
  receiptDocumentNo: UploadFile[];
  remark?: string;
};
type CancelReviewValues = {
  remark: string;
};

type AddressFormValues = Omit<ReceivingAddressRecord, "id">;
type ProductEntryRow = {
  key: number;
  name: number;
};

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

const healthOptions: ProductHealthType[] = ["好货", "过半", "过三"];

const statusColorMap: Record<EDistributionOrderStatus, string> = {
  待审批: "processing",
  待发货: "gold",
  待收货: "blue",
  收货待确认: "cyan",
  收货异常待确认: "magenta",
  收货待重新提交: "warning",
  已完成: "success",
  取消确认中: "orange",
  取消待审批: "volcano",
  已取消: "default",
};

export function DistributorPlatformOrderListPage() {
  const [filterForm] = Form.useForm<DistributorFilters>();
  const [orderForm] = Form.useForm<OrderFormValues>();
  const [receiptForm] = Form.useForm<ReceiptFormValues>();
  const [addressForm] = Form.useForm<AddressFormValues>();
  const [cancelReviewForm] = Form.useForm<CancelReviewValues>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [items, setItems] = useState<EDistributionOrderRecord[]>([]);
  const [addressOptions, setAddressOptions] = useState<ReceivingAddressRecord[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [addressEditorOpen, setAddressEditorOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [receiptTarget, setReceiptTarget] = useState<EDistributionOrderRecord | null>(null);
  const [cancelConfirmTarget, setCancelConfirmTarget] = useState<EDistributionOrderRecord | null>(null);

  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    maxCount: 1,
  };

  const distributorProfile =
    distributorServiceProviderMap[user?.account ?? "distributor"] ?? distributorServiceProviderMap.distributor;

  const watchedOrderProducts = Form.useWatch("products", orderForm);
  const orderProductRows = watchedOrderProducts ?? [];
  const selectedAddressId = Form.useWatch("consigneeId", orderForm);
  const selectedAddress = addressOptions.find((item) => item.id === selectedAddressId);

  const orderSummary = useMemo(() => {
    const orderProducts = watchedOrderProducts ?? [];
    let totalQuantity = 0;
    let totalAmount = 0;

    orderProducts.forEach((item) => {
      const product = orderProductOptions.find((option) => option.value === item.productCode);
      const healthType = item.healthType;

      if (!product || !healthType || !item.quantity) {
        return;
      }

      const unitPrice = product.prices[healthType];
      totalQuantity += item.quantity;
      totalAmount += unitPrice * item.quantity;
    });

    return {
      totalQuantity,
      totalAmount: Number(totalAmount.toFixed(2)),
    };
  }, [watchedOrderProducts]);

  async function loadData(filters: DistributorFilters = {}) {
    setLoading(true);
    try {
      const all = await listEDistributionOrders();
      const keyword = filters.keyword?.trim().toLowerCase();
      setItems(
        all.filter((item) => {
          const matchesKeyword =
            !keyword ||
            item.orderNo.toLowerCase().includes(keyword) ||
            item.productSummary.toLowerCase().includes(keyword) ||
            item.serviceProviderName.toLowerCase().includes(keyword);
          const matchesStatus = !filters.status || item.status === filters.status;
          return matchesKeyword && matchesStatus;
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      await loadData();
      setAddressOptions(await listReceivingAddresses());
    })();
  }, []);

  async function handleCreateOrder() {
    const values = await orderForm.validateFields();
    const platform = platformOptions.find((item) => item.value === values.platformCode);
    const address = addressOptions.find((item) => item.id === values.consigneeId);

    if (!platform || !address) {
      void message.error("订单基础信息缺失。");
      return;
    }

    setCreating(true);
    try {
      await createEDistributionOrder({
        platformCode: platform.value,
        platformName: platform.label,
        distributorName: distributorProfile.distributorName,
        distributorCode: distributorProfile.distributorCode,
        serviceProviderCode: distributorProfile.serviceProviderCode,
        serviceProviderName: distributorProfile.serviceProviderName,
        products: values.products.map((item) => {
          const product = orderProductOptions.find((option) => option.value === item.productCode)!;
          return {
            productCode: item.productCode,
            productName: product.label,
            healthType: item.healthType,
            unitPrice: product.prices[item.healthType],
            quantity: item.quantity,
          };
        }),
        consigneeId: address.id,
        consigneeName: address.name,
        consigneePhone: address.phone,
        consigneeProvince: address.province,
        consigneeCity: address.city,
        consigneeDistrict: address.district,
        consigneeAddress: address.detailAddress,
        consigneePostalCode: address.postalCode,
        paymentProof: values.paymentProof?.[0]?.name ?? "",
        account: user?.account ?? "distributor",
        actorName: user?.name ?? "分销商用户",
      });
      void message.success("订单已提交，已进入管理端审批。");
      setCreateOpen(false);
      orderForm.resetFields();
      await loadData(filterForm.getFieldsValue());
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveAddress() {
    const values = await addressForm.validateFields();
    const region = (values as typeof values & { region?: string[] }).region ?? [];
    setSavingAddress(true);
    try {
      const next = await saveReceivingAddress({
        name: values.name,
        phone: values.phone,
        province: region[0] ?? "吉林省",
        city: region[1] ?? "",
        district: region[2] ?? "",
        detailAddress: values.detailAddress,
        postalCode: values.postalCode,
      });
      const nextOptions = await listReceivingAddresses();
      setAddressOptions(nextOptions);
      orderForm.setFieldValue("consigneeId", next.id);
      setAddressEditorOpen(false);
      addressForm.resetFields();
      void message.success("收货地址已新增。");
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleSubmitReceipt() {
    if (!receiptTarget) {
      return;
    }
    const values = await receiptForm.validateFields();
    setSubmittingReceipt(true);
    try {
      await submitOrderReceipt({
        id: receiptTarget.id,
        receiptDetails: values.receiptDetails?.[0]?.name ?? "",
        receiptDocumentNo: values.receiptDocumentNo?.[0]?.name ?? "",
        remark: values.remark ?? "",
        account: user?.account ?? "distributor",
        actorName: user?.name ?? "分销商用户",
      });
      void message.success("收货明细与签收单已提交。");
      setReceiptTarget(null);
      receiptForm.resetFields();
      await loadData(filterForm.getFieldsValue());
    } finally {
      setSubmittingReceipt(false);
    }
  }

  async function handleConfirmCancellation(decision: "approve" | "reject") {
    if (!cancelConfirmTarget) {
      return;
    }
    const values = await cancelReviewForm.validateFields();

    setConfirmingCancel(true);
    try {
      await reviewDistributorCancellation({
        id: cancelConfirmTarget.id,
        decision,
        remark: values.remark,
        account: user?.account ?? "distributor",
        actorName: user?.name ?? "分销商用户",
      });
      void message.success(decision === "approve" ? "已审批通过，订单进入管理端取消审批。" : "已驳回取消申请，订单回到待发货。");
      setCancelConfirmTarget(null);
      cancelReviewForm.resetFields();
      await loadData(filterForm.getFieldsValue());
    } finally {
      setConfirmingCancel(false);
    }
  }

  const columns: ColumnsType<EDistributionOrderRecord> = [
    { title: "订单编号", dataIndex: "orderNo", width: 180, fixed: "left" },
    { title: "平台名称", dataIndex: "platformName", width: 140 },
    { title: "服务商", dataIndex: "serviceProviderName", width: 180 },
    { title: "商品总数", dataIndex: "totalQuantity", width: 120 },
    {
      title: "订单总金额",
      dataIndex: "orderAmount",
      width: 140,
      render: (value: number) => `¥ ${value.toFixed(2)}`,
    },
    { title: "创建时间", dataIndex: "createdAt", width: 160 },
    {
      title: "订单状态",
      dataIndex: "status",
      width: 140,
      render: (value: EDistributionOrderStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 220,
      render: (_, record) => (
        <Space size={12} wrap>
          <Button type="link" onClick={() => navigate(`/distributor/order/distributor-order-list/detail/${record.id}`)}>
            查看详情
          </Button>
          {(record.status === "待收货" || record.status === "收货待重新提交") ? (
            <Button
              type="link"
              onClick={() => {
                setReceiptTarget(record);
                receiptForm.setFieldsValue({
                  receiptDetails: record.receipt?.receiptDetails
                    ? [{ uid: `${record.id}-detail`, name: record.receipt.receiptDetails, status: "done" }]
                    : [],
                  receiptDocumentNo: record.receipt?.receiptDocumentNo
                    ? [{ uid: `${record.id}-doc`, name: record.receipt.receiptDocumentNo, status: "done" }]
                    : [],
                  remark: "",
                });
              }}
            >
              提交收货
            </Button>
          ) : null}
          {record.status === "取消确认中" ? (
            <Button type="link" onClick={() => setCancelConfirmTarget(record)}>
              审批取消
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const productColumns: ColumnsType<ProductEntryRow> = [
    {
      title: "商品",
      key: "productCode",
      width: 220,
      render: (_: unknown, field) => (
        <Form.Item
          {...field}
          name={[field.name, "productCode"]}
          rules={[{ required: true, message: "请选择商品" }]}
          style={{ marginBottom: 0 }}
        >
          <Select
            placeholder="请选择商品"
            options={orderProductOptions.map((item) => ({ value: item.value, label: item.label }))}
          />
        </Form.Item>
      ),
    },
    {
      title: "效期类型",
      key: "healthType",
      width: 140,
      render: (_: unknown, field) => (
        <Form.Item
          {...field}
          name={[field.name, "healthType"]}
          rules={[{ required: true, message: "请选择效期类型" }]}
          style={{ marginBottom: 0 }}
        >
          <Select placeholder="请选择效期类型" options={healthOptions.map((item) => ({ value: item, label: item }))} />
        </Form.Item>
      ),
    },
    {
      title: "数量",
      key: "quantity",
      width: 120,
      render: (_: unknown, field) => (
        <Form.Item
          {...field}
          name={[field.name, "quantity"]}
          rules={[{ required: true, message: "请输入数量" }]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber min={1} precision={0} style={{ width: "100%" }} placeholder="数量" />
        </Form.Item>
      ),
    },
    {
      title: "服务商价格",
      key: "price",
      width: 140,
      render: (_: unknown, field) => {
        const row = orderProductRows[field.name];
        const product = orderProductOptions.find((option) => option.value === row?.productCode);
        const unitPrice = product && row?.healthType ? product.prices[row.healthType] : undefined;
        return unitPrice ? `¥ ${unitPrice.toFixed(2)}` : "-";
      },
    },
    {
      title: "单商品金额",
      key: "amount",
      width: 150,
      render: (_: unknown, field) => {
        const row = orderProductRows[field.name];
        const product = orderProductOptions.find((option) => option.value === row?.productCode);
        const unitPrice = product && row?.healthType ? product.prices[row.healthType] : undefined;
        return unitPrice && row?.quantity ? `¥ ${(unitPrice * row.quantity).toFixed(2)}` : "-";
      },
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={filterForm} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="keyword" name="keyword" label="订单编号 / 商品 / 服务商">
                <Input allowClear placeholder="请输入关键词" />
              </Form.Item>,
              <Form.Item key="status" name="status" label="订单状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={Object.keys(statusColorMap).map((item) => ({ label: item, value: item }))}
                />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(filterForm.getFieldsValue())}>
                  查询
                </Button>
                <Button onClick={() => { filterForm.resetFields(); void loadData(); }}>
                  重置
                </Button>
              </>
            }
          />
        </Form>
      </Card>

      <Card className="page-card">
        <div className="e-distributor-page__toolbar">
          <Button type="primary" onClick={() => {
            orderForm.setFieldsValue({
              platformCode: undefined,
              consigneeId: undefined,
              paymentProof: [],
              products: [{ productCode: undefined, healthType: "好货", quantity: 1 }],
            });
            setCreateOpen(true);
          }}>
            新建订单
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 1760 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="新建订单"
        open={createOpen}
        width={1120}
        okText="提交订单"
        cancelText="取消"
        onCancel={() => {
          setCreateOpen(false);
          orderForm.resetFields();
        }}
        onOk={() => void handleCreateOrder()}
        confirmLoading={creating}
        destroyOnHidden
      >
        <Form form={orderForm} layout="vertical">
          <Card className="page-card" title="平台信息">
            <Form.Item name="platformCode" label="平台" rules={[{ required: true, message: "请选择平台" }]} style={{ marginBottom: 0 }}>
              <Select placeholder="请选择平台" options={platformOptions} />
            </Form.Item>
          </Card>

          <Card className="page-card" title="付款信息" style={{ marginTop: 16 }}>
            <Form.Item
              name="paymentProof"
              label="付款证明"
              valuePropName="fileList"
              getValueFromEvent={(event) => event?.fileList ?? []}
              rules={[{ required: true, message: "请上传付款证明附件" }]}
              style={{ marginBottom: 0 }}
            >
              <Upload {...uploadProps}>
                <Button>上传附件</Button>
              </Upload>
            </Form.Item>
          </Card>

          <Card className="page-card" title="服务商信息" style={{ marginTop: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="已关联服务商">{distributorProfile.serviceProviderName}</Descriptions.Item>
              <Descriptions.Item label="服务商编码">{distributorProfile.serviceProviderCode}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            className="page-card"
            title="产品模块"
            style={{ marginTop: 16 }}
            extra={
              <Button onClick={() => orderForm.setFieldValue("products", [...(orderForm.getFieldValue("products") ?? []), { productCode: undefined, healthType: "好货", quantity: 1 }])}>
                新增商品
              </Button>
            }
          >
            <Form.List name="products">
              {(fields, { remove }) => (
                <Space direction="vertical" size={12} className="page-stack">
                  <Table
                    rowKey="key"
                    pagination={false}
                    tableLayout="fixed"
                    dataSource={fields.map((field) => ({ key: field.key, name: field.name }))}
                    columns={[
                      ...productColumns,
                      {
                        title: "操作",
                        key: "actions",
                        width: 120,
                        render: (_: unknown, field: ProductEntryRow) =>
                          fields.length > 1 ? (
                            <Button danger type="link" onClick={() => remove(field.name)}>
                              删除
                            </Button>
                          ) : (
                            "-"
                          ),
                      },
                    ]}
                    scroll={{ x: 980 }}
                  />
                </Space>
              )}
            </Form.List>
            <Card className="page-card" style={{ marginTop: 16 }}>
              <Space size={48}>
                <Typography.Text>商品总数：{orderSummary.totalQuantity}</Typography.Text>
                <Typography.Text>商品总金额：¥ {orderSummary.totalAmount.toFixed(2)}</Typography.Text>
              </Space>
            </Card>
          </Card>

          <Card
            className="page-card"
            title="收货人信息"
            style={{ marginTop: 16 }}
            extra={
              <Button
                onClick={() => {
                  addressForm.resetFields();
                  setAddressEditorOpen(true);
                }}
              >
                新增收货地址
              </Button>
            }
          >
            <Form.Item name="consigneeId" label="收货地址" rules={[{ required: true, message: "请选择收货地址" }]}>
              <Select
                placeholder="请选择收货地址"
                options={addressOptions.map((item) => ({
                  value: item.id,
                  label: `${item.name} / ${item.phone} / ${item.province}${item.city}${item.district}`,
                }))}
              />
            </Form.Item>
            {selectedAddress ? (
              <Descriptions column={2} size="small">
                <Descriptions.Item label="收货人">{selectedAddress.name}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{selectedAddress.phone}</Descriptions.Item>
                <Descriptions.Item label="省市区">
                  {selectedAddress.province} / {selectedAddress.city} / {selectedAddress.district}
                </Descriptions.Item>
                <Descriptions.Item label="邮编">{selectedAddress.postalCode || "-"}</Descriptions.Item>
                <Descriptions.Item label="详细地址" span={2}>
                  {selectedAddress.detailAddress}
                </Descriptions.Item>
              </Descriptions>
            ) : null}
          </Card>
        </Form>
      </Modal>

      <Modal
        title={receiptTarget ? `${receiptTarget.orderNo} · 提交收货` : "提交收货"}
        open={Boolean(receiptTarget)}
        okText="提交"
        cancelText="取消"
        onCancel={() => {
          setReceiptTarget(null);
          receiptForm.resetFields();
        }}
        onOk={() => void handleSubmitReceipt()}
        confirmLoading={submittingReceipt}
        destroyOnHidden
      >
        <Form form={receiptForm} layout="vertical">
          <Form.Item
            name="receiptDetails"
            label="收货明细"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList ?? []}
            rules={[{ required: true, message: "请上传收货明细附件" }]}
          >
            <Upload {...uploadProps}>
              <Button>上传附件</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            name="receiptDocumentNo"
            label="签收单"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList ?? []}
            rules={[{ required: true, message: "请上传签收单附件" }]}
          >
            <Upload {...uploadProps}>
              <Button>上传附件</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入补充说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={cancelConfirmTarget ? `${cancelConfirmTarget.orderNo} · 审批取消` : "审批取消"}
        open={Boolean(cancelConfirmTarget)}
        footer={null}
        onCancel={() => {
          setCancelConfirmTarget(null);
          cancelReviewForm.resetFields();
        }}
        destroyOnHidden
      >
        <Form form={cancelReviewForm} layout="vertical">
          <Form.Item name="remark" label="审批备注" rules={[{ required: true, message: "请输入审批备注" }]}>
            <Input.TextArea rows={4} placeholder="请输入审批意见" />
          </Form.Item>
          <Space>
            <Button type="primary" loading={confirmingCancel} onClick={() => void handleConfirmCancellation("approve")}>
              通过
            </Button>
            <Button danger loading={confirmingCancel} onClick={() => void handleConfirmCancellation("reject")}>
              驳回
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="新增收货地址"
        open={addressEditorOpen}
        okText="保存"
        cancelText="取消"
        onCancel={() => {
          setAddressEditorOpen(false);
          addressForm.resetFields();
        }}
        onOk={() => void handleSaveAddress()}
        confirmLoading={savingAddress}
        destroyOnHidden
      >
        <Form form={addressForm} layout="vertical">
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
