import dayjs from "dayjs";
import { read, utils, writeFileXLSX } from "xlsx";
import type { SoldToRecord, SoldToStatus } from "../mocks/soldTo.mock";
import { soldToSeedRecords } from "../mocks/soldTo.mock";

const STORAGE_KEY = "csl-order-admin-sold-to-list";

export type SoldToFilters = {
  businessUnit?: string;
  region?: string;
  cg?: string;
  dealerCode?: string;
  dealerName?: string;
  status?: SoldToStatus;
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
    return JSON.parse(raw) as SoldToRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: SoldToRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getMergedRecords() {
  const stored = readStoredRecords();
  const merged = [...soldToSeedRecords];

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

function persistMergedRecord(nextRecord: SoldToRecord) {
  const stored = readStoredRecords();
  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);

  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredRecords(next);
    return;
  }

  const seedIndex = soldToSeedRecords.findIndex((item) => item.id === nextRecord.id);
  if (seedIndex >= 0) {
    persistStoredRecords([...stored, nextRecord]);
    return;
  }

  persistStoredRecords([nextRecord, ...stored]);
}

export async function listSoldToRecords(filters: SoldToFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 160));
  const businessUnit = filters.businessUnit?.trim().toLowerCase();
  const region = filters.region?.trim().toLowerCase();
  const cg = filters.cg?.trim().toLowerCase();
  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const dealerName = filters.dealerName?.trim().toLowerCase();
  const status = filters.status;

  return getMergedRecords().filter((item) => {
    const matchesBusinessUnit = !businessUnit || item.businessUnit.toLowerCase().includes(businessUnit);
    const matchesRegion = !region || item.region.toLowerCase().includes(region);
    const matchesCg = !cg || item.cg.toLowerCase().includes(cg);
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesDealerName = !dealerName || item.dealerName.toLowerCase().includes(dealerName);
    const matchesStatus = !status || item.status === status;
    return matchesBusinessUnit && matchesRegion && matchesCg && matchesDealerCode && matchesDealerName && matchesStatus;
  });
}

export function exportSoldToRecords(records: SoldToRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      业务单元: item.businessUnit,
      大区: item.region,
      CG: item.cg,
      经销商编码: item.dealerCode,
      经销商名称: item.dealerName,
      状态: item.status,
      创建时间: item.createdAt,
    })),
  );
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 30 },
    { wch: 10 },
    { wch: 20 },
  ];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "SoldTo列表");
  writeFileXLSX(workbook, `SoldTo列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

function downloadTemplate(fileName: string, sampleStatus: "启用" | "停用") {
  const templateSheet = utils.json_to_sheet([
    {
      业务单元: "OMNI",
      大区: "华东大区",
      CG: "上海",
      经销商编码: "D1917070",
      经销商名称: "辽宁嘉丰进出口贸易有限公司",
      状态: sampleStatus,
    },
  ]);
  templateSheet["!cols"] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 30 },
    { wch: 10 },
  ];

  const instructionSheet = utils.aoa_to_sheet([
    ["导入说明"],
    [],
    ["字段名", "是否必填", "说明"],
    ["业务单元", "是", "例如 OMNI、NIN"],
    ["大区", "是", "例如 华东大区"],
    ["CG", "是", "例如 上海"],
    ["经销商编码", "是", "用于识别经销商"],
    ["经销商名称", "是", "需与经销商编码对应"],
    ["状态", "否", "导入新增默认启用；导入停用默认停用"],
  ]);
  instructionSheet["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 42 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, templateSheet, "导入模板");
  utils.book_append_sheet(workbook, instructionSheet, "导入说明");
  writeFileXLSX(workbook, fileName);
}

export function downloadSoldToCreateTemplate() {
  downloadTemplate("SoldTo导入新增模板.xlsx", "启用");
}

export function downloadSoldToDisableTemplate() {
  downloadTemplate("SoldTo导入停用模板.xlsx", "停用");
}

export async function importSoldToRecords(file: File, mode: "create" | "disable") {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<Record<string, string>>(worksheet, { defval: "" });
  const merged = getMergedRecords();
  let successCount = 0;
  let skippedCount = 0;

  rows.forEach((row, index) => {
    const businessUnit = String(row["业务单元"] ?? "").trim();
    const region = String(row["大区"] ?? "").trim();
    const cg = String(row["CG"] ?? "").trim();
    const dealerCode = String(row["经销商编码"] ?? "").trim();
    const dealerName = String(row["经销商名称"] ?? "").trim();

    if (!businessUnit || !region || !cg || !dealerCode || !dealerName) {
      skippedCount += 1;
      return;
    }

    const existing = merged.find((item) => item.dealerCode === dealerCode && item.businessUnit === businessUnit);
    const now = dayjs().format("YYYY-MM-DD HH:mm");

    persistMergedRecord({
      id: existing?.id ?? `soldto-import-${Date.now()}-${index}`,
      businessUnit,
      region,
      cg,
      dealerCode,
      dealerName,
      status: mode === "disable" ? "停用" : "启用",
      createdAt: existing?.createdAt ?? now,
    });
    successCount += 1;
  });

  return { successCount, skippedCount };
}
