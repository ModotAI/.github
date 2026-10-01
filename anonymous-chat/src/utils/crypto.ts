import * as ExpoCrypto from "expo-crypto";

export function generateId(): string {
  return ExpoCrypto.randomUUID();
}

export function generateUserId(): string {
  return `anon_${ExpoCrypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function generateChatId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `chat_${sorted[0]}_${sorted[1]}`;
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
