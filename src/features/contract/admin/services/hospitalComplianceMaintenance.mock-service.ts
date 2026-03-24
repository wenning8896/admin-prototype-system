import dayjs from "dayjs";
import { read, utils, writeFileXLSX } from "xlsx";
import { listHospitalContracts } from "../../shared/services/hospitalContract.mock-service";

const STORAGE_KEY = "csl-contract-admin-hospital-compliance-maintenance";

export type HospitalComplianceRecord = {
  id: string;
  etmsId: string;
  medicalInstitutionName: string;
  tags: string;
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
    medicalInstitutionName: contracts.find((item) => item.useProductEtmsId === etmsId)?.dmsHospitalName ?? `医疗机构${index + 1}`,
    tags: index % 2 === 0 ? "重点医院,需合规关注" : "常规维护",
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
      医疗机构名称: item.medicalInstitutionName,
      标签: item.tags,
      创建时间: item.createdAt,
    })),
  );
  worksheet["!cols"] = [{ wch: 24 }, { wch: 28 }, { wch: 28 }, { wch: 20 }];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "医院合规维护");
  writeFileXLSX(workbook, `医院合规维护_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function downloadHospitalComplianceTemplate() {
  const templateSheet = utils.json_to_sheet([
    {
      "使用产品医院ETMS-ID": "ETMS-U-001",
      医疗机构名称: "上海第一人民医院",
      标签: "重点医院,需合规关注",
    },
  ]);
  templateSheet["!cols"] = [{ wch: 24 }, { wch: 28 }, { wch: 28 }];

  const instructionSheet = utils.aoa_to_sheet([
    ["医院合规维护导入说明"],
    [],
    ["字段名", "是否必填", "说明"],
    ["使用产品医院ETMS-ID", "是", "每次导入按该字段重建医院合规记录"],
    ["医疗机构名称", "是", "不能为空"],
    ["标签", "是", "支持一个ETMS-ID对应多个标签，多个标签可用逗号分隔"],
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
  const nextRecords: HospitalComplianceRecord[] = [];
  let successCount = 0;
  let skippedCount = 0;

  rows.forEach((row, index) => {
    const etmsId = String(row["使用产品医院ETMS-ID"] ?? "").trim();
    const medicalInstitutionName = String(row["医疗机构名称"] ?? "").trim();
    const tags = String(row["标签"] ?? "").trim();

    if (!etmsId || !medicalInstitutionName || !tags) {
      skippedCount += 1;
      return;
    }

    nextRecords.push({
      id: `compliance-${Date.now()}-${index + 1}`,
      etmsId,
      medicalInstitutionName,
      tags,
      createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
    });
    successCount += 1;
  });

  persistStoredRecords(nextRecords);
  return { successCount, skippedCount };
}

export async function batchDeleteHospitalComplianceRecords(ids: string[]) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const records = await getRecords();
  const next = records.filter((item) => !ids.includes(item.id));
  persistStoredRecords(next);
  return `${ids.length} 条记录已删除。`;
}
