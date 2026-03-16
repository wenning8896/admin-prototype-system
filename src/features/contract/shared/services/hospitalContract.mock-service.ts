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

function wait() {
  return new Promise((resolve) => window.setTimeout(resolve, 180));
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

  return merged;
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
    contractNo: existing?.contractNo ?? `HT-${dayjs().format("YYYYMM")}-${String(Math.floor(Math.random() * 900) + 100)}`,
    approvalStatus: existing?.approvalStatus ?? "草稿",
    lifeStatus: existing?.lifeStatus ?? "有效",
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
  const next = toRecord(values, actor, existing);
  next.approvalStatus = "审核中";
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
    lifeStatus: "无效",
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
    persistMergedRecord(next);
    return next;
  }

  if (nextNode) {
    next.currentApprovalNode = nextNode;
    persistMergedRecord(next);
    return next;
  }

  next.approvalStatus = "审核通过";
  next.currentApprovalNode = undefined;

  if (record.pendingAction === "关闭合同") {
    next.lifeStatus = "无效";
  } else {
    next.lifeStatus = "有效";
  }

  if (record.pendingAction === "续签") {
    next.renewedDuration = `${record.versions.filter((item) => item.actionType === "续签").length + 1} 次`;
  }

  next.versions = [...record.versions, buildVersionRecord(record, record.pendingAction, params.actor.name)];
  next.pendingAction = undefined;
  persistMergedRecord(next);
  return next;
}

export async function listContractApprovals(tab: ContractReviewTab, actorAccount: string, filters: HospitalContractFilters = {}) {
  const all = await listHospitalContracts(filters);
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
      DMS医院编码: item.dmsHospitalCode,
      DMS医院名称: item.dmsHospitalName,
      经销商编码: item.dealerCode,
      经销商名称: item.dealerName,
      大区: item.region,
      CG: item.cg,
      省份: item.province,
      合同签署时间: item.signedAt,
      合同到期时间: item.expiredAt,
      合同存续状态: item.lifeStatus,
    })),
  );
  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 18 },
    { wch: 24 },
    { wch: 16 },
    { wch: 28 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
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

export function canRenewOrSupplement(record: HospitalContractRecord) {
  return record.approvalStatus === "审核通过";
}

export function canClose(record: HospitalContractRecord) {
  return record.approvalStatus === "审核通过" && record.lifeStatus !== "无效";
}

export function hasPendingContractWorkflow(record: HospitalContractRecord) {
  return record.approvalStatus === "审核中" && Boolean(record.pendingAction);
}

export function getContractStatistics(records: HospitalContractRecord[]) {
  return {
    total: records.length,
    pending: records.filter((item) => item.approvalStatus === "审核中").length,
    active: records.filter((item) => item.lifeStatus === "有效").length,
    invalid: records.filter((item) => item.lifeStatus === "无效").length,
  };
}

export function getContractProductDimension(records: HospitalContractRecord[]): HospitalContractProduct[] {
  return records.flatMap((item) => item.products);
}
