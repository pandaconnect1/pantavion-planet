export type MemoryRecord = {
  id: string;
  key: string;
  value: unknown;
  createdAt: string;
};

export type KernelMemoryStore = {
  records: MemoryRecord[];
};

export function createMemoryStore(): KernelMemoryStore {
  return {
    records: [],
  };
}

export function addMemoryRecord(
  store: KernelMemoryStore,
  record: MemoryRecord,
): KernelMemoryStore {
  return {
    ...store,
    records: [record, ...store.records].slice(0, 500),
  };
}

export function getMemoryRecords(
  store: KernelMemoryStore,
): MemoryRecord[] {
  return store.records;
}
