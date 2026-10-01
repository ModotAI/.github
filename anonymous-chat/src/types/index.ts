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
  mediaWidth?: number;
  mediaHeight?: number;
  waveform?: number[];
  fileName?: string;
  fileSize?: number;
  sticker?: string;
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

export type FontSizeOption = "small" | "normal" | "large";
export type MediaAutoDownload = "always" | "wifi" | "never";
export type ChatWallpaper = "default" | "dark" | "gradient1" | "gradient2" | "gradient3" | "solid1" | "solid2" | "solid3";

export interface AppSettings {
  showLastSeen: boolean;
  readReceipts: boolean;
  pushNotifications: boolean;
  messageSound: boolean;
  fontSize: FontSizeOption;
  chatWallpaper: ChatWallpaper;
  mediaAutoDownload: MediaAutoDownload;
  appLock: boolean;
}
