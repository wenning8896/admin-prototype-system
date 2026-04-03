export type EDistributionOrderStatus =
  | "待审批"
  | "待发货"
  | "待收货"
  | "收货待确认"
  | "收货异常待确认"
  | "收货待重新提交"
  | "已完成"
  | "取消确认中"
  | "取消待审批"
  | "已取消";

export type ApprovalType = "新建订单" | "取消订单";
export type ProductHealthType = "好货" | "过半" | "过三";

export type OrderProductItem = {
  id: string;
  productCode: string;
  productName: string;
  healthType: ProductHealthType;
  unitPrice: number;
  quantity: number;
  amount: number;
};

export type OrderFulfillmentItem = {
  id: string;
  productCode: string;
  productName: string;
  healthType: ProductHealthType;
  batchNo: string;
  quantity: number;
  abnormalReason?: string;
};

export type OrderReceiptInfo = {
  receiptDetails?: string;
  receiptDocumentNo?: string;
  submittedAt?: string;
};

export type OrderApprovalHistory = {
  id: string;
  type: ApprovalType;
  nodeName: string;
  role: string;
  account: string;
  actorName: string;
  decision:
    | "提交"
    | "审批通过"
    | "审批驳回"
    | "发货完成"
    | "确认取消"
    | "提交收货"
    | "确认收货"
    | "驳回收货";
  remark: string;
  operatedAt: string;
};

export type EDistributionOrderRecord = {
  id: string;
  orderNo: string;
  platformCode: string;
  platformName: string;
  distributorName: string;
  distributorCode: string;
  serviceProviderName: string;
  serviceProviderCode: string;
  productSummary: string;
  totalQuantity: number;
  orderAmount: number;
  products: OrderProductItem[];
  consigneeId?: string;
  consigneeName: string;
  consigneePhone: string;
  consigneeProvince: string;
  consigneeCity: string;
  consigneeDistrict: string;
  consigneeAddress: string;
  consigneePostalCode: string;
  paymentProof?: string;
  isAbnormal?: boolean;
  createdAt: string;
  status: EDistributionOrderStatus;
  currentApprovalType?: ApprovalType;
  currentApprovalNode?: string;
  approvalStep?: number;
  shipmentNo?: string;
  shippedAt?: string;
  shipmentDetails?: OrderFulfillmentItem[];
  receivingDetails?: OrderFulfillmentItem[];
  cancelReason?: string;
  receipt?: OrderReceiptInfo;
  approvalHistory: OrderApprovalHistory[];
};

export const createOrderApprovalNodes = ["平台订单初审", "渠道复核", "风控复核", "运营终审"];

