export type DistributorSelfInventoryRecord = {
  id: string;
  productCode: string;
  productName: string;
  batchNo: string;
  quantity: number;
  productionDate: string;
  validDays: number;
};

export const distributorSelfInventorySeedRecords: DistributorSelfInventoryRecord[] = [
  {
    id: "dist-inventory-001",
    productCode: "SKU-10001",
    productName: "金装奶品 250ml",
    batchNo: "DISTBATCH-20260302-A",
    quantity: 180,
    productionDate: "2026-02-18",
    validDays: 180,
  },
  {
    id: "dist-inventory-002",
    productCode: "SKU-10002",
    productName: "即饮咖啡 300ml",
    batchNo: "DISTBATCH-20260305-B",
    quantity: 96,
    productionDate: "2026-02-24",
    validDays: 150,
  },
  {
    id: "dist-inventory-003",
    productCode: "SKU-10003",
    productName: "经典 RTD 饮品",
    batchNo: "DISTBATCH-20260308-C",
    quantity: 142,
    productionDate: "2026-03-04",
    validDays: 120,
  },
];
