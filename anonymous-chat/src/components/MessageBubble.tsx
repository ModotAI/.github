import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { formatTime } from "@/utils/time";
import { Ionicons } from "@expo/vector-icons";
import type { Message } from "@/types";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
  isGroupChat: boolean;
  onLongPress: (message: Message) => void;
  onReply: (message: Message) => void;
}

export function MessageBubble({ message, isGroupChat, onLongPress, onReply }: MessageBubbleProps) {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const messages = useStore((s) => s.messages[message.chatId] || []);
  const [showReactions, setShowReactions] = useState(false);

  if (!currentUser) return null;

  const isMine = message.senderId === currentUser.id;
  const isSystem = message.type === "system";
  const sender = users[message.senderId];
  const isDeleted = !!message.deletedAt;

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <View style={[styles.systemBubble, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.systemText, { color: colors.textSecondary }]}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  }

  const replyMsg = message.replyTo
    ? messages.find((m) => m.id === message.replyTo)
    : null;

  const reactions = Object.entries(message.reactions);
  const hasReactions = reactions.length > 0;

  const statusIcon = isMine ? (
    message.status === "read" ? (
      <Ionicons name="checkmark-done" size={14} color="#ffffff90" />
    ) : message.status === "delivered" ? (
      <Ionicons name="checkmark-done" size={14} color={isMine ? "#ffffff60" : colors.textMuted} />
    ) : message.status === "sent" ? (
      <Ionicons name="checkmark" size={14} color={isMine ? "#ffffff60" : colors.textMuted} />
    ) : message.status === "sending" ? (
      <Ionicons name="time-outline" size={14} color={isMine ? "#ffffff60" : colors.textMuted} />
    ) : null
  ) : null;

  return (
    <Pressable
      style={[
        styles.container,
        isMine ? styles.containerRight : styles.containerLeft,
      ]}
      onLongPress={() => onLongPress(message)}
      delayLongPress={300}
    >
      <View
        style={[
          styles.bubble,
          isMine
            ? [styles.bubbleRight, { backgroundColor: colors.received }]
            : [styles.bubbleLeft, { backgroundColor: colors.sent }],
        ]}
      >
        {isGroupChat && !isMine && sender && (
          <Text style={[styles.senderName, { color: colors.accent }]}>
            {sender.displayName}
          </Text>
        )}

        {replyMsg && (
          <View style={[styles.replyContainer, { borderLeftColor: colors.accent, backgroundColor: isMine ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
            <Text style={[styles.replyName, { color: colors.accent }]} numberOfLines={1}>
              {replyMsg.senderId === currentUser.id ? "You" : users[replyMsg.senderId]?.displayName || "Unknown"}
            </Text>
            <Text style={[styles.replyText, { color: isMine ? colors.receivedText : colors.textSecondary }]} numberOfLines={1}>
              {replyMsg.deletedAt ? "Deleted message" : replyMsg.text}
            </Text>
          </View>
        )}

        {message.forwarded && (
          <View style={styles.forwardedRow}>
            <Ionicons name="arrow-redo" size={12} color={isMine ? "#ffffff80" : colors.textMuted} />
            <Text style={[styles.forwardedText, { color: isMine ? "#ffffff80" : colors.textMuted }]}>
              Forwarded
            </Text>
          </View>
        )}

        {isDeleted ? (
          <View style={styles.deletedRow}>
            <Ionicons name="ban" size={14} color={isMine ? "#ffffff80" : colors.textMuted} />
            <Text
              style={[
                styles.deletedText,
                { color: isMine ? "#ffffff80" : colors.textMuted },
              ]}
            >
              This message was deleted
            </Text>
          </View>
        ) : (
          <>
            {message.type === "image" && (
              <View style={[styles.mediaPlaceholder, { backgroundColor: isMine ? "rgba(255,255,255,0.1)" : colors.surfaceVariant }]}>
                <Ionicons name="image" size={40} color={isMine ? "#ffffff60" : colors.textMuted} />
                <Text style={{ color: isMine ? "#ffffff80" : colors.textMuted, fontSize: 12, marginTop: 4 }}>Photo</Text>
              </View>
            )}
            {message.type === "video" && (
              <View style={[styles.mediaPlaceholder, { backgroundColor: isMine ? "rgba(255,255,255,0.1)" : colors.surfaceVariant }]}>
                <Ionicons name="videocam" size={40} color={isMine ? "#ffffff60" : colors.textMuted} />
                <Text style={{ color: isMine ? "#ffffff80" : colors.textMuted, fontSize: 12, marginTop: 4 }}>Video</Text>
              </View>
            )}
            {(message.type === "voice" || message.type === "audio") && (
              <View style={styles.voiceRow}>
                <Ionicons name="play" size={24} color={isMine ? colors.receivedText : colors.primary} />
                <View style={[styles.voiceWave, { backgroundColor: isMine ? "rgba(255,255,255,0.3)" : colors.surfaceVariant }]} />
                <Text style={{ color: isMine ? "#ffffff80" : colors.textMuted, fontSize: 12 }}>
                  0:{(message.mediaDuration || 0).toString().padStart(2, "0")}
                </Text>
              </View>
            )}
            {message.type === "document" && (
              <View style={styles.documentRow}>
                <Ionicons name="document" size={32} color={isMine ? colors.receivedText : colors.primary} />
                <Text style={[styles.documentName, { color: isMine ? colors.receivedText : colors.text }]}>
                  Document
                </Text>
              </View>
            )}
            {message.text ? (
              <Text style={[styles.text, { color: isMine ? colors.receivedText : colors.text }]}>
                {message.text}
              </Text>
            ) : null}
          </>
        )}

        <View style={styles.metaRow}>
          {message.editedAt && (
            <Text style={[styles.edited, { color: isMine ? "#ffffff60" : colors.textMuted }]}>
              edited
            </Text>
          )}
          <Text style={[styles.time, { color: isMine ? "#ffffff80" : colors.textMuted }]}>
            {formatTime(message.createdAt)}
          </Text>
          {statusIcon}
        </View>
      </View>

      {hasReactions && (
        <Pressable
          style={[
            styles.reactionsContainer,
            isMine ? styles.reactionsRight : styles.reactionsLeft,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => setShowReactions(!showReactions)}
        >
          {reactions.map(([emoji, userIds]) => (
            <View key={emoji} style={styles.reactionItem}>
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              {userIds.length > 1 && (
                <Text style={[styles.reactionCount, { color: colors.textSecondary }]}>
                  {userIds.length}
                </Text>
              )}
            </View>
          ))}
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 12,
    maxWidth: "85%",
  },
  containerLeft: {
    alignSelf: "flex-start",
  },
  containerRight: {
    alignSelf: "flex-end",
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  bubbleLeft: {
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  bubbleRight: {
    borderRadius: 16,
    borderTopRightRadius: 4,
  },
  senderName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: 11,
  },
  edited: {
    fontSize: 11,
    fontStyle: "italic",
  },
  systemContainer: {
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  systemText: {
    fontSize: 12,
    textAlign: "center",
  },
  replyContainer: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    marginBottom: 4,
    borderRadius: 4,
    paddingRight: 8,
  },
  replyName: {
    fontSize: 12,
    fontWeight: "600",
  },
  replyText: {
    fontSize: 12,
  },
  forwardedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  forwardedText: {
    fontSize: 11,
    fontStyle: "italic",
  },
  deletedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deletedText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  reactionsContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: -6,
  },
  reactionsLeft: {
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  reactionsRight: {
    alignSelf: "flex-end",
    marginRight: 8,
  },
  reactionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    marginLeft: 2,
  },
  mediaPlaceholder: {
    width: 200,
    height: 150,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  voiceWave: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    minWidth: 100,
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  documentName: {
    fontSize: 14,
    fontWeight: "500",
  },
});
