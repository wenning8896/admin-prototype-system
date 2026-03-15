export type InterceptionReleaseApplicationStatus = "待审批" | "审批通过" | "审批驳回";

export type InterceptionReleaseProductItem = {
  id: string;
  shipToCode: string;
  shipToName: string;
  shape2: string;
  productCode: string;
  productName: string;
};

export type InterceptionReleaseApplicationRecord = {
  id: string;
  applicationNo: string;
  businessUnit: string;
  region: string;
  cg: string;
  dealerCode: string;
  dealerName: string;
  applyReason: string;
  approvalStatus: InterceptionReleaseApplicationStatus;
  approvalNode: string;
  appliedAt: string;
  products: InterceptionReleaseProductItem[];
};

export const interceptionReleaseApplicationSeedRecords: InterceptionReleaseApplicationRecord[] = [
  {
    id: "interception-release-001",
    applicationNo: "JRJ20260315001",
    businessUnit: "OMNI",
    region: "华东大区",
    cg: "上海",
    dealerCode: "D1917070",
    dealerName: "辽宁嘉丰进出口贸易有限公司",
    applyReason: "客户紧急补货，需要临时放开库存拦截。",
    approvalStatus: "待审批",
    approvalNode: "平台审批节点",
    appliedAt: "2026-03-15 10:30",
    products: [
      {
        id: "interception-release-001-item-1",
        shipToCode: "SHIPTO0001",
        shipToName: "浦东收货点",
        shape2: "好货",
        productCode: "PDT-1001",
        productName: "雀巢咖啡经典款",
      },
    ],
  },
];
