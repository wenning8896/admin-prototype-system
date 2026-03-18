export type SuggestionOrderStatus = "待审批" | "审批通过" | "审批驳回" | "已撤销";

export type SuggestionOrderAttachment = {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
};

export type SuggestionOrderProductItem = {
  id: string;
  nestleProductCode: string;
  productName: string;
  productBu: string;
  suggestedAvgQuantity: number;
  quantity: number;
  npsAmount: number;
  isNewProduct: "是" | "否" | "-";
  orderReasonCategory?: string;
  orderReasonRemark?: string;
  suggestedMinQuantity: number;
  suggestedMaxQuantity: number;
  estimatedMonthlySales: number | null;
  stockQuantity: number;
  estimatedInventoryDaysAfterOrder: number;
  quotaOnOrder: number | null;
};

export type SuggestionOrderFlowItem = {
  id: string;
  nodeName: string;
  decision: "提交审批" | "审批通过" | "审批驳回" | "一键撤销";
  operatorName: string;
  account: string;
  role: string;
  operatedAt: string;
  remark: string;
};

export type SuggestionOrderRecord = {
  id: string;
  orderNo: string;
  orderProductTotalBoxes: number;
  orderNpsAmount: number;
  approvalProductTotalBoxes: number;
  approvalProductNpsAmount: number;
  businessUnit: string;
  region: string;
  cg: string;
  soldToCode: string;
  dealerCode: string;
  dealerName: string;
  shipToWarehouseCode: string;
  shipToCode: string;
  shipToName: string;
  approvalNode: string;
  createdAt: string;
  isOrderDay: "是" | "否";
  orderStatus: SuggestionOrderStatus;
  updatedAt: string;
  pendingProducts: SuggestionOrderProductItem[];
  normalProducts: SuggestionOrderProductItem[];
  attachments: SuggestionOrderAttachment[];
  flowRecords: SuggestionOrderFlowItem[];
};

