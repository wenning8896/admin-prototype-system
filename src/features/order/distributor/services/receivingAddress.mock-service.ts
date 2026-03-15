import type { ReceivingAddressRecord } from "../mocks/receivingAddress.mock";
import { receivingAddressSeedRecords } from "../mocks/receivingAddress.mock";

const STORAGE_KEY = "csl-order-distributor-receiving-addresses";

export type ReceivingAddressFilters = {
  keyword?: string;
};

export type SaveReceivingAddressPayload = Omit<ReceivingAddressRecord, "id"> & { id?: string };

function readStoredRecords() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as ReceivingAddressRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistRecords(records: ReceivingAddressRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getMergedRecords() {
  const merged = [...receivingAddressSeedRecords];
  const stored = readStoredRecords();

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

export async function listReceivingAddresses(filters: ReceivingAddressFilters = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const keyword = filters.keyword?.trim().toLowerCase();

  return getMergedRecords().filter((item) => {
    if (!keyword) {
      return true;
    }

    return (
      item.name.toLowerCase().includes(keyword) ||
      item.phone.includes(keyword) ||
      `${item.province}${item.city}${item.district}${item.detailAddress}`.toLowerCase().includes(keyword)
    );
  });
}

export async function saveReceivingAddress(payload: SaveReceivingAddressPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 240));
  const stored = readStoredRecords();
  const nextRecord: ReceivingAddressRecord = {
    id: payload.id ?? `addr-${Date.now()}`,
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    province: payload.province.trim(),
    city: payload.city.trim(),
    district: payload.district.trim(),
    detailAddress: payload.detailAddress.trim(),
    postalCode: payload.postalCode.trim(),
  };

  const existingIndex = stored.findIndex((item) => item.id === nextRecord.id);
  if (existingIndex >= 0) {
    const next = [...stored];
    next[existingIndex] = nextRecord;
    persistRecords(next);
    return nextRecord;
  }

  const isSeed = receivingAddressSeedRecords.some((item) => item.id === nextRecord.id);
  persistRecords(isSeed ? [...stored, nextRecord] : [nextRecord, ...stored]);
  return nextRecord;
}

export async function deleteReceivingAddress(id: string) {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const stored = readStoredRecords().filter((item) => item.id !== id);
  persistRecords(stored);
}

export async function getReceivingAddressById(id: string) {
  await new Promise((resolve) => window.setTimeout(resolve, 100));
  return getMergedRecords().find((item) => item.id === id) ?? null;
}
