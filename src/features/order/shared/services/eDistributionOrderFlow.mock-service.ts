import dayjs from "dayjs";
import {
  createOrderApprovalNodes,
  eDistributionOrderSeedRecords,
  type EDistributionOrderRecord,
  type EDistributionOrderStatus,
  type OrderFulfillmentItem,
  type OrderApprovalHistory,
  type OrderProductItem,
  type ProductHealthType,
} from "../mocks/eDistributionOrderFlow.mock";

const STORAGE_KEY = "csl-order-e-distribution-order-flow";

export type CreateOrderPayload = {
  platformCode: string;
  platformName: string;
  distributorName: string;
  distributorCode: string;
  serviceProviderName: string;
  serviceProviderCode: string;
  products: Array<{
    productCode: string;
    productName: string;
    healthType: ProductHealthType;
    unitPrice: number;
    quantity: number;
  }>;
  consigneeId?: string;
  consigneeName: string;
  consigneePhone: string;
  consigneeProvince: string;
  consigneeCity: string;
  consigneeDistrict: string;
  consigneeAddress: string;
  consigneePostalCode: string;
  paymentProof: string;
  account: string;
  actorName: string;
};

type ReviewOrderPayload = {
  id: string;
  decision: "approve" | "reject";
  remark: string;
  account: string;
  actorName: string;
};

type ShipOrderPayload = {
  id: string;
  shipmentType: "full" | "partial";
  remark: string;
  account: string;
  actorName: string;
};

type CancelOrderPayload = {
  id: string;
  remark: string;
  account: string;
  actorName: string;
};

type ReviewCancelPayload = {
  id: string;
  decision: "approve" | "reject";
  remark: string;
  account: string;
  actorName: string;
};

type SubmitReceiptPayload = {
  id: string;
  receiptDetails: string;
  receiptDocumentNo: string;
  remark: string;
  account: string;
  actorName: string;
};

type ReceiptComparisonResult = {
  isAbnormal: boolean;
  shipmentDetails: OrderFulfillmentItem[];
  receivingDetails: OrderFulfillmentItem[];
};

function readStoredRecords() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as EDistributionOrderRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistRecords(records: EDistributionOrderRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getMergedRecords() {
  const merged = [...eDistributionOrderSeedRecords];
  const stored = readStoredRecords();

  stored.forEach((item) => {
    const index = merged.findIndex((record) => record.id === item.id);
    if (index >= 0) {
      merged[index] = item;
      return;
    }

    merged.unshift(item);
  });

  return merged.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
}

function appendHistory(
  record: EDistributionOrderRecord,
  history: Omit<OrderApprovalHistory, "id" | "operatedAt">,
): EDistributionOrderRecord {
  return {
    ...record,
    approvalHistory: [
      ...record.approvalHistory,
      {
        ...history,
        id: `${record.id}-${Date.now()}-${record.approvalHistory.length + 1}`,
        operatedAt: dayjs().format("YYYY-MM-DD HH:mm"),
      },
    ],
  };
}

function upsertRecord(nextRecord: EDistributionOrderRecord) {
  const stored = readStoredRecords();
  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);

  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistRecords(next);
    return;
  }

  const seedIndex = eDistributionOrderSeedRecords.findIndex((item) => item.id === nextRecord.id);

  if (seedIndex >= 0) {
    persistRecords([...stored, nextRecord]);
    return;
  }

  persistRecords([nextRecord, ...stored]);
}

function getNextOrderNo(records: EDistributionOrderRecord[]) {
  const today = dayjs().format("YYYYMMDD");
  const maxIndex = records.reduce((max, item) => {
    const matched = item.orderNo.match(new RegExp(`EOD${today}(\\d{3})`));
    const next = matched ? Number(matched[1]) : 0;
    return Math.max(max, next);
  }, 0);

  return `EOD${today}${String(maxIndex + 1).padStart(3, "0")}`;
}

