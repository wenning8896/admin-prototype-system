import dayjs from "dayjs";
import { utils, writeFileXLSX } from "xlsx";
import type {
  AdminOrderDealerOption,
  AdminOrderPayerOption,
  AdminOrderProductItem,
  AdminOrderRecord,
  AdminOrderShipToOption,
  AdminOrderStatus,
  AdminOrderTabKey,
  AdminSuggestedOrderProductItem,
} from "../mocks/orderList.mock";
import { adminOrderSeedRecords } from "../mocks/orderList.mock";

const STORAGE_KEY = "csl-order-admin-order-list";

export type AdminOrderFilters = {
  orderNo?: string;
  dealerCode?: string;
  dealerName?: string;
  orderStatus?: AdminOrderStatus;
};

export type AdminOrderDealerFilters = {
  dealerCode?: string;
  dealerName?: string;
  hierarchyKeyword?: string;
};

export type SaveAdminOrderDraftPayload = {
  id: string;
  orderNo: string;
  paymentMethod?: string;
  parentOrderNo?: string;
  soldToCode?: string;
  selectedShipToId?: string;
  warehouseAddress?: string;
  addressRemark?: string;
  selectedPayerId?: string;
  paymentInfo?: string;
  submitTo?: string;
  orderSubmitDate?: string;
  expectedDeliveryDate?: string;
  expectedArrivalDate?: string;
  useArAmount?: number;
  discountAmount?: number;
  discountUsedAmount?: number;
  suggestedProducts: AdminSuggestedOrderProductItem[];
  manualOrderProducts?: AdminOrderProductItem[];
  orderRemark?: string;
  deliveryNote?: string;
  multiPayEnabled?: boolean;
  multiPayPayerName?: string;
  multiPayAmount?: number;
  multiPayRemark?: string;
};

export function buildAdminSuggestedProductTemplate(
  dealerCode: string,
  partial: Partial<AdminSuggestedOrderProductItem> & Pick<AdminSuggestedOrderProductItem, "id" | "nestleCode" | "productName">,
): AdminSuggestedOrderProductItem {
  return {
    id: partial.id,
    nestleCode: partial.nestleCode,
    productName: partial.productName,
    productBu: partial.productBu ?? "奶品",
    gpsUnitPrice: partial.gpsUnitPrice ?? 100,
    unitWeight: partial.unitWeight ?? 1,
    unitVolume: partial.unitVolume ?? 0.01,
    taxRate: partial.taxRate ?? 13,
    distributorDiscountRate: partial.distributorDiscountRate ?? 5,
    preDistributionDiscountRate: partial.preDistributionDiscountRate ?? 2,
    suggestedAvgQuantity: partial.suggestedAvgQuantity ?? 0,
    orderQuantity: partial.orderQuantity ?? 0,
    orderReason: partial.orderReason,
    orderReasonDetail: partial.orderReasonDetail,
    suggestedMinQuantity: partial.suggestedMinQuantity ?? 0,
    suggestedMaxQuantity: partial.suggestedMaxQuantity ?? 0,
    stockQuantity: partial.stockQuantity ?? 0,
    estimatedSales: partial.estimatedSales ?? null,
    quotaDetail: partial.quotaDetail ?? 0,
    promoDiscountRate: partial.promoDiscountRate ?? 0,
    customerCode: partial.customerCode ?? dealerCode,
    productGroup: partial.productGroup ?? "默认产品组",
    shipWarehouse: partial.shipWarehouse ?? "默认仓",
    stockDetail: partial.stockDetail ?? 0,
  };
}

function readStoredRecords() {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as AdminOrderRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: AdminOrderRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getMergedRecords() {
  const stored = readStoredRecords();
  const merged = [...adminOrderSeedRecords];
  stored.forEach((item) => {
    const index = merged.findIndex((record) => record.id === item.id);
    if (index >= 0) {
      merged[index] = item;
      return;
    }
    merged.unshift(item);
  });
  return merged;
}

function persistMergedRecord(nextRecord: AdminOrderRecord) {
  const stored = readStoredRecords();
  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);
  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredRecords(next);
    return;
  }
  persistStoredRecords([nextRecord, ...stored.filter((item) => item.id !== nextRecord.id)]);
}

