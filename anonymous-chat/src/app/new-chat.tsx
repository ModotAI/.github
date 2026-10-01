import { View, Text, FlatList, StyleSheet, Pressable, TextInput } from "react-native";
import { useState, useMemo } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";

export default function NewChatScreen() {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const contacts = useStore((s) => s.contacts);
  const createPrivateChat = useStore((s) => s.createPrivateChat);
  const [search, setSearch] = useState("");

  if (!currentUser) return null;

  const contactList = useMemo(() => {
    const list = Object.values(contacts)
      .filter((c) => !c.isBlocked)
      .map((c) => users[c.userId])
      .filter(Boolean);

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
    );
  }, [contacts, users, search]);

  const handleSelect = (userId: string) => {
    const chatId = createPrivateChat(userId);
    router.replace(`/chat/${chatId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search contacts..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Pressable
        style={styles.actionRow}
        onPress={() => router.push("/new-group")}
      >
        <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="people" size={22} color="#ffffff" />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>New Group</Text>
      </Pressable>

      <Pressable style={styles.actionRow}>
        <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
          <Ionicons name="person-add" size={22} color="#ffffff" />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>Add Contact</Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Contacts
      </Text>

      <FlatList
        data={contactList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.contactRow,
              pressed && { backgroundColor: colors.surfaceVariant },
            ]}
            onPress={() => handleSelect(item.id)}
          >
            <Avatar
              id={item.id}
              name={item.displayName}
              size={44}
              showOnline
              isOnline={item.isOnline}
            />
            <View style={styles.contactInfo}>
              <Text style={[styles.contactName, { color: colors.text }]}>
                {item.displayName}
              </Text>
              <Text style={[styles.contactBio, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.bio}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {search ? "No contacts found" : "No contacts yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: "uppercase",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
  },
  contactBio: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
  },
});
