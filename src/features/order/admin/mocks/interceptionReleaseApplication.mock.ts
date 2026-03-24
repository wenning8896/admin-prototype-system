export type InterceptionReleaseApplicationStatus = "待审批" | "审批通过" | "审批驳回";
export type InterceptionReleaseEffectiveStatus = "有效" | "失效";

export type InterceptionReleaseProductItem = {
  id: string;
  shipToCode: string;
  shipToName: string;
  shape2: string;
  productCode: string;
  productName: string;
};

export type InterceptionReleaseApprovalHistoryItem = {
  id: string;
  nodeName: string;
  decision: "提交审批" | "审批通过" | "审批驳回" | "置为失效";
  operatorName: string;
  account: string;
  role: string;
  operatedAt: string;
  remark: string;
};

export type InterceptionReleaseApplicationRecord = {
  id: string;
  applicationNo: string;
  businessUnit: string;
  region: string;
  cg: string;
  dealerCode: string;
  dealerName: string;
  l4: string;
  l5: string;
  l6: string;
  dealerType: "DD" | "DT";
  applyReason: string;
  attachmentName?: string;
  approvalStatus: InterceptionReleaseApplicationStatus;
  effectiveStatus: InterceptionReleaseEffectiveStatus;
  approvalNode: string;
  appliedAt: string;
  updatedAt: string;
  products: InterceptionReleaseProductItem[];
  approvalHistory: InterceptionReleaseApprovalHistoryItem[];
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
    l4: "L4-A",
    l5: "L5-A",
    l6: "L6-A",
    dealerType: "DT",
    applyReason: "客户紧急补货，需要临时放开库存拦截。",
    attachmentName: "解除拦截申请说明.pdf",
    approvalStatus: "待审批",
    effectiveStatus: "失效",
    approvalNode: "平台审批节点",
    appliedAt: "2026-03-15 10:30",
    updatedAt: "2026-03-15 10:30",
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
    approvalHistory: [
      {
        id: "interception-release-001-history-1",
        nodeName: "经销商提交",
        decision: "提交审批",
        operatorName: "陈晓峰",
        account: "dealer.omni",
        role: "经销商",
        operatedAt: "2026-03-15 10:30",
        remark: "客户紧急补货，需要临时放开库存拦截。",
      },
    ],
  },
  {
    id: "interception-release-002",
    applicationNo: "JRJ20260316002",
    businessUnit: "OMNI",
    region: "华南大区",
    cg: "广州",
    dealerCode: "D2100458",
    dealerName: "广东鹏瑞医药有限公司",
    l4: "L4-B",
    l5: "L5-B",
    l6: "L6-B",
    dealerType: "DD",
    applyReason: "重点终端补货，申请临时解除库存拦截。",
    attachmentName: "华南重点门店补货说明.xlsx",
    approvalStatus: "审批通过",
    effectiveStatus: "有效",
    approvalNode: "审批完成",
    appliedAt: "2026-03-16 14:20",
    updatedAt: "2026-03-16 15:05",
    products: [
      {
        id: "interception-release-002-item-1",
        shipToCode: "SHIPTO0092",
        shipToName: "广州白云仓",
        shape2: "好货",
        productCode: "PDT-5012",
        productName: "雀巢咖啡低糖款",
      },
      {
        id: "interception-release-002-item-2",
        shipToCode: "SHIPTO0092",
        shipToName: "广州白云仓",
        shape2: "好货",
        productCode: "PDT-6020",
        productName: "雀巢奶咖原味",
      },
    ],
    approvalHistory: [
      {
        id: "interception-release-002-history-1",
        nodeName: "经销商提交",
        decision: "提交审批",
        operatorName: "刘颖",
        account: "dealer.gz",
        role: "经销商",
        operatedAt: "2026-03-16 14:20",
        remark: "重点终端活动备货，申请临时解除拦截。",
      },
      {
        id: "interception-release-002-history-2",
        nodeName: "平台审批节点",
        decision: "审批通过",
        operatorName: "管理员",
        account: "admin",
        role: "管理员",
        operatedAt: "2026-03-16 15:05",
        remark: "需求合理，同意解除拦截。",
      },
    ],
  },
  {
    id: "interception-release-003",
    applicationNo: "JRJ20260317003",
    businessUnit: "OMNI",
    region: "西南大区",
    cg: "成都",
    dealerCode: "D3200186",
    dealerName: "四川新蓉医药科技有限公司",
    l4: "L4-C",
    l5: "L5-C",
    l6: "L6-C",
    dealerType: "DT",
    applyReason: "申请放开库存限制，但未提供完整补货依据。",
    attachmentName: "成都门店补货申请.pdf",
    approvalStatus: "审批驳回",
    effectiveStatus: "失效",
    approvalNode: "-",
    appliedAt: "2026-03-17 09:10",
    updatedAt: "2026-03-17 10:00",
    products: [
      {
        id: "interception-release-003-item-1",
        shipToCode: "SHIPTO0388",
        shipToName: "成都双流仓",
        shape2: "好货",
        productCode: "PDT-7005",
        productName: "雀巢咖啡拿铁款",
      },
    ],
    approvalHistory: [
      {
        id: "interception-release-003-history-1",
        nodeName: "经销商提交",
        decision: "提交审批",
        operatorName: "王琳",
        account: "dealer.cd",
        role: "经销商",
        operatedAt: "2026-03-17 09:10",
        remark: "门店补货申请，先提交流程。",
      },
      {
        id: "interception-release-003-history-2",
        nodeName: "平台审批节点",
        decision: "审批驳回",
        operatorName: "管理员",
        account: "admin",
        role: "管理员",
        operatedAt: "2026-03-17 10:00",
        remark: "附件依据不完整，暂不通过。",
      },
    ],
  },
];
