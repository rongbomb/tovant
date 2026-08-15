import { describe, it, expect } from "vitest";
import {
  isOwnerOf,
  requireOwnership,
  messageAsOwnedEntity,
  NotFoundError,
  ForbiddenError,
  type SessionUser,
} from "@/lib/security/ownership";

const owner: SessionUser = { id: "user_owner", role: "owner" };
const provider: SessionUser = { id: "user_provider", role: "provider" };
const stranger: SessionUser = { id: "user_stranger", role: "owner" };
const admin: SessionUser = { id: "user_admin", role: "admin" };

const entity = { ownerId: "user_owner", providerUserId: "user_provider" };

describe("isOwnerOf", () => {
  it("allows the owner", () => {
    expect(isOwnerOf(entity, owner)).toBe(true);
  });

  it("allows the provider", () => {
    expect(isOwnerOf(entity, provider)).toBe(true);
  });

  it("denies an unrelated user", () => {
    expect(isOwnerOf(entity, stranger)).toBe(false);
  });

  it("always allows admin", () => {
    expect(isOwnerOf(entity, admin)).toBe(true);
  });
});

describe("requireOwnership", () => {
  it("returns the entity when the session user owns it", async () => {
    await expect(requireOwnership(entity, owner)).resolves.toBe(entity);
  });

  it("throws NotFoundError for a missing entity", async () => {
    await expect(requireOwnership(null, owner)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError for an unrelated user", async () => {
    await expect(requireOwnership(entity, stranger)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("messageAsOwnedEntity", () => {
  it("maps sender/recipient onto ownerId/providerUserId", () => {
    const message = { senderId: "user_owner", recipientId: "user_provider" };
    expect(messageAsOwnedEntity(message)).toEqual({
      ownerId: "user_owner",
      providerUserId: "user_provider",
    });
  });
});
