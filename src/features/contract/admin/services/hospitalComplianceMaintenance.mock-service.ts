import dayjs from "dayjs";
import { read, utils, writeFileXLSX } from "xlsx";
import { listHospitalContracts } from "../../shared/services/hospitalContract.mock-service";

const STORAGE_KEY = "csl-contract-admin-hospital-compliance-maintenance";

export type HospitalComplianceRecord = {
  id: string;
  etmsId: string;
  createdAt: string;
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
    return JSON.parse(raw) as HospitalComplianceRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: HospitalComplianceRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

async function buildSeedRecords() {
  const contracts = await listHospitalContracts();
  const uniqueEtmsIds = Array.from(new Set(contracts.map((item) => item.useProductEtmsId).filter(Boolean)));
  return uniqueEtmsIds.map((etmsId, index) => ({
    id: `compliance-seed-${index + 1}`,
    etmsId,
    createdAt: dayjs().subtract(index, "day").format("YYYY-MM-DD HH:mm"),
  }));
}

async function getRecords() {
  const stored = readStoredRecords();
  if (stored.length > 0) {
    return stored;
  }

  const seeds = await buildSeedRecords();
  persistStoredRecords(seeds);
  return seeds;
}

export async function listHospitalComplianceRecords() {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  return getRecords();
}

export function exportHospitalComplianceRecords(records: HospitalComplianceRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      "使用产品医院ETMS-ID": item.etmsId,
      创建时间: item.createdAt,
    })),
  );
  worksheet["!cols"] = [{ wch: 24 }, { wch: 20 }];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "医院合规维护");
  writeFileXLSX(workbook, `医院合规维护_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function downloadHospitalComplianceTemplate() {
  const templateSheet = utils.json_to_sheet([
    {
      "使用产品医院ETMS-ID": "ETMS-U-001",
    },
  ]);
  templateSheet["!cols"] = [{ wch: 24 }];

  const instructionSheet = utils.aoa_to_sheet([
    ["医院合规维护导入说明"],
    [],
    ["字段名", "是否必填", "说明"],
    ["使用产品医院ETMS-ID", "是", "按该字段新增医院合规记录；已存在则跳过"],
  ]);
  instructionSheet["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 48 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, templateSheet, "导入模板");
  utils.book_append_sheet(workbook, instructionSheet, "导入说明");
  writeFileXLSX(workbook, "医院合规维护导入模板.xlsx");
}

export async function importHospitalComplianceRecords(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<Record<string, string>>(worksheet, { defval: "" });
  const records = await getRecords();
  const recordMap = new Map(records.map((item) => [item.etmsId, item]));
  let successCount = 0;
  let skippedCount = 0;

  rows.forEach((row) => {
    const etmsId = String(row["使用产品医院ETMS-ID"] ?? "").trim();
    if (!etmsId || recordMap.has(etmsId)) {
      skippedCount += 1;
      return;
    }

    recordMap.set(etmsId, {
      id: `compliance-${Date.now()}-${successCount + 1}`,
      etmsId,
      createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
    });
    successCount += 1;
  });

  persistStoredRecords(Array.from(recordMap.values()));
  return { successCount, skippedCount };
}

export async function batchDeleteHospitalComplianceRecords(ids: string[]) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const records = await getRecords();
  const next = records.filter((item) => !ids.includes(item.id));
  persistStoredRecords(next);
  return `${ids.length} 条记录已删除。`;
}