export async function listAdminOrders(tabKey: AdminOrderTabKey, filters: AdminOrderFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const orderNo = filters.orderNo?.trim().toLowerCase();
  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const dealerName = filters.dealerName?.trim().toLowerCase();

  return getMergedRecords().filter((item) => {
    const matchesTab = item.tabKey === tabKey;
    const matchesOrderNo = !orderNo || item.orderNo.toLowerCase().includes(orderNo);
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesDealerName = !dealerName || item.dealerName.toLowerCase().includes(dealerName);
    const matchesStatus = !filters.orderStatus || item.orderStatus === filters.orderStatus;
    return matchesTab && matchesOrderNo && matchesDealerCode && matchesDealerName && matchesStatus;
  });
}

export function getAdminOrderById(id: string) {
  return getMergedRecords().find((item) => item.id === id) ?? null;
}

export function listAdminOrderDealerOptions(filters: AdminOrderDealerFilters = {}) {
  const baseOptions: AdminOrderDealerOption[] = [
    {
      dealerCode: "2601081",
      dealerName: "lec测试引导认证408",
      l4: "--",
      l5: "--",
      l6: "--",
      region: "南区",
      cg: "广西",
      businessUnit: "NIN",
      dealerType: "--",
    },
    {
      dealerCode: "7523775",
      dealerName: "潍坊花琚木供应链管理有限公司",
      l4: "L4 CN 26 02 Beverage Solutions",
      l5: "L5 CN 26 02 Beijing-BEV SOL",
      l6: "L6 CN 26 02 Beijing DSO-BEV SOL",
      region: "--",
      cg: "--",
      businessUnit: "NP_BEV",
      dealerType: "DT",
    },
    {
      dealerCode: "5335048",
      dealerName: "上海瑾睿供应链管理服务有限公司",
      l4: "L4 CN WN Ecommerce",
      l5: "L5 CN WN Ecommerce-Indirect",
      l6: "L6 CN WN Ecommerce-Indirect",
      region: "--",
      cg: "--",
      businessUnit: "WIN",
      dealerType: "EC",
    },
    {
      dealerCode: "4720319",
      dealerName: "深圳市怡亚通深度供应链管理有限公司",
      l4: "L4 CN WN Ecommerce",
      l5: "L5 CN WN Ecommerce-Indirect",
      l6: "L6 CN WN Ecommerce-Indirect",
      region: "--",
      cg: "--",
      businessUnit: "WIN",
      dealerType: "EC",
    },
    {
      dealerCode: "6900769",
      dealerName: "国药医疗健康科技有限公司",
      l4: "L4 CN WN Ecommerce",
      l5: "L5 CN WN Ecommerce-Indirect",
      l6: "L6 CN WN Ecommerce-Indirect",
      region: "--",
      cg: "--",
      businessUnit: "WIN",
      dealerType: "EC",
    },
    {
      dealerCode: "6455642",
      dealerName: "上海什瀚科技服务有限公司",
      l4: "L4 CN WN Ecommerce",
      l5: "L5 CN WN Ecommerce-Indirect",
      l6: "L6 CN WN Ecommerce-Indirect",
      region: "--",
      cg: "--",
      businessUnit: "WIN",
      dealerType: "EC",
    },
    {
      dealerCode: "7030466",
      dealerName: "昆明万利汇商贸有限公司",
      l4: "L4 CN WN Distributors",
      l5: "L5 CN WN West Zone",
      l6: "L6 CN WN West Yu/Gui/Yun Region",
      region: "--",
      cg: "--",
      businessUnit: "WIN",
      dealerType: "DT",
    },
    {
      dealerCode: "4411269",
      dealerName: "兰州中信贸易有限责任公司",
      l4: "L4 CN WN Distributors",
      l5: "L5 CN WN West Zone",
      l6: "L6 CN WN West Xibei Region",
      region: "--",
      cg: "--",
      businessUnit: "WIN",
      dealerType: "DT",
    },
  ];

  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const dealerName = filters.dealerName?.trim().toLowerCase();
  const hierarchyKeyword = filters.hierarchyKeyword?.trim().toLowerCase();

  return baseOptions.filter((item) => {
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesDealerName = !dealerName || item.dealerName.toLowerCase().includes(dealerName);
    const matchesHierarchy =
      !hierarchyKeyword ||
      item.l4.toLowerCase().includes(hierarchyKeyword) ||
      item.l5.toLowerCase().includes(hierarchyKeyword) ||
      item.l6.toLowerCase().includes(hierarchyKeyword);
    return matchesDealerCode && matchesDealerName && matchesHierarchy;
  });
}

