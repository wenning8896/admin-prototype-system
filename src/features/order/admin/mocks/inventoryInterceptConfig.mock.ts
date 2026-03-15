export type InventoryInterceptConfigRecord = {
  id: string;
  businessUnit: string;
  region: string;
  cg: string;
  dealerCode: string;
  dealerName: string;
  shipToCode: string;
  shipToName: string;
  shape2: string;
  productCode: string;
  productName: string;
  createdAt: string;
};

export const inventoryInterceptConfigSeedRecords: InventoryInterceptConfigRecord[] = [
  {
    id: "inventory-intercept-001",
    businessUnit: "OMNI",
    region: "华东大区",
    cg: "上海",
    dealerCode: "D1917070",
    dealerName: "辽宁嘉丰进出口贸易有限公司",
    shipToCode: "SHIPTO0001",
    shipToName: "浦东收货点",
    shape2: "好货",
    productCode: "PDT-1001",
    productName: "雀巢咖啡经典款",
    createdAt: "2024-02-08 10:20",
  },
  {
    id: "inventory-intercept-002",
    businessUnit: "NIN",
    region: "华南大区",
    cg: "广州",
    dealerCode: "D5060011",
    dealerName: "广州市康盛贸易有限公司",
    shipToCode: "SHIPTO0002",
    shipToName: "广州天河收货点",
    shape2: "过半",
    productCode: "PDT-2088",
    productName: "雀巢奶粉铂臻装",
    createdAt: "2024-02-12 15:40",
  },
  {
    id: "inventory-intercept-003",
    businessUnit: "OMNI",
    region: "华东大区",
    cg: "上海",
    dealerCode: "D1917070",
    dealerName: "辽宁嘉丰进出口贸易有限公司",
    shipToCode: "SHIPTO0001",
    shipToName: "浦东收货点",
    shape2: "过三",
    productCode: "PDT-3099",
    productName: "雀巢咖啡醇香装",
    createdAt: "2024-02-18 09:40",
  },
];
