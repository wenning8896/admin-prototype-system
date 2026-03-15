export type CertificationStatus = "未认证" | "认证中" | "已认证" | "认证驳回";

export type EDistributorRecord = {
  id: string;
  distributorName: string;
  distributorCode: string;
  companyType: "企业" | "个体工商户";
  socialCreditCode: string;
  legalRepresentative: string;
  phone: string;
  eSignName: string;
  businessOwnerName: string;
  email: string;
  productScopes: string[];
  registeredAt: string;
  certificationStatus: CertificationStatus;
  relatedServiceProviders: Array<{
    id: string;
    name: string;
    owner: string;
    status: "已关联" | "待确认";
  }>;
};

export const eDistributorSeedRecords: EDistributorRecord[] = [
  {
    id: "ed-001",
    distributorName: "上海联享分销有限公司",
    distributorCode: "EDS240301",
    companyType: "企业",
    socialCreditCode: "91310115MA1K3L6P8M",
    legalRepresentative: "赵昱",
    phone: "13856217890",
    eSignName: "王曦",
    businessOwnerName: "刘彬",
    email: "operation@lianxiang.example",
    productScopes: ["奶品", "咖啡", "RTD"],
    registeredAt: "2026-03-02 09:12",
    certificationStatus: "已认证",
    relatedServiceProviders: [
      { id: "sp-001", name: "华东履约服务商", owner: "周奕", status: "已关联" },
      { id: "sp-002", name: "浦东仓配服务商", owner: "沈岚", status: "待确认" },
    ],
  },
  {
    id: "ed-002",
    distributorName: "广州星河渠道管理有限公司",
    distributorCode: "EDS240302",
    companyType: "企业",
    socialCreditCode: "91440101MA5D8K2W1Q",
    legalRepresentative: "林森",
    phone: "13922457890",
    eSignName: "陈熙",
    businessOwnerName: "梁可",
    email: "bd@xinghe.example",
    productScopes: ["奶品", "糖果"],
    registeredAt: "2026-03-05 14:26",
    certificationStatus: "认证中",
    relatedServiceProviders: [],
  },
  {
    id: "ed-003",
    distributorName: "成都优选商贸中心",
    distributorCode: "EDS240303",
    companyType: "个体工商户",
    socialCreditCode: "92510100MA63L9A71N",
    legalRepresentative: "贺青",
    phone: "13711885672",
    eSignName: "贺青",
    businessOwnerName: "肖萌",
    email: "youxuan@trade.example",
    productScopes: ["咖啡", "星巴克"],
    registeredAt: "2026-03-07 11:08",
    certificationStatus: "认证驳回",
    relatedServiceProviders: [{ id: "sp-003", name: "西南区域服务商", owner: "马昭", status: "已关联" }],
  },
  {
    id: "ed-004",
    distributorName: "北京北辰快配有限公司",
    distributorCode: "EDS240304",
    companyType: "企业",
    socialCreditCode: "91110108MA00A1234X",
    legalRepresentative: "唐越",
    phone: "13691924561",
    eSignName: "顾忻",
    businessOwnerName: "陆禾",
    email: "delivery@beichen.example",
    productScopes: ["RTD"],
    registeredAt: "2026-03-08 16:40",
    certificationStatus: "未认证",
    relatedServiceProviders: [],
  },
  {
    id: "ed-005",
    distributorName: "苏州云启渠道有限公司",
    distributorCode: "EDS240305",
    companyType: "企业",
    socialCreditCode: "91320594MA1Y8N7C9U",
    legalRepresentative: "宋庭",
    phone: "13501762348",
    eSignName: "周翎",
    businessOwnerName: "何齐",
    email: "channel@yq.example",
    productScopes: ["奶品", "咖啡", "糖果", "RTD"],
    registeredAt: "2026-03-10 10:18",
    certificationStatus: "已认证",
    relatedServiceProviders: [],
  },
];
