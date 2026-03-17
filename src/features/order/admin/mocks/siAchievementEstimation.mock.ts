export type SiAchievementEstimationRecord = {
  id: string;
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
};

export const siAchievementEstimationSeedRecords: SiAchievementEstimationRecord[] = [
  {
    id: "si-achievement-001",
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
  },
  {
    id: "si-achievement-002",
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
  },
  {
    id: "si-achievement-003",
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
  },
  {
    id: "si-achievement-004",
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
  },
];
