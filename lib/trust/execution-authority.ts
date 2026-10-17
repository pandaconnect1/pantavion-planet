export type AuthoritySource = 'USER' | 'FOUNDER' | 'GUARDIAN' | 'SYSTEM_POLICY' | 'SERVICE';

export interface ExecutionAuthorityEnvelope {
  actorId: string;
  authoritySource: AuthoritySource;
  capabilities: readonly string[];
  jurisdiction: string;
  issuedAt: string;
  expiresAt: string;
  auditId: string;
  approvalRequired: boolean;
  approvalId?: string;
}

export class AuthorityError extends Error {
  constructor(public readonly code: 'INVALID_ENVELOPE' | 'EXPIRED_AUTHORITY' | 'CAPABILITY_DENIED' | 'APPROVAL_REQUIRED') {
    super(code);
    this.name = 'AuthorityError';
  }
}

export function authorizeExecution(
  envelope: ExecutionAuthorityEnvelope,
  requiredCapability: string,
  now = new Date(),
): void {
  const issuedAt = Date.parse(envelope.issuedAt);
  const expiresAt = Date.parse(envelope.expiresAt);
  if (
    !envelope.actorId.trim() ||
    !envelope.auditId.trim() ||
    !envelope.jurisdiction.trim() ||
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    issuedAt > expiresAt
  ) {
    throw new AuthorityError('INVALID_ENVELOPE');
  }
  if (expiresAt <= now.getTime()) throw new AuthorityError('EXPIRED_AUTHORITY');
  if (!envelope.capabilities.includes(requiredCapability)) throw new AuthorityError('CAPABILITY_DENIED');
  if (envelope.approvalRequired && !envelope.approvalId?.trim()) throw new AuthorityError('APPROVAL_REQUIRED');
}

/** Human/policy authority is explicit; an agent never grants itself capability. */
export function narrowAuthority(
  parent: ExecutionAuthorityEnvelope,
  childActorId: string,
  requestedCapabilities: readonly string[],
  auditId: string,
): ExecutionAuthorityEnvelope {
  const capabilities = requestedCapabilities.filter((capability) => parent.capabilities.includes(capability));
  return {
    ...parent,
    actorId: childActorId,
    capabilities,
    auditId,
  };
}
