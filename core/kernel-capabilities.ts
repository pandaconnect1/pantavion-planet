export const KERNEL_CAPABILITIES = [
  {
    key: "classifier",
    title: "Input Classifier",
    description: "Classifies requests into module, user segment and delivery mode."
  },
  {
    key: "canonical-memory",
    title: "Canonical Memory",
    description: "Stores directives, runs and decisions server-side."
  },
  {
    key: "planner",
    title: "Planner",
    description: "Builds governed plan steps for execution."
  },
  {
    key: "orchestrator",
    title: "Orchestrator",
    description: "Combines memory, planning and final output."
  },
  {
    key: "state-api",
    title: "State API",
    description: "Exposes current kernel state."
  }
];