export const eDistributionOrderSeedRecords: EDistributionOrderRecord[] = [
  {
    id: "ed-order-001",
    orderNo: "EOD20260314001",
    platformCode: "PLAT-001",
    platformName: "京东",
    distributorName: "苏州云启渠道有限公司",
    distributorCode: "EDS240305",
    serviceProviderName: "华东履约服务商",
    serviceProviderCode: "SP-001",
    productSummary: "金装奶品 250ml 等 2 件商品",
    totalQuantity: 180,
    orderAmount: 3804,
    products: [
      {
        id: "order-item-001",
        productCode: "SKU-10001",
        productName: "金装奶品 250ml",
        healthType: "好货",
        unitPrice: 22.2,
        quantity: 120,
        amount: 2664,
      },
      {
        id: "order-item-002",
        productCode: "SKU-10002",
        productName: "即饮咖啡 300ml",
        healthType: "过半",
        unitPrice: 19.5,
        quantity: 60,
        amount: 1140,
      },
    ],
    consigneeId: "addr-001",
    consigneeName: "何齐",
    consigneePhone: "13501762348",
    consigneeProvince: "江苏省",
    consigneeCity: "苏州市",
    consigneeDistrict: "工业园区",
    consigneeAddress: "星湖街 88 号 3 幢 201 室",
    consigneePostalCode: "215021",
    paymentProof: "付款证明_EOD20260314001.pdf",
    createdAt: "2026-03-14 09:10",
    status: "待审批",
    currentApprovalType: "新建订单",
    currentApprovalNode: "平台订单初审",
    approvalStep: 1,
    approvalHistory: [
      {
        id: "history-001",
        type: "新建订单",
        nodeName: "分销商提交订单",
        role: "分销商",
        account: "13501762348",
        actorName: "周睿",
        decision: "提交",
        remark: "订单已按平台与价格规则提交。",
        operatedAt: "2026-03-14 09:10",
      },
    ],
  },
  {
    id: "ed-order-002",
    orderNo: "EOD20260313007",
    platformCode: "PLAT-002",
    platformName: "淘宝",
    distributorName: "上海联享分销有限公司",
    distributorCode: "EDS240301",
    serviceProviderName: "华东履约服务商",
    serviceProviderCode: "SP-001",
    productSummary: "即饮咖啡 300ml",
    totalQuantity: 80,
    orderAmount: 1776,
    products: [
      {
        id: "order-item-003",
        productCode: "SKU-10002",
        productName: "即饮咖啡 300ml",
        healthType: "好货",
        unitPrice: 22.2,
        quantity: 80,
        amount: 1776,
      },
    ],
    consigneeId: "addr-001",
    consigneeName: "王曦",
    consigneePhone: "13856217890",
    consigneeProvince: "上海市",
    consigneeCity: "上海市",
    consigneeDistrict: "浦东新区",
    consigneeAddress: "张江路 166 号",
    consigneePostalCode: "201203",
    paymentProof: "付款证明_EOD20260313007.pdf",
    createdAt: "2026-03-13 15:20",
    status: "待发货",
    shipmentDetails: [],
    approvalHistory: [
      {
        id: "history-002",
        type: "新建订单",
        nodeName: "分销商提交订单",
        role: "分销商",
        account: "13856217890",
        actorName: "王曦",
        decision: "提交",
        remark: "常规补货订单。",
        operatedAt: "2026-03-13 15:20",
      },
      {
        id: "history-003",
        type: "新建订单",
        nodeName: "平台订单初审",
        role: "管理员",
        account: "admin",
        actorName: "徐衡",
        decision: "审批通过",
        remark: "首节点通过。",
        operatedAt: "2026-03-13 15:40",
      },
      {
        id: "history-004",
        type: "新建订单",
        nodeName: "渠道复核",
        role: "管理员",
        account: "admin",
        actorName: "徐衡",
        decision: "审批通过",
        remark: "渠道复核通过。",
        operatedAt: "2026-03-13 16:00",
      },
      {
        id: "history-005",
        type: "新建订单",
        nodeName: "风控复核",
        role: "管理员",
        account: "admin",
        actorName: "徐衡",
        decision: "审批通过",
        remark: "风控通过。",
        operatedAt: "2026-03-13 16:18",
      },
      {
        id: "history-006",
        type: "新建订单",
        nodeName: "运营终审",
        role: "管理员",
        account: "admin",
        actorName: "徐衡",
        decision: "审批通过",
        remark: "终审通过，转服务商待发货。",
        operatedAt: "2026-03-13 16:35",
      },
    ],
  },
  {
    id: "ed-order-003",
    orderNo: "EOD20260312005",
    platformCode: "PLAT-004",
    platformName: "拼多多",
    distributorName: "广州星河渠道管理有限公司",
    distributorCode: "EDS240302",
    serviceProviderName: "华南仓配服务商",
    serviceProviderCode: "SP-002",
    productSummary: "经典 RTD 饮品",
    totalQuantity: 60,
    orderAmount: 1212,
    products: [
      {
        id: "order-item-004",
        productCode: "SKU-10003",
        productName: "经典 RTD 饮品",
        healthType: "过三",
        unitPrice: 20.2,
        quantity: 60,
        amount: 1212,
      },
    ],
    consigneeName: "梁可",
    consigneePhone: "13922457890",
    consigneeProvince: "广东省",
    consigneeCity: "广州市",
    consigneeDistrict: "天河区",
    consigneeAddress: "体育东路 28 号",
    consigneePostalCode: "510620",
    paymentProof: "付款证明_EOD20260312005.pdf",
    createdAt: "2026-03-12 10:05",
    status: "待收货",
    shipmentNo: "SHIP2026031201",
    shippedAt: "2026-03-12 17:20",
    shipmentDetails: [
      {
        id: "ship-item-001",
        productCode: "SKU-10003",
        productName: "经典 RTD 饮品",
        healthType: "过三",
        batchNo: "RTD260312A",
        quantity: 60,
      },
    ],
    receivingDetails: [],
    approvalHistory: [],
  },
  {
    id: "ed-order-004",
    orderNo: "EOD20260311003",
    platformCode: "PLAT-001",
    platformName: "京东",
    distributorName: "上海联享分销有限公司",
    distributorCode: "EDS240301",
    serviceProviderName: "华东履约服务商",
    serviceProviderCode: "SP-001",
    productSummary: "金装奶品 250ml",
    totalQuantity: 100,
    orderAmount: 2220,
    products: [
      {
        id: "order-item-005",
        productCode: "SKU-10001",
        productName: "金装奶品 250ml",
        healthType: "好货",
        unitPrice: 22.2,
        quantity: 100,
        amount: 2220,
      },
    ],
    consigneeName: "刘彬",
    consigneePhone: "13856217890",
    consigneeProvince: "上海市",
    consigneeCity: "上海市",
    consigneeDistrict: "浦东新区",
    consigneeAddress: "盛夏路 56 号",
    consigneePostalCode: "201203",
    paymentProof: "付款证明_EOD20260311003.pdf",
    createdAt: "2026-03-11 09:18",
    status: "收货异常待确认",
    isAbnormal: true,
    shipmentNo: "SHIP2026031103",
    shippedAt: "2026-03-11 15:30",
    shipmentDetails: [
      {
        id: "ship-item-002",
        productCode: "SKU-10001",
        productName: "金装奶品 250ml",
        healthType: "好货",
        batchNo: "MILK260311B",
        quantity: 100,
      },
    ],
    receivingDetails: [
      {
        id: "receive-item-001",
        productCode: "SKU-10001",
        productName: "金装奶品 250ml",
        healthType: "好货",
        batchNo: "MILK260311B",
        quantity: 96,
        abnormalReason: "收货数量异常",
      },
    ],
    receipt: {
      receiptDetails: "已到货 100 件，外箱完好。",
      receiptDocumentNo: "RCV2026031101",
      submittedAt: "2026-03-12 10:20",
    },
    approvalHistory: [],
  },
  {
    id: "ed-order-005",
    orderNo: "EOD20260310002",
    platformCode: "PLAT-003",
    platformName: "天猫",
    distributorName: "苏州云启渠道有限公司",
    distributorCode: "EDS240305",
    serviceProviderName: "华东履约服务商",
    serviceProviderCode: "SP-001",
    productSummary: "即饮咖啡 300ml",
    totalQuantity: 40,
    orderAmount: 780,
    products: [
      {
        id: "order-item-006",
        productCode: "SKU-10002",
        productName: "即饮咖啡 300ml",
        healthType: "过半",
        unitPrice: 19.5,
        quantity: 40,
        amount: 780,
      },
    ],
    consigneeName: "何齐",
    consigneePhone: "13501762348",
    consigneeProvince: "江苏省",
    consigneeCity: "苏州市",
    consigneeDistrict: "工业园区",
    consigneeAddress: "星湖街 88 号 3 幢 201 室",
    consigneePostalCode: "215021",
    paymentProof: "付款证明_EOD20260310002.pdf",
    createdAt: "2026-03-10 13:10",
    status: "收货待重新提交",
    shipmentNo: "SHIP2026031002",
    shippedAt: "2026-03-10 18:10",
    shipmentDetails: [
      {
        id: "ship-item-003",
        productCode: "SKU-10002",
        productName: "即饮咖啡 300ml",
        healthType: "过半",
        batchNo: "COF260310C",
        quantity: 40,
      },
    ],
    receivingDetails: [
      {
        id: "receive-item-002",
        productCode: "SKU-10002",
        productName: "即饮咖啡 300ml",
        healthType: "过半",
        batchNo: "COF260310C",
        quantity: 40,
      },
    ],
    receipt: {
      receiptDetails: "签收单缺失页码，请重新提交。",
      receiptDocumentNo: "RCV2026031002",
      submittedAt: "2026-03-11 09:05",
    },
    approvalHistory: [],
  },
  {
    id: "ed-order-006",
    orderNo: "EOD20260309001",
    platformCode: "PLAT-001",
    platformName: "京东",
    distributorName: "上海联享分销有限公司",
    distributorCode: "EDS240301",
    serviceProviderName: "华东履约服务商",
    serviceProviderCode: "SP-001",
    productSummary: "经典 RTD 饮品",
    totalQuantity: 50,
    orderAmount: 1010,
    products: [
      {
        id: "order-item-007",
        productCode: "SKU-10003",
        productName: "经典 RTD 饮品",
        healthType: "过三",
        unitPrice: 20.2,
        quantity: 50,
        amount: 1010,
      },
    ],
    consigneeName: "王曦",
    consigneePhone: "13856217890",
    consigneeProvince: "上海市",
    consigneeCity: "上海市",
    consigneeDistrict: "浦东新区",
    consigneeAddress: "张江路 166 号",
    consigneePostalCode: "201203",
    paymentProof: "付款证明_EOD20260309001.pdf",
    createdAt: "2026-03-09 11:30",
    status: "已完成",
    shipmentNo: "SHIP2026030901",
    shippedAt: "2026-03-09 16:00",
    shipmentDetails: [
      {
        id: "ship-item-004",
        productCode: "SKU-10003",
        productName: "经典 RTD 饮品",
        healthType: "过三",
        batchNo: "RTD260309D",
        quantity: 50,
      },
    ],
    receivingDetails: [
      {
        id: "receive-item-003",
        productCode: "SKU-10003",
        productName: "经典 RTD 饮品",
        healthType: "过三",
        batchNo: "RTD260309D",
        quantity: 50,
      },
    ],
    receipt: {
      receiptDetails: "签收完成，明细一致。",
      receiptDocumentNo: "RCV2026030901",
      submittedAt: "2026-03-10 08:40",
    },
    approvalHistory: [],
  },
];
