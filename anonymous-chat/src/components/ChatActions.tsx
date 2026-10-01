import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import type { Chat } from "@/types";

interface ChatActionsProps {
  chat: Chat | null;
  visible: boolean;
  onClose: () => void;
}

export function ChatActions({ chat, visible, onClose }: ChatActionsProps) {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const contacts = useStore((s) => s.contacts);
  const pinChat = useStore((s) => s.pinChat);
  const muteChat = useStore((s) => s.muteChat);
  const archiveChat = useStore((s) => s.archiveChat);
  const deleteChat = useStore((s) => s.deleteChat);
  const blockContact = useStore((s) => s.blockContact);

  if (!chat || !currentUser) return null;

  const isGroup = chat.type === "group";
  const otherUserId = isGroup
    ? ""
    : chat.participants.find((id) => id !== currentUser.id) || "";
  const otherUser = isGroup ? null : users[otherUserId];
  const chatName = isGroup ? chat.name || "Gruppo" : otherUser?.displayName || "Sconosciuto";
  const isBlocked = otherUserId ? contacts[otherUserId]?.isBlocked : false;

  const actions: { icon: string; label: string; onPress: () => void; destructive?: boolean }[] = [
    {
      icon: chat.isPinned ? "pin-outline" : "pin",
      label: chat.isPinned ? "Rimuovi dalla cima" : "Fissa in alto",
      onPress: () => pinChat(chat.id),
    },
    {
      icon: chat.isMuted ? "volume-high" : "volume-mute",
      label: chat.isMuted ? "Riattiva notifiche" : "Silenzia",
      onPress: () => muteChat(chat.id),
    },
    {
      icon: chat.isArchived ? "archive-outline" : "archive",
      label: chat.isArchived ? "Togli dall'archivio" : "Archivia",
      onPress: () => archiveChat(chat.id),
    },
  ];

  if (!isGroup && otherUserId) {
    actions.push({
      icon: isBlocked ? "shield-outline" : "shield",
      label: isBlocked ? `Sblocca ${chatName}` : `Blocca ${chatName}`,
      onPress: () => blockContact(otherUserId),
      destructive: !isBlocked,
    });
  }

  actions.push({
    icon: "trash",
    label: "Elimina chat",
    onPress: () => deleteChat(chat.id),
    destructive: true,
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
              {chatName}
            </Text>
          </View>
          <View style={[styles.actionsContainer, { backgroundColor: colors.surface }]}>
            {actions.map((action, index) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && { backgroundColor: colors.surfaceVariant },
                  index < actions.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
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
  header: {
    paddingBottom: 12,
    marginBottom: 4,
    alignItems: "center",
  },
  headerName: {
    fontSize: 17,
    fontWeight: "600",
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
