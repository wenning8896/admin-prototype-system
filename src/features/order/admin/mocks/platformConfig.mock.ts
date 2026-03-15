export type PlatformConfigStatus = "启用" | "停用";

export type PlatformConfigRecord = {
  id: string;
  platformCode: string;
  platformName: string;
  platformShortName: string;
  sort: number;
  createdAt: string;
  status: PlatformConfigStatus;
};

export const platformConfigSeedRecords: PlatformConfigRecord[] = [
  {
    id: "platform-001",
    platformCode: "PLAT-001",
    platformName: "京东",
    platformShortName: "JD",
    sort: 10,
    createdAt: "2026-03-01 09:30",
    status: "启用",
  },
  {
    id: "platform-002",
    platformCode: "PLAT-002",
    platformName: "淘宝",
    platformShortName: "TB",
    sort: 20,
    createdAt: "2026-03-03 14:10",
    status: "启用",
  },
  {
    id: "platform-003",
    platformCode: "PLAT-003",
    platformName: "天猫",
    platformShortName: "TM",
    sort: 30,
    createdAt: "2026-03-08 11:45",
    status: "启用",
  },
  {
    id: "platform-004",
    platformCode: "PLAT-004",
    platformName: "拼多多",
    platformShortName: "PDD",
    sort: 40,
    createdAt: "2026-03-10 16:20",
    status: "启用",
  },
];
