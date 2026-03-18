export type AdminOrderTabKey = "orders" | "drafts";

export type AdminOrderStatus =
  | "待SA确认"
  | "SA驳回"
  | "订单已提交"
  | "建议订单审批中"
  | "订单撤销"
  | "待经销商确认"
  | "经销商驳回"
  | "暂存";

export type AdminOrderProductItem = {
  id: string;
  nestleCode: string;
  productName: string;
  quantity: number;
  taxIncludedAmount: number;
  npsAmount: number;
  taxExcludedAmount: number;
  customerCode?: string;
  quotaDetail?: number;
  promoDiscountRate?: number;
  discountRate?: number;
  productGroup?: string;
  shipWarehouse?: string;
  stockDetail?: number;
  unitPrice?: number;
  taxRate?: number;
  isManual?: boolean;
};

export type AdminSuggestedOrderProductItem = {
  id: string;
  nestleCode: string;
  productName: string;
  productBu: string;
  gpsUnitPrice: number;
  unitWeight: number;
  unitVolume: number;
  taxRate: number;
  distributorDiscountRate: number;
  preDistributionDiscountRate: number;
  suggestedAvgQuantity: number;
  orderQuantity: number;
  orderReason?: string;
  orderReasonDetail?: string;
  suggestedMinQuantity: number;
  suggestedMaxQuantity: number;
  stockQuantity: number;
  estimatedSales: number | null;
  quotaDetail: number;
  promoDiscountRate: number;
  customerCode: string;
  productGroup: string;
  shipWarehouse: string;
  stockDetail: number;
};

export type AdminOrderShipToOption = {
  id: string;
  label: string;
  address: string;
};

export type AdminOrderPayerOption = {
  id: string;
  label: string;
  paymentInfo: string;
};

export type AdminOrderDealerOption = {
  dealerCode: string;
  dealerName: string;
  l4: string;
  l5: string;
  l6: string;
  region: string;
  cg: string;
  businessUnit: string;
  dealerType: string;
};

export type AdminOrderRecord = {
  id: string;
  tabKey: AdminOrderTabKey;
  orderNo: string;
  orderProductTotalBoxes: number;
  orderAmountWithTax: number;
  npsAmount: number;
  orderAmountWithoutTax: number;
  dealerCode: string;
  dealerName: string;
  l4: string;
  l5: string;
  l6: string;
  createdAt: string;
  createdBy: string;
  statusChangedAt: string;
  orderStatus: AdminOrderStatus;
  products: AdminOrderProductItem[];
  soldToCode?: string;
  shipToOptions?: AdminOrderShipToOption[];
  selectedShipToId?: string;
  warehouseAddress?: string;
  payerOptions?: AdminOrderPayerOption[];
  selectedPayerId?: string;
  paymentInfo?: string;
  salesOfficeRegion?: string;
  submitTo?: string;
  orderSubmitDate?: string;
  expectedDeliveryDate?: string;
  expectedArrivalDate?: string;
  totalWeight?: number;
  totalVolume?: number;
  useArAmount?: number;
  discountAmount?: number;
  discountUsedAmount?: number;
  amountBeforeDiscount?: number;
  amountPayable?: number;
  actualPaymentAmount?: number;
  suggestedProducts?: AdminSuggestedOrderProductItem[];
  manualOrderProducts?: AdminOrderProductItem[];
  orderRemark?: string;
  deliveryNote?: string;
  multiPayEnabled?: boolean;
  multiPayPayerName?: string;
  multiPayAmount?: number;
  multiPayRemark?: string;
};

