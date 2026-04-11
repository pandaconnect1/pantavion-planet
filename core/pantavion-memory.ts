export type MemoryType =
  | "directive"
  | "decision"
  | "task"
  | "module"
  | "system"
  | "user"
  | "signal";

export type MemoryEntry = {
  id: string;
  type: MemoryType;
  content: string;
  createdAt: string;
};

const MEMORY: MemoryEntry[] = [];

function now() {
  return new Date().toISOString();
}

export function addMemory(type: MemoryType, content: string) {
  const entry: MemoryEntry = {
    id: Date.now().toString(),
    type,
    content,
    createdAt: now()
  };

  MEMORY.unshift(entry);
  return entry;
}

export function getMemory() {
  return MEMORY;
}
