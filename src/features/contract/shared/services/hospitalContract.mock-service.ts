import dayjs from "dayjs";
import { utils, writeFileXLSX } from "xlsx";
import type {
  ContractActionType,
  ContractApprovalStatus,
  ContractApprovalHistory,
  ContractLifeStatus,
  ContractVersionRecord,
  HospitalContractDetailValues,
  HospitalContractProduct,
  HospitalContractRecord,
} from "../mocks/hospitalContract.mock";
import { contractApprovalNodeSequence, contractSeedRecords } from "../mocks/hospitalContract.mock";

const STORAGE_KEY = "csl-contract-hospital-contracts";

export type HospitalContractFilters = {
  contractNo?: string;
  dealerCode?: string;
  hospitalCode?: string;
  approvalStatus?: ContractApprovalStatus;
  actionType?: ContractActionType;
  submitterName?: string;
  lifeStatus?: ContractLifeStatus;
};

export type ContractReviewTab = "pending" | "reviewed";

type ContractActor = {
  name: string;
  account: string;
  roleLabel: string;
};

export type DealerProfile = {
  dealerCode: string;
  dealerName: string;
  region: string;
  cg: string;
  province: string;
};

function wait() {
  return new Promise((resolve) => window.setTimeout(resolve, 180));
}

function getComputedLifeStatus(record: Pick<HospitalContractRecord, "approvalStatus" | "lifeStatus" | "signedAt" | "expiredAt">) {
  if (record.lifeStatus === "关闭" || String(record.lifeStatus) === "无效") {
    return "关闭" as const;
  }

  if (record.approvalStatus !== "审核通过") {
    return record.lifeStatus === "待生效" ? "待生效" : "有效";
  }

  const today = dayjs().startOf("day");
  const signedAt = dayjs(record.signedAt).startOf("day");
  const expiredAt = dayjs(record.expiredAt).startOf("day");

  if (signedAt.isValid() && signedAt.isAfter(today)) {
    return "待生效" as const;
  }

  if (expiredAt.isValid() && expiredAt.isBefore(today)) {
    return "失效" as const;
  }

  return "有效" as const;
}

function readStoredRecords() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as HospitalContractRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: HospitalContractRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getMergedRecords() {
  const stored = readStoredRecords();
  const merged = [...contractSeedRecords];

  stored.forEach((record) => {
    const index = merged.findIndex((item) => item.id === record.id);
    if (index >= 0) {
      merged[index] = record;
      return;
    }

    merged.unshift(record);
  });

  return merged.map((item) => ({
    ...item,
    lifeStatus: getComputedLifeStatus(item),
  }));
}

function persistMergedRecord(nextRecord: HospitalContractRecord) {
  const stored = readStoredRecords();
  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);

  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredRecords(next);
    return;
  }

  const seedIndex = contractSeedRecords.findIndex((item) => item.id === nextRecord.id);
  if (seedIndex >= 0) {
    persistStoredRecords([...stored, nextRecord]);
    return;
  }

  persistStoredRecords([nextRecord, ...stored]);
}

function buildContractId() {
  return `CONTRACT-${dayjs().format("YYYYMMDDHHmmss")}-${Math.floor(Math.random() * 900 + 100)}`;
}

export function getDealerProfile(account?: string): DealerProfile {
  const merged = getMergedRecords();
  const exactMatch = merged.find((item) => item.submitterAccount === account);
  if (exactMatch) {
    return {
      dealerCode: exactMatch.dealerCode,
      dealerName: exactMatch.dealerName,
      region: exactMatch.region,
      cg: exactMatch.cg,
      province: exactMatch.province,
    };
  }

  const defaultDealer = merged.find((item) => item.dealerCode === "D1917070") ?? merged[0];
  return {
    dealerCode: defaultDealer?.dealerCode ?? "",
    dealerName: defaultDealer?.dealerName ?? "",
    region: defaultDealer?.region ?? "",
    cg: defaultDealer?.cg ?? "",
    province: defaultDealer?.province ?? "",
  };
}

