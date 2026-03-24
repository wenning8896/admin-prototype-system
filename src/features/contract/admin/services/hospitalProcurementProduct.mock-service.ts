import dayjs from "dayjs";
import { read, utils, writeFileXLSX } from "xlsx";
import type { HospitalContractProduct } from "../../shared/mocks/hospitalContract.mock";
import { listHospitalContracts } from "../../shared/services/hospitalContract.mock-service";

const STORAGE_KEY = "csl-contract-admin-hospital-procurement-products";

export type HospitalProcurementProductFilters = {
  productCode?: string;
  productName?: string;
  brand?: string;
  maintainToContract?: "Y" | "N";
  maintainToSignReceipt?: "Y" | "N";
};

type StoredHospitalProcurementProduct = HospitalContractProduct & {
  updatedAt: string;
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
    return JSON.parse(raw) as StoredHospitalProcurementProduct[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: StoredHospitalProcurementProduct[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function buildBaseProductMap(products: HospitalContractProduct[]) {
  const map = new Map<string, HospitalContractProduct>();

  products.forEach((item) => {
    const existing = map.get(item.productCode);
    if (!existing) {
      map.set(item.productCode, {
        id: item.id,
        productCode: item.productCode,
        productName: item.productName,
        brand: item.brand,
        maintainToContract: item.maintainToContract ?? "Y",
        maintainToSignReceipt: item.maintainToSignReceipt ?? "Y",
        suggestedPrice: item.suggestedPrice,
        price: item.price,
      });
      return;
    }

    map.set(item.productCode, {
      ...existing,
      productName: existing.productName || item.productName,
      brand: existing.brand || item.brand,
      maintainToContract: existing.maintainToContract || item.maintainToContract || "N",
      maintainToSignReceipt: existing.maintainToSignReceipt || item.maintainToSignReceipt || "N",
      suggestedPrice: item.suggestedPrice || existing.suggestedPrice,
      price: item.price ?? existing.price,
    });
  });

  return map;
}

export async function listHospitalProcurementProducts(filters: HospitalProcurementProductFilters = {}) {
  const contracts = await listHospitalContracts();
  const baseMap = buildBaseProductMap(contracts.flatMap((item) => item.products));
  const stored = readStoredRecords();

  stored.forEach((item) => {
    const existing = baseMap.get(item.productCode);
    baseMap.set(item.productCode, {
      id: existing?.id ?? item.id,
      productCode: item.productCode,
      productName: item.productName || existing?.productName || `导入产品 ${item.productCode}`,
      brand: item.brand || existing?.brand || "",
      maintainToContract: item.maintainToContract || existing?.maintainToContract || "Y",
      maintainToSignReceipt: item.maintainToSignReceipt || existing?.maintainToSignReceipt || "Y",
      suggestedPrice: item.suggestedPrice,
      price: existing?.price ?? item.price,
    });
  });

  const productCode = filters.productCode?.trim().toLowerCase();
  const productName = filters.productName?.trim().toLowerCase();
  const brand = filters.brand?.trim().toLowerCase();
  return Array.from(baseMap.values()).filter(
    (item) =>
      (!productCode || item.productCode.toLowerCase().includes(productCode)) &&
      (!productName || item.productName.toLowerCase().includes(productName)) &&
      (!brand || (item.brand ?? "").toLowerCase().includes(brand)) &&
      (!filters.maintainToContract || item.maintainToContract === filters.maintainToContract) &&
      (!filters.maintainToSignReceipt || item.maintainToSignReceipt === filters.maintainToSignReceipt),
  );
}

export function exportHospitalProcurementProducts(records: HospitalContractProduct[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      产品编码: item.productCode,
      产品名称: item.productName,
      品牌: item.brand ?? "",
      是否维护到合同: item.maintainToContract ?? "N",
      是否维护到签收单: item.maintainToSignReceipt ?? "N",
      建议价格: item.suggestedPrice,
    })),
  );

  worksheet["!cols"] = [{ wch: 18 }, { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "院采产品列表");
  writeFileXLSX(workbook, `院采产品列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function downloadHospitalProcurementProductTemplate() {
  const templateSheet = utils.json_to_sheet([
    {
      产品编码: "P-1001",
      产品名称: "启赋配方奶粉 1 段",
      品牌: "启赋",
      是否维护到合同: "Y",
      是否维护到签收单: "Y",
      建议价格: 328,
    },
  ]);

  templateSheet["!cols"] = [{ wch: 18 }, { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];

  const instructionSheet = utils.aoa_to_sheet([
    ["院采产品列表导入说明"],
    [],
    ["字段名", "是否必填", "说明"],
    ["产品编码", "是", "导入时按产品编码写入产品记录"],
    ["产品名称", "是", "不能为空"],
    ["品牌", "是", "不能为空"],
    ["是否维护到合同", "是", "仅支持 Y 或 N"],
    ["是否维护到签收单", "是", "仅支持 Y 或 N"],
    ["建议价格", "是", "必须为大于等于 0 的数字"],
    [],
    ["处理逻辑", "说明"],
    ["覆盖规则", "每次导入按文件内容全量覆盖院采产品列表"],
  ]);

  instructionSheet["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 60 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, templateSheet, "导入模板");
  utils.book_append_sheet(workbook, instructionSheet, "导入说明");
  writeFileXLSX(workbook, "院采产品列表导入模板.xlsx");
}

export async function importHospitalProcurementProducts(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<Record<string, string | number>>(worksheet, { defval: "" });
  const nextRecords: StoredHospitalProcurementProduct[] = [];

  let successCount = 0;
  let skippedCount = 0;

  rows.forEach((row, index) => {
    const productCode = String(row["产品编码"] ?? "").trim();
    const productName = String(row["产品名称"] ?? "").trim();
    const brand = String(row["品牌"] ?? "").trim();
    const maintainToContract = String(row["是否维护到合同"] ?? "").trim().toUpperCase();
    const maintainToSignReceipt = String(row["是否维护到签收单"] ?? "").trim().toUpperCase();
    const suggestedPriceRaw = String(row["建议价格"] ?? "").trim();
    const suggestedPrice = Number(suggestedPriceRaw);

    if (
      !productCode ||
      !productName ||
      !brand ||
      !["Y", "N"].includes(maintainToContract) ||
      !["Y", "N"].includes(maintainToSignReceipt) ||
      suggestedPriceRaw === "" ||
      Number.isNaN(suggestedPrice) ||
      suggestedPrice < 0
    ) {
      skippedCount += 1;
      return;
    }

    nextRecords.push({
      id: `hospital-procurement-product-${productCode}-${index + 1}`,
      productCode,
      productName,
      brand,
      maintainToContract: maintainToContract as "Y" | "N",
      maintainToSignReceipt: maintainToSignReceipt as "Y" | "N",
      suggestedPrice,
      price: suggestedPrice,
      updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    });
    successCount += 1;
  });

  persistStoredRecords(nextRecords);

  return {
    successCount,
    skippedCount,
  };
}
