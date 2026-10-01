import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, Message, Chat, Call, Contact, AppSettings } from "@/types";
import { generateId, generateUserId, generateChatId } from "@/utils/crypto";
import { generateAnonymousName } from "@/constants/avatars";
import { fileStorage } from "@/utils/storage";

interface AppState {
  currentUser: User | null;
  users: Record<string, User>;
  chats: Record<string, Chat>;
  messages: Record<string, Message[]>;
  calls: Call[];
  contacts: Record<string, Contact>;
  settings: AppSettings;
  searchQuery: string;
  _hydrated: boolean;

  initialize: () => void;
  updateProfile: (updates: Partial<User>) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;

  createPrivateChat: (otherUserId: string) => string;
  createGroupChat: (name: string, participantIds: string[]) => string;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  deleteChat: (chatId: string) => void;
  pinChat: (chatId: string) => void;
  muteChat: (chatId: string) => void;
  archiveChat: (chatId: string) => void;

  sendMessage: (chatId: string, message: Partial<Message>) => void;
  editMessage: (chatId: string, messageId: string, text: string) => void;
  deleteMessage: (chatId: string, messageId: string, forEveryone: boolean) => void;
  reactToMessage: (chatId: string, messageId: string, emoji: string) => void;
  markAsRead: (chatId: string) => void;

  addCall: (call: Omit<Call, "id" | "startedAt">) => void;
  startCall: (userId: string, type: "voice" | "video") => string;
  endCall: (callId: string) => void;

  findUserByUsername: (username: string) => User | null;
  findOrCreateUser: (query: string) => User | null;

  addContact: (userId: string) => void;
  removeContact: (userId: string) => void;
  blockContact: (userId: string) => void;
  toggleFavorite: (userId: string) => void;

  setSearchQuery: (query: string) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  currentUser: null,
  users: {},
  chats: {},
  messages: {},
  calls: [],
  contacts: {},
  settings: {
    showLastSeen: true,
    readReceipts: true,
    pushNotifications: true,
    messageSound: true,
    fontSize: "normal",
    chatWallpaper: "default",
    mediaAutoDownload: "wifi",
    appLock: false,
  },
  searchQuery: "",
  _hydrated: false,

  initialize: () => {
    if (get().currentUser) return;

    const userId = generateUserId();
    const name = generateAnonymousName();
    const currentUser: User = {
      id: userId,
      username: name.toLowerCase().replace(/\s/g, "_"),
      displayName: name,
      avatar: null,
      bio: "Hey there! I'm anonymous",
      lastSeen: Date.now(),
      isOnline: true,
      createdAt: Date.now(),
    };

    set({
      currentUser,
      users: { [userId]: currentUser },
    });
  },

  updateProfile: (updates) => {
    set((state) => {
      if (!state.currentUser) return state;
      const updated = { ...state.currentUser, ...updates };
      return {
        currentUser: updated,
        users: { ...state.users, [updated.id]: updated },
      };
    });
  },

  updateSettings: (updates) => {
    set((s) => ({ settings: { ...s.settings, ...updates } }));
  },

