export type ServiceProviderInventoryRecord = {
  id: string;
  serviceProviderCode: string;
  serviceProviderName: string;
  productCode: string;
  productName: string;
  batchNo: string;
  quantity: number;
  productionDate: string;
  validDays: number;
};

export const serviceProviderInventorySeedRecords: ServiceProviderInventoryRecord[] = [
  {
    id: "sp-inventory-001",
    serviceProviderCode: "SP-001",
    serviceProviderName: "华东履约服务商",
    productCode: "SKU-10001",
    productName: "金装奶品 250ml",
    batchNo: "SPBATCH-20260301-A",
    quantity: 1260,
    productionDate: "2026-02-14",
    validDays: 180,
  },
  {
    id: "sp-inventory-002",
    serviceProviderCode: "SP-001",
    serviceProviderName: "华东履约服务商",
    productCode: "SKU-10002",
    productName: "即饮咖啡 300ml",
    batchNo: "SPBATCH-20260303-B",
    quantity: 840,
    productionDate: "2026-02-22",
    validDays: 150,
  },
  {
    id: "sp-inventory-003",
    serviceProviderCode: "SP-002",
    serviceProviderName: "华南仓配服务商",
    productCode: "SKU-10003",
    productName: "经典 RTD 饮品",
    batchNo: "SPBATCH-20260307-C",
    quantity: 960,
    productionDate: "2026-03-01",
    validDays: 120,
  },
];
