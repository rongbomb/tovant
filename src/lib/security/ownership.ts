/**
 * Row-level ownership check shared across every quote/job/payment/dispute/
 * message route — see CLAUDE.md: "this is a repeated pattern across the
 * whole API, not a one-off." Every entity in those tables carries
 * ownerId/providerUserId (or an equivalent pair below), so this stays
 * generic instead of being reimplemented per-route.
 */

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export interface OwnedEntity {
  ownerId?: string | null;
  providerUserId?: string | null;
}

export interface SessionUser {
  id: string;
  role: "owner" | "provider" | "admin";
}

export function isOwnerOf(entity: OwnedEntity, session: SessionUser): boolean {
  if (session.role === "admin") return true;
  return entity.ownerId === session.id || entity.providerUserId === session.id;
}

export async function requireOwnership<T extends OwnedEntity>(
  entity: T | undefined | null,
  session: SessionUser,
): Promise<T> {
  if (!entity) throw new NotFoundError();
  if (!isOwnerOf(entity, session)) throw new ForbiddenError();
  return entity;
}

/**
 * messages rows use sender/recipient rather than owner/providerUserId —
 * this adapts them to the same shape so callers use one primitive
 * regardless of which table they're checking against.
 */
export function messageAsOwnedEntity(message: {
  senderId: string;
  recipientId: string;
}): OwnedEntity {
  return { ownerId: message.senderId, providerUserId: message.recipientId };
}
