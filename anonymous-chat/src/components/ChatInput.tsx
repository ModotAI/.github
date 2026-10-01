import { View, TextInput, StyleSheet, Pressable, Platform } from "react-native";
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import type { Message } from "@/types";
import { Text } from "react-native";

interface ChatInputProps {
  onSend: (text: string) => void;
  onAttach: () => void;
  onVoice: () => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  onSaveEdit: (text: string) => void;
}

export function ChatInput({
  onSend,
  onAttach,
  onVoice,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSaveEdit,
}: ChatInputProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(editingMessage?.text || "");
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (editingMessage) {
      onSaveEdit(trimmed);
    } else {
      onSend(trimmed);
    }
    setText("");
  };

  const hasText = text.trim().length > 0;

  return (
    <View style={[styles.wrapper, { borderTopColor: colors.border }]}>
      {(replyTo || editingMessage) && (
        <View style={[styles.replyBar, { backgroundColor: colors.surfaceVariant, borderLeftColor: colors.primary }]}>
          <View style={styles.replyContent}>
            <Text style={[styles.replyLabel, { color: colors.primary }]}>
              {editingMessage ? "Editing" : "Reply to"}
            </Text>
            <Text style={[styles.replyText, { color: colors.textSecondary }]} numberOfLines={1}>
              {(editingMessage || replyTo)?.text}
            </Text>
          </View>
          <Pressable onPress={editingMessage ? onCancelEdit : onCancelReply} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      )}
      <View style={styles.container}>
        <Pressable onPress={onAttach} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </Pressable>

        <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
          <Pressable style={styles.emojiButton} hitSlop={8}>
            <Ionicons name="happy-outline" size={24} color={colors.textMuted} />
          </Pressable>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            placeholder="Message"
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={4096}
            onSubmitEditing={Platform.OS === "web" ? handleSend : undefined}
          />
        </View>

        {hasText ? (
          <Pressable onPress={handleSend} style={[styles.sendButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="send" size={20} color="#ffffff" />
          </Pressable>
        ) : (
          <Pressable onPress={onVoice} style={styles.iconButton} hitSlop={8}>
            <Ionicons name="mic" size={26} color={colors.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  iconButton: {
    padding: 4,
    marginBottom: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    paddingHorizontal: 4,
    minHeight: 40,
    maxHeight: 120,
  },
  emojiButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    marginHorizontal: 8,
    marginTop: 4,
    borderRadius: 4,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  replyText: {
    fontSize: 13,
  },
});