export const adminOrderSeedRecords: AdminOrderRecord[] = [
  {
    id: "admin-order-001",
    tabKey: "orders",
    orderNo: "BSY1917069631303",
    orderProductTotalBoxes: 100,
    orderAmountWithTax: 68026,
    npsAmount: 60200,
    orderAmountWithoutTax: 60200,
    dealerCode: "1917069",
    dealerName: "葫芦岛市龙港区甜蜜食品经销处",
    l4: "北区",
    l5: "东北",
    l6: "辽宁西部",
    createdAt: "2026-03-13 19:09:05",
    createdBy: "王丽",
    statusChangedAt: "2026-03-13 21:33:47",
    orderStatus: "SA驳回",
    products: [
      {
        id: "admin-order-001-product-1",
        nestleCode: "12192124",
        productName: "雀巢鹰唛炼奶歪斜装@48x350g CN",
        quantity: 100,
        taxIncludedAmount: 68026,
        npsAmount: 60200,
        taxExcludedAmount: 60200,
      },
    ],
  },
  {
    id: "admin-order-002",
    tabKey: "orders",
    orderNo: "BSY2100458052201",
    orderProductTotalBoxes: 156,
    orderAmountWithTax: 122379,
    npsAmount: 108300,
    orderAmountWithoutTax: 108300,
    dealerCode: "2100458",
    dealerName: "广东鹏瑞医药有限公司",
    l4: "南区",
    l5: "华南",
    l6: "广州",
    createdAt: "2026-03-15 14:36:12",
    createdBy: "刘颖",
    statusChangedAt: "2026-03-15 16:08:24",
    orderStatus: "订单已提交",
    products: [
      {
        id: "admin-order-002-product-1",
        nestleCode: "12800112",
        productName: "雀巢咖啡低糖款 30条装",
        quantity: 56,
        taxIncludedAmount: 43053,
        npsAmount: 38100,
        taxExcludedAmount: 38100,
      },
      {
        id: "admin-order-002-product-2",
        nestleCode: "12800620",
        productName: "雀巢奶咖原味 15g*80",
        quantity: 100,
        taxIncludedAmount: 79326,
        npsAmount: 70200,
        taxExcludedAmount: 70200,
      },
    ],
  },
  {
    id: "admin-order-003",
    tabKey: "drafts",
    orderNo: "TMP3200186031701",
    orderProductTotalBoxes: 72,
    orderAmountWithTax: 55867,
    npsAmount: 49440,
    orderAmountWithoutTax: 49440,
    dealerCode: "3200186",
    dealerName: "四川新蓉医药科技有限公司",
    l4: "西区",
    l5: "西南",
    l6: "成都",
    createdAt: "2026-03-17 09:10:18",
    createdBy: "王琳",
    statusChangedAt: "2026-03-17 09:10:18",
    orderStatus: "暂存",
    products: [
      {
        id: "admin-order-003-product-1",
        nestleCode: "12980001",
        productName: "雀巢奶咖微甜款 15g*80",
        quantity: 72,
        taxIncludedAmount: 55867,
        npsAmount: 49440,
        taxExcludedAmount: 49440,
      },
    ],
  },
  {
    id: "admin-order-004",
    tabKey: "orders",
    orderNo: "BSY3100102041102",
    orderProductTotalBoxes: 88,
    orderAmountWithTax: 75602,
    npsAmount: 66904,
    orderAmountWithoutTax: 66904,
    dealerCode: "3100102",
    dealerName: "上海汇康食品贸易有限公司",
    l4: "东区",
    l5: "华东",
    l6: "上海",
    createdAt: "2026-03-14 08:11:22",
    createdBy: "陈昕",
    statusChangedAt: "2026-03-14 09:06:10",
    orderStatus: "待SA确认",
    products: [
      {
        id: "admin-order-004-product-1",
        nestleCode: "12630056",
        productName: "雀巢奶香三合一 20g*120",
        quantity: 88,
        taxIncludedAmount: 75602,
        npsAmount: 66904,
        taxExcludedAmount: 66904,
      },
    ],
  },
  {
    id: "admin-order-005",
    tabKey: "orders",
    orderNo: "BSY4402201033301",
    orderProductTotalBoxes: 132,
    orderAmountWithTax: 101982,
    npsAmount: 90250,
    orderAmountWithoutTax: 90250,
    dealerCode: "4402201",
    dealerName: "佛山顺康商贸有限公司",
    l4: "南区",
    l5: "华南",
    l6: "佛山",
    createdAt: "2026-03-16 10:33:18",
    createdBy: "杨洁",
    statusChangedAt: "2026-03-16 11:28:40",
    orderStatus: "建议订单审批中",
    products: [
      {
        id: "admin-order-005-product-1",
        nestleCode: "12800620",
        productName: "雀巢奶咖原味 15g*80",
        quantity: 132,
        taxIncludedAmount: 101982,
        npsAmount: 90250,
        taxExcludedAmount: 90250,
      },
    ],
  },
  {
    id: "admin-order-006",
    tabKey: "orders",
    orderNo: "BSY5103001060105",
    orderProductTotalBoxes: 64,
    orderAmountWithTax: 46896,
    npsAmount: 41500,
    orderAmountWithoutTax: 41500,
    dealerCode: "5103001",
    dealerName: "成都润驰供应链有限公司",
    l4: "西区",
    l5: "西南",
    l6: "成都",
    createdAt: "2026-03-12 16:01:05",
    createdBy: "李欣",
    statusChangedAt: "2026-03-12 18:14:52",
    orderStatus: "订单撤销",
    products: [
      {
        id: "admin-order-006-product-1",
        nestleCode: "12970005",
        productName: "雀巢咖啡拿铁款 24条装",
        quantity: 64,
        taxIncludedAmount: 46896,
        npsAmount: 41500,
        taxExcludedAmount: 41500,
      },
    ],
  },
  {
    id: "admin-order-007",
    tabKey: "orders",
    orderNo: "BSY2106002072504",
    orderProductTotalBoxes: 118,
    orderAmountWithTax: 92435,
    npsAmount: 81790,
    orderAmountWithoutTax: 81790,
    dealerCode: "2106002",
    dealerName: "沈阳佳禾食品有限公司",
    l4: "北区",
    l5: "东北",
    l6: "沈阳",
    createdAt: "2026-03-15 07:25:46",
    createdBy: "高源",
    statusChangedAt: "2026-03-15 12:01:17",
    orderStatus: "待经销商确认",
    products: [
      {
        id: "admin-order-007-product-1",
        nestleCode: "12192124",
        productName: "雀巢鹰唛炼奶歪斜装@48x350g CN",
        quantity: 118,
        taxIncludedAmount: 92435,
        npsAmount: 81790,
        taxExcludedAmount: 81790,
      },
    ],
  },
  {
    id: "admin-order-008",
    tabKey: "orders",
    orderNo: "BSY3709003081507",
    orderProductTotalBoxes: 92,
    orderAmountWithTax: 70824,
    npsAmount: 62700,
    orderAmountWithoutTax: 62700,
    dealerCode: "3709003",
    dealerName: "济南融泰商贸有限公司",
    l4: "东区",
    l5: "华东",
    l6: "济南",
    createdAt: "2026-03-11 08:15:03",
    createdBy: "韩梅",
    statusChangedAt: "2026-03-11 13:44:28",
    orderStatus: "经销商驳回",
    products: [
      {
        id: "admin-order-008-product-1",
        nestleCode: "12800112",
        productName: "雀巢咖啡低糖款 30条装",
        quantity: 92,
        taxIncludedAmount: 70824,
        npsAmount: 62700,
        taxExcludedAmount: 62700,
      },
    ],
  },
];
