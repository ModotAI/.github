export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  lastSeen: number;
  isOnline: boolean;
  createdAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: MessageType;
  mediaUrl?: string;
  mediaThumbnail?: string;
  mediaDuration?: number;
  replyTo?: string;
  forwarded?: boolean;
  status: MessageStatus;
  reactions: Record<string, string[]>;
  createdAt: number;
  editedAt?: number;
  deletedAt?: number;
  readBy: string[];
}

export type MessageType = "text" | "image" | "video" | "audio" | "voice" | "document" | "location" | "sticker" | "system";

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
  avatar?: string;
  participants: string[];
  admins?: string[];
  createdBy: string;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  typing?: string[];
  disappearingMessages?: number;
}

export type ChatType = "private" | "group";

export interface Status {
  id: string;
  userId: string;
  type: "text" | "image" | "video";
  content: string;
  backgroundColor?: string;
  caption?: string;
  viewedBy: string[];
  createdAt: number;
  expiresAt: number;
}

export interface Call {
  id: string;
  type: "voice" | "video";
  callerId: string;
  participants: string[];
  status: "ringing" | "ongoing" | "ended" | "missed" | "declined";
  startedAt: number;
  endedAt?: number;
  duration?: number;
}

export interface Contact {
  userId: string;
  nickname?: string;
  isBlocked: boolean;
  isFavorite: boolean;
  addedAt: number;
}
