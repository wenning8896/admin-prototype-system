import dayjs from "dayjs";
import type { SuggestionOrderFlowItem, SuggestionOrderRecord, SuggestionOrderStatus } from "../mocks/suggestionOrder.mock";
import { suggestionOrderSeedRecords } from "../mocks/suggestionOrder.mock";

const STORAGE_KEY = "csl-order-admin-suggestion-orders";

export type SuggestionOrderFilters = {
  orderNo?: string;
  businessUnit?: string;
  region?: string;
  cg?: string;
  dealerCode?: string;
  dealerName?: string;
  shipToCode?: string;
  shipToName?: string;
  approvalNode?: string;
  orderStatus?: SuggestionOrderStatus;
  isOrderDay?: "是" | "否";
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
    return JSON.parse(raw) as SuggestionOrderRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: SuggestionOrderRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getMergedRecords() {
  const stored = readStoredRecords();
  const merged = [...suggestionOrderSeedRecords];

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

function persistMergedRecord(nextRecord: SuggestionOrderRecord) {
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

function appendFlowRecord(record: SuggestionOrderRecord, flow: SuggestionOrderFlowItem) {
  return {
    ...record,
    updatedAt: flow.operatedAt,
    flowRecords: [...record.flowRecords, flow],
  };
}

export async function listSuggestionOrders(filters: SuggestionOrderFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));

  const orderNo = filters.orderNo?.trim().toLowerCase();
  const businessUnit = filters.businessUnit?.trim().toLowerCase();
  const region = filters.region?.trim().toLowerCase();
  const cg = filters.cg?.trim().toLowerCase();
  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const dealerName = filters.dealerName?.trim().toLowerCase();
  const shipToCode = filters.shipToCode?.trim().toLowerCase();
  const shipToName = filters.shipToName?.trim().toLowerCase();
  const approvalNode = filters.approvalNode?.trim().toLowerCase();

  return getMergedRecords().filter((item) => {
    const matchesOrderNo = !orderNo || item.orderNo.toLowerCase().includes(orderNo);
    const matchesBusinessUnit = !businessUnit || item.businessUnit.toLowerCase().includes(businessUnit);
    const matchesRegion = !region || item.region.toLowerCase().includes(region);
    const matchesCg = !cg || item.cg.toLowerCase().includes(cg);
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesDealerName = !dealerName || item.dealerName.toLowerCase().includes(dealerName);
    const matchesShipToCode = !shipToCode || item.shipToCode.toLowerCase().includes(shipToCode);
    const matchesShipToName = !shipToName || item.shipToName.toLowerCase().includes(shipToName);
    const matchesApprovalNode = !approvalNode || item.approvalNode.toLowerCase().includes(approvalNode);
    const matchesStatus = !filters.orderStatus || item.orderStatus === filters.orderStatus;
    const matchesOrderDay = !filters.isOrderDay || item.isOrderDay === filters.isOrderDay;

    return (
      matchesOrderNo &&
      matchesBusinessUnit &&
      matchesRegion &&
      matchesCg &&
      matchesDealerCode &&
      matchesDealerName &&
      matchesShipToCode &&
      matchesShipToName &&
      matchesApprovalNode &&
      matchesStatus &&
      matchesOrderDay
    );
  });
}

export function getSuggestionOrderById(id: string) {
  return getMergedRecords().find((item) => item.id === id) ?? null;
}

export function reviewSuggestionOrder(params: {
  id: string;
  action: "approve" | "reject";
  remark: string;
  reviewerAccount: string;
  reviewerName: string;
}) {
  const target = getSuggestionOrderById(params.id);
  if (!target) {
    throw new Error("未找到建议订单记录");
  }

  const operatedAt = dayjs().format("YYYY-MM-DD HH:mm");
  const next = appendFlowRecord(target, {
    id: `${target.id}-${Date.now()}`,
    nodeName: target.approvalNode,
    decision: params.action === "approve" ? "审批通过" : "审批驳回",
    operatorName: params.reviewerName,
    account: params.reviewerAccount,
    role: "管理员",
    operatedAt,
    remark: params.remark,
  });

  const nextRecord: SuggestionOrderRecord = {
    ...next,
    orderStatus: params.action === "approve" ? "审批通过" : "审批驳回",
    approvalNode: params.action === "approve" ? "审批完成" : "-",
  };

  persistMergedRecord(nextRecord);
  return nextRecord;
}

export function quickApproveSuggestionOrder(params: {
  id: string;
  remark: string;
  reviewerAccount: string;
  reviewerName: string;
}) {
  return reviewSuggestionOrder({
    ...params,
    action: "approve",
  });
}

export function revokeSuggestionOrder(params: {
  id: string;
  remark: string;
  reviewerAccount: string;
  reviewerName: string;
}) {
  const target = getSuggestionOrderById(params.id);
  if (!target) {
    throw new Error("未找到建议订单记录");
  }

  const operatedAt = dayjs().format("YYYY-MM-DD HH:mm");
  const nextRecord: SuggestionOrderRecord = {
    ...appendFlowRecord(target, {
      id: `${target.id}-${Date.now()}`,
      nodeName: "经销商撤销",
      decision: "一键撤销",
      operatorName: params.reviewerName,
      account: params.reviewerAccount,
      role: "管理员",
      operatedAt,
      remark: params.remark,
    }),
    orderStatus: "已撤销",
    approvalNode: "-",
  };

  persistMergedRecord(nextRecord);
  return nextRecord;
}

export function hasSuggestionOrderReviewedByAccount(record: SuggestionOrderRecord, account?: string) {
  if (!account) {
    return false;
  }

  return record.flowRecords.some(
    (item) => item.account === account && (item.decision === "审批通过" || item.decision === "审批驳回"),
  );
}
