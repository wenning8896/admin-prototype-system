import dayjs from "dayjs";

export type AgreementStage =
  | "待签约审批"
  | "待服务商补充"
  | "待分销商签署"
  | "待服务商签署"
  | "已签署完成"
  | "审批驳回";

export type ApprovalDecision = "发起申请" | "审批通过" | "审批驳回";

export type ApprovalHistoryItem = {
  id: string;
  roleLabel: string;
  account: string;
  operatorName: string;
  actedAt: string;
  decision: ApprovalDecision;
  remark: string;
};

export type ServiceProviderOption = {
  id: string;
  name: string;
  owner: string;
  region: string;
};

export type AgreementClauseItem = {
  id: string;
  clauseTitle: string;
  defaultRule: string;
  editable: boolean;
  description: string;
};

export type PurchaseAgreementRecord = {
  id: string;
  applicationNo: string;
  agreementNo?: string;
  distributorId: string;
  distributorName: string;
  distributorCode: string;
  serviceProviderId: string;
  serviceProviderName: string;
  serviceProviderOwner: string;
  status: AgreementStage;
  currentApprovalNode: string;
  createdAt: string;
  approvalAt?: string;
  serviceProviderSubmittedAt?: string;
  distributorSignedAt?: string;
  serviceProviderSignedAt?: string;
  approvalHistory: ApprovalHistoryItem[];
  serviceProviderSupplement?: {
    partyBName: string;
    partyBContact: string;
    partyBPhone: string;
    partyBAddress: string;
    clauseItems: AgreementClauseItem[];
  };
  distributorContract?: {
    partyAName: string;
    partyAContact: string;
    partyAPhone: string;
    consigneeName: string;
    consigneePhone: string;
    consigneeAddress: string;
  };
};

type DistributorAgreementOverview = {
  hasAgreement: boolean;
  hasActiveAgreement: boolean;
  latestAgreementStatus: AgreementStage | "未发起";
  relatedServiceProviders: Array<{
    id: string;
    name: string;
    owner: string;
    status: "已关联" | "签约中";
  }>;
};

const STORAGE_KEY = "csl-purchase-agreement-flow";

export const serviceProviderOptions: ServiceProviderOption[] = [
  { id: "sp-001", name: "华东履约服务商", owner: "周奕", region: "华东大区" },
  { id: "sp-002", name: "浦东仓配服务商", owner: "沈岚", region: "上海浦东" },
  { id: "sp-003", name: "西南区域服务商", owner: "马昭", region: "西南大区" },
  { id: "sp-004", name: "苏南服务商", owner: "夏桐", region: "苏南大区" },
];

const seedAgreements: PurchaseAgreementRecord[] = [
  {
    id: "pa-001",
    applicationNo: "SQ-202603-001",
    agreementNo: "GXY-202603-001",
    distributorId: "ed-001",
    distributorName: "上海联享分销有限公司",
    distributorCode: "EDS240301",
    serviceProviderId: "sp-001",
    serviceProviderName: "华东履约服务商",
    serviceProviderOwner: "周奕",
    status: "已签署完成",
    currentApprovalNode: "已完成",
    createdAt: "2026-03-02 10:08",
    approvalAt: "2026-03-02 15:20",
    serviceProviderSubmittedAt: "2026-03-03 09:30",
    distributorSignedAt: "2026-03-03 14:10",
    serviceProviderSignedAt: "2026-03-04 11:45",
    approvalHistory: [
      {
        id: "hist-001",
        roleLabel: "管理员",
        account: "admin",
        operatorName: "周睿",
        actedAt: "2026-03-02 10:08",
        decision: "发起申请",
        remark: "为分销商发起与华东履约服务商的购销协议流程。",
      },
      {
        id: "hist-002",
        roleLabel: "管理员",
        account: "admin",
        operatorName: "周睿",
        actedAt: "2026-03-02 15:20",
        decision: "审批通过",
        remark: "主体资料齐全，允许进入服务商补充环节。",
      },
    ],
    serviceProviderSupplement: {
      partyBName: "华东履约服务商",
      partyBContact: "周奕",
      partyBPhone: "13800001234",
      partyBAddress: "上海市浦东新区锦绣路 188 号",
      clauseItems: [
        {
          id: "clause-1",
          clauseTitle: "月度进货额月度指标",
          defaultRule: "100%完成，月返利 1%",
          editable: true,
          description: "百分比需支持编辑",
        },
        {
          id: "clause-2",
          clauseTitle: "季度进货额季度指标",
          defaultRule: "100%完成，季返利 1%",
          editable: true,
          description: "原描述为“季度进货额月度指标”，建议产品和业务统一口径",
        },
        {
          id: "clause-3",
          clauseTitle: "订单系统维护及数据准确度",
          defaultRule: "无误，月返 1%",
          editable: true,
          description: "百分比需支持编辑",
        },
        {
          id: "clause-4",
          clauseTitle: "市场秩序管理规则",
          defaultRule: "季度无投诉，季返 1%",
          editable: true,
          description: "百分比需支持编辑",
        },
      ],
    },
    distributorContract: {
      partyAName: "上海联享分销有限公司",
      partyAContact: "王曦",
      partyAPhone: "13856217890",
      consigneeName: "李湛",
      consigneePhone: "13911112222",
      consigneeAddress: "上海市闵行区申长路 699 号 2 幢 3 楼",
    },
  },
];

