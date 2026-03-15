export type ServiceProviderRecord = {
  id: string;
  serviceProviderCode: string;
  serviceProviderName: string;
  ownerName: string;
  ownerPhone: string;
  region: string;
  linkedDistributorCount: number;
  status: "启用" | "停用";
  createdAt: string;
};

export const serviceProviderSeedRecords: ServiceProviderRecord[] = [
  {
    id: "sp-001",
    serviceProviderCode: "SP-001",
    serviceProviderName: "华东履约服务商",
    ownerName: "周衡",
    ownerPhone: "13800001111",
    region: "华东区域",
    linkedDistributorCount: 12,
    status: "启用",
    createdAt: "2026-02-11 10:18",
  },
  {
    id: "sp-002",
    serviceProviderCode: "SP-002",
    serviceProviderName: "华南仓配服务商",
    ownerName: "林睿",
    ownerPhone: "13900002222",
    region: "华南区域",
    linkedDistributorCount: 8,
    status: "启用",
    createdAt: "2026-02-18 14:06",
  },
  {
    id: "sp-003",
    serviceProviderCode: "SP-003",
    serviceProviderName: "西南区域服务商",
    ownerName: "顾廷",
    ownerPhone: "13700003333",
    region: "西南区域",
    linkedDistributorCount: 5,
    status: "停用",
    createdAt: "2026-02-25 09:42",
  },
];
