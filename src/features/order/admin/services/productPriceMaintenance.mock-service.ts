import dayjs from "dayjs";
import { utils, writeFileXLSX } from "xlsx";
import type { ProductBuNameCn, PurchasePriceRecord, SalePriceRecord } from "../mocks/productPriceMaintenance.mock";
import { productBuOptions, purchasePriceSeedRecords, salePriceSeedRecords } from "../mocks/productPriceMaintenance.mock";

const PURCHASE_STORAGE_KEY = "csl-order-admin-purchase-prices";
const SALE_STORAGE_KEY = "csl-order-admin-sale-prices";
const PURCHASE_DELETED_KEY = "csl-order-admin-purchase-prices-deleted";
const SALE_DELETED_KEY = "csl-order-admin-sale-prices-deleted";

export type PurchasePriceFilters = {
  keyword?: string;
};

export type SalePriceFilters = {
  keyword?: string;
  serviceProviderCode?: string;
  serviceProviderName?: string;
};

export type SavePurchasePricePayload = {
  id?: string;
  productCode: string;
  productBu: ProductBuNameCn;
  productName: string;
  imageUrl?: string;
  serviceProviderPurchasePrice: number;
};

export type SaveSalePricePayload = {
  id: string;
  goodPrice: number;
  salePriceAboveHalf: number;
  salePriceAboveThird: number;
};

function readStoredPurchasePrices() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(PURCHASE_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as PurchasePriceRecord[];
  } catch {
    window.localStorage.removeItem(PURCHASE_STORAGE_KEY);
    return [];
  }
}

function persistStoredPurchasePrices(records: PurchasePriceRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(records));
}

function readStoredSalePrices() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(SALE_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as SalePriceRecord[];
  } catch {
    window.localStorage.removeItem(SALE_STORAGE_KEY);
    return [];
  }
}

function persistStoredSalePrices(records: SalePriceRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SALE_STORAGE_KEY, JSON.stringify(records));
}

function readDeletedIds(key: string) {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as string[];
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

function persistDeletedIds(key: string, ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(Array.from(new Set(ids))));
}

function getMergedPurchasePrices() {
  const stored = readStoredPurchasePrices();
  const deletedIds = readDeletedIds(PURCHASE_DELETED_KEY);
  const merged = [...purchasePriceSeedRecords].filter((item) => !deletedIds.includes(item.id));

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

function getMergedSalePrices() {
  const stored = readStoredSalePrices();
  const deletedIds = readDeletedIds(SALE_DELETED_KEY);
  const merged = [...salePriceSeedRecords].filter((item) => !deletedIds.includes(item.id));

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

function buildProductImage(productName: string, productCode: string) {
  const source = `${productName}${productCode}`;
  const colorSeed = source.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const colors = ["#2f6df6", "#0f766e", "#8b5cf6", "#dc6b2f", "#d946ef"];
  const imageColor = colors[colorSeed % colors.length];
  return {
    imageLabel: productName.trim().charAt(0) || productCode.trim().charAt(0) || "产",
    imageColor,
  };
}

function normalizeProductBu(value: string): ProductBuNameCn {
  return productBuOptions.find((item) => item.value === value.trim())?.value ?? "奶品";
}

export async function listPurchasePrices(filters: PurchasePriceFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 220));

  const keyword = filters.keyword?.trim().toLowerCase();

  return getMergedPurchasePrices().filter((item) => {
    if (!keyword) {
      return true;
    }

    return (
      item.productCode.toLowerCase().includes(keyword) ||
      item.productName.toLowerCase().includes(keyword) ||
      item.productBu.toLowerCase().includes(keyword)
    );
  });
}

export async function listSalePrices(filters: SalePriceFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 220));

  const keyword = filters.keyword?.trim().toLowerCase();
  const providerCode = filters.serviceProviderCode?.trim().toLowerCase();
  const providerName = filters.serviceProviderName?.trim().toLowerCase();

  return getMergedSalePrices().filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.productCode.toLowerCase().includes(keyword) ||
      item.productName.toLowerCase().includes(keyword) ||
      item.productBu.toLowerCase().includes(keyword);
    const matchesProviderCode = !providerCode || item.serviceProviderCode.toLowerCase().includes(providerCode);
    const matchesProviderName = !providerName || item.serviceProviderName.toLowerCase().includes(providerName);

    return matchesKeyword && matchesProviderCode && matchesProviderName;
  });
}