  createPrivateChat: (otherUserId) => {
    const state = get();
    if (!state.currentUser) return "";
    const chatId = generateChatId(state.currentUser.id, otherUserId);
    if (state.chats[chatId]) return chatId;

    const chat: Chat = {
      id: chatId,
      type: "private",
      participants: [state.currentUser.id, otherUserId],
      createdBy: state.currentUser.id,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((s) => ({
      chats: { ...s.chats, [chatId]: chat },
      messages: { ...s.messages, [chatId]: [] },
    }));
    return chatId;
  },

  createGroupChat: (name, participantIds) => {
    const state = get();
    if (!state.currentUser) return "";
    const chatId = `group_${generateId().slice(0, 8)}`;
    const allParticipants = [state.currentUser.id, ...participantIds];

    const chat: Chat = {
      id: chatId,
      type: "group",
      name,
      participants: allParticipants,
      admins: [state.currentUser.id],
      createdBy: state.currentUser.id,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const systemMessage: Message = {
      id: generateId(),
      chatId,
      senderId: "system",
      text: `${state.currentUser.displayName} created the group "${name}"`,
      type: "system",
      status: "read",
      reactions: {},
      createdAt: Date.now(),
      readBy: allParticipants,
    };

    set((s) => ({
      chats: { ...s.chats, [chatId]: { ...chat, lastMessage: systemMessage } },
      messages: { ...s.messages, [chatId]: [systemMessage] },
    }));
    return chatId;
  },

  updateChat: (chatId, updates) => {
    set((s) => ({
      chats: {
        ...s.chats,
        [chatId]: { ...s.chats[chatId], ...updates, updatedAt: Date.now() },
      },
    }));
  },

  deleteChat: (chatId) => {
    set((s) => {
      const { [chatId]: _, ...chats } = s.chats;
      const { [chatId]: __, ...messages } = s.messages;
      return { chats, messages };
    });
  },

  pinChat: (chatId) => {
    set((s) => ({
      chats: {
        ...s.chats,
        [chatId]: { ...s.chats[chatId], isPinned: !s.chats[chatId].isPinned },
      },
    }));
  },

  muteChat: (chatId) => {
    set((s) => ({
      chats: {
        ...s.chats,
        [chatId]: { ...s.chats[chatId], isMuted: !s.chats[chatId].isMuted },
      },
    }));
  },

  archiveChat: (chatId) => {
    set((s) => ({
      chats: {
        ...s.chats,
        [chatId]: { ...s.chats[chatId], isArchived: !s.chats[chatId].isArchived },
      },
    }));
  },

  sendMessage: (chatId, partial) => {
    const state = get();
    if (!state.currentUser) return;
    const message: Message = {
      id: generateId(),
      chatId,
      senderId: state.currentUser.id,
      text: partial.text || "",
      type: partial.type || "text",
      mediaUrl: partial.mediaUrl,
      mediaThumbnail: partial.mediaThumbnail,
      mediaDuration: partial.mediaDuration,
      mediaWidth: partial.mediaWidth,
      mediaHeight: partial.mediaHeight,
      waveform: partial.waveform,
      fileName: partial.fileName,
      fileSize: partial.fileSize,
      sticker: partial.sticker,
      replyTo: partial.replyTo,
      forwarded: partial.forwarded,
      status: "sent",
      reactions: {},
      createdAt: Date.now(),
      readBy: [state.currentUser.id],
    };

    set((s) => {
      const chatMessages = [...(s.messages[chatId] || []), message];
      return {
        messages: { ...s.messages, [chatId]: chatMessages },
        chats: {
          ...s.chats,
          [chatId]: {
            ...s.chats[chatId],
            lastMessage: message,
            updatedAt: Date.now(),
          },
        },
      };
    });

    setTimeout(() => {
      set((s) => {
        const msgs = s.messages[chatId];
        if (!msgs) return s;
        return {
          messages: {
            ...s.messages,
            [chatId]: msgs.map((m) =>
              m.id === message.id ? { ...m, status: "delivered" } : m
            ),
          },
        };
      });
    }, 500);

    setTimeout(() => {
      set((s) => {
        const msgs = s.messages[chatId];
        if (!msgs) return s;
        return {
          messages: {
            ...s.messages,
            [chatId]: msgs.map((m) =>
              m.id === message.id ? { ...m, status: "read" } : m
            ),
          },
        };
      });
    }, 1500);
  },

  editMessage: (chatId, messageId, text) => {
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] || []).map((m) =>
          m.id === messageId ? { ...m, text, editedAt: Date.now() } : m
        ),
      },
    }));
  },

  deleteMessage: (chatId, messageId, forEveryone) => {
    set((s) => {
      const msgs = (s.messages[chatId] || []).map((m) =>
        m.id === messageId
          ? { ...m, deletedAt: Date.now(), text: forEveryone ? "" : m.text }
          : m
      );
      const lastVisible = [...msgs].reverse().find((m) => !m.deletedAt);
      return {
        messages: { ...s.messages, [chatId]: msgs },
        chats: {
          ...s.chats,
          [chatId]: { ...s.chats[chatId], lastMessage: lastVisible },
        },
      };
    });
  },

  reactToMessage: (chatId, messageId, emoji) => {
    const state = get();
    if (!state.currentUser) return;
    const userId = state.currentUser.id;

    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] || []).map((m) => {
          if (m.id !== messageId) return m;
          const reactions = { ...m.reactions };
          const users = reactions[emoji] || [];
          if (users.includes(userId)) {
            reactions[emoji] = users.filter((id) => id !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...users, userId];
          }
          return { ...m, reactions };
        }),
      },
    }));
  },

  markAsRead: (chatId) => {
    const state = get();
    if (!state.currentUser) return;
    set((s) => ({
      chats: {
        ...s.chats,
        [chatId]: { ...s.chats[chatId], unreadCount: 0 },
      },
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] || []).map((m) => ({
          ...m,
          readBy: m.readBy.includes(state.currentUser!.id)
            ? m.readBy
            : [...m.readBy, state.currentUser!.id],
        })),
      },
    }));
  },

  addCall: (callData) => {
    const call: Call = {
      ...callData,
      id: generateId(),
      startedAt: Date.now(),
    };
    set((s) => ({ calls: [call, ...s.calls] }));
  },

  startCall: (userId, type) => {
    const state = get();
    if (!state.currentUser) return "";
    const callId = generateId();
    const call: Call = {
      id: callId,
      type,
      callerId: state.currentUser.id,
      participants: [state.currentUser.id, userId],
      status: "ongoing",
      startedAt: Date.now(),
    };
    set((s) => ({ calls: [call, ...s.calls] }));
    return callId;
  },

  endCall: (callId) => {
    set((s) => ({
      calls: s.calls.map((c) =>
        c.id === callId
          ? {
              ...c,
              status: "ended" as const,
              endedAt: Date.now(),
              duration: Math.floor((Date.now() - c.startedAt) / 1000),
            }
          : c
      ),
    }));
  },

  findUserByUsername: (username) => {
    const state = get();
    const q = username.toLowerCase().replace(/^@/, "");
    return (
      Object.values(state.users).find(
        (u) =>
          u.username.toLowerCase() === q ||
          u.id.toLowerCase() === q
      ) || null
    );
  },

  findOrCreateUser: (query) => {
    const state = get();
    if (!state.currentUser) return null;
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q || q.length < 2) return null;

    const existing = Object.values(state.users).find(
      (u) => u.username.toLowerCase() === q || u.id.toLowerCase() === q
    );
    if (existing) return existing;

    const username = q.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!username) return null;

    const userId = generateUserId();
    const displayName = username
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const newUser: User = {
      id: userId,
      username,
      displayName,
      avatar: null,
      bio: "Hey there! I'm anonymous",
      lastSeen: Date.now() - Math.floor(Math.random() * 3600000),
      isOnline: Math.random() > 0.5,
      createdAt: Date.now() - Math.floor(Math.random() * 86400000 * 30),
    };

    set((s) => ({
      users: { ...s.users, [userId]: newUser },
    }));

    return newUser;
  },

  addContact: (userId) => {
    set((s) => ({
      contacts: {
        ...s.contacts,
        [userId]: { userId, isBlocked: false, isFavorite: false, addedAt: Date.now() },
      },
    }));
  },

  removeContact: (userId) => {
    set((s) => {
      const { [userId]: _, ...contacts } = s.contacts;
      return { contacts };
    });
  },

  blockContact: (userId) => {
    set((s) => ({
      contacts: {
        ...s.contacts,
        [userId]: { ...s.contacts[userId], isBlocked: !s.contacts[userId]?.isBlocked },
      },
    }));
  },

  toggleFavorite: (userId) => {
    set((s) => ({
      contacts: {
        ...s.contacts,
        [userId]: { ...s.contacts[userId], isFavorite: !s.contacts[userId]?.isFavorite },
      },
    }));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setTyping: (chatId, userId, isTyping) => {
    set((s) => {
      const chat = s.chats[chatId];
      if (!chat) return s;
      const typing = chat.typing || [];
      const newTyping = isTyping
        ? typing.includes(userId) ? typing : [...typing, userId]
        : typing.filter((id) => id !== userId);
      return {
        chats: { ...s.chats, [chatId]: { ...chat, typing: newTyping } },
      };
    });
  },
    }),
    {
      name: "anonymous-chat-store",
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        chats: state.chats,
        messages: state.messages,
        contacts: state.contacts,
        calls: state.calls,
        settings: state.settings,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ _hydrated: true });
      },
    },
  ),
);
