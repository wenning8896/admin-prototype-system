export type ShipToStatus = "启用" | "停用";

export type ShipToRecord = {
  id: string;
  businessUnit: string;
  region: string;
  cg: string;
  dealerCode: string;
  dealerName: string;
  shipToCode: string;
  inheritedFromShipTo: string;
  status: ShipToStatus;
  createdAt: string;
};

export const shipToSeedRecords: ShipToRecord[] = [
  {
    id: "shipto-001",
    businessUnit: "OMNI",
    region: "华东大区",
    cg: "上海",
    dealerCode: "D1917070",
    dealerName: "辽宁嘉丰进出口贸易有限公司",
    shipToCode: "SHIPTO0001",
    inheritedFromShipTo: "BASE-SHIPTO-001",
    status: "启用",
    createdAt: "2024-01-18 09:30",
  },
  {
    id: "shipto-002",
    businessUnit: "NIN",
    region: "华南大区",
    cg: "广州",
    dealerCode: "D5060011",
    dealerName: "广州市康盛贸易有限公司",
    shipToCode: "SHIPTO0002",
    inheritedFromShipTo: "BASE-SHIPTO-008",
    status: "启用",
    createdAt: "2024-01-22 14:10",
  },
];