function buildVersionLabel(record: HospitalContractRecord) {
  const version = record.versions.length + 1;
  return `V${version}.0`;
}

function buildVersionRecord(record: HospitalContractRecord, actionType: ContractActionType, actorName: string): ContractVersionRecord {
  const versionLabel = buildVersionLabel(record);
  return {
    id: `${record.id}-version-${record.versions.length + 1}`,
    versionLabel,
    actionType,
    createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
    operatorName: actorName,
    exportFileName: `${record.contractNo}_${versionLabel}.pdf`,
  };
}

function nextApprovalNode(currentNode?: string) {
  if (!currentNode) {
    return contractApprovalNodeSequence[0];
  }

  const index = contractApprovalNodeSequence.indexOf(currentNode);
  if (index < 0 || index === contractApprovalNodeSequence.length - 1) {
    return undefined;
  }

  return contractApprovalNodeSequence[index + 1];
}

function toRecord(values: HospitalContractDetailValues, actor: ContractActor, existing?: HospitalContractRecord) {
  const now = dayjs().format("YYYY-MM-DD HH:mm");

  return {
    id: existing?.id ?? `contract-${Date.now()}`,
    contractId: existing?.contractId ?? existing?.id ?? buildContractId(),
    sourceContractId: existing?.sourceContractId,
    removedFromApproval: existing?.removedFromApproval ?? false,
    contractNo: existing?.contractNo ?? `HT-${dayjs().format("YYYYMM")}-${String(Math.floor(Math.random() * 900) + 100)}`,
    approvalStatus: existing?.approvalStatus ?? "草稿",
    lifeStatus: existing?.lifeStatus ?? "待生效",
    pendingAction: existing?.pendingAction,
    latestActionType: existing?.latestActionType,
    currentApprovalNode: existing?.currentApprovalNode,
    submitterName: existing?.submitterName ?? actor.name,
    submitterAccount: existing?.submitterAccount ?? actor.account,
    dmsHospitalCode: values.dmsHospitalCode,
    dmsHospitalName: values.dmsHospitalName,
    dmsHospitalCooperationStatus: values.dmsHospitalCooperationStatus,
    signHospitalEtmsId: values.signHospitalEtmsId,
    useProductEtmsId: values.useProductEtmsId,
    dealerCode: values.dealerCode,
    dealerName: values.dealerName,
    region: values.region,
    cg: values.cg,
    province: values.province,
    dmsHospitalAddress: values.dmsHospitalAddress,
    deliveryAddress: values.deliveryAddress,
    contractForm: values.contractForm,
    transferType: values.transferType,
    contractDepartmentType: values.contractDepartmentType,
    signatoryFullName: values.signatoryFullName,
    sealName: values.sealName,
    paymentAccount: values.paymentAccount,
    accountHolderName: values.accountHolderName,
    bankName: values.bankName,
    signedAt: values.signedAt,
    expiredAt: values.expiredAt,
    renewalType: values.renewalType,
    autoRenewYears: values.autoRenewYears,
    renewedDuration: values.renewedDuration,
    thirdPartyCompanyEstablishedAt: values.thirdPartyCompanyEstablishedAt,
    thirdPartyCompanyQualification: [values.thirdPartyBusinessLicenseName, values.thirdPartyFoodQualificationName].filter(Boolean).join(" / "),
    thirdPartyBusinessLicenseName: values.thirdPartyBusinessLicenseName,
    thirdPartyFoodQualificationName: values.thirdPartyFoodQualificationName,
    hospitalAuthorizationLetterName: values.hospitalAuthorizationLetterName,
    authorizationProofAttachmentName: values.hospitalAuthorizationLetterName,
    contractAttachmentName: values.contractAttachmentName,
    thirdPartyEffectiveAt: values.thirdPartyEffectiveAt,
    authorizationMode: values.authorizationMode,
    authorizationEffectiveAt: values.authorizationEffectiveAt,
    authorizationExpiredAt: values.authorizationExpiredAt,
    authorizedReceiver: values.authorizedReceiver,
    receivers: values.receivers,
    products: values.products,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    approvalHistory: existing?.approvalHistory ?? [],
    versions: existing?.versions ?? [],
  } satisfies HospitalContractRecord;
}

