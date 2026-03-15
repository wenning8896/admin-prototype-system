import dayjs from "dayjs";
import { utils, writeFileXLSX } from "xlsx";
import type { ServiceProviderRecord } from "../mocks/serviceProvider.mock";
import { serviceProviderSeedRecords } from "../mocks/serviceProvider.mock";
import type { ServiceProviderInventoryRecord } from "../mocks/serviceProviderInventory.mock";
import { serviceProviderInventorySeedRecords } from "../mocks/serviceProviderInventory.mock";

export type ServiceProviderFilters = {
  serviceProviderCode?: string;
  serviceProviderName?: string;
  ownerName?: string;
  status?: ServiceProviderRecord["status"];
};

export type ServiceProviderInventoryFilters = {
  serviceProviderCode?: string;
  serviceProviderName?: string;
  productCode?: string;
  productName?: string;
  batchNo?: string;
};

export async function listServiceProviders(filters: ServiceProviderFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const providerCode = filters.serviceProviderCode?.trim().toLowerCase();
  const providerName = filters.serviceProviderName?.trim().toLowerCase();
  const ownerName = filters.ownerName?.trim().toLowerCase();
  const status = filters.status;

  return serviceProviderSeedRecords.filter((item) => {
    const matchesCode = !providerCode || item.serviceProviderCode.toLowerCase().includes(providerCode);
    const matchesName = !providerName || item.serviceProviderName.toLowerCase().includes(providerName);
    const matchesOwner = !ownerName || item.ownerName.toLowerCase().includes(ownerName);
    const matchesStatus = !status || item.status === status;
    return matchesCode && matchesName && matchesOwner && matchesStatus;
  });
}

export async function listServiceProviderInventory(filters: ServiceProviderInventoryFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const providerCode = filters.serviceProviderCode?.trim().toLowerCase();
  const providerName = filters.serviceProviderName?.trim().toLowerCase();
  const productCode = filters.productCode?.trim().toLowerCase();
  const productName = filters.productName?.trim().toLowerCase();
  const batchNo = filters.batchNo?.trim().toLowerCase();

  return serviceProviderInventorySeedRecords.filter((item) => {
    const matchesProviderCode = !providerCode || item.serviceProviderCode.toLowerCase().includes(providerCode);
    const matchesProviderName = !providerName || item.serviceProviderName.toLowerCase().includes(providerName);
    const matchesProductCode = !productCode || item.productCode.toLowerCase().includes(productCode);
    const matchesProductName = !productName || item.productName.toLowerCase().includes(productName);
    const matchesBatchNo = !batchNo || item.batchNo.toLowerCase().includes(batchNo);
    return matchesProviderCode && matchesProviderName && matchesProductCode && matchesProductName && matchesBatchNo;
  });
}

export function exportServiceProviders(records: ServiceProviderRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      服务商编码: item.serviceProviderCode,
      服务商名称: item.serviceProviderName,
      负责人: item.ownerName,
      联系电话: item.ownerPhone,
      覆盖区域: item.region,
      已关联分销商数: item.linkedDistributorCount,
      状态: item.status,
      创建时间: item.createdAt,
    })),
  );
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "服务商列表");
  writeFileXLSX(workbook, `服务商列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function exportServiceProviderInventory(records: ServiceProviderInventoryRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      服务商编码: item.serviceProviderCode,
      服务商名称: item.serviceProviderName,
      产品编码: item.productCode,
      产品名称: item.productName,
      批次号: item.batchNo,
      数量: item.quantity,
      生产日期: item.productionDate,
      "有效期（天）": item.validDays,
    })),
  );
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "服务商库存列表");
  writeFileXLSX(workbook, `服务商库存列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}
