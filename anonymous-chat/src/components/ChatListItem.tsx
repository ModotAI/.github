import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { Avatar } from "./Avatar";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { formatTime, formatDate } from "@/utils/time";
import type { Chat } from "@/types";
import { Ionicons } from "@expo/vector-icons";

interface ChatListItemProps {
  chat: Chat;
  onLongPress?: (chat: Chat) => void;
}

export function ChatListItem({ chat, onLongPress }: ChatListItemProps) {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);

  if (!currentUser) return null;

  const isGroup = chat.type === "group";
  const otherUserId = isGroup
    ? ""
    : chat.participants.find((id) => id !== currentUser.id) || "";
  const otherUser = isGroup ? null : users[otherUserId];

  const chatName = isGroup ? chat.name || "Group" : otherUser?.displayName || "Unknown";
  const chatId = isGroup ? chat.id : otherUserId;
  const isOnline = isGroup ? false : otherUser?.isOnline || false;
  const isTyping = (chat.typing || []).length > 0;

  const lastMsg = chat.lastMessage;
  const lastMsgTime = lastMsg ? lastMsg.createdAt : chat.updatedAt;
  const isToday = new Date(lastMsgTime).toDateString() === new Date().toDateString();

  let previewText = "";
  if (isTyping) {
    const typingUsers = (chat.typing || [])
      .map((id) => users[id]?.displayName || "Someone")
      .join(", ");
    previewText = `${typingUsers} typing...`;
  } else if (lastMsg) {
    if (lastMsg.deletedAt) {
      previewText = "🚫 This message was deleted";
    } else if (lastMsg.type === "image") {
      previewText = "📷 Photo";
    } else if (lastMsg.type === "video") {
      previewText = "🎥 Video";
    } else if (lastMsg.type === "voice") {
      previewText = "🎤 Voice message";
    } else if (lastMsg.type === "document") {
      previewText = "📄 Document";
    } else if (lastMsg.type === "audio") {
      previewText = "🎵 Audio";
    } else {
      previewText = lastMsg.text;
    }
    if (isGroup && lastMsg.senderId !== currentUser.id && lastMsg.type !== "system") {
      const sender = users[lastMsg.senderId]?.displayName || "Unknown";
      previewText = `${sender}: ${previewText}`;
    }
  }

  const statusIcon = lastMsg?.senderId === currentUser.id ? (
    lastMsg.status === "read" ? (
      <Ionicons name="checkmark-done" size={16} color={colors.primary} style={styles.statusIcon} />
    ) : lastMsg.status === "delivered" ? (
      <Ionicons name="checkmark-done" size={16} color={colors.textMuted} style={styles.statusIcon} />
    ) : (
      <Ionicons name="checkmark" size={16} color={colors.textMuted} style={styles.statusIcon} />
    )
  ) : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? colors.surfaceVariant : "transparent" },
      ]}
      onPress={() => router.push(`/chat/${chat.id}`)}
      onLongPress={() => onLongPress?.(chat)}
      delayLongPress={400}
    >
      <Avatar
        id={chatId}
        name={chatName}
        size={52}
        showOnline={!isGroup}
        isOnline={isOnline}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            {chat.isMuted && (
              <Ionicons name="volume-mute" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {chatName}
            </Text>
          </View>
          <Text style={[styles.time, { color: chat.unreadCount > 0 ? colors.primary : colors.textMuted }]}>
            {isToday ? formatTime(lastMsgTime) : formatDate(lastMsgTime)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.previewRow}>
            {statusIcon}
            <Text
              style={[
                styles.preview,
                {
                  color: isTyping ? colors.primary : colors.textSecondary,
                  fontStyle: isTyping ? "italic" : "normal",
                },
              ]}
              numberOfLines={1}
            >
              {previewText}
            </Text>
          </View>
          <View style={styles.badges}>
            {chat.isPinned && (
              <Ionicons name="pin" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
            )}
            {chat.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: chat.isMuted ? colors.textMuted : colors.primary }]}>
                <Text style={styles.unreadText}>
                  {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.05)",
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  time: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  statusIcon: {
    marginRight: 4,
  },
  preview: {
    fontSize: 14,
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
});