function buildShipToOptions(dealer: AdminOrderDealerOption): AdminOrderShipToOption[] {
  return [
    {
      id: `${dealer.dealerCode}-shipto-1`,
      label: `${dealer.dealerCode} - ${dealer.dealerName} - 7282`,
      address: `${dealer.dealerName}默认仓地址`,
    },
    {
      id: `${dealer.dealerCode}-shipto-2`,
      label: `${dealer.dealerCode} - ${dealer.dealerName} - 8361`,
      address: `${dealer.dealerName}冷链分仓地址`,
    },
  ];
}

function buildPayerOptions(dealer: AdminOrderDealerOption): AdminOrderPayerOption[] {
  return [
    {
      id: `${dealer.dealerCode}-payer-1`,
      label: `${dealer.dealerCode} - ${dealer.dealerName}`,
      paymentInfo: `${dealer.dealerName} / 默认付款方式 / 账期30天`,
    },
    {
      id: `${dealer.dealerCode}-payer-2`,
      label: `${dealer.dealerCode} - ${dealer.dealerName} 分公司`,
      paymentInfo: `${dealer.dealerName}分公司 / 银行转账 / 账期15天`,
    },
  ];
}

function buildSuggestedProducts(dealer: AdminOrderDealerOption): AdminSuggestedOrderProductItem[] {
  return [
    buildAdminSuggestedProductTemplate(dealer.dealerCode, {
      id: `${dealer.dealerCode}-suggested-1`,
      nestleCode: "12192124",
      productName: "雀巢鹰唛炼奶奶零售装@48x350g CN",
      productBu: "奶品",
      gpsUnitPrice: 638.7,
      unitWeight: 19.6,
      unitVolume: 0.025871,
      taxRate: 13,
      distributorDiscountRate: 5,
      preDistributionDiscountRate: 2,
      suggestedAvgQuantity: 0,
      orderQuantity: 0,
      suggestedMinQuantity: 0,
      suggestedMaxQuantity: 0,
      stockQuantity: 0,
      estimatedSales: null,
      quotaDetail: 0,
      promoDiscountRate: 0,
      customerCode: dealer.dealerCode,
      productGroup: "炼奶",
      shipWarehouse: "默认仓",
      stockDetail: 0,
    }),
    buildAdminSuggestedProductTemplate(dealer.dealerCode, {
      id: `${dealer.dealerCode}-suggested-2`,
      nestleCode: "12237391",
      productName: "雀巢淡奶油@24x250mlN1 CN",
      productBu: "奶品",
      gpsUnitPrice: 293,
      unitWeight: 6.36,
      unitVolume: 0.008268,
      taxRate: 13,
      distributorDiscountRate: 5,
      preDistributionDiscountRate: 2,
      suggestedAvgQuantity: 0,
      orderQuantity: 0,
      suggestedMinQuantity: 0,
      suggestedMaxQuantity: 0,
      stockQuantity: 0,
      estimatedSales: null,
      quotaDetail: 0,
      promoDiscountRate: 0,
      customerCode: dealer.dealerCode,
      productGroup: "淡奶油",
      shipWarehouse: "默认仓",
      stockDetail: 0,
    }),
    buildAdminSuggestedProductTemplate(dealer.dealerCode, {
      id: `${dealer.dealerCode}-suggested-3`,
      nestleCode: "12496119",
      productName: "雀巢怡养燕麦种因子中老年奶粉双听礼盒 @2x1.4kg N1 CN",
      productBu: "营养品",
      gpsUnitPrice: 418,
      unitWeight: 2.8,
      unitVolume: 0.021,
      taxRate: 13,
      distributorDiscountRate: 4,
      preDistributionDiscountRate: 1,
      suggestedAvgQuantity: 0,
      orderQuantity: 0,
      suggestedMinQuantity: 0,
      suggestedMaxQuantity: 20,
      stockQuantity: 6,
      estimatedSales: 10,
      quotaDetail: 12,
      promoDiscountRate: 0,
      customerCode: dealer.dealerCode,
      productGroup: "奶粉",
      shipWarehouse: "营养仓",
      stockDetail: 6,
    }),
    buildAdminSuggestedProductTemplate(dealer.dealerCode, {
      id: `${dealer.dealerCode}-suggested-4`,
      nestleCode: "12970005",
      productName: "雀巢咖啡拿铁款 24条装",
      productBu: "咖啡",
      gpsUnitPrice: 265,
      unitWeight: 4.2,
      unitVolume: 0.014,
      taxRate: 13,
      distributorDiscountRate: 3,
      preDistributionDiscountRate: 1,
      suggestedAvgQuantity: 0,
      orderQuantity: 0,
      suggestedMinQuantity: 0,
      suggestedMaxQuantity: 30,
      stockQuantity: 15,
      estimatedSales: 20,
      quotaDetail: 10,
      promoDiscountRate: 2,
      customerCode: dealer.dealerCode,
      productGroup: "咖啡",
      shipWarehouse: "咖啡仓",
      stockDetail: 15,
    }),
    buildAdminSuggestedProductTemplate(dealer.dealerCode, {
      id: `${dealer.dealerCode}-suggested-5`,
      nestleCode: "12800112",
      productName: "雀巢咖啡低糖款 30条装",
      productBu: "咖啡",
      gpsUnitPrice: 312,
      unitWeight: 5.1,
      unitVolume: 0.016,
      taxRate: 13,
      distributorDiscountRate: 3,
      preDistributionDiscountRate: 1,
      suggestedAvgQuantity: 0,
      orderQuantity: 0,
      suggestedMinQuantity: 0,
      suggestedMaxQuantity: 24,
      stockQuantity: 10,
      estimatedSales: 18,
      quotaDetail: 8,
      promoDiscountRate: 1,
      customerCode: dealer.dealerCode,
      productGroup: "咖啡",
      shipWarehouse: "咖啡仓",
      stockDetail: 10,
    }),
  ];
}

