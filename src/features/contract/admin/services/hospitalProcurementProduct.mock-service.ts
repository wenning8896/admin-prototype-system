import dayjs from "dayjs";
import { read, utils, writeFileXLSX } from "xlsx";
import type { HospitalContractProduct } from "../../shared/mocks/hospitalContract.mock";
import { listHospitalContracts } from "../../shared/services/hospitalContract.mock-service";

const STORAGE_KEY = "csl-contract-admin-hospital-procurement-products";

export type HospitalProcurementProductFilters = {
  keyword?: string;
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
        suggestedPrice: item.suggestedPrice,
        price: item.price,
      });
      return;
    }

    map.set(item.productCode, {
      ...existing,
      productName: existing.productName || item.productName,
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
      suggestedPrice: item.suggestedPrice,
      price: existing?.price ?? item.price,
    });
  });

  const keyword = filters.keyword?.trim().toLowerCase();
  return Array.from(baseMap.values()).filter(
    (item) =>
      !keyword ||
      item.productCode.toLowerCase().includes(keyword) ||
      item.productName.toLowerCase().includes(keyword),
  );
}

export function exportHospitalProcurementProducts(records: HospitalContractProduct[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      产品编码: item.productCode,
      产品名称: item.productName,
      建议价格: item.suggestedPrice,
    })),
  );

  worksheet["!cols"] = [{ wch: 18 }, { wch: 28 }, { wch: 14 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "院采产品列表");
  writeFileXLSX(workbook, `院采产品列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function downloadHospitalProcurementProductTemplate() {
  const templateSheet = utils.json_to_sheet([
    {
      产品编码: "P-1001",
      建议价格: 328,
    },
  ]);

  templateSheet["!cols"] = [{ wch: 18 }, { wch: 14 }];

  const instructionSheet = utils.aoa_to_sheet([
    ["院采产品列表导入说明"],
    [],
    ["字段名", "是否必填", "说明"],
    ["产品编码", "是", "按产品编码匹配现有产品；未匹配到时该行会跳过"],
    ["建议价格", "是", "必须为大于等于 0 的数字"],
    [],
    ["处理逻辑", "说明"],
    ["覆盖规则", "按产品编码更新建议价格"],
    ["新增规则", "系统内不存在的产品编码不允许导入，会直接跳过"],
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
  const currentProducts = await listHospitalProcurementProducts();
  const currentProductCodes = new Set(currentProducts.map((item) => item.productCode));
  const stored = readStoredRecords();
  const storedMap = new Map(stored.map((item) => [item.productCode, item]));

  let successCount = 0;
  let skippedCount = 0;

  rows.forEach((row) => {
    const productCode = String(row["产品编码"] ?? "").trim();
    const suggestedPriceRaw = String(row["建议价格"] ?? "").trim();
    const suggestedPrice = Number(suggestedPriceRaw);

    if (!productCode || suggestedPriceRaw === "" || Number.isNaN(suggestedPrice) || suggestedPrice < 0) {
      skippedCount += 1;
      return;
    }

    if (!currentProductCodes.has(productCode)) {
      skippedCount += 1;
      return;
    }

    const existing = storedMap.get(productCode);
    storedMap.set(productCode, {
      id: existing?.id ?? `hospital-procurement-product-${productCode}`,
      productCode,
      productName: existing?.productName ?? `导入产品 ${productCode}`,
      suggestedPrice,
      price: existing?.price,
      updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    });
    successCount += 1;
  });

  persistStoredRecords(Array.from(storedMap.values()));

  return {
    successCount,
    skippedCount,
  };
}
