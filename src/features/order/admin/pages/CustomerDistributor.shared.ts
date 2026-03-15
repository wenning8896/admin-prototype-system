import dayjs, { Dayjs } from "dayjs";
import { utils, writeFileXLSX } from "xlsx";
import { eDistributorSeedRecords } from "../mocks/eDistributorList.mock";

export type CustomerDistributorStatus = "启用" | "停用";
export type CustomerDistributorApprovalStatus = "草稿" | "待审批" | "已驳回" | "已通过";
export type CustomerDistributorDisplayStatus = CustomerDistributorStatus | "草稿" | "待审批" | "已驳回";

export type CustomerDistributorApprovalHistory = {
  id: string;
  nodeName: string;
  decision: "提交申请" | "审批通过" | "审批驳回";
  roleLabel: string;
  operatorName: string;
  account: string;
  actedAt: string;
  remark?: string;
};

export type SupplyRelation = {
  id: string;
  dealerType: string;
  dealerCode: string;
  dealerName: string;
  shipToCode: string;
  shipToName: string;
  cooperationStatus: string;
  cooperationStartDate: string;
  cooperationEndDate?: string;
};

export type CustomerDistributorRecord = {
  id: string;
  distributorCode: string;
  distributorName: string;
  socialCreditCode: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  companyType: "企业" | "个体工商户";
  legalRepresentative: string;
  provinceCityDistrict: string[];
  street: string;
  companyAddress: string;
  businessUnit: string;
  channelName: string;
  isKeyCustomer: boolean;
  cityMaster: string;
  eSignName: string;
  eSignPhone: string;
  createdAt: string;
  updatedAt: string;
  status: CustomerDistributorStatus;
  approvalStatus: CustomerDistributorApprovalStatus;
  submittedAt?: string;
  approvalHistory: CustomerDistributorApprovalHistory[];
  supplyRelations: SupplyRelation[];
  businessUnits: Array<{
    id: string;
    businessUnit: string;
    channelName: string;
    isKeyCustomer: boolean;
    cityMaster: string;
    eSignName: string;
    eSignPhone: string;
    supplyRelations: SupplyRelation[];
  }>;
};

export type CustomerDistributorFilters = {
  keyword?: string;
  distributorCode?: string;
  companyType?: CustomerDistributorRecord["companyType"];
  status?: CustomerDistributorDisplayStatus;
};

export type DistributorFormValues = {
  distributorCode: string;
  socialCreditCode: string;
  distributorName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  companyType: CustomerDistributorRecord["companyType"];
  legalRepresentative: string;
  provinceCityDistrict: string[];
  street: string;
  companyAddress: string;
  businessUnit: string;
  channelName: string;
  isKeyCustomer: boolean;
  cityMaster: string;
  eSignName: string;
  eSignPhone: string;
  businessUnits: Array<{
    id?: string;
    businessUnit: string;
    channelName: string;
    isKeyCustomer: boolean;
    cityMaster: string;
    eSignName: string;
    eSignPhone: string;
    supplyRelations: Array<{
      id?: string;
      dealerType: string;
      dealerCode: string;
      dealerName: string;
      shipToCode: string;
      shipToName: string;
      cooperationStatus: string;
      cooperationStartDate?: Dayjs;
      cooperationEndDate?: Dayjs;
    }>;
  }>;
};

const STORAGE_KEY = "csl-admin-customer-distributor-list";

export const regionOptions = [
  {
    value: "北京市",
    label: "北京市",
    children: [
      {
        value: "北京市",
        label: "北京市",
        children: [
          { value: "朝阳区", label: "朝阳区" },
          { value: "海淀区", label: "海淀区" },
        ],
      },
    ],
  },
  {
    value: "上海市",
    label: "上海市",
    children: [
      {
        value: "上海市",
        label: "上海市",
        children: [
          { value: "浦东新区", label: "浦东新区" },
          { value: "闵行区", label: "闵行区" },
        ],
      },
    ],
  },
];

export const streetOptions = [
  { label: "望京街道", value: "望京街道" },
  { label: "北苑街道", value: "北苑街道" },
  { label: "张江镇", value: "张江镇" },
  { label: "金桥镇", value: "金桥镇" },
];

