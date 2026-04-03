export const productBuOptions = [
  { value: "奶品", label: "奶品" },
  { value: "咖啡", label: "咖啡" },
  { value: "糖果", label: "糖果" },
  { value: "RTD", label: "RTD" },
  { value: "星巴克", label: "星巴克" },
] as const;

export type ProductBuNameCn = (typeof productBuOptions)[number]["value"];

export type PurchasePriceRecord = {
  id: string;
  productCode: string;
  productBu: ProductBuNameCn;
  productName: string;
  imageUrl?: string;
  imageLabel: string;
  imageColor: string;
  serviceProviderPurchasePrice: number;
};

export type SalePriceRecord = {
  id: string;
  serviceProviderCode: string;
  serviceProviderName: string;
  productCode: string;
  productBu: ProductBuNameCn;
  productName: string;
  serviceProviderPurchasePrice: number;
  serviceProviderSalePrice: number;
  goodPrice: number;
  salePriceAboveThird: number;
  salePriceAboveHalf: number;
};

export const purchasePriceSeedRecords: PurchasePriceRecord[] = [
  {
    id: "purchase-price-001",
    productCode: "SKU-10001",
    productBu: "奶品",
    productName: "金装奶品 250ml",
    imageUrl: undefined,
    imageLabel: "奶",
    imageColor: "#2f6df6",
    serviceProviderPurchasePrice: 18.6,
  },
  {
    id: "purchase-price-002",
    productCode: "SKU-10002",
    productBu: "咖啡",
    productName: "即饮咖啡 300ml",
    imageUrl: undefined,
    imageLabel: "咖",
    imageColor: "#8b5cf6",
    serviceProviderPurchasePrice: 22.4,
  },
  {
    id: "purchase-price-003",
    productCode: "SKU-10003",
    productBu: "RTD",
    productName: "经典 RTD 饮品",
    imageUrl: undefined,
    imageLabel: "R",
    imageColor: "#0f766e",
    serviceProviderPurchasePrice: 16.8,
  },
];

export const salePriceSeedRecords: SalePriceRecord[] = [
  {
    id: "sale-price-001",
    serviceProviderCode: "SP-001",
    serviceProviderName: "华东履约服务商",
    productCode: "SKU-10001",
    productBu: "奶品",
    productName: "金装奶品 250ml",
    serviceProviderPurchasePrice: 18.6,
    serviceProviderSalePrice: 21.8,
    goodPrice: 22.2,
    salePriceAboveThird: 22.8,
    salePriceAboveHalf: 23.6,
  },
  {
    id: "sale-price-002",
    serviceProviderCode: "SP-002",
    serviceProviderName: "华南仓配服务商",
    productCode: "SKU-10002",
    productBu: "咖啡",
    productName: "即饮咖啡 300ml",
    serviceProviderPurchasePrice: 22.4,
    serviceProviderSalePrice: 25.2,
    goodPrice: 25.8,
    salePriceAboveThird: 26.5,
    salePriceAboveHalf: 27.3,
  },
  {
    id: "sale-price-003",
    serviceProviderCode: "SP-003",
    serviceProviderName: "西南区域服务商",
    productCode: "SKU-10003",
    productBu: "RTD",
    productName: "经典 RTD 饮品",
    serviceProviderPurchasePrice: 16.8,
    serviceProviderSalePrice: 19.1,
    goodPrice: 19.6,
    salePriceAboveThird: 20.2,
    salePriceAboveHalf: 21.0,
  },
];
