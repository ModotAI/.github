import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import type { Message } from "@/types";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];

interface MessageActionsProps {
  message: Message | null;
  visible: boolean;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

export function MessageActions({
  message,
  visible,
  onClose,
  onReply,
  onForward,
  onEdit,
  onDelete,
  onCopy,
}: MessageActionsProps) {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const reactToMessage = useStore((s) => s.reactToMessage);

  if (!message || !currentUser) return null;

  const isMine = message.senderId === currentUser.id;
  const isDeleted = !!message.deletedAt;

  const handleReact = (emoji: string) => {
    reactToMessage(message.chatId, message.id, emoji);
    onClose();
  };

  const actions: { icon: string; label: string; onPress: () => void; destructive?: boolean }[] = [];

  if (!isDeleted) {
    actions.push({ icon: "arrow-undo", label: "Reply", onPress: onReply });
    actions.push({ icon: "copy", label: "Copy", onPress: onCopy });
    actions.push({ icon: "arrow-redo", label: "Forward", onPress: onForward });
    if (isMine) {
      actions.push({ icon: "create", label: "Edit", onPress: onEdit });
    }
  }
  actions.push({ icon: "trash", label: "Delete", onPress: onDelete, destructive: true });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          {!isDeleted && (
            <View style={styles.reactions}>
              {REACTION_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={[styles.reactionButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => handleReact(emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={[styles.actionsContainer, { backgroundColor: colors.surface }]}>
            {actions.map((action, index) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && { backgroundColor: colors.surfaceVariant },
                  index < actions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
                onPress={() => {
                  action.onPress();
                  onClose();
                }}
              >
                <Ionicons
                  name={action.icon as any}
                  size={20}
                  color={action.destructive ? colors.error : colors.text}
                />
                <Text
                  style={[
                    styles.actionLabel,
                    { color: action.destructive ? colors.error : colors.text },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxWidth: 340,
  },
  reactions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionEmoji: {
    fontSize: 22,
  },
  actionsContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  actionLabel: {
    fontSize: 16,
  },
});
