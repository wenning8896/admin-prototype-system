import dayjs from "dayjs";
import { read, utils, writeFileXLSX } from "xlsx";
import type {
  DealerDistributorSupplyRelationRecord,
  DealerDistributorSupplyRelationStatus,
} from "../mocks/dealerDistributorSupplyRelation.mock";
import { dealerDistributorSupplyRelationSeedRecords } from "../mocks/dealerDistributorSupplyRelation.mock";
import { eDistributorSeedRecords } from "../mocks/eDistributorList.mock";

const STORAGE_KEY = "csl-order-admin-dealer-distributor-supply-relation";

export type DealerDistributorSupplyRelationFilters = {
  businessUnit?: string;
  dealerCode?: string;
  dealerName?: string;
  dealerType?: string;
  distributorCode?: string;
  distributorName?: string;
  status?: DealerDistributorSupplyRelationStatus;
};

function readStoredRecords() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as DealerDistributorSupplyRelationRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: DealerDistributorSupplyRelationRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getMergedRecords() {
  const stored = readStoredRecords();
  const merged = [...dealerDistributorSupplyRelationSeedRecords];

  stored.forEach((item) => {
    const index = merged.findIndex((record) => record.id === item.id);
    if (index >= 0) {
      merged[index] = item;
      return;
    }
    merged.unshift(item);
  });

  return merged;
}

function getDistributorNameByCode(distributorCode: string) {
  return eDistributorSeedRecords.find((item) => item.distributorCode === distributorCode)?.distributorName ?? "";
}

function getDealerReferenceByCode(dealerCode: string) {
  const matched = getMergedRecords().find((item) => item.dealerCode === dealerCode);
  if (!matched) {
    return null;
  }

  return {
    businessUnit: matched.businessUnit,
    dealerName: matched.dealerName,
    dealerType: matched.dealerType,
  };
}

function persistMergedRecord(nextRecord: DealerDistributorSupplyRelationRecord) {
  const stored = readStoredRecords();
  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);

  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredRecords(next);
    return;
  }

  const seedIndex = dealerDistributorSupplyRelationSeedRecords.findIndex((item) => item.id === nextRecord.id);
  if (seedIndex >= 0) {
    persistStoredRecords([...stored, nextRecord]);
    return;
  }

  persistStoredRecords([nextRecord, ...stored]);
}

export async function listDealerDistributorSupplyRelations(
  filters: DealerDistributorSupplyRelationFilters = {},
) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));

  const businessUnit = filters.businessUnit?.trim().toLowerCase();
  const dealerCode = filters.dealerCode?.trim().toLowerCase();
  const dealerName = filters.dealerName?.trim().toLowerCase();
  const dealerType = filters.dealerType?.trim().toLowerCase();
  const distributorCode = filters.distributorCode?.trim().toLowerCase();
  const distributorName = filters.distributorName?.trim().toLowerCase();
  const status = filters.status;

  return getMergedRecords().filter((item) => {
    const matchesBusinessUnit = !businessUnit || item.businessUnit.toLowerCase().includes(businessUnit);
    const matchesDealerCode = !dealerCode || item.dealerCode.toLowerCase().includes(dealerCode);
    const matchesDealerName = !dealerName || item.dealerName.toLowerCase().includes(dealerName);
    const matchesDealerType = !dealerType || item.dealerType.toLowerCase().includes(dealerType);
    const matchesDistributorCode = !distributorCode || item.distributorCode.toLowerCase().includes(distributorCode);
    const matchesDistributorName = !distributorName || item.distributorName.toLowerCase().includes(distributorName);
    const matchesStatus = !status || item.status === status;
    return (
      matchesBusinessUnit &&
      matchesDealerCode &&
      matchesDealerName &&
      matchesDealerType &&
      matchesDistributorCode &&
      matchesDistributorName &&
      matchesStatus
    );
  });
}

