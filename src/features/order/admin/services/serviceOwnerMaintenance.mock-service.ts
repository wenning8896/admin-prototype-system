import dayjs from "dayjs";
import { read, utils, writeFileXLSX } from "xlsx";
import type {
  ServiceOwnerMaintenanceRecord,
  ServiceOwnerMaintenanceStatus,
} from "../mocks/serviceOwnerMaintenance.mock";
import { serviceOwnerMaintenanceSeedRecords } from "../mocks/serviceOwnerMaintenance.mock";

const STORAGE_KEY = "csl-order-admin-service-owner-maintenance";

export type MaintenanceLabelConfig = {
  codeLabel: string;
  nameLabel: string;
  fileBaseName: string;
};

const defaultLabelConfig: MaintenanceLabelConfig = {
  codeLabel: "服务商编码",
  nameLabel: "服务商名称",
  fileBaseName: "服务商负责人维护",
};

export type ServiceOwnerMaintenanceFilters = {
  serviceProviderCode?: string;
  serviceProviderName?: string;
  ownerName?: string;
  status?: ServiceOwnerMaintenanceStatus;
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
    return JSON.parse(raw) as ServiceOwnerMaintenanceRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: ServiceOwnerMaintenanceRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getMergedRecords() {
  const stored = readStoredRecords();
  const merged = [...serviceOwnerMaintenanceSeedRecords];

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

function persistMergedRecord(nextRecord: ServiceOwnerMaintenanceRecord) {
  const stored = readStoredRecords();
  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);

  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredRecords(next);
    return;
  }

  const seedIndex = serviceOwnerMaintenanceSeedRecords.findIndex((item) => item.id === nextRecord.id);

  if (seedIndex >= 0) {
    persistStoredRecords([...stored, nextRecord]);
    return;
  }

  persistStoredRecords([nextRecord, ...stored]);
}

export async function listServiceOwnerMaintenance(filters: ServiceOwnerMaintenanceFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));

  const providerCode = filters.serviceProviderCode?.trim().toLowerCase();
  const providerName = filters.serviceProviderName?.trim().toLowerCase();
  const ownerName = filters.ownerName?.trim().toLowerCase();
  const status = filters.status;

  return getMergedRecords().filter((item) => {
    const matchesProviderCode = !providerCode || item.serviceProviderCode.toLowerCase().includes(providerCode);
    const matchesProviderName = !providerName || item.serviceProviderName.toLowerCase().includes(providerName);
    const matchesOwnerName = !ownerName || item.ownerName.toLowerCase().includes(ownerName);
    const matchesStatus = !status || item.status === status;
    return matchesProviderCode && matchesProviderName && matchesOwnerName && matchesStatus;
  });
}

