export type ServiceOwnerMaintenanceStatus = "启用" | "停用";

export type ServiceOwnerMaintenanceRecord = {
  id: string;
  serviceProviderCode: string;
  serviceProviderName: string;
  ownerName: string;
  ownerPhone: string;
  nestleAccount: string;
  nestleAccountEmail: string;
  status: ServiceOwnerMaintenanceStatus;
};

export const serviceOwnerMaintenanceSeedRecords: ServiceOwnerMaintenanceRecord[] = [
  {
    id: "service-owner-001",
    serviceProviderCode: "SP-001",
    serviceProviderName: "华东履约服务商",
    ownerName: "周衡",
    ownerPhone: "13800001111",
    nestleAccount: "zhou.heng",
    nestleAccountEmail: "zhou.heng@nestle.com",
    status: "启用",
  },
  {
    id: "service-owner-002",
    serviceProviderCode: "SP-002",
    serviceProviderName: "华南仓配服务商",
    ownerName: "林睿",
    ownerPhone: "13900002222",
    nestleAccount: "lin.rui",
    nestleAccountEmail: "lin.rui@nestle.com",
    status: "启用",
  },
  {
    id: "service-owner-003",
    serviceProviderCode: "SP-003",
    serviceProviderName: "西南区域服务商",
    ownerName: "顾廷",
    ownerPhone: "13700003333",
    nestleAccount: "gu.ting",
    nestleAccountEmail: "gu.ting@nestle.com",
    status: "停用",
  },
];