export const businessUnitOptions = ["干货", "咖啡", "奶品"];
export const channelOptions = ["现代渠道", "传统渠道", "O2O渠道"];
export const cityMasterOptions = ["北京", "上海", "广州", "成都"];
export const cooperationStatusOptions = ["合作中", "已暂停"];

function buildSeedRecords(): CustomerDistributorRecord[] {
  return eDistributorSeedRecords.map((item, index) => ({
    id: `customer-distributor-${item.id}`,
    distributorCode: item.distributorCode,
    distributorName: item.distributorName,
    socialCreditCode: item.socialCreditCode,
    ownerName: item.businessOwnerName,
    ownerPhone: item.phone,
    ownerEmail: item.email,
    companyType: item.companyType,
    legalRepresentative: item.legalRepresentative,
    provinceCityDistrict: index % 2 === 0 ? ["上海市", "上海市", "浦东新区"] : ["北京市", "北京市", "朝阳区"],
    street: index % 2 === 0 ? "张江镇" : "望京街道",
    companyAddress: index % 2 === 0 ? "张江高科园区科苑路 88 号" : "望京 SOHO T2-1208",
    businessUnit: "干货",
    channelName: index % 2 === 0 ? "现代渠道" : "传统渠道",
    isKeyCustomer: index % 3 === 0,
    cityMaster: index % 2 === 0 ? "上海" : "北京",
    eSignName: item.eSignName,
    eSignPhone: item.phone,
    createdAt: item.registeredAt,
    updatedAt: dayjs(item.registeredAt).add(index + 1, "day").format("YYYY-MM-DD HH:mm"),
    status: index === 1 ? "停用" : "启用",
    approvalStatus: "已通过",
    submittedAt: item.registeredAt,
    approvalHistory: [
      {
        id: `${item.id}-history-1`,
        nodeName: "分销商准入审批",
        decision: "审批通过",
        roleLabel: "管理员",
        operatorName: "系统管理员",
        account: "admin",
        actedAt: dayjs(item.registeredAt).add(1, "day").format("YYYY-MM-DD HH:mm"),
        remark: "初始化客户数据。",
      },
    ],
    supplyRelations: [
      {
        id: `${item.id}-relation-1`,
        dealerType: "经销商",
        dealerCode: `DL${String(index + 1).padStart(3, "0")}`,
        dealerName: index % 2 === 0 ? "华东经销商A" : "华北经销商B",
        shipToCode: `SHIPTO${String(index + 1).padStart(4, "0")}`,
        shipToName: index % 2 === 0 ? "浦东收货点" : "朝阳收货点",
        cooperationStatus: "合作中",
        cooperationStartDate: dayjs(item.registeredAt).subtract(20, "day").format("YYYY-MM-DD"),
      },
    ],
    businessUnits: [
      {
        id: `${item.id}-bu-1`,
        businessUnit: "干货",
        channelName: index % 2 === 0 ? "现代渠道" : "传统渠道",
        isKeyCustomer: index % 3 === 0,
        cityMaster: index % 2 === 0 ? "上海" : "北京",
        eSignName: item.eSignName,
        eSignPhone: item.phone,
        supplyRelations: [
          {
            id: `${item.id}-relation-1`,
            dealerType: "经销商",
            dealerCode: `DL${String(index + 1).padStart(3, "0")}`,
            dealerName: index % 2 === 0 ? "华东经销商A" : "华北经销商B",
            shipToCode: `SHIPTO${String(index + 1).padStart(4, "0")}`,
            shipToName: index % 2 === 0 ? "浦东收货点" : "朝阳收货点",
            cooperationStatus: "合作中",
            cooperationStartDate: dayjs(item.registeredAt).subtract(20, "day").format("YYYY-MM-DD"),
          },
        ],
      },
    ],
  }));
}

const seedRecords = buildSeedRecords();