function buildSubmitHistory(record: HospitalContractRecord, actionType: ContractActionType, actor: ContractActor): ContractApprovalHistory {
  return {
    id: `${record.id}-history-${Date.now()}`,
    nodeName: actionType === "新建合同" ? "经销商提交" : actionType,
    decision: "提交申请",
    roleLabel: actor.roleLabel,
    operatorName: actor.name,
    account: actor.account,
    actedAt: dayjs().format("YYYY-MM-DD HH:mm"),
    remark: `${actionType}已提交审批。`,
  };
}

export async function listHospitalContracts(filters: HospitalContractFilters = {}, role: "admin" | "dealer" | "all" = "all") {
  await wait();
  const contractNo = filters.contractNo?.trim().toLowerCase();
  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const hospitalCode = filters.hospitalCode?.trim().toLowerCase();
  const submitterName = filters.submitterName?.trim().toLowerCase();

  return getMergedRecords().filter((item) => {
    if (item.approvalStatus !== "审核通过" || item.sourceContractId) {
      return false;
    }

    if (role === "dealer" && !item.dealerCode.startsWith("D")) {
      return true;
    }

    const matchesContractNo = !contractNo || item.contractNo.toLowerCase().includes(contractNo);
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesHospitalCode = !hospitalCode || item.dmsHospitalCode.toLowerCase().includes(hospitalCode);
    const matchesApprovalStatus = !filters.approvalStatus || item.approvalStatus === filters.approvalStatus;
    const matchesActionType = !filters.actionType || item.latestActionType === filters.actionType;
    const matchesSubmitter = !submitterName || item.submitterName.toLowerCase().includes(submitterName);
    const matchesLifeStatus = !filters.lifeStatus || item.lifeStatus === filters.lifeStatus;

    return (
      matchesContractNo &&
      matchesDealerCode &&
      matchesHospitalCode &&
      matchesApprovalStatus &&
      matchesActionType &&
      matchesSubmitter &&
      matchesLifeStatus
    );
  });
}

export async function listDealerHospitalContracts(dealerAccount: string, filters: HospitalContractFilters = {}) {
  const dealerProfile = getDealerProfile(dealerAccount);
  return listHospitalContracts(
    {
      ...filters,
      dealerCode: dealerProfile.dealerCode,
    },
    "all",
  );
}

export async function getHospitalContractById(id: string) {
  await wait();
  return getMergedRecords().find((item) => item.id === id) ?? null;
}

export async function saveHospitalContractDraft(values: HospitalContractDetailValues, actor: ContractActor, existingId?: string) {
  await wait();
  const existing = existingId ? getMergedRecords().find((item) => item.id === existingId) : undefined;
  const next = toRecord(values, actor, existing);
  next.approvalStatus = "草稿";
  next.pendingAction = undefined;
  next.currentApprovalNode = undefined;
  persistMergedRecord(next);
  return next;
}

export async function submitHospitalContractAction(
  values: HospitalContractDetailValues,
  actionType: ContractActionType,
  actor: ContractActor,
  existingId?: string,
) {
  await wait();
  const existing = existingId ? getMergedRecords().find((item) => item.id === existingId) : undefined;
  const baseRecord = toRecord(values, actor, existing);
  const submissionId = existing?.approvalStatus === "审核通过" ? `contract-submission-${Date.now()}` : baseRecord.id;
  const next: HospitalContractRecord = {
    ...baseRecord,
    id: submissionId,
    contractId: existing?.contractId ?? baseRecord.contractId,
    sourceContractId: existing?.approvalStatus === "审核通过" ? existing.id : existing?.sourceContractId,
    createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
    updatedAt: dayjs().format("YYYY-MM-DD HH:mm"),
    approvalHistory: existing?.approvalStatus === "审核通过" ? [...existing.approvalHistory] : (existing?.approvalHistory ?? []),
    versions: existing?.versions ?? [],
  };
  next.approvalStatus = "审核中";
  next.removedFromApproval = false;
  next.pendingAction = actionType;
  next.latestActionType = actionType;
  next.currentApprovalNode = contractApprovalNodeSequence[0];
  next.updatedAt = dayjs().format("YYYY-MM-DD HH:mm");
  next.approvalHistory = [...(existing?.approvalHistory ?? []), buildSubmitHistory(next, actionType, actor)];
  persistMergedRecord(next);
  return next;
}

