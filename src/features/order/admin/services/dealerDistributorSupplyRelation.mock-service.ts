import dayjs from "dayjs";
import { read, utils, writeFileXLSX } from "xlsx";
import type {
  DealerDistributorSupplyRelationRecord,
  DealerDistributorSupplyRelationStatus,
} from "../mocks/dealerDistributorSupplyRelation.mock";
import { dealerDistributorSupplyRelationSeedRecords } from "../mocks/dealerDistributorSupplyRelation.mock";

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
    })),
  );
  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
  ];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "经分供货关系维护");
  writeFileXLSX(workbook, `经分供货关系维护_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function downloadDealerDistributorSupplyRelationTemplate() {
  const templateSheet = utils.json_to_sheet([
    {
      业务单元: "干货",
      经销商编码: "DL001",
      经销商名称: "华东经销商A",
      经销商类型: "经销商",
      分销商编码: "EDS240301",
      分销商名称: "上海联享分销有限公司",
    },
  ]);
  templateSheet["!cols"] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
  ];

  const instructionSheet = utils.aoa_to_sheet([
    ["经分供货关系维护导入说明"],
    [],
    ["一、导入字段说明"],
    ["字段名", "是否必填", "校验规则", "说明"],
    ["业务单元", "是", "不能为空，建议与系统中的业务单元保持一致", "如：干货、咖啡、奶品"],
    ["经销商编码", "是", "不能为空，长度建议不超过 30", "用于识别经销商主体"],
    ["经销商名称", "是", "不能为空", "需与经销商编码对应"],
    ["经销商类型", "是", "仅支持“经销商”或“DT经销商”", "需与系统配置保持一致"],
    ["分销商编码", "是", "不能为空，长度建议不超过 30", "用于识别分销商主体"],
    ["分销商名称", "是", "不能为空", "需与分销商编码对应"],
    [],
    ["二、导入处理逻辑"],
    ["规则项", "说明"],
    ["默认状态", "导入成功后的每一条数据默认进入“待审批”状态，审批通过后才会启用"],
    ["新增/更新逻辑", "系统按“业务单元 + 经销商编码 + 分销商编码”判断是否为同一条关系"],
    ["空值处理", "任一必填项为空时，该行不会导入"],
    [],
    ["三、常见错误提示"],
    ["错误场景", "提示说明"],
    ["字段缺失", "业务单元、经销商编码、经销商名称、经销商类型、分销商编码、分销商名称均不能为空"],
    ["经销商类型错误", "经销商类型仅支持填写“经销商”或“DT经销商”"],
    ["编码与名称不匹配", "请确认经销商和分销商的编码与名称是否一一对应"],
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
    const businessUnit = String(row["业务单元"] ?? "").trim();
    const dealerCode = String(row["经销商编码"] ?? "").trim();
    const dealerName = String(row["经销商名称"] ?? "").trim();
    const dealerType = String(row["经销商类型"] ?? "").trim();
    const distributorCode = String(row["分销商编码"] ?? "").trim();
    const distributorName = String(row["分销商名称"] ?? "").trim();

    if (!businessUnit || !dealerCode || !dealerName || !dealerType || !distributorCode || !distributorName) {
      skippedCount += 1;
      return;
    }

    if (dealerType !== "经销商" && dealerType !== "DT经销商") {
      skippedCount += 1;
      return;
    }

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
