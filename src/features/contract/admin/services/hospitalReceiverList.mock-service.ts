import dayjs from "dayjs";
import { read, utils, writeFileXLSX } from "xlsx";
import { listHospitalContracts } from "../../shared/services/hospitalContract.mock-service";

const STORAGE_KEY = "csl-contract-admin-hospital-receiver-list";

export type HospitalReceiverListRecord = {
  id: string;
  etmsId: string;
  medicalInstitutionName: string;
  receiverName: string;
  receiverId: string;
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
    return JSON.parse(raw) as HospitalReceiverListRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: HospitalReceiverListRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

async function buildSeedRecords() {
  const contracts = await listHospitalContracts();
  const rows: HospitalReceiverListRecord[] = [];

  contracts.forEach((contract, contractIndex) => {
    contract.receivers.forEach((receiver, receiverIndex) => {
      rows.push({
        id: `hospital-receiver-seed-${contractIndex + 1}-${receiverIndex + 1}`,
        etmsId: contract.useProductEtmsId,
        medicalInstitutionName: contract.dmsHospitalName,
        receiverName: receiver.receiverName,
        receiverId: receiver.receiverCode,
      });
    });
  });

  return rows;
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

export async function listHospitalReceiverRecords() {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  return getRecords();
}

export function exportHospitalReceiverRecords(records: HospitalReceiverListRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      "使用产品医院ETMS-ID": item.etmsId,
      医疗机构名称: item.medicalInstitutionName,
      收货人姓名: item.receiverName,
      收货人ID: item.receiverId,
    })),
  );
  worksheet["!cols"] = [{ wch: 24 }, { wch: 28 }, { wch: 18 }, { wch: 18 }];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "医院收货人列表");
  writeFileXLSX(workbook, `医院收货人列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function downloadHospitalReceiverTemplate() {
  const templateSheet = utils.json_to_sheet([
    {
      "使用产品医院ETMS-ID": "ETMS-U-001",
      医疗机构名称: "上海第一人民医院",
      收货人姓名: "赵医生",
      收货人ID: "RCV-001",
    },
  ]);
  templateSheet["!cols"] = [{ wch: 24 }, { wch: 28 }, { wch: 18 }, { wch: 18 }];

  const instructionSheet = utils.aoa_to_sheet([
    ["医院收货人列表导入说明"],
    [],
    ["字段名", "是否必填", "说明"],
    ["使用产品医院ETMS-ID", "是", "按 ETMS-ID 分组处理，导入时会覆盖该 ETMS-ID 下的全部收货人"],
    ["医疗机构名称", "是", "不能为空"],
    ["收货人姓名", "是", "不能为空"],
    ["收货人ID", "是", "不能为空"],
    [],
    ["处理逻辑", "说明"],
    ["覆盖规则", "每次导入按文件内容全量覆盖医院收货人列表"],
  ]);
  instructionSheet["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 58 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, templateSheet, "导入模板");
  utils.book_append_sheet(workbook, instructionSheet, "导入说明");
  writeFileXLSX(workbook, "医院收货人列表导入模板.xlsx");
}

export async function importHospitalReceiverRecords(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<Record<string, string>>(worksheet, { defval: "" });
  const importRows = rows
    .map((row, index) => ({
      id: `hospital-receiver-import-${Date.now()}-${index + 1}`,
      etmsId: String(row["使用产品医院ETMS-ID"] ?? "").trim(),
      medicalInstitutionName: String(row["医疗机构名称"] ?? "").trim(),
      receiverName: String(row["收货人姓名"] ?? "").trim(),
      receiverId: String(row["收货人ID"] ?? "").trim(),
    }))
    .filter((row) => row.etmsId && row.medicalInstitutionName && row.receiverName && row.receiverId);

  persistStoredRecords(importRows);

  return {
    successCount: importRows.length,
    skippedCount: rows.length - importRows.length,
  };
}
