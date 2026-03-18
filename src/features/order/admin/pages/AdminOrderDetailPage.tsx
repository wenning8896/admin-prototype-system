import {
  App,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { AdminOrderProductItem, AdminOrderRecord, AdminSuggestedOrderProductItem } from "../mocks/orderList.mock";
import {
  exportOrderProducts,
  exportSuggestedProducts,
  getAdminOrderById,
  previewAdminOrderPdf,
  saveAdminOrderDraft,
  submitAdminOrder,
} from "../services/orderList.mock-service";

type OrderFormValues = {
  orderNo: string;
  parentOrderNo?: string;
  selectedShipToId?: string;
  addressRemark?: string;
  selectedPayerId?: string;
  paymentInfo?: string;
  submitTo?: string;
  expectedDeliveryDate?: dayjs.Dayjs;
  useArAmount?: number;
  discountAmount?: number;
  discountUsedAmount?: number;
  paymentMethod?: string[];
  orderRemark?: string;
  deliveryNote?: string;
  multiPayEnabled?: boolean;
  multiPayPayerName?: string;
  multiPayAmount?: number;
  multiPayRemark?: string;
};

const orderReasonOptions = [
  { label: "季节性影响", value: "季节性影响" },
  { label: "促销活动", value: "促销活动" },
  { label: "新品铺货", value: "新品铺货" },
  { label: "日常补货", value: "日常补货" },
];

function formatAmount(value: number) {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildManualDraftProduct(record: AdminOrderRecord, index: number): AdminOrderProductItem {
  return {
    id: `manual-${Date.now()}-${index}`,
    nestleCode: "",
    productName: "手工录入产品",
    quantity: 0,
    taxIncludedAmount: 0,
    npsAmount: 0,
    taxExcludedAmount: 0,
    customerCode: record.dealerCode,
    quotaDetail: 0,
    promoDiscountRate: 0,
    discountRate: 0,
    productGroup: "手工产品组",
    shipWarehouse: "手工录入仓",
    stockDetail: 0,
    unitPrice: 100,
    taxRate: 13,
    isManual: true,
  };
}

function normalizeManualProduct(product: AdminOrderProductItem, dealerCode: string): AdminOrderProductItem {
  const quantity = Number(product.quantity ?? 0);
  const unitPrice = Number(product.unitPrice ?? 100);
  const taxRate = Number(product.taxRate ?? 13);
  const npsAmount = unitPrice * quantity;
  const taxIncludedAmount = npsAmount * (1 + taxRate / 100);

  return {
    ...product,
    productName: product.productName || "手工录入产品",
    customerCode: product.customerCode || dealerCode,
    quantity,
    unitPrice,
    taxRate,
    npsAmount,
    taxExcludedAmount: npsAmount,
    taxIncludedAmount,
    quotaDetail: product.quotaDetail ?? 0,
    promoDiscountRate: product.promoDiscountRate ?? 0,
    discountRate: product.discountRate ?? 0,
    productGroup: product.productGroup ?? "手工产品组",
    shipWarehouse: product.shipWarehouse ?? "手工录入仓",
    stockDetail: product.stockDetail ?? 0,
    isManual: true,
  };
}

export function AdminOrderDetailPage() {
  const [form] = Form.useForm<OrderFormValues>();
  const { message } = App.useApp();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = new URLSearchParams(location.search).get("mode");
  const record = useMemo<AdminOrderRecord | null>(() => {
    if (!detailId) {
      return null;
    }
    return getAdminOrderById(detailId);
  }, [detailId]);

  const isEditable = mode === "create" || record?.orderStatus === "暂存";
  const [suggestedProducts, setSuggestedProducts] = useState<AdminSuggestedOrderProductItem[]>(record?.suggestedProducts ?? []);
  const [manualOrderProducts, setManualOrderProducts] = useState<AdminOrderProductItem[]>(record?.manualOrderProducts ?? []);

  const watchedShipToId = Form.useWatch("selectedShipToId", form);
  const watchedPayerId = Form.useWatch("selectedPayerId", form);
  const watchedUseArAmount = Form.useWatch("useArAmount", form) ?? 0;
  const watchedDiscountUsedAmount = Form.useWatch("discountUsedAmount", form) ?? 0;
  const watchedExpectedDeliveryDate = Form.useWatch("expectedDeliveryDate", form);
  const watchedMultiPayEnabled = Form.useWatch("multiPayEnabled", form);

  const selectedShipTo = record?.shipToOptions?.find((item) => item.id === watchedShipToId) ?? record?.shipToOptions?.[0];
  const selectedPayer = record?.payerOptions?.find((item) => item.id === watchedPayerId) ?? record?.payerOptions?.[0];

  useEffect(() => {
    if (selectedPayer?.paymentInfo && form.getFieldValue("paymentInfo") !== selectedPayer.paymentInfo) {
      form.setFieldValue("paymentInfo", selectedPayer.paymentInfo);
    }
  }, [form, selectedPayer]);

  const suggestedOrderProducts = useMemo<AdminOrderProductItem[]>(
    () =>
      suggestedProducts
        .filter((item) => item.orderQuantity > 0)
        .map((item) => {
          const npsAmount = item.gpsUnitPrice * item.orderQuantity;
          const taxIncludedAmount = npsAmount * (1 + item.taxRate / 100);
          return {
            id: item.id,
            nestleCode: item.nestleCode,
            productName: item.productName,
            quantity: item.orderQuantity,
            taxIncludedAmount,
            npsAmount,
            taxExcludedAmount: npsAmount,
            customerCode: item.customerCode,
            quotaDetail: item.quotaDetail,
            promoDiscountRate: item.promoDiscountRate,
            discountRate: item.distributorDiscountRate,
            productGroup: item.productGroup,
            shipWarehouse: item.shipWarehouse,
            stockDetail: item.stockDetail,
            unitPrice: item.gpsUnitPrice,
            taxRate: item.taxRate,
          };
        }),
    [suggestedProducts],
  );

  const normalizedManualOrderProducts = useMemo(
    () => manualOrderProducts.map((item) => normalizeManualProduct(item, record?.dealerCode ?? "")),
    [manualOrderProducts, record?.dealerCode],
  );

  const orderProducts = useMemo(
    () => [...suggestedOrderProducts, ...normalizedManualOrderProducts],
    [normalizedManualOrderProducts, suggestedOrderProducts],
  );

  const totalBoxes = orderProducts.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeight = suggestedProducts.reduce((sum, item) => sum + item.orderQuantity * item.unitWeight, 0);
  const totalVolume = suggestedProducts.reduce((sum, item) => sum + item.orderQuantity * item.unitVolume, 0);
  const totalNpsAmount = orderProducts.reduce((sum, item) => sum + item.npsAmount, 0);
  const totalTaxIncludedAmount = orderProducts.reduce((sum, item) => sum + item.taxIncludedAmount, 0);
  const totalWithoutTaxAmount = orderProducts.reduce((sum, item) => sum + item.taxExcludedAmount, 0);
  const payableAmount = Math.max(totalTaxIncludedAmount - Number(watchedDiscountUsedAmount) - Number(watchedUseArAmount), 0);

  const initialValues: OrderFormValues = {
    orderNo: record?.orderNo ?? "",
    parentOrderNo: "",
    selectedShipToId: record?.selectedShipToId,
    addressRemark: "",
    selectedPayerId: record?.selectedPayerId,
    paymentInfo: record?.paymentInfo,
    submitTo: record?.submitTo,
    expectedDeliveryDate: record?.expectedDeliveryDate ? dayjs(record.expectedDeliveryDate) : undefined,
    useArAmount: record?.useArAmount ?? 0,
    discountAmount: record?.discountAmount ?? 0,
    discountUsedAmount: record?.discountUsedAmount ?? 0,
    paymentMethod: [],
    orderRemark: record?.orderRemark ?? "",
    deliveryNote: record?.deliveryNote ?? "",
    multiPayEnabled: record?.multiPayEnabled ?? false,
    multiPayPayerName: record?.multiPayPayerName ?? "",
    multiPayAmount: record?.multiPayAmount ?? 0,
    multiPayRemark: record?.multiPayRemark ?? "",
  };

  if (!record) {
    return (
      <Card className="page-card">
        <Typography.Text>未找到当前订单记录。</Typography.Text>
      </Card>
    );
  }

  async function handleSave(action: "draft" | "submit") {
    const values = await form.validateFields();
    const payload = {
      id: record.id,
      orderNo: values.orderNo,
      parentOrderNo: values.parentOrderNo,
      soldToCode: record.soldToCode,
      selectedShipToId: values.selectedShipToId,
      warehouseAddress: selectedShipTo?.address ?? record.warehouseAddress,
      addressRemark: values.addressRemark,
      selectedPayerId: values.selectedPayerId,
      paymentInfo: values.paymentInfo,
      submitTo: values.submitTo,
      orderSubmitDate: record.orderSubmitDate,
      expectedDeliveryDate: values.expectedDeliveryDate?.format("YYYY-MM-DD"),
      expectedArrivalDate: values.expectedDeliveryDate?.add(3, "day").format("YYYY-MM-DD"),
      useArAmount: values.useArAmount ?? 0,
      discountAmount: values.discountAmount ?? 0,
      discountUsedAmount: values.discountUsedAmount ?? 0,
      paymentMethod: values.paymentMethod?.join(","),
      suggestedProducts,
      manualOrderProducts,
      orderRemark: values.orderRemark,
      deliveryNote: values.deliveryNote,
      multiPayEnabled: values.multiPayEnabled ?? false,
      multiPayPayerName: values.multiPayPayerName,
      multiPayAmount: values.multiPayAmount ?? 0,
      multiPayRemark: values.multiPayRemark,
    };

    if (action === "draft") {
      saveAdminOrderDraft(payload);
      void message.success("订单暂存成功。");
      navigate("/admin/order/order-list");
      return;
    }

    submitAdminOrder(payload);
    void message.success("订单已提交。");
    navigate("/admin/order/order-list");
  }

  function handleImportSuggestedProducts() {
    const demoQuantities = [
      { quantity: 12, reason: "日常补货", detail: "门店补货" },
      { quantity: 8, reason: "促销活动", detail: "活动备货" },
      { quantity: 5, reason: "新品铺货", detail: "新品首批铺货" },
      { quantity: 10, reason: "季节性影响", detail: "旺季提前备货" },
      { quantity: 6, reason: "日常补货", detail: "常规补单" },
    ];

    setSuggestedProducts((current) =>
      current.map((item, index) => {
        const demo = demoQuantities[index];
        if (!demo) {
          return item;
        }
        return {
          ...item,
          orderQuantity: demo.quantity,
          orderReason: demo.reason,
          orderReasonDetail: demo.detail,
        };
      }),
    );
    void message.success("建议订单产品已导入 5 条示例数据。");
  }

  function handleImportOrderProducts() {
    setManualOrderProducts((current) => {
      if (current.length === 0) {
        return [
          {
            ...buildManualDraftProduct(record, 1),
            nestleCode: "12988001",
            quantity: 10,
          },
        ];
      }

      return current.map((item, index) =>
        index === 0 && !item.nestleCode && item.quantity === 0 ? { ...item, nestleCode: "12988001", quantity: 10 } : item,
      );
    });
    void message.success("订单产品已导入示例数据。");
  }

  function handleAddManualProduct() {
    setManualOrderProducts((current) => [...current, buildManualDraftProduct(record, current.length + 1)]);
  }

  function updateManualProduct(id: string, patch: Partial<AdminOrderProductItem>) {
    setManualOrderProducts((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function handleRemoveManualProduct(id: string) {
    setManualOrderProducts((current) => current.filter((item) => item.id !== id));
  }

  const suggestedColumns: ColumnsType<AdminSuggestedOrderProductItem> = [
    { title: "序号", key: "index", width: 70, render: (_, __, index) => index + 1 },
    { title: "雀巢代码", dataIndex: "nestleCode", width: 120 },
    {
      title: "产品信息",
      width: 360,
      render: (_, row) => (
        <Space direction="vertical" size={6}>
          <Typography.Text>{row.productName}</Typography.Text>
          <Typography.Text type="secondary">
            BU：{row.productBu} · GPS单价：{formatAmount(row.gpsUnitPrice)} 元
          </Typography.Text>
          <Typography.Text type="secondary">
            单位毛重：{row.unitWeight} 公斤 · 单位体积：{row.unitVolume} 立方米 · 税率：{row.taxRate}%
          </Typography.Text>
          <Typography.Text type="secondary">
            经销商折扣：{row.distributorDiscountRate}% · 经销商预付折扣：{row.preDistributionDiscountRate}%
          </Typography.Text>
        </Space>
      ),
    },
    { title: "建议数量Avg(箱)", dataIndex: "suggestedAvgQuantity", width: 130 },
    {
      title: "订购数量(箱)",
      width: 150,
      render: (_, row) => (
        <InputNumber
          min={0}
          value={row.orderQuantity}
          style={{ width: "100%" }}
          disabled={!isEditable}
          onChange={(value) => {
            setSuggestedProducts((current) =>
              current.map((item) => (item.id === row.id ? { ...item, orderQuantity: Number(value ?? 0) } : item)),
            );
          }}
        />
      ),
    },
    {
      title: "订购原因",
      width: 150,
      render: (_, row) => (
        <Select
          allowClear
          value={row.orderReason}
          placeholder="选择订购原因"
          disabled={!isEditable}
          options={orderReasonOptions}
          onChange={(value) => {
            setSuggestedProducts((current) =>
              current.map((item) => (item.id === row.id ? { ...item, orderReason: value } : item)),
            );
          }}
        />
      ),
    },
    {
      title: "原因详情",
      width: 170,
      render: (_, row) => (
        <Input.TextArea
          rows={2}
          value={row.orderReasonDetail}
          placeholder="输入原因详情"
          disabled={!isEditable}
          onChange={(event) => {
            setSuggestedProducts((current) =>
              current.map((item) => (item.id === row.id ? { ...item, orderReasonDetail: event.target.value } : item)),
            );
          }}
        />
      ),
    },
    { title: "建议数量Min(箱)", dataIndex: "suggestedMinQuantity", width: 130 },
    { title: "建议数量Max(箱)", dataIndex: "suggestedMaxQuantity", width: 130 },
    { title: "库存数量(箱)", dataIndex: "stockQuantity", width: 120 },
    {
      title: "销量预估(箱)",
      dataIndex: "estimatedSales",
      width: 120,
      render: (value: number | null) => value ?? "--",
    },
    { title: "配额明细(箱)", dataIndex: "quotaDetail", width: 120 },
    { title: "促销折扣(%)", dataIndex: "promoDiscountRate", width: 120 },
  ];

  const orderColumns: ColumnsType<AdminOrderProductItem> = [
    { title: "序号", key: "index", width: 70, render: (_, __, index) => index + 1 },
    {
      title: "雀巢代码",
      width: 150,
      render: (_, row) =>
        row.isManual ? (
          <Input
            value={row.nestleCode}
            disabled={!isEditable}
            placeholder="请输入雀巢代码"
            onChange={(event) => updateManualProduct(row.id, { nestleCode: event.target.value })}
          />
        ) : (
          row.nestleCode
        ),
    },
    {
      title: "订购数量(箱)",
      width: 140,
      render: (_, row) =>
        row.isManual ? (
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            disabled={!isEditable}
            value={row.quantity}
            onChange={(value) => updateManualProduct(row.id, { quantity: Number(value ?? 0) })}
          />
        ) : (
          row.quantity
        ),
    },
    {
      title: "客户代码",
      width: 120,
      render: (_, row) => row.customerCode ?? record.dealerCode,
    },
    {
      title: "产品信息",
      width: 220,
      render: (_, row) => row.productName,
    },
    {
      title: "配额明细(箱)",
      width: 120,
      render: (_, row) => row.quotaDetail ?? 0,
    },
    {
      title: "促销折扣(%)",
      width: 120,
      render: (_, row) => row.promoDiscountRate ?? 0,
    },
    {
      title: "折让",
      width: 120,
      render: (_, row) => `${row.discountRate ?? 0}%`,
    },
    {
      title: "净价",
      dataIndex: "taxExcludedAmount",
      width: 120,
      render: (value: number) => formatAmount(value),
    },
    {
      title: "税额",
      width: 120,
      render: (_, row) => formatAmount(row.taxIncludedAmount - row.taxExcludedAmount),
    },
    {
      title: "产品组",
      width: 120,
      render: (_, row) => row.productGroup ?? "--",
    },
    {
      title: "出货仓",
      width: 120,
      render: (_, row) => row.shipWarehouse ?? "--",
    },
    {
      title: "库存明细(箱)",
      width: 130,
      render: (_, row) => row.stockDetail ?? 0,
    },
    {
      title: "操作",
      width: 90,
      fixed: "right",
      render: (_, row) =>
        row.isManual ? (
          <Button type="link" disabled={!isEditable} onClick={() => handleRemoveManualProduct(row.id)}>
            删除
          </Button>
        ) : (
          "--"
        ),
    },
  ];

  return (
    <Form
      form={form}
      initialValues={initialValues}
      layout="horizontal"
      colon={false}
      labelAlign="left"
      labelCol={{ flex: "150px" }}
      wrapperCol={{ flex: "auto" }}
    >
      <Space direction="vertical" size={16} className="page-stack">
        <Card className="page-card">
          <div className="agreement-detail__header">
            <Space align="center" size={12}>
              <Typography.Title level={4} className="agreement-detail__title">
                新增/编辑订单
              </Typography.Title>
            </Space>
            <Space>
              <Button onClick={() => navigate("/admin/order/order-list")}>返回</Button>
              <Button onClick={() => previewAdminOrderPdf(record)}>导出PDF</Button>
              {isEditable ? (
                <>
                  <Button type="primary" ghost onClick={() => void handleSave("draft")}>
                    暂存数据
                  </Button>
                  <Button type="primary" onClick={() => void handleSave("submit")}>
                    提交订单
                  </Button>
                </>
              ) : null}
            </Space>
          </div>
        </Card>

        <Card className="page-card" title="订单基础信息">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <Space direction="vertical" size={0} style={{ width: "100%" }}>
              <Form.Item name="paymentMethod" label="付款方式">
                <Checkbox.Group options={[{ label: "赊销订单", value: "赊销订单" }]} disabled={!isEditable} />
              </Form.Item>
              <Form.Item name="orderNo" label="订单编号" rules={[{ required: true, message: "请输入订单编号" }]}>
                <Input disabled={!isEditable} />
              </Form.Item>
              <Form.Item name="parentOrderNo" label="雀巢订单号">
                <Input disabled />
              </Form.Item>
              <Form.Item label="经销商客户代码 sold to">
                <Input value={`${record.soldToCode ?? record.dealerCode} - ${record.dealerName}`} disabled />
              </Form.Item>
              <Form.Item name="selectedShipToId" label="仓库编码 ship to" rules={[{ required: true, message: "请选择仓库编码" }]}>
                <Select
                  disabled={!isEditable}
                  options={(record.shipToOptions ?? []).map((item) => ({ label: item.label, value: item.id }))}
                />
              </Form.Item>
              <Form.Item label="仓库地址">
                <Input value={selectedShipTo?.address ?? record.warehouseAddress ?? "-"} disabled />
              </Form.Item>
              <Form.Item name="addressRemark" label="收货地址注释">
                <Input maxLength={50} disabled={!isEditable} placeholder="输入收货地址注释" />
              </Form.Item>
              <Form.Item name="selectedPayerId" label="付款人" rules={[{ required: true, message: "请选择付款人" }]}>
                <Select
                  disabled={!isEditable}
                  options={(record.payerOptions ?? []).map((item) => ({ label: item.label, value: item.id }))}
                />
              </Form.Item>
              <Form.Item name="paymentInfo" label="付款信息">
                <Input disabled={!isEditable} />
              </Form.Item>
              <Form.Item label="销售办事处及经销商区域">
                <Input value={record.salesOfficeRegion ?? "-"} disabled />
              </Form.Item>
              <Form.Item name="submitTo" label="订单提交给">
                <Select
                  disabled={!isEditable}
                  options={[
                    { label: "提交给CS", value: "提交给CS" },
                    { label: "提交给SA", value: "提交给SA" },
                  ]}
                />
              </Form.Item>
            </Space>

            <Space direction="vertical" size={0} style={{ width: "100%" }}>
              <Form.Item label="订单NPS总金额">
                <Input value={formatAmount(totalNpsAmount)} disabled />
              </Form.Item>
              <Form.Item name="discountAmount" label="订单折扣总金额">
                <InputNumber min={0} style={{ width: "100%" }} disabled={!isEditable} />
              </Form.Item>
              <Form.Item name="discountUsedAmount" label="折让单使用金额">
                <InputNumber min={0} style={{ width: "100%" }} disabled={!isEditable} />
              </Form.Item>
              <Form.Item label="订单税前净金额">
                <Input value={formatAmount(totalWithoutTaxAmount)} disabled />
              </Form.Item>
              <Form.Item label="订单应纳税金额">
                <Input value={formatAmount(Math.max(totalTaxIncludedAmount - totalWithoutTaxAmount, 0))} disabled />
              </Form.Item>
              <Form.Item label="订单总金额">
                <Input value={formatAmount(totalTaxIncludedAmount)} disabled />
              </Form.Item>
              <Form.Item name="useArAmount" label="使用AR金额">
                <InputNumber min={0} style={{ width: "100%" }} disabled={!isEditable} />
              </Form.Item>
              <Form.Item label="订单应付金额">
                <Input value={formatAmount(payableAmount)} disabled />
              </Form.Item>
              <Form.Item label="订单实际付款金额">
                <Input value={formatAmount(payableAmount)} disabled />
              </Form.Item>
            </Space>
          </div>
        </Card>

        <Card className="page-card" title="订单附加信息">
          <Tabs
            items={[
              {
                key: "delivery",
                label: "发货",
                children: (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <Space direction="vertical" size={0} style={{ width: "100%" }}>
                      <Form.Item label="订单提交日期">
                        <Input value={record.orderSubmitDate ?? "-"} disabled />
                      </Form.Item>
                      <Form.Item name="expectedDeliveryDate" label="预计发货日期" rules={[{ required: true, message: "请选择预计发货日期" }]}>
                        <DatePicker style={{ width: "100%" }} disabled={!isEditable} />
                      </Form.Item>
                      <Form.Item label="预计到货日期">
                        <Input
                          value={
                            watchedExpectedDeliveryDate
                              ? `${dayjs(watchedExpectedDeliveryDate).add(3, "day").format("YYYY-MM-DD")} | 在途 3 天`
                              : record.expectedArrivalDate ?? "-"
                          }
                          disabled
                        />
                      </Form.Item>
                    </Space>
                    <Space direction="vertical" size={0} style={{ width: "100%" }}>
                      <Form.Item label="订单产品总件数">
                        <Input value={`${totalBoxes} 箱`} disabled />
                      </Form.Item>
                      <Form.Item label="订单产品总重量">
                        <Input value={`${totalWeight.toFixed(2)} 公斤`} disabled />
                      </Form.Item>
                      <Form.Item label="订单产品总体积">
                        <Input value={`${totalVolume.toFixed(6)} 立方米`} disabled />
                      </Form.Item>
                    </Space>
                  </div>
                ),
              },
              {
                key: "remark",
                label: "订单备注",
                children: (
                  <Space direction="vertical" size={0} style={{ width: "100%" }}>
                    <Form.Item name="orderRemark" label="订单备注">
                      <Input.TextArea rows={4} disabled={!isEditable} placeholder="输入订单备注" />
                    </Form.Item>
                    <Form.Item name="deliveryNote" label="发货备注">
                      <Input.TextArea rows={4} disabled={!isEditable} placeholder="输入发货备注" />
                    </Form.Item>
                  </Space>
                ),
              },
              {
                key: "payment",
                label: "多方付款",
                children: (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <Space direction="vertical" size={0} style={{ width: "100%" }}>
                      <Form.Item name="multiPayEnabled" label="启用多方付款" valuePropName="checked">
                        <Checkbox disabled={!isEditable}>启用</Checkbox>
                      </Form.Item>
                      <Form.Item name="multiPayPayerName" label="付款方名称">
                        <Input disabled={!isEditable || !watchedMultiPayEnabled} placeholder="输入付款方名称" />
                      </Form.Item>
                    </Space>
                    <Space direction="vertical" size={0} style={{ width: "100%" }}>
                      <Form.Item name="multiPayAmount" label="付款金额">
                        <InputNumber
                          min={0}
                          style={{ width: "100%" }}
                          disabled={!isEditable || !watchedMultiPayEnabled}
                          placeholder="输入付款金额"
                        />
                      </Form.Item>
                      <Form.Item name="multiPayRemark" label="付款备注">
                        <Input.TextArea rows={4} disabled={!isEditable || !watchedMultiPayEnabled} placeholder="输入付款备注" />
                      </Form.Item>
                    </Space>
                  </div>
                ),
              },
            ]}
          />
        </Card>

        <Card
          className="page-card"
          title="建议订单产品信息"
          extra={
            <Space>
              <Button onClick={() => exportSuggestedProducts(suggestedProducts, "建议订单产品")}>导出产品</Button>
              <Button onClick={handleImportSuggestedProducts} disabled={!isEditable}>
                导入产品
              </Button>
            </Space>
          }
        >
          <Table
            rowKey="id"
            dataSource={suggestedProducts}
            columns={suggestedColumns}
            tableLayout="fixed"
            pagination={false}
            scroll={{ x: 2200 }}
          />
        </Card>

        <Card
          className="page-card"
          title="订单产品信息"
          extra={
            <Space>
              <Button onClick={() => exportOrderProducts(orderProducts, "订单产品")}>导出产品</Button>
              <Button onClick={handleImportOrderProducts} disabled={!isEditable}>
                导入产品
              </Button>
              <Button type="primary" ghost disabled={!isEditable} onClick={handleAddManualProduct}>
                添加产品
              </Button>
            </Space>
          }
        >
          <Table
            rowKey="id"
            dataSource={orderProducts}
            columns={orderColumns}
            locale={{ emptyText: "暂无数据" }}
            tableLayout="fixed"
            pagination={false}
            scroll={{ x: 1800 }}
          />
        </Card>
      </Space>
    </Form>
  );
}
