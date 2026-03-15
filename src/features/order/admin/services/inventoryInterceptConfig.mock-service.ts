import dayjs from "dayjs";
import { read, utils, writeFileXLSX } from "xlsx";
import type { InventoryInterceptConfigRecord } from "../mocks/inventoryInterceptConfig.mock";
import { inventoryInterceptConfigSeedRecords } from "../mocks/inventoryInterceptConfig.mock";

const STORAGE_KEY = "csl-order-admin-inventory-intercept-config";

export type InventoryInterceptConfigFilters = {
  businessUnit?: string;
  dealerCode?: string;
  dealerName?: string;
  shipToCode?: string;
  shipToName?: string;
  productCode?: string;
  productName?: string;
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
    return JSON.parse(raw) as InventoryInterceptConfigRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: InventoryInterceptConfigRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getMergedRecords() {
  const stored = readStoredRecords();
  const merged = [...inventoryInterceptConfigSeedRecords];
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

export function getInventoryInterceptConfigRecords() {
  return getMergedRecords();
}

function persistMergedRecord(nextRecord: InventoryInterceptConfigRecord) {
  const stored = readStoredRecords();
  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);

  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredRecords(next);
    return;
  }

  const seedIndex = inventoryInterceptConfigSeedRecords.findIndex((item) => item.id === nextRecord.id);
  if (seedIndex >= 0) {
    persistStoredRecords([...stored, nextRecord]);
    return;
  }

  persistStoredRecords([nextRecord, ...stored]);
}

export async function listInventoryInterceptConfigs(filters: InventoryInterceptConfigFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 160));
  const businessUnit = filters.businessUnit?.trim().toLowerCase();
  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const dealerName = filters.dealerName?.trim().toLowerCase();
  const shipToCode = filters.shipToCode?.trim().toLowerCase();
  const shipToName = filters.shipToName?.trim().toLowerCase();
  const productCode = filters.productCode?.trim().toLowerCase();
  const productName = filters.productName?.trim().toLowerCase();

  return getMergedRecords().filter((item) => {
    const matchesBusinessUnit = !businessUnit || item.businessUnit.toLowerCase().includes(businessUnit);
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesDealerName = !dealerName || item.dealerName.toLowerCase().includes(dealerName);
    const matchesShipToCode = !shipToCode || item.shipToCode.toLowerCase().includes(shipToCode);
    const matchesShipToName = !shipToName || item.shipToName.toLowerCase().includes(shipToName);
    const matchesProductCode = !productCode || item.productCode.toLowerCase().includes(productCode);
    const matchesProductName = !productName || item.productName.toLowerCase().includes(productName);
    return (
      matchesBusinessUnit &&
      matchesDealerCode &&
      matchesDealerName &&
      matchesShipToCode &&
      matchesShipToName &&
      matchesProductCode &&
      matchesProductName
    );
  });
}

export function exportInventoryInterceptConfigs(records: InventoryInterceptConfigRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      业务单元: item.businessUnit,
      经销商编码: item.dealerCode,
      经销商名称: item.dealerName,
      ShipTo编码: item.shipToCode,
      ShipTo名称: item.shipToName,
      产品编码: item.productCode,
      产品名称: item.productName,
      创建时间: item.createdAt,
    })),
  );
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 24 },
    { wch: 20 },
  ];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "库存拦截配置");
  writeFileXLSX(workbook, `库存拦截配置_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

function downloadTemplate(fileName: string) {
  const templateSheet = utils.json_to_sheet([
    {
      业务单元: "OMNI",
      经销商编码: "D1917070",
      经销商名称: "辽宁嘉丰进出口贸易有限公司",
      ShipTo编码: "SHIPTO0001",
      ShipTo名称: "浦东收货点",
      产品编码: "PDT-1001",
      产品名称: "雀巢咖啡经典款",
    },
  ]);
  templateSheet["!cols"] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 24 },
  ];

  const instructionSheet = utils.aoa_to_sheet([
    ["导入说明"],
    [],
    ["字段名", "是否必填", "说明"],
    ["业务单元", "是", "例如 OMNI、NIN"],
    ["经销商编码", "是", "用于识别经销商主体"],
    ["经销商名称", "是", "需与经销商编码对应"],
    ["ShipTo编码", "是", "用于识别 ShipTo 主体"],
    ["ShipTo名称", "是", "需与 ShipTo 编码对应"],
    ["产品编码", "是", "用于识别产品"],
    ["产品名称", "是", "需与产品编码对应"],
    [],
    ["处理逻辑", "说明"],
    ["导入新增", "按 业务单元 + 经销商编码 + ShipTo编码 + 产品编码 判断唯一配置；命中则更新，未命中则新增"],
    ["导入删除", "按 业务单元 + 经销商编码 + ShipTo编码 + 产品编码 精确匹配删除"],
  ]);
  instructionSheet["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 52 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, templateSheet, "导入模板");
  utils.book_append_sheet(workbook, instructionSheet, "导入说明");
  writeFileXLSX(workbook, fileName);
}

export function downloadInventoryInterceptCreateTemplate() {
  downloadTemplate("库存拦截配置_导入新增模板.xlsx");
}

export function downloadInventoryInterceptDeleteTemplate() {
  downloadTemplate("库存拦截配置_导入删除模板.xlsx");
}

export async function importInventoryInterceptConfigs(file: File, mode: "create" | "delete") {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<Record<string, string>>(worksheet, { defval: "" });
  let currentRecords = getMergedRecords();
  let successCount = 0;
  let skippedCount = 0;

  rows.forEach((row, index) => {
    const businessUnit = String(row["业务单元"] ?? "").trim();
    const dealerCode = String(row["经销商编码"] ?? "").trim();
    const dealerName = String(row["经销商名称"] ?? "").trim();
    const shipToCode = String(row["ShipTo编码"] ?? "").trim();
    const shipToName = String(row["ShipTo名称"] ?? "").trim();
    const productCode = String(row["产品编码"] ?? "").trim();
    const productName = String(row["产品名称"] ?? "").trim();

    if (!businessUnit || !dealerCode || !dealerName || !shipToCode || !shipToName || !productCode || !productName) {
      skippedCount += 1;
      return;
    }

    if (mode === "delete") {
      const nextRecords = currentRecords.filter(
        (item) =>
          !(
            item.businessUnit === businessUnit &&
            item.dealerCode === dealerCode &&
            item.shipToCode === shipToCode &&
            item.productCode === productCode
          ),
      );
      currentRecords = nextRecords;
      persistStoredRecords(
        nextRecords.filter((item) => !inventoryInterceptConfigSeedRecords.some((seed) => seed.id === item.id)),
      );
      successCount += 1;
      return;
    }

    const existing = currentRecords.find(
      (item) =>
        item.businessUnit === businessUnit &&
        item.dealerCode === dealerCode &&
        item.shipToCode === shipToCode &&
        item.productCode === productCode,
    );

    persistMergedRecord({
      id: existing?.id ?? `inventory-intercept-import-${Date.now()}-${index}`,
      businessUnit,
      region: existing?.region ?? "",
      cg: existing?.cg ?? "",
      dealerCode,
      dealerName,
      shipToCode,
      shipToName,
      shape2: existing?.shape2 ?? "好货",
      productCode,
      productName,
      createdAt: existing?.createdAt ?? dayjs().format("YYYY-MM-DD HH:mm"),
    });
    currentRecords = getMergedRecords();
    successCount += 1;
  });

  return { successCount, skippedCount };
}
