export type KernelState = {
  memory: any[]
  planner: any[]
  tasks: any[]
  signals: any[]
  radar: any[]
  audit: any[]
  modules: any[]
  updatedAt: string
}

const KEY = "pantavion.kernel.v1"

function now() {
  return new Date().toISOString()
}

export function createKernel(): KernelState {
  return {
    memory: [],
    planner: [],
    tasks: [],
    signals: [],
    radar: [],
    audit: [],
    modules: [
      { key: "memory", state: "active" },
      { key: "planner", state: "active" },
      { key: "runner", state: "idle" },
      { key: "intelligence", state: "active" },
      { key: "radar", state: "idle" },
      { key: "evolution", state: "idle" }
    ],
    updatedAt: now()
  }
}

export function loadKernel(): KernelState {
  if (typeof window === "undefined") return createKernel()

  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return createKernel()
    return JSON.parse(raw)
  } catch {
    return createKernel()
  }
}

export function saveKernel(state: KernelState) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify({ ...state, updatedAt: now() }))
}

export function addMemory(state: KernelState, text: string): KernelState {
  const next = {
    ...state,
    memory: [{ id: Date.now(), text, createdAt: now() }, ...state.memory]
  }

  next.audit.unshift({
    id: Date.now(),
    action: "memory.add",
    message: text,
    createdAt: now()
  })

  return next
}

export function addTask(state: KernelState, title: string): KernelState {
  const next = {
    ...state,
    tasks: [
      { id: Date.now(), title, status: "queued", createdAt: now() },
      ...state.tasks
    ]
  }

  next.audit.unshift({
    id: Date.now(),
    action: "task.add",
    message: title,
    createdAt: now()
  })

  return next
}

export function runKernel(state: KernelState): KernelState {
  const task = state.tasks.find(t => t.status === "queued")
  if (!task) return state

  task.status = "done"

  const next = {
    ...state,
    updatedAt: now()
  }

  next.audit.unshift({
    id: Date.now(),
    action: "kernel.run",
    message: `Executed: ${task.title}`,
    createdAt: now()
  })

  return next
}
