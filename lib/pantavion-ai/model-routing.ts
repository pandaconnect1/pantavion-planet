/**
 * Pantavion-owned inference routing. Models are self-hosted, not third-party AI APIs.
 * A large model is reserved for complex coding; small models serve ordinary chat.
 * Routing does not imply the GPU endpoints are provisioned.
 */
export type PantavionTask = "chat" | "code" | "reason";
export type ModelRoute = { endpoint: string; model: string; token: string; tier: "fast" | "coder" | "frontier" };
const configs = {
  fast: ["PANTAVION_AI_FAST_ENDPOINT", "PANTAVION_AI_FAST_MODEL", "PANTAVION_AI_FAST_KEY"],
  coder: ["PANTAVION_AI_CODER_ENDPOINT", "PANTAVION_AI_CODER_MODEL", "PANTAVION_AI_CODER_KEY"],
  frontier: ["PANTAVION_AI_FRONTIER_ENDPOINT", "PANTAVION_AI_FRONTIER_MODEL", "PANTAVION_AI_FRONTIER_KEY"],
} as const;
export function selectPantavionModel(task: PantavionTask, env: NodeJS.ProcessEnv = process.env): ModelRoute | null {
 const order: Array<keyof typeof configs> = task === "code" ? ["coder","frontier","fast"] : task === "reason" ? ["frontier","coder","fast"] : ["fast","coder","frontier"];
 for (const tier of order) {
  const [endpointKey,modelKey,tokenKey]=configs[tier];
  const endpoint=env[endpointKey]?.trim(),model=env[modelKey]?.trim(),token=env[tokenKey]?.trim();
  if (!endpoint || !model || !token) continue;
  let parsed: URL;
  try { parsed=new URL(endpoint); } catch { continue; }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) continue;
  if (parsed.protocol!=="https:" && !(parsed.protocol==="http:" && ["localhost","127.0.0.1"].includes(parsed.hostname))) continue;
  return { endpoint:parsed.toString(),model,token,tier };
 }
 return null;
}