export function listAdminAdditionalProductTemplates(dealerCode: string) {
  return [
    buildAdminSuggestedProductTemplate(dealerCode, {
      id: `${dealerCode}-extra-1`,
      nestleCode: "12496119",
      productName: "雀巢怡养燕麦种因子中老年奶粉双听礼盒 @2x1.4kg N1 CN",
      productBu: "营养品",
      gpsUnitPrice: 418,
      unitWeight: 2.8,
      unitVolume: 0.021,
      suggestedMinQuantity: 0,
      suggestedMaxQuantity: 20,
      productGroup: "奶粉",
    }),
    buildAdminSuggestedProductTemplate(dealerCode, {
      id: `${dealerCode}-extra-2`,
      nestleCode: "12970005",
      productName: "雀巢咖啡拿铁款 24条装",
      productBu: "咖啡",
      gpsUnitPrice: 265,
      unitWeight: 4.2,
      unitVolume: 0.014,
      suggestedMinQuantity: 0,
      suggestedMaxQuantity: 30,
      productGroup: "咖啡",
    }),
  ];
}

function sumOrderProducts(suggestedProducts: AdminSuggestedOrderProductItem[]): AdminOrderProductItem[] {
  return suggestedProducts
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
      };
    });
}

function normalizeManualOrderProducts(products: AdminOrderProductItem[] = [], dealerCode: string) {
  return products
    .filter((item) => item.nestleCode.trim() || item.quantity > 0)
    .map((item, index) => {
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? 100);
      const taxRate = Number(item.taxRate ?? 13);
      const npsAmount = unitPrice * quantity;
      const taxIncludedAmount = npsAmount * (1 + taxRate / 100);

      return {
        ...item,
        id: item.id || `manual-${Date.now()}-${index}`,
        productName: item.productName || "手工录入产品",
        customerCode: item.customerCode || dealerCode,
        quantity,
        unitPrice,
        taxRate,
        npsAmount,
        taxExcludedAmount: npsAmount,
        taxIncludedAmount,
        quotaDetail: item.quotaDetail ?? 0,
        promoDiscountRate: item.promoDiscountRate ?? 0,
        discountRate: item.discountRate ?? 0,
        productGroup: item.productGroup ?? "手工产品组",
        shipWarehouse: item.shipWarehouse ?? "手工录入仓",
        stockDetail: item.stockDetail ?? 0,
        isManual: true,
      };
    });
}