function buildProductsSummary(products: OrderProductItem[]) {
  if (products.length === 0) {
    return "-";
  }

  if (products.length === 1) {
    return `${products[0].productName}（${products[0].healthType}）`;
  }

  return `${products[0].productName} 等 ${products.length} 件商品`;
}

function toOrderItems(
  products: CreateOrderPayload["products"],
  recordId: string,
): OrderProductItem[] {
  return products.map((item, index) => ({
    id: `${recordId}-item-${index + 1}`,
    productCode: item.productCode,
    productName: item.productName,
    healthType: item.healthType,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    amount: Number((item.unitPrice * item.quantity).toFixed(2)),
  }));
}

function buildFulfillmentDetails(products: OrderProductItem[], recordId: string, type: "shipment" | "receipt"): OrderFulfillmentItem[] {
  return products.map((item, index) => ({
    id: `${recordId}-${type}-${index + 1}`,
    productCode: item.productCode,
    productName: item.productName,
    healthType: item.healthType,
    batchNo: `${item.productCode.replace(/[^A-Z0-9]/g, "")}${dayjs().format("YYMMDD")}${String(index + 1).padStart(2, "0")}`,
    quantity: item.quantity,
  }));
}

function buildReceiptDraftDetails(current: EDistributionOrderRecord, remark: string) {
  const baseDetails = current.shipmentDetails?.length
    ? current.shipmentDetails.map((item, index) => ({
        ...item,
        id: `${current.id}-receipt-${index + 1}`,
        abnormalReason: undefined,
      }))
    : buildFulfillmentDetails(current.products, current.id, "receipt");

  const normalizedRemark = remark.trim();

  if (baseDetails.length === 0 || !normalizedRemark) {
    return baseDetails;
  }

  const firstItem = baseDetails[0];

  if (normalizedRemark.includes("商品差异")) {
    baseDetails[0] = {
      ...firstItem,
      productCode: `${firstItem.productCode}-ALT`,
      productName: `${firstItem.productName}（替代）`,
    };
  }

  if (normalizedRemark.includes("批次差异")) {
    baseDetails[0] = {
      ...baseDetails[0],
      batchNo: `${firstItem.batchNo}-ALT`,
    };
  }

  if (normalizedRemark.includes("数量差异")) {
    baseDetails[0] = {
      ...baseDetails[0],
      quantity: Math.max(firstItem.quantity - 2, 0),
    };
  }

  return baseDetails;
}

function compareReceiptDetails(
  shipmentDetails: OrderFulfillmentItem[],
  receivingDetails: OrderFulfillmentItem[],
): ReceiptComparisonResult {
  const shipmentByCode = new Map(shipmentDetails.map((item) => [item.productCode, item]));

  const nextShipmentDetails: OrderFulfillmentItem[] = shipmentDetails.map((item) => ({
    ...item,
    abnormalReason: undefined,
  }));
  const nextReceivingDetails: OrderFulfillmentItem[] = receivingDetails.map((item) => ({
    ...item,
    abnormalReason: undefined,
  }));

  let isAbnormal = false;

  nextReceivingDetails.forEach((receivingItem) => {
    const shipmentItem = shipmentByCode.get(receivingItem.productCode);
    const reasons: string[] = [];

    if (!shipmentItem) {
      reasons.push("收货商品异常");
    } else {
      if (receivingItem.batchNo !== shipmentItem.batchNo) {
        reasons.push("收货批次异常");
      }
      if (receivingItem.quantity !== shipmentItem.quantity) {
        reasons.push("收货数量异常");
      }
    }

    if (reasons.length > 0) {
      isAbnormal = true;
      const mergedReason = Array.from(new Set(reasons)).join("；");
      receivingItem.abnormalReason = mergedReason;

      const shipmentIndex = shipmentItem
        ? nextShipmentDetails.findIndex((item) => item.productCode === shipmentItem.productCode)
        : -1;

      if (shipmentIndex >= 0) {
        nextShipmentDetails[shipmentIndex] = {
          ...nextShipmentDetails[shipmentIndex],
          abnormalReason: mergedReason,
        };
      }
    }
  });

  return {
    isAbnormal,
    shipmentDetails: nextShipmentDetails,
    receivingDetails: nextReceivingDetails,
  };
}