function readStoredRecords() {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as CustomerDistributorRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: CustomerDistributorRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getMergedCustomerDistributors() {
  const stored = readStoredRecords();
  const merged = [...seedRecords];
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

export function getCustomerDistributorById(id: string) {
  return getMergedCustomerDistributors().find((item) => item.id === id) ?? null;
}

export function getCustomerDistributorDisplayStatus(record: CustomerDistributorRecord): CustomerDistributorDisplayStatus {
  if (record.approvalStatus === "草稿" || record.approvalStatus === "待审批" || record.approvalStatus === "已驳回") {
    return record.approvalStatus;
  }
  return record.status;
}

export function saveCustomerDistributor(record: CustomerDistributorRecord) {
  const stored = readStoredRecords();
  const index = stored.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    const next = [...stored];
    next[index] = record;
    persistStoredRecords(next);
    return;
  }
  persistStoredRecords([record, ...stored]);
}

export function listCustomerDistributors(filters: CustomerDistributorFilters = {}) {
  const keyword = filters.keyword?.trim().toLowerCase();
  const code = filters.distributorCode?.trim().toLowerCase();
  return getMergedCustomerDistributors().filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.distributorName.toLowerCase().includes(keyword) ||
      item.socialCreditCode.toLowerCase().includes(keyword) ||
      item.legalRepresentative.toLowerCase().includes(keyword);
    const matchesCode = !code || item.distributorCode.toLowerCase().includes(code);
    const matchesCompanyType = !filters.companyType || item.companyType === filters.companyType;
    const matchesStatus = !filters.status || getCustomerDistributorDisplayStatus(item) === filters.status;
    return matchesKeyword && matchesCode && matchesCompanyType && matchesStatus;
  });
}

export function updateCustomerDistributorsStatus(ids: string[], status: CustomerDistributorStatus) {
  const merged = getMergedCustomerDistributors();
  ids.forEach((id) => {
    const target = merged.find((item) => item.id === id);
    if (!target || target.approvalStatus !== "已通过") {
      return;
    }
    saveCustomerDistributor({
      ...target,
      status,
      updatedAt: dayjs().format("YYYY-MM-DD HH:mm"),
    });
  });
}

export function exportCustomerDistributors(records: CustomerDistributorRecord[]) {
  const worksheet = utils.json_to_sheet(
    records.map((item) => ({
      分销商编码: item.distributorCode,
      分销商名称: item.distributorName,
      企业主体类型: item.companyType,
      统一社会信用代码: item.socialCreditCode,
      法定代表人: item.legalRepresentative,
      负责人姓名: item.ownerName,
      负责人手机号: item.ownerPhone,
      负责人邮箱: item.ownerEmail,
      创建时间: item.createdAt,
      更新时间: item.updatedAt,
      状态: getCustomerDistributorDisplayStatus(item),
    })),
  );
  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 26 },
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
  ];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "分销商列表");
  writeFileXLSX(workbook, `客户管理分销商列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function submitCustomerDistributor(params: {
  record: CustomerDistributorRecord;
  account: string;
  operatorName: string;
  remark?: string;
}) {
  const now = dayjs().format("YYYY-MM-DD HH:mm");
  const nextRecord: CustomerDistributorRecord = {
    ...params.record,
    updatedAt: now,
    submittedAt: now,
    status: "停用",
    approvalStatus: "待审批",
    approvalHistory: [
      ...(params.record.approvalHistory ?? []).filter((item) => item.decision !== "提交申请"),
      {
        id: `distributor-submit-${Date.now()}`,
        nodeName: "分销商准入审批",
        decision: "提交申请",
        roleLabel: "管理员",
        operatorName: params.operatorName,
        account: params.account,
        actedAt: now,
        remark: params.remark || "提交分销商审批",
      },
    ],
  };

  saveCustomerDistributor(nextRecord);
  return nextRecord;
}

export function reviewCustomerDistributor(params: {
  id: string;
  action: "approve" | "reject";
  remark: string;
  reviewerAccount: string;
  reviewerName: string;
}) {
  const target = getCustomerDistributorById(params.id);
  if (!target) {
    throw new Error("未找到当前分销商记录");
  }

  const now = dayjs().format("YYYY-MM-DD HH:mm");
  const nextRecord: CustomerDistributorRecord = {
    ...target,
    updatedAt: now,
    approvalStatus: params.action === "approve" ? "已通过" : "已驳回",
    status: params.action === "approve" ? "启用" : "停用",
    approvalHistory: [
      ...(target.approvalHistory ?? []),
      {
        id: `distributor-review-${Date.now()}`,
        nodeName: "分销商准入审批",
        decision: params.action === "approve" ? "审批通过" : "审批驳回",
        roleLabel: "管理员",
        operatorName: params.reviewerName,
        account: params.reviewerAccount,
        actedAt: now,
        remark: params.remark,
      },
    ],
  };

  saveCustomerDistributor(nextRecord);
  return nextRecord;
}
