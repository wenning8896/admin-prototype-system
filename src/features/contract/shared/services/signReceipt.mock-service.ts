import dayjs from "dayjs";
import type { SignReceiptRecord, SignReceiptStatus } from "../mocks/signReceipt.mock";
import { signReceiptApprovalNodeSequence } from "../mocks/signReceipt.mock";
import { getHospitalContractById, listHospitalContracts } from "./hospitalContract.mock-service";

const STORAGE_KEY = "csl-contract-sign-receipts";

export type SignReceiptFilters = {
  contractNo?: string;
  dealerCode?: string;
  hospitalCode?: string;
  status?: SignReceiptStatus;
};

export type SignReceiptActor = {
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
    return JSON.parse(raw) as SignReceiptRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: SignReceiptRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function persistRecord(nextRecord: SignReceiptRecord) {
  const stored = readStoredRecords();
  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);
  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredRecords(next);
    return;
  }
  persistStoredRecords([nextRecord, ...stored]);
}

export async function listDealerSignReceiptRecords(filters: SignReceiptFilters = {}) {
  await wait();
  const contracts = await listHospitalContracts({}, "dealer");
  const submitted = readStoredRecords();

  const all = contracts
    .filter((item) => item.approvalStatus === "审核通过")
    .map((contract) => {
      const existing = submitted.find((item) => item.contractId === contract.id);
      if (existing) {
        return existing;
      }
      return {
        id: `sign-receipt-${contract.id}`,
        contractId: contract.id,
        contractNo: contract.contractNo,
        dealerCode: contract.dealerCode,
        dealerName: contract.dealerName,
        dmsHospitalCode: contract.dmsHospitalCode,
        dmsHospitalName: contract.dmsHospitalName,
        receiverName: contract.receivers[0]?.receiverName ?? "-",
        receiverId: contract.receivers[0]?.receiverCode ?? "-",
        status: "待上传" as const,
        approvalHistory: [],
      } satisfies SignReceiptRecord;
    });

  const contractNo = filters.contractNo?.trim().toLowerCase();
  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const hospitalCode = filters.hospitalCode?.trim().toLowerCase();

  return all.filter((item) => {
    const matchesContractNo = !contractNo || item.contractNo.toLowerCase().includes(contractNo);
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesHospitalCode = !hospitalCode || item.dmsHospitalCode.toLowerCase().includes(hospitalCode);
    const matchesStatus = !filters.status || item.status === filters.status;
    return matchesContractNo && matchesDealerCode && matchesHospitalCode && matchesStatus;
  });
}

export async function getSignReceiptById(id: string) {
  const records = await listDealerSignReceiptRecords();
  return records.find((item) => item.id === id || item.contractId === id) ?? null;
}

export async function submitSignReceipt(params: {
  id: string;
  receiptAttachmentName: string;
  detailAttachmentName: string;
  remark?: string;
  actor: SignReceiptActor;
}) {
  await wait();
  const current = await getSignReceiptById(params.id);
  if (!current) {
    return null;
  }

  const next: SignReceiptRecord = {
    ...current,
    status: "待审批",
    approvalNode: signReceiptApprovalNodeSequence[0],
    submitterName: params.actor.name,
    submitterAccount: params.actor.account,
    uploadedAt: dayjs().format("YYYY-MM-DD HH:mm"),
    receiptAttachmentName: params.receiptAttachmentName,
    detailAttachmentName: params.detailAttachmentName,
    remark: params.remark,
    approvalHistory: [
      ...current.approvalHistory,
      {
        id: `${current.id}-history-${Date.now()}`,
        nodeName: "经销商上传",
        decision: "提交签收单",
        roleLabel: params.actor.roleLabel,
        operatorName: params.actor.name,
        account: params.actor.account,
        actedAt: dayjs().format("YYYY-MM-DD HH:mm"),
        remark: params.remark,
        attachmentName: params.receiptAttachmentName,
      },
    ],
  };

  persistRecord(next);
  return next;
}

export async function listSignReceiptApprovals(
  tab: "pending" | "reviewed",
  actorAccount: string,
  filters: SignReceiptFilters = {},
) {
  await wait();
  const all = (await listDealerSignReceiptRecords(filters)).filter((item) => item.status !== "待上传");
  if (tab === "pending") {
    return all.filter((item) => item.status === "待审批");
  }

  return all.filter((item) =>
    item.approvalHistory.some(
      (history) =>
        history.account === actorAccount && (history.decision === "审批通过" || history.decision === "审批驳回"),
    ),
  );
}

export async function reviewSignReceipt(params: {
  id: string;
  decision: "approve" | "reject";
  remark: string;
  attachmentName?: string;
  actor: SignReceiptActor;
}) {
  await wait();
  const current = await getSignReceiptById(params.id);
  if (!current) {
    return null;
  }

  const next: SignReceiptRecord = {
    ...current,
    status: params.decision === "approve" ? "审批通过" : "审批驳回",
    approvalNode: undefined,
    approvalHistory: [
      ...current.approvalHistory,
      {
        id: `${current.id}-history-${Date.now()}`,
        nodeName: "签收单审批",
        decision: params.decision === "approve" ? "审批通过" : "审批驳回",
        roleLabel: params.actor.roleLabel,
        operatorName: params.actor.name,
        account: params.actor.account,
        actedAt: dayjs().format("YYYY-MM-DD HH:mm"),
        remark: params.remark,
        attachmentName: params.attachmentName,
      },
    ],
  };

  persistRecord(next);
  return next;
}

export async function listSignReceiptApprovalCandidatesForContract(contractId: string) {
  const contract = await getHospitalContractById(contractId);
  if (!contract) {
    return [];
  }
  return contract.receivers;
}