export const suggestionOrderSeedRecords: SuggestionOrderRecord[] = [
  {
    id: "suggestion-order-001",
    orderNo: "SO202603160001",
    orderProductTotalBoxes: 280,
    orderNpsAmount: 189640,
    approvalProductTotalBoxes: 120,
    approvalProductNpsAmount: 84200,
    businessUnit: "OMNI",
    region: "华东大区",
    cg: "上海CG",
    soldToCode: "1917069",
    dealerCode: "D1917070",
    dealerName: "辽宁嘉丰进出口贸易有限公司",
    shipToWarehouseCode: "1917070",
    shipToCode: "SHIPTO0001",
    shipToName: "浦东新区中心仓",
    approvalNode: "大区经理审批",
    createdAt: "2026-03-16 09:12",
    isOrderDay: "是",
    orderStatus: "待审批",
    updatedAt: "2026-03-16 09:12",
    pendingProducts: [
      {
        id: "suggestion-order-001-p-1",
        nestleProductCode: "12192124",
        productName: "雀巢鹰唛炼奶歪斜装@48x350g CN",
        productBu: "Nutrition",
        suggestedAvgQuantity: 0,
        quantity: 80,
        npsAmount: 55200,
        isNewProduct: "-",
        orderReasonCategory: "季节性影响",
        orderReasonRemark: "22",
        suggestedMinQuantity: 0,
        suggestedMaxQuantity: 0,
        estimatedMonthlySales: null,
        stockQuantity: 0,
        estimatedInventoryDaysAfterOrder: 0,
        quotaOnOrder: null,
      },
      {
        id: "suggestion-order-001-p-2",
        nestleProductCode: "12450018",
        productName: "雀巢咖啡醇品袋装 15g*100",
        productBu: "Coffee",
        suggestedAvgQuantity: 30,
        quantity: 40,
        npsAmount: 29000,
        isNewProduct: "否",
        orderReasonCategory: "促销活动",
        orderReasonRemark: "大促备货",
        suggestedMinQuantity: 20,
        suggestedMaxQuantity: 30,
        estimatedMonthlySales: 18,
        stockQuantity: 8,
        estimatedInventoryDaysAfterOrder: 25,
        quotaOnOrder: 30,
      },
    ],
    normalProducts: [
      {
        id: "suggestion-order-001-n-1",
        nestleProductCode: "12630056",
        productName: "雀巢奶香三合一 20g*120",
        productBu: "Coffee",
        suggestedAvgQuantity: 120,
        quantity: 160,
        npsAmount: 105440,
        isNewProduct: "否",
        suggestedMinQuantity: 100,
        suggestedMaxQuantity: 160,
        estimatedMonthlySales: 120,
        stockQuantity: 65,
        estimatedInventoryDaysAfterOrder: 32,
        quotaOnOrder: 160,
      },
    ],
    attachments: [
      {
        id: "suggestion-order-001-a-1",
        fileName: "建议订单附件_华东紧急补货说明.pdf",
        uploadedBy: "张敏",
        uploadedAt: "2026-03-16 09:05",
      },
    ],
    flowRecords: [
      {
        id: "suggestion-order-001-f-1",
        nodeName: "经销商提交",
        decision: "提交审批",
        operatorName: "陈晓峰",
        account: "dealer.omni",
        role: "经销商",
        operatedAt: "2026-03-16 09:12",
        remark: "订单日补货，超限产品提请审批。",
      },
    ],
  },
  {
    id: "suggestion-order-002",
    orderNo: "SO202603150018",
    orderProductTotalBoxes: 156,
    orderNpsAmount: 108300,
    approvalProductTotalBoxes: 56,
    approvalProductNpsAmount: 38100,
    businessUnit: "OMNI",
    region: "华南大区",
    cg: "广州CG",
    soldToCode: "2100458",
    dealerCode: "D2100458",
    dealerName: "广东鹏瑞医药有限公司",
    shipToWarehouseCode: "2100492",
    shipToCode: "SHIPTO0092",
    shipToName: "广州白云仓",
    approvalNode: "审批完成",
    createdAt: "2026-03-15 14:36",
    isOrderDay: "否",
    orderStatus: "审批通过",
    updatedAt: "2026-03-15 16:08",
    pendingProducts: [
      {
        id: "suggestion-order-002-p-1",
        nestleProductCode: "12800112",
        productName: "雀巢咖啡低糖款 30条装",
        productBu: "Coffee",
        suggestedAvgQuantity: 24,
        quantity: 56,
        npsAmount: 38100,
        isNewProduct: "否",
        orderReasonCategory: "活动备货",
        orderReasonRemark: "白云区商超促销",
        suggestedMinQuantity: 20,
        suggestedMaxQuantity: 40,
        estimatedMonthlySales: 26,
        stockQuantity: 10,
        estimatedInventoryDaysAfterOrder: 18,
        quotaOnOrder: 56,
      },
    ],
    normalProducts: [
      {
        id: "suggestion-order-002-n-1",
        nestleProductCode: "12800620",
        productName: "雀巢奶咖原味 15g*80",
        productBu: "Coffee",
        suggestedAvgQuantity: 80,
        quantity: 100,
        npsAmount: 70200,
        isNewProduct: "否",
        suggestedMinQuantity: 60,
        suggestedMaxQuantity: 100,
        estimatedMonthlySales: 72,
        stockQuantity: 35,
        estimatedInventoryDaysAfterOrder: 28,
        quotaOnOrder: 100,
      },
    ],
    attachments: [
      {
        id: "suggestion-order-002-a-1",
        fileName: "建议订单附件_白云活动备货.xlsx",
        uploadedBy: "刘颖",
        uploadedAt: "2026-03-15 14:28",
      },
    ],
    flowRecords: [
      {
        id: "suggestion-order-002-f-1",
        nodeName: "经销商提交",
        decision: "提交审批",
        operatorName: "刘颖",
        account: "dealer.gz",
        role: "经销商",
        operatedAt: "2026-03-15 14:36",
        remark: "活动档期前置备货。",
      },
      {
        id: "suggestion-order-002-f-2",
        nodeName: "大区经理审批",
        decision: "审批通过",
        operatorName: "管理员",
        account: "admin",
        role: "管理员",
        operatedAt: "2026-03-15 16:08",
        remark: "活动备货合理，同意通过。",
      },
    ],
  },
  {
    id: "suggestion-order-003",
    orderNo: "SO202603140067",
    orderProductTotalBoxes: 96,
    orderNpsAmount: 66480,
    approvalProductTotalBoxes: 24,
    approvalProductNpsAmount: 17160,
    businessUnit: "OMNI",
    region: "西南大区",
    cg: "成都CG",
    soldToCode: "3200186",
    dealerCode: "D3200186",
    dealerName: "四川新蓉医药科技有限公司",
    shipToWarehouseCode: "3200388",
    shipToCode: "SHIPTO0388",
    shipToName: "成都双流仓",
    approvalNode: "-",
    createdAt: "2026-03-14 10:22",
    isOrderDay: "否",
    orderStatus: "已撤销",
    updatedAt: "2026-03-14 11:05",
    pendingProducts: [
      {
        id: "suggestion-order-003-p-1",
        nestleProductCode: "12970005",
        productName: "雀巢咖啡拿铁款 24条装",
        productBu: "Coffee",
        suggestedAvgQuantity: 12,
        quantity: 24,
        npsAmount: 17160,
        isNewProduct: "是",
        orderReasonCategory: "新品铺货",
        orderReasonRemark: "区域试销",
        suggestedMinQuantity: 6,
        suggestedMaxQuantity: 12,
        estimatedMonthlySales: 8,
        stockQuantity: 4,
        estimatedInventoryDaysAfterOrder: 20,
        quotaOnOrder: null,
      },
    ],
    normalProducts: [
      {
        id: "suggestion-order-003-n-1",
        nestleProductCode: "12980001",
        productName: "雀巢奶咖微甜款 15g*80",
        productBu: "Coffee",
        suggestedAvgQuantity: 60,
        quantity: 72,
        npsAmount: 49320,
        isNewProduct: "否",
        suggestedMinQuantity: 40,
        suggestedMaxQuantity: 80,
        estimatedMonthlySales: 55,
        stockQuantity: 22,
        estimatedInventoryDaysAfterOrder: 24,
        quotaOnOrder: 72,
      },
    ],
    attachments: [],
    flowRecords: [
      {
        id: "suggestion-order-003-f-1",
        nodeName: "经销商提交",
        decision: "提交审批",
        operatorName: "王琳",
        account: "dealer.cd",
        role: "经销商",
        operatedAt: "2026-03-14 10:22",
        remark: "门店补货申请。",
      },
      {
        id: "suggestion-order-003-f-2",
        nodeName: "经销商撤销",
        decision: "一键撤销",
        operatorName: "管理员",
        account: "admin",
        role: "管理员",
        operatedAt: "2026-03-14 11:05",
        remark: "订单信息确认后撤销。",
      },
    ],
  },
];