function readStoredAgreements() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as PurchaseAgreementRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredAgreements(records: PurchaseAgreementRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function readAllAgreements() {
  return [...readStoredAgreements(), ...seedAgreements].map((item) => {
    if (!item.serviceProviderSupplement) {
      return item;
    }

    const legacySupplement = item.serviceProviderSupplement as typeof item.serviceProviderSupplement & {
      cooperationMode?: string;
      settlementRule?: string;
      clauseRemark?: string;
    };

    const clauseItems = item.serviceProviderSupplement.clauseItems ?? [
      {
        id: `${item.id}-clause-legacy`,
        clauseTitle: "协议条款说明",
        defaultRule: [legacySupplement.cooperationMode, legacySupplement.settlementRule]
          .filter(Boolean)
          .join(" / "),
        editable: true,
        description: legacySupplement.clauseRemark ?? "",
      },
    ];

    return {
      ...item,
      serviceProviderSupplement: {
        partyBName: item.serviceProviderSupplement.partyBName,
        partyBContact: item.serviceProviderSupplement.partyBContact,
        partyBPhone: item.serviceProviderSupplement.partyBPhone,
        partyBAddress: item.serviceProviderSupplement.partyBAddress,
        clauseItems,
      },
    };
  });
}

function createApplicationNo(index: number) {
  return `SQ-${dayjs().format("YYYYMM")}-${String(index).padStart(3, "0")}`;
}

function createAgreementNo(index: number) {
  return `GXY-${dayjs().format("YYYYMM")}-${String(index).padStart(3, "0")}`;
}

export async function listPurchaseAgreements() {
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  return readAllAgreements().sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
}

export async function getPurchaseAgreementById(id: string) {
  const all = await listPurchaseAgreements();
  return all.find((item) => item.id === id);
}

export function getDistributorAgreementOverview() {
  const agreements = readAllAgreements();
  const overviewMap: Record<string, DistributorAgreementOverview> = {};

  for (const item of agreements) {
    if (!overviewMap[item.distributorId]) {
      overviewMap[item.distributorId] = {
        hasAgreement: true,
        hasActiveAgreement: false,
        latestAgreementStatus: item.status,
        relatedServiceProviders: [],
      };
    }

    overviewMap[item.distributorId].latestAgreementStatus = item.status;

    if (item.status !== "已签署完成" && item.status !== "审批驳回") {
      overviewMap[item.distributorId].hasActiveAgreement = true;
    }

    overviewMap[item.distributorId].relatedServiceProviders.push({
      id: item.serviceProviderId,
      name: item.serviceProviderName,
      owner: item.serviceProviderOwner,
      status: item.status === "已签署完成" ? "已关联" : "签约中",
    });
  }

  return overviewMap;
}

export async function initiatePurchaseAgreement(payload: {
  distributorId: string;
  distributorName: string;
  distributorCode: string;
  serviceProviderId: string;
  initiatorAccount: string;
  initiatorName: string;
}) {
  const stored = readStoredAgreements();
  const all = readAllAgreements();
  const existed = all.find((item) => item.distributorId === payload.distributorId);

  if (existed) {
    throw new Error("当前分销商已存在签约记录，不能重复发起协议。");
  }

  const provider = serviceProviderOptions.find((item) => item.id === payload.serviceProviderId);
  if (!provider) {
    throw new Error("请选择服务商后再发起协议。");
  }

  const nextRecord: PurchaseAgreementRecord = {
    id: `pa-${Date.now()}`,
    applicationNo: createApplicationNo(all.length + 1),
    distributorId: payload.distributorId,
    distributorName: payload.distributorName,
    distributorCode: payload.distributorCode,
    serviceProviderId: provider.id,
    serviceProviderName: provider.name,
    serviceProviderOwner: provider.owner,
    status: "待签约审批",
    currentApprovalNode: "平台签约审批",
    createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
    approvalHistory: [
      {
        id: `hist-${Date.now()}`,
        roleLabel: "管理员",
        account: payload.initiatorAccount,
        operatorName: payload.initiatorName,
        actedAt: dayjs().format("YYYY-MM-DD HH:mm"),
        decision: "发起申请",
        remark: `为 ${payload.distributorName} 发起与 ${provider.name} 的购销协议申请。`,
      },
    ],
  };

  persistStoredAgreements([nextRecord, ...stored]);
  return nextRecord;
}

export async function reviewPurchaseAgreement(payload: {
  id: string;
  action: "approve" | "reject";
  remark: string;
  reviewerAccount: string;
  reviewerName: string;
}) {
  const stored = readStoredAgreements();
  const target = stored.find((item) => item.id === payload.id);
  if (!target) {
    throw new Error("未找到当前审批记录。");
  }

  const all = readAllAgreements();
  const nextAgreementNo = payload.action === "approve" ? createAgreementNo(all.length + 1) : target.agreementNo;

  const next = stored.map((item) =>
    item.id === payload.id
      ? {
          ...item,
          agreementNo: nextAgreementNo,
          status: payload.action === "approve" ? ("待服务商补充" as AgreementStage) : ("审批驳回" as AgreementStage),
          currentApprovalNode: payload.action === "approve" ? "服务商补充信息" : "审批驳回",
          approvalAt: dayjs().format("YYYY-MM-DD HH:mm"),
          approvalHistory: [
            ...item.approvalHistory,
            {
              id: `hist-${Date.now()}`,
              roleLabel: "管理员",
              account: payload.reviewerAccount,
              operatorName: payload.reviewerName,
              actedAt: dayjs().format("YYYY-MM-DD HH:mm"),
              decision: payload.action === "approve" ? ("审批通过" as ApprovalDecision) : ("审批驳回" as ApprovalDecision),
              remark: payload.remark,
            },
          ],
        }
      : item,
  );

  persistStoredAgreements(next);
}

export async function submitServiceProviderAgreement(
  id: string,
  payload: {
    partyBName: string;
    partyBContact: string;
    partyBPhone: string;
    partyBAddress: string;
    clauseItems: AgreementClauseItem[];
  },
) {
  const stored = readStoredAgreements();
  const next = stored.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "待分销商签署" as AgreementStage,
          currentApprovalNode: "分销商签署",
          serviceProviderSubmittedAt: dayjs().format("YYYY-MM-DD HH:mm"),
          serviceProviderSupplement: payload,
        }
      : item,
  );
  persistStoredAgreements(next);
}

export async function signDistributorAgreement(
  id: string,
  payload: {
    partyAName: string;
    partyAContact: string;
    partyAPhone: string;
    consigneeName: string;
    consigneePhone: string;
    consigneeAddress: string;
  },
) {
  const stored = readStoredAgreements();
  const next = stored.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "待服务商签署" as AgreementStage,
          currentApprovalNode: "服务商签署",
          distributorSignedAt: dayjs().format("YYYY-MM-DD HH:mm"),
          distributorContract: payload,
        }
      : item,
  );
  persistStoredAgreements(next);
}

export async function signServiceProviderAgreement(id: string) {
  const stored = readStoredAgreements();
  const next = stored.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "已签署完成" as AgreementStage,
          currentApprovalNode: "已完成",
          serviceProviderSignedAt: dayjs().format("YYYY-MM-DD HH:mm"),
        }
      : item,
  );
  persistStoredAgreements(next);
}
