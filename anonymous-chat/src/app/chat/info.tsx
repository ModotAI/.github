import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";

export default function ChatInfoScreen() {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const chats = useStore((s) => s.chats);
  const users = useStore((s) => s.users);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.emptyContainer}>
        <Ionicons name="information-circle-outline" size={64} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Chat details
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
          Select a chat to view its details
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 8,
  },
  emptyText: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptySubtext: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
});
