// core/security/prompt-tool-execution-guard.ts

export interface PantavionPromptToolExecutionRequest {
  promptTrusted: boolean;
  requestedTool: string;
  requestedWriteScope: 'none' | 'thread' | 'canonical' | 'global';
  crossThreadTarget: boolean;
}

export interface PantavionPromptToolExecutionDecision {
  requestedTool: string;
  allowed: boolean;
  escalationBlocked: boolean;
  reason: string;
}

export interface PantavionPromptToolExecutionSnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  escalationBlockedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluatePromptToolExecution(
  request: PantavionPromptToolExecutionRequest,
): PantavionPromptToolExecutionDecision {
  if (!request.promptTrusted && request.requestedWriteScope === 'global') {
    return {
      requestedTool: request.requestedTool,
      allowed: false,
      escalationBlocked: true,
      reason: 'Untrusted prompts may not request global write operations.',
    };
  }

  if (!request.promptTrusted && request.requestedWriteScope === 'canonical') {
    return {
      requestedTool: request.requestedTool,
      allowed: false,
      escalationBlocked: true,
      reason: 'Canonical writes are blocked for untrusted prompts.',
    };
  }

  if (request.crossThreadTarget) {
    return {
      requestedTool: request.requestedTool,
      allowed: false,
      escalationBlocked: true,
      reason: 'Cross-thread execution is blocked by prompt/tool isolation.',
    };
  }

  return {
    requestedTool: request.requestedTool,
    allowed: true,
    escalationBlocked: false,
    reason: 'Prompt/tool execution request is within allowed boundaries.',
  };
}

export function getPromptToolExecutionSnapshot(
  decisions: PantavionPromptToolExecutionDecision[],
): PantavionPromptToolExecutionSnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    allowedCount: decisions.filter((item) => item.allowed).length,
    blockedCount: decisions.filter((item) => !item.allowed).length,
    escalationBlockedCount: decisions.filter((item) => item.escalationBlocked).length,
  };
}

export default evaluatePromptToolExecution;