export async function listEDistributionOrders() {
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  return getMergedRecords();
}

export async function getEDistributionOrderById(id: string) {
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  return getMergedRecords().find((item) => item.id === id) ?? null;
}

export async function createEDistributionOrder(payload: CreateOrderPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 300));
  const records = getMergedRecords();
  const id = `ed-order-${Date.now()}`;
  const products = toOrderItems(payload.products, id);
  const totalQuantity = products.reduce((total, item) => total + item.quantity, 0);
  const orderAmount = Number(products.reduce((total, item) => total + item.amount, 0).toFixed(2));
  const nextRecord: EDistributionOrderRecord = {
    id,
    orderNo: getNextOrderNo(records),
    platformCode: payload.platformCode,
    platformName: payload.platformName,
    distributorName: payload.distributorName,
    distributorCode: payload.distributorCode,
    serviceProviderName: payload.serviceProviderName,
    serviceProviderCode: payload.serviceProviderCode,
    productSummary: buildProductsSummary(products),
    totalQuantity,
    orderAmount,
    products,
    consigneeId: payload.consigneeId,
    consigneeName: payload.consigneeName,
    consigneePhone: payload.consigneePhone,
    consigneeProvince: payload.consigneeProvince,
    consigneeCity: payload.consigneeCity,
    consigneeDistrict: payload.consigneeDistrict,
    consigneeAddress: payload.consigneeAddress,
    consigneePostalCode: payload.consigneePostalCode,
    paymentProof: payload.paymentProof,
    createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
    status: "待审批",
    currentApprovalType: "新建订单",
    currentApprovalNode: createOrderApprovalNodes[0],
    approvalStep: 1,
    approvalHistory: [
      {
        id: `${id}-history-1`,
        type: "新建订单",
        nodeName: "分销商提交订单",
        role: "分销商",
        account: payload.account,
        actorName: payload.actorName,
        decision: "提交",
        remark: "新建订单已提交审批。",
        operatedAt: dayjs().format("YYYY-MM-DD HH:mm"),
      },
    ],
  };

  upsertRecord(nextRecord);
  return nextRecord;
}

export async function reviewEDistributionOrder(payload: ReviewOrderPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 260));
  const current = await getEDistributionOrderById(payload.id);

  if (!current || !current.currentApprovalType || !current.currentApprovalNode) {
    throw new Error("当前订单没有待审批节点。");
  }

  let nextRecord = appendHistory(current, {
    type: current.currentApprovalType,
    nodeName: current.currentApprovalNode,
    role: "管理员",
    account: payload.account,
    actorName: payload.actorName,
    decision: payload.decision === "approve" ? "审批通过" : "审批驳回",
    remark: payload.remark,
  });

  if (current.currentApprovalType === "新建订单") {
    if (payload.decision === "reject") {
      nextRecord = {
        ...nextRecord,
        status: "已取消",
        currentApprovalType: undefined,
        currentApprovalNode: undefined,
        approvalStep: undefined,
        cancelReason: payload.remark,
      };
    } else {
      const nextStep = (current.approvalStep ?? 1) + 1;
      const nextNode = createOrderApprovalNodes[nextStep - 1];

      nextRecord = {
        ...nextRecord,
        status: nextNode ? "待审批" : "待发货",
        currentApprovalType: nextNode ? "新建订单" : undefined,
        currentApprovalNode: nextNode,
        approvalStep: nextNode ? nextStep : undefined,
      };
    }
  } else {
    nextRecord = {
      ...nextRecord,
      status: payload.decision === "approve" ? "已取消" : "待发货",
      currentApprovalType: undefined,
      currentApprovalNode: undefined,
      approvalStep: undefined,
    };
  }

  upsertRecord(nextRecord);
  return nextRecord;
}