export function createDraftAdminOrder(dealer: AdminOrderDealerOption) {
  const createdAt = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const shipToOptions = buildShipToOptions(dealer);
  const payerOptions = buildPayerOptions(dealer);
  const suggestedProducts = buildSuggestedProducts(dealer);
  const nextRecord: AdminOrderRecord = {
    id: `admin-order-${Date.now()}`,
    tabKey: "drafts",
    orderNo: `RN${dealer.dealerCode}${dayjs().format("HHmmss")}`,
    orderProductTotalBoxes: 0,
    orderAmountWithTax: 0,
    npsAmount: 0,
    orderAmountWithoutTax: 0,
    dealerCode: dealer.dealerCode,
    dealerName: dealer.dealerName,
    l4: dealer.l4,
    l5: dealer.l5,
    l6: dealer.l6,
    createdAt,
    createdBy: "管理员",
    statusChangedAt: createdAt,
    orderStatus: "暂存",
    products: [],
    soldToCode: dealer.dealerCode,
    shipToOptions,
    selectedShipToId: shipToOptions[0]?.id,
    warehouseAddress: shipToOptions[0]?.address,
    payerOptions,
    selectedPayerId: payerOptions[0]?.id,
    paymentInfo: payerOptions[0]?.paymentInfo ?? "",
    salesOfficeRegion: `${dealer.region} | ${dealer.l6}`,
    submitTo: "提交给CS",
    orderSubmitDate: dayjs().format("YYYY-MM-DD"),
    expectedDeliveryDate: dayjs().add(2, "day").format("YYYY-MM-DD"),
    expectedArrivalDate: dayjs().add(5, "day").format("YYYY-MM-DD"),
    totalWeight: 0,
    totalVolume: 0,
    useArAmount: 0,
    discountAmount: 0,
    discountUsedAmount: 0,
    amountBeforeDiscount: 0,
    amountPayable: 0,
    actualPaymentAmount: 0,
    suggestedProducts,
    manualOrderProducts: [],
    orderRemark: "",
    deliveryNote: "",
    multiPayEnabled: false,
    multiPayPayerName: "",
    multiPayAmount: 0,
    multiPayRemark: "",
  };
  persistMergedRecord(nextRecord);
  return nextRecord;
}

export function saveAdminOrderDraft(payload: SaveAdminOrderDraftPayload) {
  const target = getAdminOrderById(payload.id);
  if (!target) {
    throw new Error("未找到订单记录");
  }

  const suggestedOrderProducts = sumOrderProducts(payload.suggestedProducts);
  const manualOrderProducts = normalizeManualOrderProducts(payload.manualOrderProducts, target.dealerCode);
  const products = [...suggestedOrderProducts, ...manualOrderProducts];
  const totalBoxes = products.reduce((sum, item) => sum + item.quantity, 0);
  const totalTaxIncluded = products.reduce((sum, item) => sum + item.taxIncludedAmount, 0);
  const totalNps = products.reduce((sum, item) => sum + item.npsAmount, 0);
  const totalWithoutTax = products.reduce((sum, item) => sum + item.taxExcludedAmount, 0);
  const selectedShipTo = target.shipToOptions?.find((item) => item.id === payload.selectedShipToId);
  const selectedPayer = target.payerOptions?.find((item) => item.id === payload.selectedPayerId);

  const nextRecord: AdminOrderRecord = {
    ...target,
    orderNo: payload.orderNo,
    orderProductTotalBoxes: totalBoxes,
    orderAmountWithTax: totalTaxIncluded,
    npsAmount: totalNps,
    orderAmountWithoutTax: totalWithoutTax,
    products,
    selectedShipToId: payload.selectedShipToId,
    warehouseAddress: payload.warehouseAddress ?? selectedShipTo?.address ?? target.warehouseAddress,
    selectedPayerId: payload.selectedPayerId,
    paymentInfo: payload.paymentInfo ?? selectedPayer?.paymentInfo ?? target.paymentInfo,
    submitTo: payload.submitTo,
    orderSubmitDate: payload.orderSubmitDate,
    expectedDeliveryDate: payload.expectedDeliveryDate,
    expectedArrivalDate: payload.expectedArrivalDate,
    useArAmount: payload.useArAmount ?? 0,
    discountAmount: payload.discountAmount ?? 0,
    discountUsedAmount: payload.discountUsedAmount ?? 0,
    amountBeforeDiscount: totalNps,
    amountPayable: totalTaxIncluded - (payload.discountUsedAmount ?? 0) - (payload.useArAmount ?? 0),
    actualPaymentAmount: totalTaxIncluded - (payload.discountUsedAmount ?? 0) - (payload.useArAmount ?? 0),
    suggestedProducts: payload.suggestedProducts,
    manualOrderProducts,
    orderRemark: payload.orderRemark ?? "",
    deliveryNote: payload.deliveryNote ?? "",
    multiPayEnabled: payload.multiPayEnabled ?? false,
    multiPayPayerName: payload.multiPayPayerName ?? "",
    multiPayAmount: payload.multiPayAmount ?? 0,
    multiPayRemark: payload.multiPayRemark ?? "",
    statusChangedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };

  persistMergedRecord(nextRecord);
  return nextRecord;
}

