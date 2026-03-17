import dayjs from "dayjs";
import { utils, writeFileXLSX } from "xlsx";
import type {
  InterceptionReleaseApplicationRecord,
  InterceptionReleaseApplicationStatus,
} from "../mocks/interceptionReleaseApplication.mock";
import { interceptionReleaseApplicationSeedRecords } from "../mocks/interceptionReleaseApplication.mock";
import { getInventoryInterceptConfigRecords } from "./inventoryInterceptConfig.mock-service";

const STORAGE_KEY = "csl-order-admin-interception-release-application";

export type InterceptionReleaseApplicationFilters = {
  applicationNo?: string;
  businessUnit?: string;
  region?: string;
  cg?: string;
  dealerCode?: string;
  dealerName?: string;
  approvalStatus?: InterceptionReleaseApplicationStatus;
};

export type InterceptionDealerOption = {
  businessUnit: string;
  region: string;
  cg: string;
  dealerCode: string;
  dealerName: string;
  l4: string;
  l5: string;
  l6: string;
  dealerType: "DD" | "DT";
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
    return JSON.parse(raw) as InterceptionReleaseApplicationRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: InterceptionReleaseApplicationRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getMergedRecords() {
  const stored = readStoredRecords();
  const merged = [...interceptionReleaseApplicationSeedRecords];
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

function persistMergedRecord(nextRecord: InterceptionReleaseApplicationRecord) {
  const stored = readStoredRecords();
  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);

  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredRecords(next);
    return;
  }

  const seedIndex = interceptionReleaseApplicationSeedRecords.findIndex((item) => item.id === nextRecord.id);
  if (seedIndex >= 0) {
    persistStoredRecords([...stored, nextRecord]);
    return;
  }

  persistStoredRecords([nextRecord, ...stored]);
}

export async function listInterceptionReleaseApplications(
  filters: InterceptionReleaseApplicationFilters = {},
) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const applicationNo = filters.applicationNo?.trim().toLowerCase();
  const businessUnit = filters.businessUnit?.trim().toLowerCase();
  const region = filters.region?.trim().toLowerCase();
  const cg = filters.cg?.trim().toLowerCase();
  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const dealerName = filters.dealerName?.trim().toLowerCase();
  const approvalStatus = filters.approvalStatus;

  return getMergedRecords().filter((item) => {
    const matchesApplicationNo = !applicationNo || item.applicationNo.toLowerCase().includes(applicationNo);
    const matchesBusinessUnit = !businessUnit || item.businessUnit.toLowerCase().includes(businessUnit);
    const matchesRegion = !region || item.region.toLowerCase().includes(region);
    const matchesCg = !cg || item.cg.toLowerCase().includes(cg);
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesDealerName = !dealerName || item.dealerName.toLowerCase().includes(dealerName);
    const matchesApprovalStatus = !approvalStatus || item.approvalStatus === approvalStatus;
    return (
      matchesApplicationNo &&
      matchesBusinessUnit &&
      matchesRegion &&
      matchesCg &&
      matchesDealerCode &&
      matchesDealerName &&
      matchesApprovalStatus
    );
  });
}

export function getInterceptionReleaseApplicationById(id: string) {
  return getMergedRecords().find((item) => item.id === id) ?? null;
}

export function listInterceptEligibleDealers() {
  const map = new Map<string, InterceptionDealerOption>();
  getInventoryInterceptConfigRecords().forEach((item) => {
    const key = `${item.businessUnit}-${item.dealerCode}`;
    if (!map.has(key)) {
      map.set(key, {
        businessUnit: item.businessUnit,
        region: item.region,
        cg: item.cg,
        dealerCode: item.dealerCode,
        dealerName: item.dealerName,
        l4: item.businessUnit === "OMNI" ? "L4-A" : "L4-B",
        l5: item.businessUnit === "OMNI" ? "L5-A" : "L5-B",
        l6: item.businessUnit === "OMNI" ? "L6-A" : "L6-B",
        dealerType: item.businessUnit === "OMNI" ? "DT" : "DD",
      });
    }
  });
  return Array.from(map.values());
}

export function listInterceptProductOptionsByDealer(dealerCode: string) {
  return getInventoryInterceptConfigRecords()
    .filter((item) => item.dealerCode === dealerCode)
    .map((item) => ({
      id: item.id,
      shipToCode: item.shipToCode,
      shipToName: item.shipToName,
      shape2: item.shape2,
      productCode: item.productCode,
      productName: item.productName,
      label: `${item.shape2} / ${item.productCode} / ${item.productName}`,
    }));
}

export function createInterceptionReleaseApplication(payload: {
  businessUnit: string;
  region: string;
  cg: string;
  dealerCode: string;
  dealerName: string;
  l4: string;
  l5: string;
  l6: string;
  dealerType: "DD" | "DT";
  applyReason: string;
  attachmentName?: string;
  products: Array<{
    shipToCode: string;
    shipToName: string;
    shape2: string;
    productCode: string;
    productName: string;
  }>;
}) {
  const nextRecord: InterceptionReleaseApplicationRecord = {
    id: `interception-release-${Date.now()}`,
    applicationNo: `JRJ${dayjs().format("YYYYMMDDHHmmss")}`,
    businessUnit: payload.businessUnit,
    region: payload.region,
    cg: payload.cg,
    dealerCode: payload.dealerCode,
    dealerName: payload.dealerName,
    l4: payload.l4,
    l5: payload.l5,
    l6: payload.l6,
    dealerType: payload.dealerType,
    applyReason: payload.applyReason,
    attachmentName: payload.attachmentName,
    approvalStatus: "待审批",
    approvalNode: "平台审批节点",
    appliedAt: dayjs().format("YYYY-MM-DD HH:mm"),
    products: payload.products.map((item, index) => ({
      id: `interception-release-item-${Date.now()}-${index}`,
      ...item,
    })),
  };

  persistMergedRecord(nextRecord);
  return nextRecord;
}

export function exportInterceptionReleaseApplications(records: InterceptionReleaseApplicationRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      申请单号: item.applicationNo,
      业务单元: item.businessUnit,
      大区: item.region,
      CG: item.cg,
      经销商编码: item.dealerCode,
      经销商名称: item.dealerName,
      申请原因: item.applyReason,
      审批状态: item.approvalStatus,
      审批节点: item.approvalNode,
      申请时间: item.appliedAt,
    })),
  );
  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 28 },
    { wch: 24 },
    { wch: 12 },
    { wch: 18 },
    { wch: 20 },
  ];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "解除拦截申请");
  writeFileXLSX(workbook, `解除拦截申请_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}
