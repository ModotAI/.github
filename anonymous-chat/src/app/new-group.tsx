import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { useState, useMemo } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";

export default function NewGroupScreen() {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const contacts = useStore((s) => s.contacts);
  const createGroupChat = useStore((s) => s.createGroupChat);
  const [step, setStep] = useState<"select" | "name">("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
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

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    const chatId = createGroupChat(groupName.trim(), selectedIds);
    router.replace(`/chat/${chatId}`);
  };

  if (step === "name") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.nameContainer}>
          <View style={[styles.groupAvatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="camera" size={32} color={colors.textMuted} />
          </View>
          <TextInput
            style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.primary }]}
            placeholder="Group name"
            placeholderTextColor={colors.textMuted}
            value={groupName}
            onChangeText={setGroupName}
            autoFocus
            maxLength={50}
          />
          <Text style={[styles.participantCount, { color: colors.textSecondary }]}>
            {selectedIds.length} participant{selectedIds.length !== 1 ? "s" : ""}
          </Text>

          <ScrollView horizontal style={styles.selectedScroll} showsHorizontalScrollIndicator={false}>
            {selectedIds.map((id) => {
              const user = users[id];
              if (!user) return null;
              return (
                <View key={id} style={styles.selectedChip}>
                  <Avatar id={user.id} name={user.displayName} size={40} />
                  <Text style={[styles.selectedChipName, { color: colors.text }]} numberOfLines={1}>
                    {user.displayName.split(" ")[0]}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <Pressable
          style={[
            styles.createButton,
            {
              backgroundColor: groupName.trim() ? colors.primary : colors.surfaceVariant,
            },
          ]}
          onPress={handleCreate}
          disabled={!groupName.trim()}
        >
          <Ionicons name="checkmark" size={28} color="#ffffff" />
        </Pressable>
      </View>
    );
  }

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

      {selectedIds.length > 0 && (
        <ScrollView
          horizontal
          style={[styles.selectedBar, { borderBottomColor: colors.border }]}
          showsHorizontalScrollIndicator={false}
        >
          {selectedIds.map((id) => {
            const user = users[id];
            if (!user) return null;
            return (
              <Pressable key={id} style={styles.selectedChip} onPress={() => toggleUser(id)}>
                <Avatar id={user.id} name={user.displayName} size={40} />
                <View style={[styles.removeBadge, { backgroundColor: colors.textMuted }]}>
                  <Ionicons name="close" size={12} color="#ffffff" />
                </View>
                <Text style={[styles.selectedChipName, { color: colors.text }]} numberOfLines={1}>
                  {user.displayName.split(" ")[0]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <FlatList
        data={contactList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <Pressable
              style={({ pressed }) => [
                styles.contactRow,
                pressed && { backgroundColor: colors.surfaceVariant },
              ]}
              onPress={() => toggleUser(item.id)}
            >
              <Avatar id={item.id} name={item.displayName} size={44} />
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: colors.text }]}>
                  {item.displayName}
                </Text>
                <Text style={[styles.contactBio, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.bio}
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isSelected ? colors.primary : "transparent",
                    borderColor: isSelected ? colors.primary : colors.textMuted,
                  },
                ]}
              >
                {isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
              </View>
            </Pressable>
          );
        }}
      />

      {selectedIds.length > 0 && (
        <Pressable
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={() => setStep("name")}
        >
          <Ionicons name="arrow-forward" size={28} color="#ffffff" />
        </Pressable>
      )}
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
  searchInput: { flex: 1, fontSize: 16 },
  selectedBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectedScroll: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  selectedChip: {
    alignItems: "center",
    marginRight: 16,
    width: 56,
    position: "relative",
  },
  removeBadge: {
    position: "absolute",
    top: 0,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedChipName: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: "500" },
  contactBio: { fontSize: 13, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  nameContainer: {
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 32,
  },
  groupAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  nameInput: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 20,
    paddingVertical: 8,
    borderBottomWidth: 2,
    width: "100%",
  },
  participantCount: {
    fontSize: 14,
    marginTop: 12,
  },
  createButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
