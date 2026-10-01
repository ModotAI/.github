import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, Message, Chat, Status, Call, Contact, AppSettings } from "@/types";
import { generateId, generateUserId, generateChatId, generateInviteCode } from "@/utils/crypto";
import { generateAnonymousName } from "@/constants/avatars";
import { fileStorage } from "@/utils/storage";

interface AppState {
  currentUser: User | null;
  users: Record<string, User>;
  chats: Record<string, Chat>;
  messages: Record<string, Message[]>;
  statuses: Status[];
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

  addStatus: (status: Omit<Status, "id" | "userId" | "viewedBy" | "createdAt" | "expiresAt">) => void;
  viewStatus: (statusId: string) => void;
  deleteStatus: (statusId: string) => void;

  addCall: (call: Omit<Call, "id" | "startedAt">) => void;
  startCall: (userId: string, type: "voice" | "video") => string;
  endCall: (callId: string) => void;

  findUserByUsername: (username: string) => User | null;

  addContact: (userId: string) => void;
  removeContact: (userId: string) => void;
  blockContact: (userId: string) => void;
  toggleFavorite: (userId: string) => void;

  setSearchQuery: (query: string) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
}

function createDemoData(currentUserId: string): {
  users: Record<string, User>;
  chats: Record<string, Chat>;
  messages: Record<string, Message[]>;
  contacts: Record<string, Contact>;
  statuses: Status[];
  calls: Call[];
} {
  const now = Date.now();
  const demoUsers: User[] = [
    {
      id: "demo_1", username: "shadow_fox", displayName: "Shadow Fox",
      avatar: null, bio: "Living in the shadows", lastSeen: now - 120000,
      isOnline: true, createdAt: now - 86400000 * 30,
    },
    {
      id: "demo_2", username: "night_owl", displayName: "Night Owl",
      avatar: null, bio: "Awake when the world sleeps", lastSeen: now - 3600000,
      isOnline: false, createdAt: now - 86400000 * 20,
    },
    {
      id: "demo_3", username: "storm_wolf", displayName: "Storm Wolf",
      avatar: null, bio: "Howling at the digital moon", lastSeen: now - 600000,
      isOnline: true, createdAt: now - 86400000 * 15,
    },
    {
      id: "demo_4", username: "dark_phoenix", displayName: "Dark Phoenix",
      avatar: null, bio: "Rising from encrypted ashes", lastSeen: now - 7200000,
      isOnline: false, createdAt: now - 86400000 * 10,
    },
    {
      id: "demo_5", username: "cyber_hawk", displayName: "Cyber Hawk",
      avatar: null, bio: "Watching from above", lastSeen: now - 300000,
      isOnline: true, createdAt: now - 86400000 * 5,
    },
  ];

  const users: Record<string, User> = {};
  demoUsers.forEach((u) => { users[u.id] = u; });

  const chats: Record<string, Chat> = {};
  const messages: Record<string, Message[]> = {};
  const contacts: Record<string, Contact> = {};

  const chatConfigs = [
    { other: demoUsers[0], msgs: [
      { text: "Hey, have you tried the new encryption protocol?", from: "other", ago: 3600000 },
      { text: "Not yet, is it any good?", from: "me", ago: 3500000 },
      { text: "It's incredible. Quantum-resistant!", from: "other", ago: 3400000 },
      { text: "Send me the docs, I'll check it out tonight", from: "me", ago: 3300000 },
      { text: "Done! Let me know what you think 🔐", from: "other", ago: 3200000 },
    ]},
    { other: demoUsers[1], msgs: [
      { text: "Movie night? 🎬", from: "other", ago: 7200000 },
      { text: "Sure! What are we watching?", from: "me", ago: 7000000 },
      { text: "The Matrix, obviously 😎", from: "other", ago: 6800000 },
    ]},
    { other: demoUsers[2], msgs: [
      { text: "The server migration is complete", from: "other", ago: 1800000 },
      { text: "Any issues?", from: "me", ago: 1700000 },
      { text: "All green! Zero downtime 🚀", from: "other", ago: 1600000 },
      { text: "Nice work!", from: "me", ago: 1500000 },
    ]},
    { other: demoUsers[3], msgs: [
      { text: "Can you review my PR?", from: "other", ago: 86400000 },
      { text: "I'll look at it tomorrow", from: "me", ago: 85000000 },
    ]},
    { other: demoUsers[4], msgs: [
      { text: "Welcome! 👋", from: "other", ago: 172800000 },
    ]},
  ];

  chatConfigs.forEach(({ other, msgs }) => {
    const chatId = generateChatId(currentUserId, other.id);
    const chatMessages: Message[] = msgs.map((m, i) => ({
      id: generateId(),
      chatId,
      senderId: m.from === "me" ? currentUserId : other.id,
      text: m.text,
      type: "text" as const,
      status: "read" as const,
      reactions: {},
      createdAt: now - m.ago,
      readBy: [currentUserId, other.id],
    }));

    messages[chatId] = chatMessages;
    chats[chatId] = {
      id: chatId,
      type: "private",
      participants: [currentUserId, other.id],
      createdBy: other.id,
      lastMessage: chatMessages[chatMessages.length - 1],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: now - 86400000,
      updatedAt: chatMessages[chatMessages.length - 1].createdAt,
    };

    contacts[other.id] = {
      userId: other.id,
      isBlocked: false,
      isFavorite: false,
      addedAt: now - 86400000,
    };
  });

  const groupChatId = `group_${generateId().slice(0, 8)}`;
  const groupMsgs: Message[] = [
    {
      id: generateId(), chatId: groupChatId, senderId: demoUsers[0].id,
      text: "Welcome to the Anon Dev Squad! 🎉", type: "text",
      status: "read", reactions: { "🎉": [demoUsers[1].id, demoUsers[2].id] },
      createdAt: now - 86400000, readBy: [currentUserId, ...demoUsers.map(u => u.id)],
    },
    {
      id: generateId(), chatId: groupChatId, senderId: demoUsers[2].id,
      text: "Let's build something amazing together", type: "text",
      status: "read", reactions: {},
      createdAt: now - 82800000, readBy: [currentUserId, ...demoUsers.map(u => u.id)],
    },
    {
      id: generateId(), chatId: groupChatId, senderId: currentUserId,
      text: "I'm in! What's the plan?", type: "text",
      status: "read", reactions: { "💪": [demoUsers[0].id] },
      createdAt: now - 79200000, readBy: [currentUserId, ...demoUsers.map(u => u.id)],
    },
  ];
  messages[groupChatId] = groupMsgs;
  chats[groupChatId] = {
    id: groupChatId,
    type: "group",
    name: "Anon Dev Squad",
    description: "A group for anonymous developers",
    participants: [currentUserId, demoUsers[0].id, demoUsers[1].id, demoUsers[2].id],
    admins: [currentUserId, demoUsers[0].id],
    createdBy: demoUsers[0].id,
    lastMessage: groupMsgs[groupMsgs.length - 1],
    unreadCount: 0,
    isPinned: true,
    isMuted: false,
    isArchived: false,
    createdAt: now - 86400000,
    updatedAt: groupMsgs[groupMsgs.length - 1].createdAt,
  };

  const statuses: Status[] = [
    {
      id: generateId(), userId: demoUsers[0].id, type: "text",
      content: "Coding at 3am... as usual 💻",
      backgroundColor: "#6c5ce7", viewedBy: [],
      createdAt: now - 3600000, expiresAt: now + 82800000,
    },
    {
      id: generateId(), userId: demoUsers[2].id, type: "text",
      content: "Just deployed to production! 🚀",
      backgroundColor: "#00b894", viewedBy: [],
      createdAt: now - 7200000, expiresAt: now + 79200000,
    },
  ];

  const calls: Call[] = [
    {
      id: generateId(), type: "voice", callerId: demoUsers[0].id,
      participants: [currentUserId, demoUsers[0].id],
      status: "ended", startedAt: now - 86400000,
      endedAt: now - 86400000 + 300000, duration: 300,
    },
    {
      id: generateId(), type: "video", callerId: currentUserId,
      participants: [currentUserId, demoUsers[2].id],
      status: "missed", startedAt: now - 172800000,
    },
  ];

  return { users, chats, messages, contacts, statuses, calls };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  currentUser: null,
  users: {},
  chats: {},
  messages: {},
  statuses: [],
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

    const demo = createDemoData(userId);

    set({
      currentUser,
      users: { [userId]: currentUser, ...demo.users },
      chats: demo.chats,
      messages: demo.messages,
      contacts: demo.contacts,
      statuses: demo.statuses,
      calls: demo.calls,
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

  addStatus: (statusData) => {
    const state = get();
    if (!state.currentUser) return;
    const status: Status = {
      ...statusData,
      id: generateId(),
      userId: state.currentUser.id,
      viewedBy: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    set((s) => ({ statuses: [...s.statuses, status] }));
  },

  viewStatus: (statusId) => {
    const state = get();
    if (!state.currentUser) return;
    set((s) => ({
      statuses: s.statuses.map((st) =>
        st.id === statusId && !st.viewedBy.includes(state.currentUser!.id)
          ? { ...st, viewedBy: [...st.viewedBy, state.currentUser!.id] }
          : st
      ),
    }));
  },

  deleteStatus: (statusId) => {
    set((s) => ({
      statuses: s.statuses.filter((st) => st.id !== statusId),
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
        statuses: state.statuses,
        settings: state.settings,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ _hydrated: true });
      },
    },
  ),
);
