export type DistributorInventoryRecord = {
  id: string;
  distributorCode: string;
  distributorName: string;
  productCode: string;
  productName: string;
  batchNo: string;
  quantity: number;
  productionDate: string;
  validDays: number;
};

export const distributorInventorySeedRecords: DistributorInventoryRecord[] = [
  {
    id: "inventory-001",
    distributorCode: "EDS240301",
    distributorName: "上海联享分销有限公司",
    productCode: "SKU-10001",
    productName: "金装奶品 250ml",
    batchNo: "BATCH-20260301-A",
    quantity: 320,
    productionDate: "2026-02-18",
    validDays: 180,
  },
  {
    id: "inventory-002",
    distributorCode: "EDS240301",
    distributorName: "上海联享分销有限公司",
    productCode: "SKU-10002",
    productName: "即饮咖啡 300ml",
    batchNo: "BATCH-20260303-B",
    quantity: 180,
    productionDate: "2026-02-25",
    validDays: 150,
  },
  {
    id: "inventory-003",
    distributorCode: "EDS240302",
    distributorName: "广州星河渠道管理有限公司",
    productCode: "SKU-10003",
    productName: "经典 RTD 饮品",
    batchNo: "BATCH-20260305-C",
    quantity: 260,
    productionDate: "2026-03-01",
    validDays: 120,
  },
  {
    id: "inventory-004",
    distributorCode: "EDS240305",
    distributorName: "苏州云启渠道有限公司",
    productCode: "SKU-10001",
    productName: "金装奶品 250ml",
    batchNo: "BATCH-20260308-D",
    quantity: 420,
    productionDate: "2026-03-06",
    validDays: 180,
  },
  {
    id: "inventory-005",
    distributorCode: "EDS240305",
    distributorName: "苏州云启渠道有限公司",
    productCode: "SKU-10002",
    productName: "即饮咖啡 300ml",
    batchNo: "BATCH-20260309-E",
    quantity: 150,
    productionDate: "2026-03-07",
    validDays: 150,
  },
];
