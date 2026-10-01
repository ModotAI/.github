import { View, Text, StyleSheet, Pressable, FlatList, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";

export default function BlockedContactsScreen() {
  const { colors } = useTheme();
  const contacts = useStore((s) => s.contacts);
  const users = useStore((s) => s.users);
  const blockContact = useStore((s) => s.blockContact);

  const blockedIds = Object.values(contacts)
    .filter((c) => c.isBlocked)
    .map((c) => c.userId);

  const handleUnblock = (userId: string) => {
    const user = users[userId];
    Alert.alert(
      "Sblocca contatto",
      `Vuoi sbloccare ${user?.displayName || "questo contatto"}?`,
      [
        { text: "Annulla", style: "cancel" },
        { text: "Sblocca", onPress: () => blockContact(userId) },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {blockedIds.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="shield-checkmark" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nessun contatto bloccato
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            I contatti bloccati non potranno inviarti messaggi o vedere il tuo stato online
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedIds}
          keyExtractor={(id) => id}
          renderItem={({ item }) => {
            const user = users[item];
            if (!user) return null;
            return (
              <View style={[styles.row, { borderBottomColor: colors.border }]}>
                <Avatar id={user.id} name={user.displayName} size={44} />
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.text }]}>{user.displayName}</Text>
                  <Text style={[styles.username, { color: colors.textSecondary }]}>@{user.username}</Text>
                </View>
                <Pressable
                  style={[styles.unblockBtn, { borderColor: colors.primary }]}
                  onPress={() => handleUnblock(item)}
                >
                  <Text style={[styles.unblockText, { color: colors.primary }]}>Sblocca</Text>
                </Pressable>
              </View>
            );
          }}
          ListHeaderComponent={
            <Text style={[styles.headerNote, { color: colors.textSecondary }]}>
              I contatti bloccati non possono inviarti messaggi, chiamarti o vedere il tuo ultimo accesso.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  headerNote: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 12,
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "500" },
  username: { fontSize: 13, marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  unblockText: { fontSize: 13, fontWeight: "600" },
});
