export type DealerDistributorSupplyRelationStatus = "待审批" | "启用" | "已驳回";

export type DealerDistributorSupplyRelationRecord = {
  id: string;
  businessUnit: string;
  dealerCode: string;
  dealerName: string;
  dealerType: string;
  distributorCode: string;
  distributorName: string;
  status: DealerDistributorSupplyRelationStatus;
  createdAt: string;
  updatedAt: string;
  approvalHistory: Array<{
    id: string;
    decision: "导入" | "审批通过" | "审批驳回";
    operatorName: string;
    account: string;
    actedAt: string;
    remark?: string;
  }>;
};

export const dealerDistributorSupplyRelationSeedRecords: DealerDistributorSupplyRelationRecord[] = [
  {
    id: "dds-001",
    businessUnit: "干货",
    dealerCode: "DL001",
    dealerName: "华东经销商A",
    dealerType: "经销商",
    distributorCode: "EDS240301",
    distributorName: "上海联享分销有限公司",
    status: "启用",
    createdAt: "2026-03-08 10:12",
    updatedAt: "2026-03-09 14:20",
    approvalHistory: [
      {
        id: "dds-001-h1",
        decision: "导入",
        operatorName: "系统管理员",
        account: "admin",
        actedAt: "2026-03-08 10:12",
        remark: "初始化关系数据",
      },
      {
        id: "dds-001-h2",
        decision: "审批通过",
        operatorName: "系统管理员",
        account: "admin",
        actedAt: "2026-03-09 14:20",
        remark: "经分供货关系审批通过",
      },
    ],
  },
  {
    id: "dds-002",
    businessUnit: "咖啡",
    dealerCode: "DL002",
    dealerName: "华南经销商B",
    dealerType: "DT经销商",
    distributorCode: "EDS240518",
    distributorName: "广州星河渠道管理有限公司",
    status: "待审批",
    createdAt: "2026-03-12 09:05",
    updatedAt: "2026-03-12 09:05",
    approvalHistory: [
      {
        id: "dds-002-h1",
        decision: "导入",
        operatorName: "系统管理员",
        account: "admin",
        actedAt: "2026-03-12 09:05",
        remark: "批量导入经分供货关系",
      },
    ],
  },
  {
    id: "dds-003",
    businessUnit: "奶品",
    dealerCode: "DL003",
    dealerName: "华北经销商C",
    dealerType: "经销商",
    distributorCode: "EDS240612",
    distributorName: "北京北辰供配有限公司",
    status: "已驳回",
    createdAt: "2026-03-13 11:30",
    updatedAt: "2026-03-14 16:10",
    approvalHistory: [
      {
        id: "dds-003-h1",
        decision: "导入",
        operatorName: "系统管理员",
        account: "admin",
        actedAt: "2026-03-13 11:30",
        remark: "批量导入经分供货关系",
      },
      {
        id: "dds-003-h2",
        decision: "审批驳回",
        operatorName: "系统管理员",
        account: "admin",
        actedAt: "2026-03-14 16:10",
        remark: "分销商主体尚未启用，请完善后重新导入",
      },
    ],
  },
];
