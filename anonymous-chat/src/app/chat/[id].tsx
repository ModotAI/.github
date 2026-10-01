import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";
import { MessageBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { MessageActions } from "@/components/MessageActions";
import { formatLastSeen } from "@/utils/time";
import * as Clipboard from "expo-clipboard";
import type { Message } from "@/types";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const currentUser = useStore((s) => s.currentUser);
  const chat = useStore((s) => (id ? s.chats[id] : undefined));
  const messages = useStore((s) => (id ? s.messages[id] || [] : []));
  const users = useStore((s) => s.users);
  const sendMessage = useStore((s) => s.sendMessage);
  const editMessage = useStore((s) => s.editMessage);
  const deleteMessage = useStore((s) => s.deleteMessage);
  const markAsRead = useStore((s) => s.markAsRead);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (id) markAsRead(id);
  }, [id, messages.length, markAsRead]);

  const isGroup = chat?.type === "group";
  const otherUserId = useMemo(() => {
    if (!chat || !currentUser || isGroup) return "";
    return chat.participants.find((pid) => pid !== currentUser.id) || "";
  }, [chat, currentUser, isGroup]);
  const otherUser = isGroup ? null : users[otherUserId];

  const chatName = isGroup ? chat?.name || "Group" : otherUser?.displayName || "Unknown";
  const avatarId = isGroup ? chat?.id || "" : otherUserId;
  const subtitle = useMemo(() => {
    if (!chat) return "";
    const typingUsers = chat.typing || [];
    if (typingUsers.length > 0) {
      const names = typingUsers.map((uid) => users[uid]?.displayName || "Someone").join(", ");
      return `${names} typing...`;
    }
    if (isGroup) {
      return chat.participants
        .map((pid) => (pid === currentUser?.id ? "You" : users[pid]?.displayName || "Unknown"))
        .join(", ");
    }
    if (otherUser?.isOnline) return "online";
    if (otherUser?.lastSeen) return `last seen ${formatLastSeen(otherUser.lastSeen)}`;
    return "";
  }, [chat, isGroup, otherUser, users, currentUser]);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; data: Message[] }[] = [];
    let currentDate = "";
    for (const msg of messages) {
      const date = new Date(msg.createdAt).toDateString();
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, data: [] });
      }
      groups[groups.length - 1].data.push(msg);
    }
    return messages;
  }, [messages]);

  const handleSend = useCallback(
    (text: string) => {
      if (!id) return;
      sendMessage(id, {
        text,
        type: "text",
        replyTo: replyTo?.id,
      });
      setReplyTo(null);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    [id, sendMessage, replyTo]
  );

  const handleLongPress = useCallback((message: Message) => {
    setSelectedMessage(message);
    setShowActions(true);
  }, []);

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
  }, []);

  const handleEdit = useCallback(() => {
    if (selectedMessage) {
      setEditingMessage(selectedMessage);
    }
  }, [selectedMessage]);

  const handleSaveEdit = useCallback(
    (text: string) => {
      if (!id || !editingMessage) return;
      editMessage(id, editingMessage.id, text);
      setEditingMessage(null);
    },
    [id, editingMessage, editMessage]
  );

  const handleDelete = useCallback(() => {
    if (!id || !selectedMessage) return;
    const isMine = selectedMessage.senderId === currentUser?.id;
    if (isMine) {
      Alert.alert("Delete Message", "Choose an option", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete for Me",
          onPress: () => deleteMessage(id, selectedMessage.id, false),
        },
        {
          text: "Delete for Everyone",
          style: "destructive",
          onPress: () => deleteMessage(id, selectedMessage.id, true),
        },
      ]);
    } else {
      Alert.alert("Delete Message", "Delete this message?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMessage(id, selectedMessage.id, false),
        },
      ]);
    }
  }, [id, selectedMessage, currentUser, deleteMessage]);

  const handleCopy = useCallback(async () => {
    if (selectedMessage?.text) {
      await Clipboard.setStringAsync(selectedMessage.text);
    }
  }, [selectedMessage]);

  const handleAttach = useCallback(() => {
    if (!id) return;
    Alert.alert("Attach", "Choose attachment type", [
      {
        text: "Photo",
        onPress: () => sendMessage(id, { type: "image", text: "" }),
      },
      {
        text: "Video",
        onPress: () => sendMessage(id, { type: "video", text: "" }),
      },
      {
        text: "Document",
        onPress: () => sendMessage(id, { type: "document", text: "" }),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [id, sendMessage]);

  const handleVoice = useCallback(() => {
    if (!id) return;
    sendMessage(id, { type: "voice", text: "", mediaDuration: Math.floor(Math.random() * 30 + 5) });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [id, sendMessage]);

  if (!chat || !currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 100 }}>
          Chat not found
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.chatBackground }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { backgroundColor: colors.header, paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.headerText} />
        </Pressable>
        <Pressable style={styles.headerProfile} onPress={() => {}}>
          <Avatar id={avatarId} name={chatName} size={38} showOnline={!isGroup} isOnline={otherUser?.isOnline} />
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: colors.headerText }]} numberOfLines={1}>
              {chatName}
            </Text>
            {subtitle ? (
              <Text
                style={[
                  styles.headerSubtitle,
                  {
                    color: `${colors.headerText}99`,
                    fontStyle: subtitle.includes("typing") ? "italic" : "normal",
                  },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} hitSlop={8}>
            <Ionicons name="videocam" size={22} color={colors.headerText} />
          </Pressable>
          <Pressable style={styles.headerAction} hitSlop={8}>
            <Ionicons name="call" size={20} color={colors.headerText} />
          </Pressable>
          <Pressable style={styles.headerAction} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.headerText} />
          </Pressable>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={groupedMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isGroupChat={isGroup}
            onLongPress={handleLongPress}
            onReply={handleReply}
          />
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.background }}>
        <ChatInput
          onSend={handleSend}
          onAttach={handleAttach}
          onVoice={handleVoice}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onSaveEdit={handleSaveEdit}
        />
      </View>

      <MessageActions
        message={selectedMessage}
        visible={showActions}
        onClose={() => {
          setShowActions(false);
          setSelectedMessage(null);
        }}
        onReply={() => {
          if (selectedMessage) setReplyTo(selectedMessage);
        }}
        onForward={() => {}}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCopy={handleCopy}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  headerAction: {
    padding: 8,
  },
  messageList: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
