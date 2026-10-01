import { v4 as uuidv4 } from "uuid";

export function generateId(): string {
  return uuidv4();
}

export function generateUserId(): string {
  return `anon_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
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
