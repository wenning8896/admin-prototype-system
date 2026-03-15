import dayjs from "dayjs";
import { utils, writeFileXLSX } from "xlsx";
import type { DistributorInventoryRecord } from "../mocks/distributorInventory.mock";
import { distributorInventorySeedRecords } from "../mocks/distributorInventory.mock";

export type DistributorInventoryFilters = {
  distributorCode?: string;
  distributorName?: string;
  productCode?: string;
  productName?: string;
  batchNo?: string;
};

export async function listDistributorInventory(filters: DistributorInventoryFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const distributorCode = filters.distributorCode?.trim().toLowerCase();
  const distributorName = filters.distributorName?.trim().toLowerCase();
  const productCode = filters.productCode?.trim().toLowerCase();
  const productName = filters.productName?.trim().toLowerCase();
  const batchNo = filters.batchNo?.trim().toLowerCase();

  return distributorInventorySeedRecords.filter((item) => {
    const matchesDistributorCode = !distributorCode || item.distributorCode.toLowerCase().includes(distributorCode);
    const matchesDistributorName = !distributorName || item.distributorName.toLowerCase().includes(distributorName);
    const matchesProductCode = !productCode || item.productCode.toLowerCase().includes(productCode);
    const matchesProductName = !productName || item.productName.toLowerCase().includes(productName);
    const matchesBatchNo = !batchNo || item.batchNo.toLowerCase().includes(batchNo);
    return (
      matchesDistributorCode &&
      matchesDistributorName &&
      matchesProductCode &&
      matchesProductName &&
      matchesBatchNo
    );
  });
}

export function exportDistributorInventory(records: DistributorInventoryRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      分销商编码: item.distributorCode,
      分销商名称: item.distributorName,
      产品编码: item.productCode,
      产品名称: item.productName,
      批次号: item.batchNo,
      数量: item.quantity,
      "生产日期": item.productionDate,
      "有效期（天）": item.validDays,
    })),
  );

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 24 },
    { wch: 20 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
  ];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "分销商库存列表");
  writeFileXLSX(workbook, `分销商库存列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}
