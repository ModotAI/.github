import { View, Text, FlatList, StyleSheet, Pressable, TextInput } from "react-native";
import { useState, useMemo, useCallback, useRef } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { ChatListItem } from "@/components/ChatListItem";
import { ChatActions } from "@/components/ChatActions";
import * as Haptics from "expo-haptics";
import type { Chat } from "@/types";

export default function ChatsScreen() {
  const { colors } = useTheme();
  const chats = useStore((s) => s.chats);
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showActions, setShowActions] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const handleLongPress = useCallback((chat: Chat) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedChat(chat);
    setShowActions(true);
  }, []);

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      if (e.nativeEvent.contentOffset.y < -60 && !showSearch) {
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    },
    [showSearch]
  );

  const sortedChats = useMemo(() => {
    let chatList = Object.values(chats).filter(
      (c) => (showArchived ? c.isArchived : !c.isArchived)
    );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      chatList = chatList.filter((chat) => {
        if (chat.type === "group") {
          return chat.name?.toLowerCase().includes(q);
        }
        const otherId = chat.participants.find((id) => id !== currentUser?.id);
        const other = otherId ? users[otherId] : null;
        return other?.displayName.toLowerCase().includes(q);
      });
    }

    return chatList.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [chats, searchQuery, currentUser, users, showArchived]);

  const archivedCount = useMemo(
    () => Object.values(chats).filter((c) => c.isArchived).length,
    [chats]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showSearch && (
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Cerca chat..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable onPress={() => { setShowSearch(false); setSearchQuery(""); }}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      )}

      <FlatList
        data={sortedChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatListItem chat={item} onLongPress={handleLongPress} />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          !showArchived && archivedCount > 0 ? (
            <Pressable
              style={[styles.archivedRow, { borderBottomColor: colors.border }]}
              onPress={() => setShowArchived(true)}
            >
              <Ionicons name="archive" size={20} color={colors.primary} />
              <Text style={[styles.archivedText, { color: colors.primary }]}>
                Archiviate ({archivedCount})
              </Text>
            </Pressable>
          ) : showArchived ? (
            <Pressable
              style={[styles.archivedRow, { borderBottomColor: colors.border }]}
              onPress={() => setShowArchived(false)}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={[styles.archivedText, { color: colors.primary }]}>
                Torna alle Chat
              </Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? "Nessuna chat trovata" : "Nessuna chat"}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Tocca + per iniziare una conversazione
            </Text>
          </View>
        }
        contentContainerStyle={sortedChats.length === 0 ? styles.emptyList : undefined}
      />

      <View style={styles.fabContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => router.push("/new-chat")}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#ffffff" />
        </Pressable>
      </View>

      <ChatActions
        chat={selectedChat}
        visible={showActions}
        onClose={() => {
          setShowActions(false);
          setSelectedChat(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  archivedRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  archivedText: {
    fontSize: 15,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
  },
  fabContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
