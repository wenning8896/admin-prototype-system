export type SiAchievementOrderDailyRecord = {
  orderDate: string;
  orderAmount: number;
  hasOrdered: boolean;
};

export type SiAchievementEstimationRecord = {
  id: string;
  month: string;
  businessUnit: string;
  region: string;
  cg: string;
  dealerCode: string;
  dealerName: string;
  shipToCode: string;
  shipToName: string;
  productCode: string;
  productName: string;
  monthlyTarget: number;
  monthlyAchieved: number;
  estimatedAchievedDetail: string;
  estimatedAchievementRate: number;
  monthlyOrderDailyData: SiAchievementOrderDailyRecord[];
};

export const siAchievementEstimationSeedRecords: SiAchievementEstimationRecord[] = [
  {
    id: "si-achievement-001",
    month: "2026-03",
    businessUnit: "OMNI",
    region: "华东大区",
    cg: "上海",
    dealerCode: "D1917070",
    dealerName: "辽宁嘉丰进出口贸易有限公司",
    shipToCode: "SHIPTO0001",
    shipToName: "浦东收货点",
    productCode: "PDT-1001",
    productName: "雀巢咖啡经典款",
    monthlyTarget: 180000,
    monthlyAchieved: 126500,
    estimatedAchievedDetail: "3/08: 28,000；3/12: 32,500；3/19: 18,000；3/24: 21,000；3/29: 27,000",
    estimatedAchievementRate: 0.92,
    monthlyOrderDailyData: [
      { orderDate: "2026-03-03", orderAmount: 18500, hasOrdered: true },
      { orderDate: "2026-03-08", orderAmount: 28000, hasOrdered: true },
      { orderDate: "2026-03-12", orderAmount: 32500, hasOrdered: true },
      { orderDate: "2026-03-19", orderAmount: 0, hasOrdered: false },
      { orderDate: "2026-03-24", orderAmount: 21000, hasOrdered: false },
      { orderDate: "2026-03-29", orderAmount: 27000, hasOrdered: false },
    ],
  },
  {
    id: "si-achievement-002",
    month: "2026-03",
    businessUnit: "OMNI",
    region: "华东大区",
    cg: "上海",
    dealerCode: "D1917070",
    dealerName: "辽宁嘉丰进出口贸易有限公司",
    shipToCode: "SHIPTO0001",
    shipToName: "浦东收货点",
    productCode: "PDT-3099",
    productName: "雀巢咖啡醇香装",
    monthlyTarget: 95000,
    monthlyAchieved: 71300,
    estimatedAchievedDetail: "3/10: 12,000；3/15: 9,800；3/21: 11,600；3/27: 8,200",
    estimatedAchievementRate: 0.87,
    monthlyOrderDailyData: [
      { orderDate: "2026-03-05", orderAmount: 14300, hasOrdered: true },
      { orderDate: "2026-03-10", orderAmount: 12000, hasOrdered: true },
      { orderDate: "2026-03-15", orderAmount: 0, hasOrdered: false },
      { orderDate: "2026-03-21", orderAmount: 0, hasOrdered: false },
      { orderDate: "2026-03-27", orderAmount: 8200, hasOrdered: false },
      { orderDate: "2026-03-30", orderAmount: 15400, hasOrdered: false },
    ],
  },
  {
    id: "si-achievement-003",
    month: "2026-03",
    businessUnit: "NIN",
    region: "华南大区",
    cg: "广州",
    dealerCode: "D5060011",
    dealerName: "广州市康盛贸易有限公司",
    shipToCode: "SHIPTO0002",
    shipToName: "广州天河收货点",
    productCode: "PDT-2088",
    productName: "雀巢奶粉铂臻装",
    monthlyTarget: 132000,
    monthlyAchieved: 88900,
    estimatedAchievedDetail: "3/09: 20,000；3/16: 16,500；3/23: 19,800；3/30: 17,200",
    estimatedAchievementRate: 0.77,
    monthlyOrderDailyData: [
      { orderDate: "2026-03-04", orderAmount: 15100, hasOrdered: true },
      { orderDate: "2026-03-09", orderAmount: 20000, hasOrdered: true },
      { orderDate: "2026-03-16", orderAmount: 0, hasOrdered: false },
      { orderDate: "2026-03-23", orderAmount: 19800, hasOrdered: false },
      { orderDate: "2026-03-30", orderAmount: 17200, hasOrdered: false },
    ],
  },
  {
    id: "si-achievement-004",
    month: "2026-03",
    businessUnit: "RTD",
    region: "华北大区",
    cg: "北京",
    dealerCode: "D8001201",
    dealerName: "北京京仓贸易有限公司",
    shipToCode: "SHIPTO1008",
    shipToName: "朝阳配送中心",
    productCode: "PDT-8801",
    productName: "即饮咖啡拿铁装",
    monthlyTarget: 210000,
    monthlyAchieved: 154000,
    estimatedAchievedDetail: "3/11: 24,000；3/18: 27,500；3/25: 31,000；3/31: 29,500",
    estimatedAchievementRate: 0.97,
    monthlyOrderDailyData: [
      { orderDate: "2026-03-02", orderAmount: 22000, hasOrdered: true },
      { orderDate: "2026-03-11", orderAmount: 24000, hasOrdered: true },
      { orderDate: "2026-03-18", orderAmount: 0, hasOrdered: false },
      { orderDate: "2026-03-25", orderAmount: 31000, hasOrdered: false },
      { orderDate: "2026-03-31", orderAmount: 29500, hasOrdered: false },
      { orderDate: "2026-03-31", orderAmount: 20000, hasOrdered: false },
    ],
  },
];