export function exportServiceOwnerMaintenance(
  records: ServiceOwnerMaintenanceRecord[],
  labelConfig: MaintenanceLabelConfig = defaultLabelConfig,
) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      [labelConfig.codeLabel]: item.serviceProviderCode,
      [labelConfig.nameLabel]: item.serviceProviderName,
      负责人姓名: item.ownerName,
      负责人手机号: item.ownerPhone,
      雀巢账号: item.nestleAccount,
      雀巢账号邮箱: item.nestleAccountEmail,
      启用状态: item.status,
    })),
  );

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 28 },
    { wch: 12 },
  ];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, labelConfig.fileBaseName);
  writeFileXLSX(workbook, `${labelConfig.fileBaseName}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function downloadServiceOwnerMaintenanceTemplate(
  labelConfig: MaintenanceLabelConfig = defaultLabelConfig,
) {
  const worksheet = utils.json_to_sheet([
    {
      [labelConfig.codeLabel]: "SP-001",
      [labelConfig.nameLabel]: "华东服务商",
      负责人姓名: "张琳",
      负责人手机号: "13800001234",
      雀巢账号: "nestle.owner",
      雀巢账号邮箱: "nestle.owner@example.com",
      启用状态: "启用",
    },
  ]);

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 28 },
    { wch: 12 },
  ];

  const instructionSheet = utils.aoa_to_sheet([
    ["服务商负责人维护导入说明"],
    [],
    ["一、导入字段说明"],
    ["字段名", "是否必填", "校验规则", "说明"],
    [labelConfig.codeLabel, "是", "长度建议不超过 30；同一负责人维护记录内必须存在", "用于定位主体"],
    [labelConfig.nameLabel, "是", "不能为空", "需与编码对应"],
    ["负责人姓名", "是", "不能为空", "同一服务商下负责人姓名不能重复"],
    ["负责人手机号", "是", "需为 11 位手机号", "示例：13800001234"],
    ["雀巢账号", "是", "不能为空", "用于系统登录或账号关联"],
    ["雀巢账号邮箱", "是", "需符合邮箱格式", "示例：nestle.owner@example.com"],
    ["启用状态", "否", "仅支持“启用”或“停用”", "为空时默认按“启用”导入"],
    [],
    ["二、导入处理逻辑"],
    ["规则项", "说明"],
    ["新增/更新逻辑", `系统会按“${labelConfig.codeLabel} + 负责人姓名”判断是否更新已有记录；未命中则新增`],
    ["空值处理", "必填项为空时，该行不会导入"],
    ["状态默认值", "启用状态未填写时，系统默认写入“启用”"],
    [],
    ["三、常见错误提示"],
    ["错误场景", "提示说明"],
    ["手机号格式错误", "负责人手机号需为 11 位手机号"],
    ["邮箱格式错误", "雀巢账号邮箱格式不正确，请检查后重新导入"],
    ["必填项缺失", `${labelConfig.codeLabel}、${labelConfig.nameLabel}、负责人姓名、负责人手机号、雀巢账号、雀巢账号邮箱不能为空`],
    ["状态值错误", "启用状态仅支持填写“启用”或“停用”"],
    ["名称与编码不匹配", `请确认${labelConfig.codeLabel}与${labelConfig.nameLabel}是否对应`],
  ]);

  instructionSheet["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 54 }, { wch: 42 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "导入模板");
  utils.book_append_sheet(workbook, instructionSheet, "导入说明");
  writeFileXLSX(workbook, `${labelConfig.fileBaseName}导入模板.xlsx`);
}

export async function batchUpdateServiceOwnerMaintenanceStatus(ids: string[], status: ServiceOwnerMaintenanceStatus) {
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  const merged = getMergedRecords();

  ids.forEach((id) => {
    const record = merged.find((item) => item.id === id);
    if (!record) {
      return;
    }

    persistMergedRecord({
      ...record,
      status,
    });
  });

  return `${ids.length} 条记录已更新为${status}。`;
}

export async function importServiceOwnerMaintenance(
  file: File,
  labelConfig: MaintenanceLabelConfig = defaultLabelConfig,
) {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<Record<string, string>>(worksheet, { defval: "" });

  const merged = getMergedRecords();
  const phoneRegExp = /^1\d{10}$/;
  const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let successCount = 0;
  let skippedCount = 0;

  rows.forEach((row, index) => {
    const serviceProviderCode = String(row[labelConfig.codeLabel] ?? "").trim();
    const serviceProviderName = String(row[labelConfig.nameLabel] ?? "").trim();
    const ownerName = String(row["负责人姓名"] ?? "").trim();
    const ownerPhone = String(row["负责人手机号"] ?? "").trim();
    const nestleAccount = String(row["雀巢账号"] ?? "").trim();
    const nestleAccountEmail = String(row["雀巢账号邮箱"] ?? "").trim();
    const statusValue = String(row["启用状态"] ?? "").trim();

    if (
      !serviceProviderCode ||
      !serviceProviderName ||
      !ownerName ||
      !ownerPhone ||
      !nestleAccount ||
      !nestleAccountEmail
    ) {
      skippedCount += 1;
      return;
    }

    if (!phoneRegExp.test(ownerPhone) || !emailRegExp.test(nestleAccountEmail)) {
      skippedCount += 1;
      return;
    }

    if (statusValue && statusValue !== "启用" && statusValue !== "停用") {
      skippedCount += 1;
      return;
    }

    const existing = merged.find(
      (item) => item.serviceProviderCode === serviceProviderCode && item.ownerName === ownerName,
    );

    const nextRecord: ServiceOwnerMaintenanceRecord = {
      id: existing?.id ?? `service-owner-import-${Date.now()}-${index}`,
      serviceProviderCode,
      serviceProviderName,
      ownerName,
      ownerPhone,
      nestleAccount,
      nestleAccountEmail,
      status: statusValue === "停用" ? "停用" : "启用",
    };

    persistMergedRecord(nextRecord);
    successCount += 1;
  });

  return {
    successCount,
    skippedCount,
  };
}