export async function triggerContractClose(id: string, actor: ContractActor) {
  await wait();
  const record = getMergedRecords().find((item) => item.id === id);
  if (!record) {
    return null;
  }

  const next: HospitalContractRecord = {
    ...record,
    lifeStatus: "关闭",
    latestActionType: "关闭合同",
    pendingAction: undefined,
    currentApprovalNode: undefined,
    updatedAt: dayjs().format("YYYY-MM-DD HH:mm"),
    approvalHistory: [
      ...record.approvalHistory,
      {
        id: `${record.id}-history-${Date.now()}`,
        nodeName: "关闭合同",
        decision: "审批通过",
        roleLabel: actor.roleLabel,
        operatorName: actor.name,
        account: actor.account,
        actedAt: dayjs().format("YYYY-MM-DD HH:mm"),
        remark: "合同已直接关闭，不再进入审批流程。",
      },
    ],
    versions: [...record.versions, buildVersionRecord(record, "关闭合同", actor.name)],
  };

  persistMergedRecord(next);
  return next;
}

export async function reviewHospitalContract(params: {
  id: string;
  decision: "approve" | "reject";
  remark: string;
  attachmentName?: string;
  actor: ContractActor;
}) {
  await wait();
  const record = getMergedRecords().find((item) => item.id === params.id);
  if (!record || !record.currentApprovalNode || !record.pendingAction) {
    return null;
  }

  const historyItem: ContractApprovalHistory = {
    id: `${record.id}-history-${Date.now()}`,
    nodeName: record.currentApprovalNode,
    decision: params.decision === "approve" ? "审批通过" : "审批驳回",
    roleLabel: params.actor.roleLabel,
    operatorName: params.actor.name,
    account: params.actor.account,
    actedAt: dayjs().format("YYYY-MM-DD HH:mm"),
    remark: params.remark,
    attachmentName: params.attachmentName,
  };

  const nextNode = params.decision === "approve" ? nextApprovalNode(record.currentApprovalNode) : undefined;
  const next: HospitalContractRecord = {
    ...record,
    approvalHistory: [...record.approvalHistory, historyItem],
    updatedAt: dayjs().format("YYYY-MM-DD HH:mm"),
  };

  if (params.decision === "reject") {
    next.approvalStatus = "审核驳回";
    next.currentApprovalNode = undefined;
    next.pendingAction = undefined;
    next.removedFromApproval = false;
    persistMergedRecord(next);
    return next;
  }

  if (nextNode) {
    next.currentApprovalNode = nextNode;
    next.removedFromApproval = false;
    persistMergedRecord(next);
    return next;
  }

  next.approvalStatus = "审核通过";
  next.currentApprovalNode = undefined;
  next.pendingAction = undefined;

  if (record.pendingAction === "关闭合同") {
    next.lifeStatus = "关闭";
  } else {
    next.lifeStatus = getComputedLifeStatus(next);
  }

  if (record.pendingAction === "续签") {
    next.renewedDuration = `${record.versions.filter((item) => item.actionType === "续签").length + 1} 次`;
  }

  next.versions = [...record.versions, buildVersionRecord(record, record.pendingAction, params.actor.name)];

  if (!record.sourceContractId) {
    next.sourceContractId = undefined;
    next.removedFromApproval = true;
    persistMergedRecord(next);
    return next;
  }

  const sourceRecord = getMergedRecords().find((item) => item.id === record.sourceContractId);
  const effectiveRecord: HospitalContractRecord = {
    ...next,
    id: sourceRecord?.id ?? record.sourceContractId,
    contractId: sourceRecord?.contractId ?? record.contractId,
    sourceContractId: undefined,
    createdAt: sourceRecord?.createdAt ?? record.createdAt,
    removedFromApproval: true,
  };

  persistMergedRecord(next);
  persistMergedRecord(effectiveRecord);
  return effectiveRecord;
}

