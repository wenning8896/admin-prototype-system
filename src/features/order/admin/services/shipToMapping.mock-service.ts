import dayjs from "dayjs";
import { read, utils, writeFileXLSX } from "xlsx";
import type { ShipToMappingRecord } from "../mocks/shipToMapping.mock";
import { shipToMappingSeedRecords } from "../mocks/shipToMapping.mock";

const STORAGE_KEY = "csl-order-admin-ship-to-mapping";

export type ShipToMappingFilters = {
  oldShipToCode?: string;
  newShipToCode?: string;
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
    return JSON.parse(raw) as ShipToMappingRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: ShipToMappingRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getMergedRecords() {
  const stored = readStoredRecords();
  const merged = [...shipToMappingSeedRecords];
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

function persistMergedRecord(nextRecord: ShipToMappingRecord) {
  const stored = readStoredRecords();
  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);

  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredRecords(next);
    return;
  }

  const seedIndex = shipToMappingSeedRecords.findIndex((item) => item.id === nextRecord.id);
  if (seedIndex >= 0) {
    persistStoredRecords([...stored, nextRecord]);
    return;
  }

  persistStoredRecords([nextRecord, ...stored]);
}

export async function listShipToMappingRecords(filters: ShipToMappingFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 160));
  const oldShipToCode = filters.oldShipToCode?.trim().toLowerCase();
  const newShipToCode = filters.newShipToCode?.trim().toLowerCase();

  return getMergedRecords().filter((item) => {
    const matchesOld = !oldShipToCode || item.oldShipToCode.toLowerCase().includes(oldShipToCode);
    const matchesNew = !newShipToCode || item.newShipToCode.toLowerCase().includes(newShipToCode);
    return matchesOld && matchesNew;
  });
}

export function exportShipToMappingRecords(records: ShipToMappingRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      老ShipTo编码: item.oldShipToCode,
      新ShipTo编码: item.newShipToCode,
      创建时间: item.createdAt,
    })),
  );
  worksheet["!cols"] = [{ wch: 18 }, { wch: 18 }, { wch: 20 }];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "ShipTo Mapping");
  writeFileXLSX(workbook, `ShipTo_Mapping_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

function downloadTemplate(fileName: string) {
  const templateSheet = utils.json_to_sheet([
    {
      老ShipTo编码: "OLD-SHIPTO-003",
      新ShipTo编码: "SHIPTO0002",
    },
  ]);
  templateSheet["!cols"] = [{ wch: 18 }, { wch: 18 }];

  const instructionSheet = utils.aoa_to_sheet([
    ["映射规则说明"],
    [],
    ["规则项", "说明"],
    ["老ShipTo编码", "一个老ShipTo编码只能对应一个新ShipTo编码，不允许一旧对多新"],
    ["新ShipTo编码", "一个新ShipTo编码可以被多个老ShipTo编码复用，支持多旧对一新"],
    ["导入新增", "若老ShipTo编码已存在且对应不同的新ShipTo编码，该行会被跳过"],
    ["导入删除", "按“老ShipTo编码 + 新ShipTo编码”匹配删除已有映射"],
    [],
    ["字段名", "是否必填"],
    ["老ShipTo编码", "是"],
    ["新ShipTo编码", "是"],
  ]);
  instructionSheet["!cols"] = [{ wch: 20 }, { wch: 54 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, templateSheet, "导入模板");
  utils.book_append_sheet(workbook, instructionSheet, "导入说明");
  writeFileXLSX(workbook, fileName);
}

export function downloadShipToMappingCreateTemplate() {
  downloadTemplate("ShipTo_Mapping_导入新增模板.xlsx");
}

export function downloadShipToMappingDeleteTemplate() {
  downloadTemplate("ShipTo_Mapping_导入删除模板.xlsx");
}

export async function importShipToMappingRecords(file: File, mode: "create" | "delete") {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<Record<string, string>>(worksheet, { defval: "" });
  let currentRecords = getMergedRecords();
  let successCount = 0;
  let skippedCount = 0;

  rows.forEach((row, index) => {
    const oldShipToCode = String(row["老ShipTo编码"] ?? "").trim();
    const newShipToCode = String(row["新ShipTo编码"] ?? "").trim();

    if (!oldShipToCode || !newShipToCode) {
      skippedCount += 1;
      return;
    }

    if (mode === "delete") {
      const nextRecords = currentRecords.filter(
        (item) => !(item.oldShipToCode === oldShipToCode && item.newShipToCode === newShipToCode),
      );
      currentRecords = nextRecords;
      persistStoredRecords(
        nextRecords.filter((item) => !shipToMappingSeedRecords.some((seed) => seed.id === item.id)),
      );
      successCount += 1;
      return;
    }

    const existingOld = currentRecords.find((item) => item.oldShipToCode === oldShipToCode);
    if (existingOld && existingOld.newShipToCode !== newShipToCode) {
      skippedCount += 1;
      return;
    }

    const existingExact = currentRecords.find(
      (item) => item.oldShipToCode === oldShipToCode && item.newShipToCode === newShipToCode,
    );
    const nextRecord = {
      id: existingExact?.id ?? `shipto-mapping-import-${Date.now()}-${index}`,
      oldShipToCode,
      newShipToCode,
      createdAt: existingExact?.createdAt ?? dayjs().format("YYYY-MM-DD HH:mm"),
    };
    persistMergedRecord(nextRecord);
    currentRecords = getMergedRecords();
    successCount += 1;
  });

  return { successCount, skippedCount };
}
