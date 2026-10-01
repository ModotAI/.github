import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";
import { MessageBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { MessageActions } from "@/components/MessageActions";
import { AttachmentMenu } from "@/components/AttachmentMenu";
import { StickerPicker } from "@/components/StickerPicker";
import { formatLastSeen } from "@/utils/time";
import { useChatWallpaper, useFontSize } from "@/hooks/useChatSettings";
import type { Message } from "@/types";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const chatBg = useChatWallpaper();
  const fontSize = useFontSize();

  const currentUser = useStore((s) => s.currentUser);
  const chat = useStore((s) => (id ? s.chats[id] : undefined));
  const messages = useStore((s) => (id ? s.messages[id] || [] : []));
  const users = useStore((s) => s.users);
  const settings = useStore((s) => s.settings);
  const sendMessage = useStore((s) => s.sendMessage);
  const editMessage = useStore((s) => s.editMessage);
  const deleteMessage = useStore((s) => s.deleteMessage);
  const markAsRead = useStore((s) => s.markAsRead);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showAttach, setShowAttach] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

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
    if (settings.showLastSeen) {
      if (otherUser?.isOnline) return "online";
      if (otherUser?.lastSeen) return `ultimo accesso ${formatLastSeen(otherUser.lastSeen)}`;
    }
    return "";
  }, [chat, isGroup, otherUser, users, currentUser, settings.showLastSeen]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      if (!id) return;
      sendMessage(id, { text, type: "text", replyTo: replyTo?.id });
      setReplyTo(null);
      scrollToEnd();
    },
    [id, sendMessage, replyTo, scrollToEnd]
  );

  const handleVoice = useCallback(
    (uri: string, duration: number, waveform: number[]) => {
      if (!id) return;
      sendMessage(id, { type: "voice", text: "", mediaUrl: uri, mediaDuration: duration, waveform });
      scrollToEnd();
    },
    [id, sendMessage, scrollToEnd]
  );

  const handleCamera = useCallback(async () => {
    if (!id) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permesso negato", "Serve accesso alla fotocamera");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      sendMessage(id, {
        type: "image",
        text: "",
        mediaUrl: asset.uri,
        mediaWidth: asset.width,
        mediaHeight: asset.height,
      });
      scrollToEnd();
    }
  }, [id, sendMessage, scrollToEnd]);

  const handleGallery = useCallback(async () => {
    if (!id) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });
    if (!result.canceled) {
      for (const asset of result.assets) {
        sendMessage(id, {
          type: "image",
          text: "",
          mediaUrl: asset.uri,
          mediaWidth: asset.width,
          mediaHeight: asset.height,
        });
      }
      scrollToEnd();
    }
  }, [id, sendMessage, scrollToEnd]);

  const handleVideo = useCallback(async () => {
    if (!id) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.7,
      videoMaxDuration: 120,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      sendMessage(id, {
        type: "video",
        text: "",
        mediaUrl: asset.uri,
        mediaThumbnail: asset.uri,
        mediaWidth: asset.width,
        mediaHeight: asset.height,
        mediaDuration: Math.floor((asset.duration || 0) / 1000),
      });
      scrollToEnd();
    }
  }, [id, sendMessage, scrollToEnd]);

  const handleDocument = useCallback(async () => {
    if (!id) return;
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const doc = result.assets[0];
      sendMessage(id, {
        type: "document",
        text: "",
        mediaUrl: doc.uri,
        fileName: doc.name,
        fileSize: doc.size,
      });
      scrollToEnd();
    }
  }, [id, sendMessage, scrollToEnd]);

  const handleSticker = useCallback(
    (sticker: string) => {
      if (!id) return;
      sendMessage(id, { type: "sticker", text: "", sticker });
      scrollToEnd();
    },
    [id, sendMessage, scrollToEnd]
  );

  const handleLongPress = useCallback((message: Message) => {
    setSelectedMessage(message);
    setShowActions(true);
  }, []);

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
  }, []);

  const handleEdit = useCallback(() => {
    if (selectedMessage) setEditingMessage(selectedMessage);
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
      Alert.alert("Elimina messaggio", "Scegli un'opzione", [
        { text: "Annulla", style: "cancel" },
        { text: "Elimina per me", onPress: () => deleteMessage(id, selectedMessage.id, false) },
        { text: "Elimina per tutti", style: "destructive", onPress: () => deleteMessage(id, selectedMessage.id, true) },
      ]);
    } else {
      Alert.alert("Elimina messaggio", "Eliminare questo messaggio?", [
        { text: "Annulla", style: "cancel" },
        { text: "Elimina", style: "destructive", onPress: () => deleteMessage(id, selectedMessage.id, false) },
      ]);
    }
  }, [id, selectedMessage, currentUser, deleteMessage]);

  const handleCopy = useCallback(async () => {
    if (selectedMessage?.text) await Clipboard.setStringAsync(selectedMessage.text);
  }, [selectedMessage]);

  const handleCallFromChat = useCallback(
    (type: "voice" | "video") => {
      if (!otherUserId) return;
      router.push({ pathname: "/call", params: { userId: otherUserId, type } });
    },
    [otherUserId]
  );

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
      style={[styles.container, { backgroundColor: chatBg }]}
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
          <Pressable style={styles.headerAction} hitSlop={8} onPress={() => handleCallFromChat("video")}>
            <Ionicons name="videocam" size={22} color={colors.headerText} />
          </Pressable>
          <Pressable style={styles.headerAction} hitSlop={8} onPress={() => handleCallFromChat("voice")}>
            <Ionicons name="call" size={20} color={colors.headerText} />
          </Pressable>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isGroupChat={isGroup}
            onLongPress={handleLongPress}
            onReply={handleReply}
            onImagePress={(uri) => setViewerImage(uri)}
            fontSize={fontSize}
            readReceipts={settings.readReceipts}
          />
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.background }}>
        <ChatInput
          onSend={handleSend}
          onAttach={() => setShowAttach(true)}
          onVoice={handleVoice}
          onSticker={() => setShowStickers(true)}
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

      <AttachmentMenu
        visible={showAttach}
        onClose={() => setShowAttach(false)}
        onCamera={handleCamera}
        onGallery={handleGallery}
        onVideo={handleVideo}
        onDocument={handleDocument}
        onSticker={() => {
          setShowAttach(false);
          setShowStickers(true);
        }}
      />

      <StickerPicker
        visible={showStickers}
        onClose={() => setShowStickers(false)}
        onSelect={handleSticker}
      />

      <Modal visible={!!viewerImage} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
        <View style={styles.imageViewer}>
          <Pressable style={styles.imageViewerClose} onPress={() => setViewerImage(null)}>
            <Ionicons name="close" size={28} color="#ffffff" />
          </Pressable>
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={styles.imageViewerImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
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
  backButton: { padding: 8 },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 17, fontWeight: "600" },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 4 },
  headerAction: { padding: 8 },
  messageList: { paddingVertical: 8, paddingHorizontal: 4 },
  imageViewer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageViewerImage: {
    width: "100%",
    height: "80%",
  },
});