export async function deleteHospitalContractApproval(id: string) {
  await wait();
  const record = getMergedRecords().find((item) => item.id === id);
  if (!record) {
    return null;
  }

  const next: HospitalContractRecord = {
    ...record,
    removedFromApproval: true,
    updatedAt: dayjs().format("YYYY-MM-DD HH:mm"),
  };

  persistMergedRecord(next);
  return next;
}

export async function listContractApprovalQueue(filters: HospitalContractFilters = {}) {
  await wait();
  const contractNo = filters.contractNo?.trim().toLowerCase();
  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const hospitalCode = filters.hospitalCode?.trim().toLowerCase();
  const submitterName = filters.submitterName?.trim().toLowerCase();

  return getMergedRecords().filter((item) => {
    if (item.removedFromApproval) {
      return false;
    }

    if (item.approvalStatus !== "审核中" && item.approvalStatus !== "审核驳回") {
      return false;
    }

    const matchesContractNo = !contractNo || item.contractNo.toLowerCase().includes(contractNo);
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesHospitalCode = !hospitalCode || item.dmsHospitalCode.toLowerCase().includes(hospitalCode);
    const matchesActionType = !filters.actionType || item.latestActionType === filters.actionType;
    const matchesSubmitter = !submitterName || item.submitterName.toLowerCase().includes(submitterName);

    return matchesContractNo && matchesDealerCode && matchesHospitalCode && matchesActionType && matchesSubmitter;
  });
}

export async function listDealerContractApprovalQueue(dealerAccount: string, filters: HospitalContractFilters = {}) {
  const dealerProfile = getDealerProfile(dealerAccount);
  return listContractApprovalQueue({
    ...filters,
    dealerCode: dealerProfile.dealerCode,
  });
}

export async function listContractApprovals(tab: ContractReviewTab, actorAccount: string, filters: HospitalContractFilters = {}) {
  await wait();
  const contractNo = filters.contractNo?.trim().toLowerCase();
  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const hospitalCode = filters.hospitalCode?.trim().toLowerCase();
  const submitterName = filters.submitterName?.trim().toLowerCase();

  const all = getMergedRecords().filter((item) => {
    const matchesContractNo = !contractNo || item.contractNo.toLowerCase().includes(contractNo);
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesHospitalCode = !hospitalCode || item.dmsHospitalCode.toLowerCase().includes(hospitalCode);
    const matchesActionType = !filters.actionType || item.latestActionType === filters.actionType;
    const matchesSubmitter = !submitterName || item.submitterName.toLowerCase().includes(submitterName);

    return matchesContractNo && matchesDealerCode && matchesHospitalCode && matchesActionType && matchesSubmitter;
  });

  return all.filter((item) => {
    if (tab === "pending") {
      return item.approvalStatus === "审核中" && Boolean(item.currentApprovalNode);
    }

    return item.approvalHistory.some(
      (history) =>
        history.account === actorAccount && (history.decision === "审批通过" || history.decision === "审批驳回"),
    );
  });
}