export async function savePurchasePrice(payload: SavePurchasePricePayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 320));

  const stored = readStoredPurchasePrices();
  const merged = getMergedPurchasePrices();
  const existingRecord = payload.id ? merged.find((item) => item.id === payload.id) : undefined;
  const imageMeta = buildProductImage(payload.productName, payload.productCode);
  const nextRecord: PurchasePriceRecord = {
    id: payload.id ?? `purchase-price-${Date.now()}`,
    productCode: existingRecord?.productCode ?? payload.productCode.trim(),
    productBu: normalizeProductBu(payload.productBu),
    productName: payload.productName.trim(),
    imageUrl: payload.imageUrl ?? existingRecord?.imageUrl,
    imageLabel: imageMeta.imageLabel,
    imageColor: imageMeta.imageColor,
    serviceProviderPurchasePrice: payload.serviceProviderPurchasePrice,
  };

  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);

  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredPurchasePrices(next);
    return nextRecord;
  }

  const seedIndex = purchasePriceSeedRecords.findIndex((item) => item.id === nextRecord.id);

  if (seedIndex >= 0) {
    persistStoredPurchasePrices([...stored, nextRecord]);
    return nextRecord;
  }

  persistStoredPurchasePrices([nextRecord, ...stored]);
  return nextRecord;
}

export async function deletePurchasePrice(id: string) {
  await new Promise((resolve) => window.setTimeout(resolve, 220));

  const target = getMergedPurchasePrices().find((item) => item.id === id);

  if (!target) {
    throw new Error("未找到对应的产品记录。");
  }

  persistStoredPurchasePrices(readStoredPurchasePrices().filter((item) => item.id !== id));
  persistDeletedIds(PURCHASE_DELETED_KEY, [...readDeletedIds(PURCHASE_DELETED_KEY), id]);

  const relatedSaleIds = getMergedSalePrices()
    .filter((item) => item.productCode === target.productCode)
    .map((item) => item.id);

  if (relatedSaleIds.length > 0) {
    persistStoredSalePrices(readStoredSalePrices().filter((item) => !relatedSaleIds.includes(item.id)));
    persistDeletedIds(SALE_DELETED_KEY, [...readDeletedIds(SALE_DELETED_KEY), ...relatedSaleIds]);
  }

  return `${target.productName} 已删除。`;
}

export async function pushPurchasePricesToErp(records: PurchasePriceRecord[]) {
  await new Promise((resolve) => window.setTimeout(resolve, 420));
  return `已向 ERP 推送 ${records.length} 条进货价数据。`;
}

export async function saveSalePrice(payload: SaveSalePricePayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 260));

  const stored = readStoredSalePrices();
  const merged = getMergedSalePrices();
  const existingRecord = merged.find((item) => item.id === payload.id);

  if (!existingRecord) {
    throw new Error("未找到对应的出货价记录。");
  }

  const nextRecord: SalePriceRecord = {
    ...existingRecord,
    goodPrice: payload.goodPrice,
    salePriceAboveHalf: payload.salePriceAboveHalf,
    salePriceAboveThird: payload.salePriceAboveThird,
  };

  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);

  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredSalePrices(next);
    return nextRecord;
  }

  const seedIndex = salePriceSeedRecords.findIndex((item) => item.id === nextRecord.id);

  if (seedIndex >= 0) {
    persistStoredSalePrices([...stored, nextRecord]);
    return nextRecord;
  }

  persistStoredSalePrices([nextRecord, ...stored]);
  return nextRecord;
}

export function exportSalePrices(records: SalePriceRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      产品编码: item.productCode,
      产品BU: item.productBu,
      产品名称: item.productName,
      服务商进货价: item.serviceProviderPurchasePrice,
      "服务商出货价（好货）": item.goodPrice,
      "服务商出货价（过半）": item.salePriceAboveHalf,
      "服务商出货价（过三）": item.salePriceAboveThird,
    })),
  );

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "出货价");
  writeFileXLSX(workbook, `出货价_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}
