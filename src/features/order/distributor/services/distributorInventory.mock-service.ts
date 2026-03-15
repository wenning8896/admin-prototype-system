import dayjs from "dayjs";
import { utils, writeFileXLSX } from "xlsx";
import type { DistributorSelfInventoryRecord } from "../mocks/distributorInventory.mock";
import { distributorSelfInventorySeedRecords } from "../mocks/distributorInventory.mock";

export type DistributorSelfInventoryFilters = {
  productCode?: string;
  productName?: string;
  batchNo?: string;
};

export async function listDistributorSelfInventory(filters: DistributorSelfInventoryFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const productCode = filters.productCode?.trim().toLowerCase();
  const productName = filters.productName?.trim().toLowerCase();
  const batchNo = filters.batchNo?.trim().toLowerCase();

  return distributorSelfInventorySeedRecords.filter((item) => {
    const matchesProductCode = !productCode || item.productCode.toLowerCase().includes(productCode);
    const matchesProductName = !productName || item.productName.toLowerCase().includes(productName);
    const matchesBatchNo = !batchNo || item.batchNo.toLowerCase().includes(batchNo);
    return matchesProductCode && matchesProductName && matchesBatchNo;
  });
}

export function exportDistributorSelfInventory(records: DistributorSelfInventoryRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      产品编码: item.productCode,
      产品名称: item.productName,
      批次号: item.batchNo,
      数量: item.quantity,
      生产日期: item.productionDate,
      "有效期（天）": item.validDays,
    })),
  );
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "库存列表");
  writeFileXLSX(workbook, `库存列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}