export function exportHospitalContractList(records: HospitalContractRecord[], fileBaseName: string) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      合同编号: item.contractNo,
      合同ID: item.contractId,
      经销商名称: item.dealerName,
      DMS医院名称: item.dmsHospitalName,
      大区: item.region,
      CG: item.cg,
      省份: item.province,
      经销商编码: item.dealerCode,
      DMS医院编码: item.dmsHospitalCode,
      DMS医院合作状态: item.dmsHospitalCooperationStatus,
      医院地址: item.dmsHospitalAddress,
      合同形式: item.contractForm,
      转移类型: item.transferType,
      科室合同签署方类型: item.contractDepartmentType,
      合同签署方: item.signatoryFullName,
      医院收货地址: item.deliveryAddress,
      合同盖章名称: item.sealName,
      付款账号: item.paymentAccount,
      付款账号名称: item.accountHolderName,
      付款开户行: item.bankName,
      合同签署时间: item.signedAt,
      合同到期时间: item.expiredAt,
      延期类型: item.renewalType,
      已延期时间: item.renewedDuration,
      合同存续状态: item.lifeStatus,
      三方公司成立时间: item.thirdPartyCompanyEstablishedAt,
      医院指定三方公司营业执照和食品经营资质: item.thirdPartyCompanyQualification,
      医院指定第三方采购授权方式: item.authorizationMode,
      "上传三方公司医院授权书/隶属关系证明": item.authorizationProofAttachmentName,
      医院授权书生效时间: item.authorizationEffectiveAt,
      医院授权书失效时间: item.authorizationExpiredAt,
      医院授权第三方采购公司的指定收货人: item.authorizedReceiver,
      "签署合同医院ETMS-ID": item.signHospitalEtmsId,
      "使用产品医院ETMS-ID": item.useProductEtmsId,
      医院指定收货人1: item.receivers[0]?.receiverName ?? "",
      "医院指定收货人ID-1": item.receivers[0]?.receiverCode ?? "",
      医院指定收货人2: item.receivers[1]?.receiverName ?? "",
      "医院指定收货人ID-2": item.receivers[1]?.receiverCode ?? "",
      医院指定收货人3: item.receivers[2]?.receiverName ?? "",
      "医院指定收货人ID-3": item.receivers[2]?.receiverCode ?? "",
      医院指定收货人4: item.receivers[3]?.receiverName ?? "",
      "医院指定收货人ID-4": item.receivers[3]?.receiverCode ?? "",
    })),
  );
  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 24 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 30 },
    { wch: 24 },
    { wch: 24 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 32 },
    { wch: 26 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 28 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "合同列表");
  writeFileXLSX(workbook, `${fileBaseName}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function exportContractVersion(record: HospitalContractRecord, version: ContractVersionRecord) {
  const worksheet = utils.aoa_to_sheet([
    ["合同版本导出"],
    [],
    ["合同编号", record.contractNo],
    ["版本", version.versionLabel],
    ["动作", version.actionType],
    ["导出时间", dayjs().format("YYYY-MM-DD HH:mm")],
    ["经销商", record.dealerName],
    ["医院", record.dmsHospitalName],
  ]);
  worksheet["!cols"] = [{ wch: 18 }, { wch: 30 }];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "版本详情");
  writeFileXLSX(workbook, version.exportFileName.replace(".pdf", ".xlsx"));
}

export function buildDefaultContractValues(): HospitalContractDetailValues {
  return {
    dealerCode: "",
    dealerName: "",
    region: "",
    cg: "",
    province: "",
    dmsHospitalCode: "",
    dmsHospitalName: "",
    dmsHospitalCooperationStatus: "Y",
    signHospitalEtmsId: "",
    useProductEtmsId: "",
    dmsHospitalAddress: "",
    deliveryAddress: "",
    contractForm: "公对公合同-医院公章",
    transferType: "公对公转账（医院）",
    contractDepartmentType: "",
    signatoryFullName: "",
    sealName: "",
    paymentAccount: "",
    accountHolderName: "",
    bankName: "",
    signedAt: dayjs().format("YYYY-MM-DD"),
    expiredAt: dayjs().add(1, "year").format("YYYY-MM-DD"),
    renewalType: "无自动延期",
    autoRenewYears: 0,
    renewedDuration: "0 次",
    thirdPartyCompanyEstablishedAt: dayjs().format("YYYY-MM-DD"),
    thirdPartyCompanyQualification: "",
    thirdPartyBusinessLicenseName: "",
    thirdPartyFoodQualificationName: "",
    hospitalAuthorizationLetterName: "",
    authorizationProofAttachmentName: "",
    contractAttachmentName: "",
    thirdPartyEffectiveAt: dayjs().format("YYYY-MM-DD"),
    authorizationMode: "医院授权第三方",
    authorizationEffectiveAt: dayjs().format("YYYY-MM-DD"),
    authorizationExpiredAt: dayjs().add(1, "year").format("YYYY-MM-DD"),
    authorizedReceiver: "",
    receivers: Array.from({ length: 4 }, (_, index) => ({
      id: `receiver-${Date.now()}-${index}`,
      receiverName: "",
      receiverCode: "",
    })),
    products: [],
  };
}

export function mapRecordToDetailValues(record: HospitalContractRecord): HospitalContractDetailValues {
  return {
    dealerCode: record.dealerCode,
    dealerName: record.dealerName,
    region: record.region,
    cg: record.cg,
    province: record.province,
    dmsHospitalCode: record.dmsHospitalCode,
    dmsHospitalName: record.dmsHospitalName,
    dmsHospitalCooperationStatus: record.dmsHospitalCooperationStatus,
    signHospitalEtmsId: record.signHospitalEtmsId,
    useProductEtmsId: record.useProductEtmsId,
    dmsHospitalAddress: record.dmsHospitalAddress,
    deliveryAddress: record.deliveryAddress,
    contractForm: record.contractForm,
    transferType: record.transferType,
    contractDepartmentType: record.contractDepartmentType,
    signatoryFullName: record.signatoryFullName,
    sealName: record.sealName,
    paymentAccount: record.paymentAccount,
    accountHolderName: record.accountHolderName,
    bankName: record.bankName,
    signedAt: record.signedAt,
    expiredAt: record.expiredAt,
    renewalType: record.renewalType,
    autoRenewYears: record.autoRenewYears,
    renewedDuration: record.renewedDuration,
    thirdPartyCompanyEstablishedAt: record.thirdPartyCompanyEstablishedAt,
    thirdPartyCompanyQualification: record.thirdPartyCompanyQualification,
    thirdPartyBusinessLicenseName: record.thirdPartyBusinessLicenseName,
    thirdPartyFoodQualificationName: record.thirdPartyFoodQualificationName,
    hospitalAuthorizationLetterName: record.hospitalAuthorizationLetterName,
    authorizationProofAttachmentName: record.authorizationProofAttachmentName,
    contractAttachmentName: record.contractAttachmentName,
    thirdPartyEffectiveAt: record.thirdPartyEffectiveAt,
    authorizationMode: record.authorizationMode,
    authorizationEffectiveAt: record.authorizationEffectiveAt,
    authorizationExpiredAt: record.authorizationExpiredAt,
    authorizedReceiver: record.authorizedReceiver,
    receivers: Array.from({ length: 4 }, (_, index) => record.receivers[index] ?? {
      id: `receiver-${Date.now()}-${index}`,
      receiverName: "",
      receiverCode: "",
    }),
    products: record.products.map((item) => ({
      ...item,
      price: item.price ?? item.suggestedPrice,
    })),
  };
}

export function canRenew(record: HospitalContractRecord) {
  if (record.approvalStatus !== "审核通过") {
    return false;
  }

  return record.lifeStatus === "有效" || record.lifeStatus === "失效" || record.lifeStatus === "待生效";
}

export function canSupplement(record: HospitalContractRecord) {
  if (record.approvalStatus !== "审核通过") {
    return false;
  }

  return record.lifeStatus === "有效" || record.lifeStatus === "待生效";
}

export function canRenewOrSupplement(record: HospitalContractRecord) {
  return canRenew(record) || canSupplement(record);
}

export function canClose(record: HospitalContractRecord) {
  return record.approvalStatus === "审核通过" && record.lifeStatus !== "关闭";
}

export function hasPendingContractWorkflow(record: HospitalContractRecord) {
  return record.approvalStatus === "审核中" && Boolean(record.pendingAction);
}

export function getContractStatistics(records: HospitalContractRecord[]) {
  return {
    total: records.length,
    pending: records.filter((item) => item.approvalStatus === "审核中").length,
    active: records.filter((item) => item.lifeStatus === "有效").length,
    invalid: records.filter((item) => item.lifeStatus === "关闭" || item.lifeStatus === "失效").length,
  };
}

export function getContractProductDimension(records: HospitalContractRecord[]): HospitalContractProduct[] {
  return records.flatMap((item) => item.products);
}