export async function requestOrderCancellation(payload: CancelOrderPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  const current = await getEDistributionOrderById(payload.id);

  if (!current || current.status !== "待发货") {
    throw new Error("当前订单不能发起取消。");
  }

  const nextRecord = appendHistory(
    {
      ...current,
      status: "取消确认中",
      cancelReason: payload.remark,
    },
    {
      type: "取消订单",
      nodeName: "服务商申请取消",
      role: "服务商",
      account: payload.account,
      actorName: payload.actorName,
      decision: "提交",
      remark: payload.remark,
    },
  );

  upsertRecord(nextRecord);
  return nextRecord;
}

export async function confirmOrderCancellation(payload: CancelOrderPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  const current = await getEDistributionOrderById(payload.id);

  if (!current || current.status !== "取消确认中") {
    throw new Error("当前订单不在取消确认阶段。");
  }

  const nextRecord = appendHistory(
    {
      ...current,
      status: "取消待审批",
      currentApprovalType: "取消订单",
      currentApprovalNode: "取消订单审批",
      approvalStep: 1,
    },
    {
      type: "取消订单",
      nodeName: "分销商确认取消",
      role: "分销商",
      account: payload.account,
      actorName: payload.actorName,
      decision: "确认取消",
      remark: payload.remark,
    },
  );

  upsertRecord(nextRecord);
  return nextRecord;
}

export async function reviewDistributorCancellation(payload: ReviewCancelPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  const current = await getEDistributionOrderById(payload.id);

  if (!current || current.status !== "取消确认中") {
    throw new Error("当前订单不在取消确认阶段。");
  }

  if (payload.decision === "approve") {
    return confirmOrderCancellation({
      id: payload.id,
      remark: payload.remark,
      account: payload.account,
      actorName: payload.actorName,
    });
  }

  const nextRecord = appendHistory(
    {
      ...current,
      status: "待发货",
      cancelReason: undefined,
    },
    {
      type: "取消订单",
      nodeName: "分销商取消审批",
      role: "分销商",
      account: payload.account,
      actorName: payload.actorName,
      decision: "审批驳回",
      remark: payload.remark,
    },
  );

  upsertRecord(nextRecord);
  return nextRecord;
}

export async function shipEDistributionOrder(payload: ShipOrderPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  const current = await getEDistributionOrderById(payload.id);

  if (!current || current.status !== "待发货") {
    throw new Error("当前订单不能发货。");
  }

  const nextRecord = appendHistory(
    {
      ...current,
      status: payload.shipmentType === "full" ? "待收货" : "待发货",
      shipmentNo: payload.shipmentType === "partial" ? "部分发货（第三方同步）" : "全部发货完成",
      shippedAt: dayjs().format("YYYY-MM-DD HH:mm"),
      shipmentDetails: buildFulfillmentDetails(current.products, current.id, "shipment"),
    },
    {
      type: "新建订单",
      nodeName: "服务商发货",
      role: "服务商",
      account: payload.account,
      actorName: payload.actorName,
      decision: "发货完成",
      remark: payload.remark,
    },
  );

  upsertRecord(nextRecord);
  return nextRecord;
}

export async function submitOrderReceipt(payload: SubmitReceiptPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  const current = await getEDistributionOrderById(payload.id);

  if (!current || (current.status !== "待收货" && current.status !== "收货待重新提交")) {
    throw new Error("当前订单不能提交收货。");
  }

  const draftReceivingDetails = buildReceiptDraftDetails(current, payload.remark);
  const comparison = compareReceiptDetails(current.shipmentDetails ?? [], draftReceivingDetails);

  const nextRecord = appendHistory(
    {
      ...current,
      status: comparison.isAbnormal ? "收货异常待确认" : "收货待确认",
      isAbnormal: comparison.isAbnormal,
      shipmentDetails: comparison.shipmentDetails,
      receivingDetails: comparison.receivingDetails,
      receipt: {
        receiptDetails: payload.receiptDetails,
        receiptDocumentNo: payload.receiptDocumentNo,
        submittedAt: dayjs().format("YYYY-MM-DD HH:mm"),
      },
    },
    {
      type: "新建订单",
      nodeName: "分销商提交收货",
      role: "分销商",
      account: payload.account,
      actorName: payload.actorName,
      decision: "提交收货",
      remark: payload.remark,
    },
  );

  upsertRecord(nextRecord);
  return nextRecord;
}