export function exportDealerDistributorSupplyRelations(records: DealerDistributorSupplyRelationRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      业务单元: item.businessUnit,
      经销商编码: item.dealerCode,
      经销商名称: item.dealerName,
      经销商类型: item.dealerType,
      分销商编码: item.distributorCode,
      分销商名称: item.distributorName,
      创建人账号: item.creatorAccount,
      创建时间: item.createdAt,
      更新时间: item.updatedAt,
      状态: item.status,
    })),
  );
  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
  ];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "经分供货关系维护");
  writeFileXLSX(workbook, `经分供货关系维护_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function downloadDealerDistributorSupplyRelationTemplate() {
  const templateSheet = utils.json_to_sheet([
    {
      "经销商编码*": "DL001",
      "分销商编码*": "EDS240301",
    },
  ]);
  templateSheet["!cols"] = [
    { wch: 16 },
    { wch: 16 },
  ];

  const instructionSheet = utils.aoa_to_sheet([
    ["经分供货关系维护导入说明"],
    [],
    ["注：带 * 的字段为必填项"],
    [],
    ["一、导入字段说明"],
    ["字段名", "是否必填", "校验规则", "说明"],
    ["经销商编码*", "是", "不能为空，长度建议不超过 30", "用于识别经销商主体，并自动带出业务单元、经销商名称、经销商类型"],
    ["分销商编码*", "是", "不能为空，长度建议不超过 30", "用于识别分销商主体，并自动带出分销商名称"],
    [],
    ["二、导入处理逻辑"],
    ["规则项", "说明"],
    ["默认状态", "导入成功后的每一条数据默认进入“待审批”状态，审批通过后才会启用"],
    ["新增/更新逻辑", "系统按“业务单元 + 经销商编码 + 分销商编码”判断是否为同一条关系；业务单元由经销商编码自动带出"],
    ["空值处理", "任一必填编码为空时，该行不会导入"],
    ["自动带出", "导入时会根据编码自动补齐分销商名称、经销商名称、经销商类型、业务单元"],
    [],
    ["三、常见错误提示"],
    ["错误场景", "提示说明"],
    ["字段缺失", "经销商编码、分销商编码均不能为空"],
    ["编码不存在", "若系统中找不到对应的经销商编码或分销商编码，该行不会导入"],
    ["重复关系", "同一业务单元下重复的经分供货关系会覆盖已有待审批记录"],
  ]);
  instructionSheet["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 56 }, { wch: 42 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, templateSheet, "导入模板");
  utils.book_append_sheet(workbook, instructionSheet, "导入说明");
  writeFileXLSX(workbook, "经分供货关系维护导入模板.xlsx");
}

export async function importDealerDistributorSupplyRelations(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<Record<string, string>>(worksheet, { defval: "" });
  const merged = getMergedRecords();
  let successCount = 0;
  let skippedCount = 0;

  rows.forEach((row, index) => {
    const dealerCode = String(row["经销商编码*"] ?? row["经销商编码"] ?? "").trim();
    const distributorCode = String(row["分销商编码*"] ?? row["分销商编码"] ?? "").trim();

    if (!dealerCode || !distributorCode) {
      skippedCount += 1;
      return;
    }

    const dealerReference = getDealerReferenceByCode(dealerCode);
    const distributorName = getDistributorNameByCode(distributorCode);

    if (!dealerReference || !distributorName) {
      skippedCount += 1;
      return;
    }

    const { businessUnit, dealerName, dealerType } = dealerReference;

    const now = dayjs().format("YYYY-MM-DD HH:mm");
    const existing = merged.find(
      (item) =>
        item.businessUnit === businessUnit &&
        item.dealerCode === dealerCode &&
        item.distributorCode === distributorCode,
    );

    const nextRecord: DealerDistributorSupplyRelationRecord = {
      id: existing?.id ?? `dds-import-${Date.now()}-${index}`,
      businessUnit,
      dealerCode,
      dealerName,
      dealerType,
      distributorCode,
      distributorName,
      status: "待审批",
      creatorAccount: existing?.creatorAccount ?? "admin",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      approvalHistory: [
        {
          id: `dds-import-history-${Date.now()}-${index}`,
          decision: "导入",
          operatorName: "系统管理员",
          account: "admin",
          actedAt: now,
          remark: "批量导入经分供货关系",
        },
      ],
    };

    persistMergedRecord(nextRecord);
    successCount += 1;
  });

  return { successCount, skippedCount };
}

export async function batchDeleteDealerDistributorSupplyRelations(ids: string[]) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const stored = readStoredRecords();
  const nextStored = stored.filter((item) => !ids.includes(item.id));
  persistStoredRecords(nextStored);
  return `${ids.length} 条关系已删除。`;
}

export function getDealerDistributorSupplyRelationById(id: string) {
  return getMergedRecords().find((item) => item.id === id) ?? null;
}

export async function reviewDealerDistributorSupplyRelation(params: {
  id: string;
  action: "approve" | "reject";
  remark?: string;
  reviewerAccount: string;
  reviewerName: string;
}) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const target = getDealerDistributorSupplyRelationById(params.id);
  if (!target) {
    throw new Error("未找到当前经分供货关系记录");
  }

  const now = dayjs().format("YYYY-MM-DD HH:mm");
  const nextRecord: DealerDistributorSupplyRelationRecord = {
    ...target,
    status: params.action === "approve" ? "启用" : "已驳回",
    updatedAt: now,
    approvalHistory: [
      ...target.approvalHistory,
      {
        id: `dds-review-${Date.now()}`,
        decision: params.action === "approve" ? "审批通过" : "审批驳回",
        operatorName: params.reviewerName,
        account: params.reviewerAccount,
        actedAt: now,
        remark: params.remark,
      },
    ],
  };

  persistMergedRecord(nextRecord);
  return nextRecord;
}

export async function batchReviewDealerDistributorSupplyRelations(params: {
  ids: string[];
  action: "approve" | "reject";
  reviewerAccount: string;
  reviewerName: string;
}) {
  await Promise.all(
    params.ids.map((id) =>
      reviewDealerDistributorSupplyRelation({
        id,
        action: params.action,
        reviewerAccount: params.reviewerAccount,
        reviewerName: params.reviewerName,
      }),
    ),
  );

  return `${params.ids.length} 条关系已${params.action === "approve" ? "批量通过" : "批量驳回"}。`;
}
