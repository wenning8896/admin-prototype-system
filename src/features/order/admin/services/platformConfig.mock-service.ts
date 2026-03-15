import dayjs from "dayjs";
import type { PlatformConfigRecord, PlatformConfigStatus } from "../mocks/platformConfig.mock";
import { platformConfigSeedRecords } from "../mocks/platformConfig.mock";

const STORAGE_KEY = "csl-order-admin-platform-configs";

export type PlatformConfigFilters = {
  keyword?: string;
  status?: PlatformConfigStatus;
};

export type SavePlatformConfigPayload = {
  id?: string;
  platformName: string;
  platformShortName: string;
  sort: number;
  status: PlatformConfigStatus;
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
    return JSON.parse(raw) as PlatformConfigRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistStoredRecords(records: PlatformConfigRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function buildPlatformCode(records: PlatformConfigRecord[]) {
  const maxSequence = records.reduce((max, item) => {
    const matched = item.platformCode.match(/PLAT-(\d+)/);
    const next = matched ? Number(matched[1]) : 0;
    return Math.max(max, next);
  }, 0);

  return `PLAT-${String(maxSequence + 1).padStart(3, "0")}`;
}

function getMergedRecords() {
  const stored = readStoredRecords();
  const merged = [...platformConfigSeedRecords];

  stored.forEach((item) => {
    const index = merged.findIndex((record) => record.id === item.id);
    if (index >= 0) {
      merged[index] = item;
      return;
    }

    merged.unshift(item);
  });

  return merged.sort((a, b) => a.sort - b.sort || dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf());
}

export async function listPlatformConfigs(filters: PlatformConfigFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 240));

  const keyword = filters.keyword?.trim().toLowerCase();

  return getMergedRecords().filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.platformCode.toLowerCase().includes(keyword) ||
      item.platformName.toLowerCase().includes(keyword) ||
      item.platformShortName.toLowerCase().includes(keyword);
    const matchesStatus = !filters.status || item.status === filters.status;

    return matchesKeyword && matchesStatus;
  });
}

export async function savePlatformConfig(payload: SavePlatformConfigPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 320));

  const stored = readStoredRecords();
  const merged = getMergedRecords();
  const existingRecord = payload.id ? merged.find((item) => item.id === payload.id) : undefined;
  const nextRecord: PlatformConfigRecord = {
    id: payload.id ?? `platform-${Date.now()}`,
    platformCode: existingRecord?.platformCode ?? buildPlatformCode(merged),
    platformName: payload.platformName.trim(),
    platformShortName: payload.platformShortName.trim(),
    sort: payload.sort,
    status: payload.status,
    createdAt:
      payload.id && existingRecord?.createdAt
        ? existingRecord.createdAt
        : dayjs().format("YYYY-MM-DD HH:mm"),
  };

  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);

  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistStoredRecords(next);
    return nextRecord;
  }

  const seedIndex = platformConfigSeedRecords.findIndex((item) => item.id === nextRecord.id);

  if (seedIndex >= 0) {
    persistStoredRecords([...stored, nextRecord]);
    return nextRecord;
  }

  persistStoredRecords([nextRecord, ...stored]);
  return nextRecord;
}
