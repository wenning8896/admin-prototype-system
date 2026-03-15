import dayjs from "dayjs";
import { utils, writeFileXLSX } from "xlsx";
import type { CertificationStatus, EDistributorRecord } from "../mocks/eDistributorList.mock";
import { eDistributorSeedRecords } from "../mocks/eDistributorList.mock";
import { getDistributorAgreementOverview } from "../../../agreement/shared/services/purchaseAgreementFlow.mock-service";

const STORAGE_KEY = "csl-order-admin-e-distributors";

export type EDistributorFilters = {
  keyword?: string;
  distributorCode?: string;
  companyType?: string;
  certificationStatus?: CertificationStatus;
  agreementStatus?: string;
  productScope?: string;
};

export type EDistributorCertificationPayload = {
  companyName: string;
  companyType: "enterprise" | "individual-business";
  socialCreditCode: string;
  legalRepresentative: string;
  phone: string;
  eSignName: string;
  businessOwnerName: string;
  email: string;
  productScopes: string[];
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
    return JSON.parse(raw) as EDistributorRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: EDistributorRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function buildDistributorCode(index: number) {
  return `EDS${dayjs().format("YYMMDD")}${String(index).padStart(2, "0")}`;
}

function maskPhone(phone: string) {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}

export async function listEDistributors(filters: EDistributorFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 320));

  const records = [...readStoredRecords(), ...eDistributorSeedRecords];
  const agreementOverview = getDistributorAgreementOverview();
  const keyword = filters.keyword?.trim().toLowerCase();

  const items = records.filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.distributorName.toLowerCase().includes(keyword) ||
      item.socialCreditCode.toLowerCase().includes(keyword) ||
      item.legalRepresentative.toLowerCase().includes(keyword);
    const matchesCode = !filters.distributorCode || item.distributorCode.includes(filters.distributorCode.trim());
    const matchesCompanyType = !filters.companyType || item.companyType === filters.companyType;
    const matchesStatus = !filters.certificationStatus || item.certificationStatus === filters.certificationStatus;
    const currentAgreementStatus = agreementOverview[item.id]?.latestAgreementStatus ?? "未发起";
    const matchesAgreementStatus = !filters.agreementStatus || currentAgreementStatus === filters.agreementStatus;
    const matchesProductScope = !filters.productScope || item.productScopes.includes(filters.productScope);

    return (
      matchesKeyword &&
      matchesCode &&
      matchesCompanyType &&
      matchesStatus &&
      matchesAgreementStatus &&
      matchesProductScope
    );
  });

  return {
    items,
    summary: {
      total: records.length,
      certified: records.filter((item) => item.certificationStatus === "已认证").length,
      certifying: records.filter((item) => item.certificationStatus === "认证中").length,
      pendingAgreement: records.filter((item) => item.certificationStatus === "已认证").length,
      relatedServiceProviders: records.reduce((total, item) => total + item.relatedServiceProviders.length, 0),
    },
  };
}

export async function createAgreement(recordId: string) {
  await new Promise((resolve) => window.setTimeout(resolve, 500));
  const stored = readStoredRecords();
  const storedIndex = stored.findIndex((item) => item.id === recordId);

  if (storedIndex >= 0) {
    const target = stored[storedIndex];
    const next = [...stored];
    next[storedIndex] = {
      ...target,
    };
    persistStoredRecords(next);
    return `已为 ${target.distributorName} 发起协议流程。`;
  }

  const seedRecord = eDistributorSeedRecords.find((item) => item.id === recordId);
  return seedRecord ? `已为 ${seedRecord.distributorName} 发起协议流程。` : "协议发起成功。";
}

export function exportEDistributors(records: EDistributorRecord[]) {
  const rows = records.map((item) => ({
    分销商名称: item.distributorName,
    分销商编码: item.distributorCode,
    企业主体类型: item.companyType,
    统一社会信用代码: item.socialCreditCode,
    法定代表人: item.legalRepresentative,
    手机号: item.phone,
    电签人: item.eSignName,
    业务负责人: item.businessOwnerName,
    邮箱: item.email,
    经营产品范围: item.productScopes.join(" / "),
    注册时间: item.registeredAt,
    腾讯电子签认证状态: item.certificationStatus,
  }));

  const worksheet = utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 26 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
    { wch: 24 },
    { wch: 20 },
    { wch: 18 },
  ];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "分销商列表");
  writeFileXLSX(workbook, `分销商列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export async function recordEDistributorCertification(payload: EDistributorCertificationPayload) {
  const current = readStoredRecords();
  const existedIndex = current.findIndex(
    (item) => item.phone === payload.phone || item.socialCreditCode === payload.socialCreditCode,
  );

  const nextRecord: EDistributorRecord = {
    id: existedIndex >= 0 ? current[existedIndex].id : `ed-${Date.now()}`,
    distributorName: payload.companyName,
    distributorCode: existedIndex >= 0 ? current[existedIndex].distributorCode : buildDistributorCode(current.length + 1),
    companyType: payload.companyType === "enterprise" ? "企业" : "个体工商户",
    socialCreditCode: payload.socialCreditCode,
    legalRepresentative: payload.legalRepresentative,
    phone: payload.phone,
    eSignName: payload.eSignName,
    businessOwnerName: payload.businessOwnerName,
    email: payload.email,
    productScopes: payload.productScopes,
    registeredAt: dayjs().format("YYYY-MM-DD HH:mm"),
    certificationStatus: "认证中",
    relatedServiceProviders: existedIndex >= 0 ? current[existedIndex].relatedServiceProviders : [],
  };

  const nextRecords =
    existedIndex >= 0
      ? current.map((item, index) => (index === existedIndex ? nextRecord : item))
      : [nextRecord, ...current];
  persistStoredRecords(nextRecords);
  return nextRecord;
}

export function getMaskedPhone(phone: string) {
  return maskPhone(phone);
}