export function submitAdminOrder(payload: SaveAdminOrderDraftPayload) {
  const saved = saveAdminOrderDraft(payload);
  const nextRecord: AdminOrderRecord = {
    ...saved,
    tabKey: "orders",
    orderStatus: "订单已提交",
    statusChangedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
  persistMergedRecord(nextRecord);
  return nextRecord;
}

export function resubmitAdminOrder(id: string) {
  const target = getAdminOrderById(id);
  if (!target) {
    throw new Error("未找到订单记录");
  }
  const nextRecord: AdminOrderRecord = {
    ...target,
    tabKey: "orders",
    orderStatus: "订单已提交",
    statusChangedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
  persistMergedRecord(nextRecord);
  return nextRecord;
}

function buildOrderPdfHtml(record: AdminOrderRecord) {
  const rows = record.products
    .map(
      (item) => `
        <tr>
          <td>${item.nestleCode}</td>
          <td>${item.productName}</td>
          <td>${item.quantity}</td>
          <td>${item.taxIncludedAmount.toFixed(2)}</td>
          <td>${item.npsAmount.toFixed(2)}</td>
          <td>${item.taxExcludedAmount.toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${record.orderNo}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
      h1 { font-size: 20px; margin-bottom: 16px; }
      .meta { margin-bottom: 24px; line-height: 1.8; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d9d9d9; padding: 8px 10px; text-align: left; font-size: 12px; }
      th { background: #f5f5f5; }
    </style>
  </head>
  <body>
    <h1>订单预览</h1>
    <div class="meta">
      <div>订单编号：${record.orderNo}</div>
      <div>经销商：${record.dealerCode} / ${record.dealerName}</div>
      <div>订单状态：${record.orderStatus}</div>
      <div>创建时间：${record.createdAt}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>雀巢代码</th>
          <th>产品名称</th>
          <th>数量</th>
          <th>订单金额（含税）</th>
          <th>NPS金额</th>
          <th>未税金额</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
  </html>`;
}

export function previewAdminOrderPdf(record: AdminOrderRecord) {
  if (typeof window === "undefined") {
    return;
  }
  const html = buildOrderPdfHtml(record);
  const previewWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!previewWindow) {
    return;
  }
  previewWindow.document.write(html);
  previewWindow.document.close();
}

export function exportAdminOrderPdf(record: AdminOrderRecord) {
  if (typeof window === "undefined") {
    return;
  }
  const html = buildOrderPdfHtml(record);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${record.orderNo}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAdminOrderList(records: AdminOrderRecord[], fileLabel: string) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      订单编号: item.orderNo,
      订单产品总数: item.orderProductTotalBoxes,
      订单金额含税元: item.orderAmountWithTax,
      NPS金额元: item.npsAmount,
      未税金额元: item.orderAmountWithoutTax,
      经销商编码: item.dealerCode,
      经销商名称: item.dealerName,
      L4: item.l4,
      L5: item.l5,
      L6: item.l6,
      创建时间: item.createdAt,
      创建人: item.createdBy,
      状态变更时间: item.statusChangedAt,
      订单状态: item.orderStatus,
    })),
  );
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "订单列表");
  writeFileXLSX(workbook, `${fileLabel}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function exportSuggestedProducts(products: AdminSuggestedOrderProductItem[], fileLabel: string) {
  const worksheet = utils.json_to_sheet(
    products.map((item) => ({
      雀巢代码: item.nestleCode,
      产品名称: item.productName,
      产品BU: item.productBu,
      建议数量Avg: item.suggestedAvgQuantity,
      订购数量: item.orderQuantity,
      订购原因: item.orderReason ?? "",
      原因详情: item.orderReasonDetail ?? "",
      建议数量Min: item.suggestedMinQuantity,
      建议数量Max: item.suggestedMaxQuantity,
      库存数量: item.stockQuantity,
      销量预估: item.estimatedSales ?? "",
      配额明细: item.quotaDetail,
      促销折扣: item.promoDiscountRate,
    })),
  );
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "建议订单产品");
  writeFileXLSX(workbook, `${fileLabel}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function exportOrderProducts(products: AdminOrderProductItem[], fileLabel: string) {
  const worksheet = utils.json_to_sheet(
    products.map((item) => ({
      雀巢代码: item.nestleCode,
      产品名称: item.productName,
      订购数量: item.quantity,
      订单金额含税: item.taxIncludedAmount,
      NPS金额: item.npsAmount,
      未税金额: item.taxExcludedAmount,
    })),
  );
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "订单产品");
  writeFileXLSX(workbook, `${fileLabel}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}