export async function reviewOrderReceipt(payload: ReviewOrderPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  const current = await getEDistributionOrderById(payload.id);

  if (!current || current.status !== "收货待确认") {
    throw new Error("当前订单不在待收货确认状态。");
  }

  const nextStatus: EDistributionOrderStatus = payload.decision === "approve" ? "已完成" : "收货待重新提交";
  const nextRecord = appendHistory(
    {
      ...current,
      status: nextStatus,
    },
    {
      type: "新建订单",
      nodeName: "服务商确认收货",
      role: "服务商",
      account: payload.account,
      actorName: payload.actorName,
      decision: payload.decision === "approve" ? "确认收货" : "驳回收货",
      remark: payload.remark,
    },
  );

  upsertRecord(nextRecord);
  return nextRecord;
}

export async function reviewAbnormalOrderReceipt(payload: ReviewOrderPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  const current = await getEDistributionOrderById(payload.id);

  if (!current || current.status !== "收货异常待确认") {
    throw new Error("当前订单不在待异常确认状态。");
  }

  const nextStatus: EDistributionOrderStatus = payload.decision === "approve" ? "已完成" : "收货待重新提交";
  const nextRecord = appendHistory(
    {
      ...current,
      status: nextStatus,
    },
    {
      type: "新建订单",
      nodeName: "管理端异常确认",
      role: "管理员",
      account: payload.account,
      actorName: payload.actorName,
      decision: payload.decision === "approve" ? "确认收货" : "驳回收货",
      remark: payload.remark,
    },
  );

  upsertRecord(nextRecord);
  return nextRecord;
}

export const platformOptions = [
  { value: "PLAT-001", label: "京东" },
  { value: "PLAT-002", label: "淘宝" },
  { value: "PLAT-003", label: "天猫" },
  { value: "PLAT-004", label: "拼多多" },
];

export const serviceProviderReference = [
  { value: "SP-001", label: "华东履约服务商" },
  { value: "SP-002", label: "华南仓配服务商" },
  { value: "SP-003", label: "西南区域服务商" },
];

export const distributorServiceProviderMap: Record<string, { distributorName: string; distributorCode: string; serviceProviderCode: string; serviceProviderName: string }> = {
  distributor: {
    distributorName: "苏州云启渠道有限公司",
    distributorCode: "EDS240305",
    serviceProviderCode: "SP-001",
    serviceProviderName: "华东履约服务商",
  },
  "13856217890": {
    distributorName: "上海联享分销有限公司",
    distributorCode: "EDS240301",
    serviceProviderCode: "SP-001",
    serviceProviderName: "华东履约服务商",
  },
};

export const orderProductOptions = [
  {
    value: "SKU-10001",
    label: "金装奶品 250ml",
    prices: {
      好货: 22.2,
      过半: 20.4,
      过三: 19.2,
    } as Record<ProductHealthType, number>,
  },
  {
    value: "SKU-10002",
    label: "即饮咖啡 300ml",
    prices: {
      好货: 22.2,
      过半: 19.5,
      过三: 18.8,
    } as Record<ProductHealthType, number>,
  },
  {
    value: "SKU-10003",
    label: "经典 RTD 饮品",
    prices: {
      好货: 19.6,
      过半: 18.7,
      过三: 20.2,
    } as Record<ProductHealthType, number>,
  },
];
