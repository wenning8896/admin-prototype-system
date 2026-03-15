export type SoldToStatus = "启用" | "停用";

export type SoldToRecord = {
  id: string;
  businessUnit: string;
  region: string;
  cg: string;
  dealerCode: string;
  dealerName: string;
  status: SoldToStatus;
  createdAt: string;
};

export const soldToSeedRecords: SoldToRecord[] = [
  {
    id: "soldto-001",
    businessUnit: "OMNI",
    region: "华东大区",
    cg: "上海",
    dealerCode: "D1917070",
    dealerName: "辽宁嘉丰进出口贸易有限公司",
    status: "启用",
    createdAt: "2024-01-10 10:00",
  },
  {
    id: "soldto-002",
    businessUnit: "NIN",
    region: "华南大区",
    cg: "广州",
    dealerCode: "D5060011",
    dealerName: "广州市康盛贸易有限公司",
    status: "启用",
    createdAt: "2024-01-15 11:00",
  },
];
