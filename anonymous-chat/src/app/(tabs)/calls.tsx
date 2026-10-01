import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";
import { formatDate, formatTime, formatDuration } from "@/utils/time";

export default function CallsScreen() {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const calls = useStore((s) => s.calls);
  const users = useStore((s) => s.users);

  if (!currentUser) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={calls}
        keyExtractor={(item) => item.id}
        renderItem={({ item: call }) => {
          const isCaller = call.callerId === currentUser.id;
          const otherUserId = call.participants.find((id) => id !== currentUser.id) || "";
          const otherUser = users[otherUserId];
          if (!otherUser) return null;

          const isMissed = call.status === "missed" || call.status === "declined";
          const isIncoming = !isCaller;

          return (
            <Pressable style={styles.callRow}>
              <Avatar id={otherUser.id} name={otherUser.displayName} size={48} />
              <View style={styles.callInfo}>
                <Text
                  style={[
                    styles.callName,
                    { color: isMissed ? colors.error : colors.text },
                  ]}
                >
                  {otherUser.displayName}
                </Text>
                <View style={styles.callMeta}>
                  <Ionicons
                    name={isIncoming ? "call-received" : "call-made" as any}
                    size={14}
                    color={isMissed ? colors.error : colors.success}
                    style={{ transform: [{ rotate: isIncoming ? "0deg" : "0deg" }] }}
                  />
                  <Text style={[styles.callMetaText, { color: colors.textSecondary }]}>
                    {formatDate(call.startedAt)} {formatTime(call.startedAt)}
                    {call.duration ? ` · ${formatDuration(call.duration)}` : ""}
                  </Text>
                </View>
              </View>
              <Pressable style={styles.callAction}>
                <Ionicons
                  name={call.type === "video" ? "videocam" : "call"}
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="call-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No calls yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Your call history will appear here
            </Text>
          </View>
        }
        contentContainerStyle={calls.length === 0 ? styles.emptyList : undefined}
      />

      <Pressable style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Ionicons name="call" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  callRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  callInfo: { flex: 1, marginLeft: 12 },
  callName: { fontSize: 16, fontWeight: "500" },
  callMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  callMetaText: { fontSize: 13 },
  callAction: { padding: 8 },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 8,
  },
  emptyList: { flexGrow: 1 },
  emptyText: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptySubtext: { fontSize: 14 },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
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
