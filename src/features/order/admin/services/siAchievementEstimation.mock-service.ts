import dayjs from "dayjs";
import { utils, writeFileXLSX } from "xlsx";
import type { SiAchievementEstimationRecord } from "../mocks/siAchievementEstimation.mock";
import { siAchievementEstimationSeedRecords } from "../mocks/siAchievementEstimation.mock";

export type SiAchievementEstimationFilters = {
  month?: string;
  businessUnit?: string;
  region?: string;
  cg?: string;
  dealerCode?: string;
  dealerName?: string;
  shipToCode?: string;
  productCode?: string;
  productName?: string;
};

function wait() {
  return new Promise((resolve) => window.setTimeout(resolve, 180));
}

function getFutureSimulatedAmount(record: SiAchievementEstimationRecord) {
  const today = dayjs().startOf("day");

  return record.monthlyOrderDailyData.reduce((sum, item) => {
    return dayjs(item.orderDate).startOf("day").isAfter(today) ? sum + item.orderAmount : sum;
  }, 0);
}

export async function listSiAchievementEstimations(filters: SiAchievementEstimationFilters = {}) {
  await wait();
  const month = filters.month?.trim();
  const businessUnit = filters.businessUnit?.trim().toLowerCase();
  const region = filters.region?.trim().toLowerCase();
  const cg = filters.cg?.trim().toLowerCase();
  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const dealerName = filters.dealerName?.trim().toLowerCase();
  const shipToCode = filters.shipToCode?.trim().toLowerCase();
  const productCode = filters.productCode?.trim().toLowerCase();
  const productName = filters.productName?.trim().toLowerCase();

  return siAchievementEstimationSeedRecords.filter((item) => {
    const matchesMonth = !month || item.month === month;
    const matchesBusinessUnit = !businessUnit || item.businessUnit.toLowerCase().includes(businessUnit);
    const matchesRegion = !region || item.region.toLowerCase().includes(region);
    const matchesCg = !cg || item.cg.toLowerCase().includes(cg);
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesDealerName = !dealerName || item.dealerName.toLowerCase().includes(dealerName);
    const matchesShipToCode = !shipToCode || item.shipToCode.toLowerCase().includes(shipToCode);
    const matchesProductCode = !productCode || item.productCode.toLowerCase().includes(productCode);
    const matchesProductName = !productName || item.productName.toLowerCase().includes(productName);

    return (
      matchesMonth &&
      matchesBusinessUnit &&
      matchesRegion &&
      matchesCg &&
      matchesDealerCode &&
      matchesDealerName &&
      matchesShipToCode &&
      matchesProductCode &&
      matchesProductName
    );
  });
}

export function exportSiAchievementEstimations(records: SiAchievementEstimationRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      月份: item.month,
      业务单元: item.businessUnit,
      大区: item.region,
      CG: item.cg,
      经销商编码: item.dealerCode,
      经销商名称: item.dealerName,
      ShipTo编码: item.shipToCode,
      ShipTo名称: item.shipToName,
      产品编码: item.productCode,
      产品名称: item.productName,
      "月度目标(元)": item.monthlyTarget,
      "当月达成(元)": item.monthlyAchieved,
      "未来模拟金额(元)": getFutureSimulatedAmount(item),
      "预估达成明细(by订单日)": item.estimatedAchievedDetail,
      预估达成率: `${(item.estimatedAchievementRate * 100).toFixed(2)}%`,
    })),
  );

  worksheet["!cols"] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 48 },
    { wch: 14 },
  ];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "SI达成预估看版");
  writeFileXLSX(workbook, `SI达成预估看版_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}
