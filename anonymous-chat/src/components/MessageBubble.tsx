import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { formatTime } from "@/utils/time";
import { Ionicons } from "@expo/vector-icons";
import { AudioWaveform } from "@/components/AudioWaveform";
import type { Message } from "@/types";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
  isGroupChat: boolean;
  onLongPress: (message: Message) => void;
  onReply: (message: Message) => void;
  onImagePress?: (uri: string) => void;
  fontSize?: number;
  readReceipts?: boolean;
}

export function MessageBubble({ message, isGroupChat, onLongPress, onReply, onImagePress, fontSize = 15, readReceipts = true }: MessageBubbleProps) {
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

  if (message.type === "sticker" && message.sticker && !isDeleted) {
    return (
      <Pressable
        style={[styles.container, isMine ? styles.containerRight : styles.containerLeft]}
        onLongPress={() => onLongPress(message)}
        delayLongPress={300}
      >
        <View style={styles.stickerBubble}>
          <Text style={styles.stickerEmoji}>{message.sticker}</Text>
          <View style={styles.stickerMeta}>
            <Text style={[styles.time, { color: colors.textMuted }]}>
              {formatTime(message.createdAt)}
            </Text>
            {isMine && <StatusIcon status={message.status} isMine colors={colors} readReceipts={readReceipts} />}
          </View>
        </View>
      </Pressable>
    );
  }

  const replyMsg = message.replyTo ? messages.find((m) => m.id === message.replyTo) : null;
  const reactions = Object.entries(message.reactions);
  const hasReactions = reactions.length > 0;

  const isMediaType = message.type === "image" || message.type === "video";
  const hasMediaUri = !!message.mediaUrl;

  return (
    <Pressable
      style={[styles.container, isMine ? styles.containerRight : styles.containerLeft]}
      onLongPress={() => onLongPress(message)}
      delayLongPress={300}
    >
      <View
        style={[
          styles.bubble,
          isMine
            ? [styles.bubbleRight, { backgroundColor: colors.received }]
            : [styles.bubbleLeft, { backgroundColor: colors.sent }],
          isMediaType && hasMediaUri && styles.mediaBubble,
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
              {replyMsg.deletedAt ? "Deleted message" : replyMsg.text || mediaLabel(replyMsg.type)}
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
            <Text style={[styles.deletedText, { color: isMine ? "#ffffff80" : colors.textMuted }]}>
              This message was deleted
            </Text>
          </View>
        ) : (
          <>
            {message.type === "image" && (
              hasMediaUri ? (
                <Pressable onPress={() => onImagePress?.(message.mediaUrl!)}>
                  <Image
                    source={{ uri: message.mediaUrl }}
                    style={[styles.mediaImage, {
                      width: Math.min(message.mediaWidth || 240, 240),
                      height: Math.min(message.mediaHeight || 240, 300),
                    }]}
                    contentFit="cover"
                    transition={200}
                  />
                </Pressable>
              ) : (
                <View style={[styles.mediaPlaceholder, { backgroundColor: isMine ? "rgba(255,255,255,0.1)" : colors.surfaceVariant }]}>
                  <Ionicons name="image" size={40} color={isMine ? "#ffffff60" : colors.textMuted} />
                </View>
              )
            )}

            {message.type === "video" && (
              hasMediaUri ? (
                <View>
                  <Image
                    source={{ uri: message.mediaThumbnail || message.mediaUrl }}
                    style={[styles.mediaImage, {
                      width: Math.min(message.mediaWidth || 240, 240),
                      height: Math.min(message.mediaHeight || 180, 300),
                    }]}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.videoOverlay}>
                    <View style={styles.playCircle}>
                      <Ionicons name="play" size={28} color="#ffffff" />
                    </View>
                    {message.mediaDuration != null && (
                      <Text style={styles.videoDuration}>
                        {Math.floor(message.mediaDuration / 60)}:{(message.mediaDuration % 60).toString().padStart(2, "0")}
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                <View style={[styles.mediaPlaceholder, { backgroundColor: isMine ? "rgba(255,255,255,0.1)" : colors.surfaceVariant }]}>
                  <Ionicons name="videocam" size={40} color={isMine ? "#ffffff60" : colors.textMuted} />
                </View>
              )
            )}

            {(message.type === "voice" || message.type === "audio") && (
              <AudioWaveform
                uri={message.mediaUrl}
                waveform={message.waveform}
                duration={message.mediaDuration || 0}
                isMine={isMine}
              />
            )}

            {message.type === "document" && (
              <View style={[styles.documentRow, { backgroundColor: isMine ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)" }]}>
                <View style={[styles.docIconBox, { backgroundColor: isMine ? "rgba(255,255,255,0.15)" : colors.primary + "20" }]}>
                  <Ionicons name="document-text" size={24} color={isMine ? colors.receivedText : colors.primary} />
                </View>
                <View style={styles.docInfo}>
                  <Text style={[styles.docName, { color: isMine ? colors.receivedText : colors.text }]} numberOfLines={1}>
                    {message.fileName || "Document"}
                  </Text>
                  {message.fileSize != null && (
                    <Text style={[styles.docSize, { color: isMine ? "rgba(255,255,255,0.6)" : colors.textMuted }]}>
                      {formatFileSize(message.fileSize)}
                    </Text>
                  )}
                </View>
                <Ionicons name="download-outline" size={20} color={isMine ? "rgba(255,255,255,0.6)" : colors.textMuted} />
              </View>
            )}

            {message.text ? (
              <Text style={[styles.text, { color: isMine ? colors.receivedText : colors.text, fontSize }]}>
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
          <StatusIcon status={message.status} isMine={isMine} colors={colors} readReceipts={readReceipts} />
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

function StatusIcon({ status, isMine, colors, readReceipts = true }: { status: string; isMine: boolean; colors: any; readReceipts?: boolean }) {
  if (!isMine) return null;
  if (status === "read" && readReceipts) return <Ionicons name="checkmark-done" size={14} color="#ffffff90" />;
  if (status === "read" && !readReceipts) return <Ionicons name="checkmark-done" size={14} color={isMine ? "#ffffff60" : colors.textMuted} />;
  if (status === "delivered") return <Ionicons name="checkmark-done" size={14} color={isMine ? "#ffffff60" : colors.textMuted} />;
  if (status === "sent") return <Ionicons name="checkmark" size={14} color={isMine ? "#ffffff60" : colors.textMuted} />;
  if (status === "sending") return <Ionicons name="time-outline" size={14} color={isMine ? "#ffffff60" : colors.textMuted} />;
  return null;
}

function mediaLabel(type: string): string {
  switch (type) {
    case "image": return "Photo";
    case "video": return "Video";
    case "voice": return "Voice message";
    case "audio": return "Audio";
    case "document": return "Document";
    case "sticker": return "Sticker";
    default: return "";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 12,
    maxWidth: "85%",
  },
  containerLeft: { alignSelf: "flex-start" },
  containerRight: { alignSelf: "flex-end" },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  mediaBubble: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  bubbleLeft: { borderRadius: 16, borderTopLeftRadius: 4 },
  bubbleRight: { borderRadius: 16, borderTopRightRadius: 4 },
  senderName: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  text: { fontSize: 15, lineHeight: 20 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 4,
  },
  time: { fontSize: 11 },
  edited: { fontSize: 11, fontStyle: "italic" },
  systemContainer: { alignItems: "center", marginVertical: 8, paddingHorizontal: 16 },
  systemBubble: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  systemText: { fontSize: 12, textAlign: "center" },
  replyContainer: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    marginBottom: 4,
    borderRadius: 4,
    paddingRight: 8,
  },
  replyName: { fontSize: 12, fontWeight: "600" },
  replyText: { fontSize: 12 },
  forwardedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  forwardedText: { fontSize: 11, fontStyle: "italic" },
  deletedRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  deletedText: { fontSize: 14, fontStyle: "italic" },
  reactionsContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: -6,
  },
  reactionsLeft: { alignSelf: "flex-start", marginLeft: 8 },
  reactionsRight: { alignSelf: "flex-end", marginRight: 8 },
  reactionItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 2 },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 11, marginLeft: 2 },
  mediaImage: {
    borderRadius: 12,
    minWidth: 150,
    minHeight: 100,
  },
  mediaPlaceholder: {
    width: 200,
    height: 150,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  videoDuration: {
    position: "absolute",
    bottom: 8,
    right: 10,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  docInfo: { flex: 1, gap: 2 },
  docName: { fontSize: 14, fontWeight: "500" },
  docSize: { fontSize: 12 },
  stickerBubble: { alignItems: "center" },
  stickerEmoji: { fontSize: 72 },
  stickerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
});
