import { View, Text, FlatList, StyleSheet, Pressable, Modal } from "react-native";
import { useState, useMemo } from "react";
import { router } from "expo-router";
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
  const contacts = useStore((s) => s.contacts);
  const [showPicker, setShowPicker] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");

  const contactList = useMemo(() => {
    return Object.values(contacts)
      .filter((c) => !c.isBlocked)
      .map((c) => users[c.userId])
      .filter(Boolean);
  }, [contacts, users]);

  if (!currentUser) return null;

  const startCallTo = (userId: string, type: "voice" | "video") => {
    setShowPicker(false);
    router.push({ pathname: "/call", params: { userId, type } });
  };

  const openPicker = (type: "voice" | "video") => {
    setCallType(type);
    setShowPicker(true);
  };

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
                    name={isIncoming ? "arrow-down-outline" : "arrow-up-outline"}
                    size={14}
                    color={isMissed ? colors.error : colors.success}
                  />
                  <Text style={[styles.callMetaText, { color: colors.textSecondary }]}>
                    {formatDate(call.startedAt)} {formatTime(call.startedAt)}
                    {call.duration ? ` · ${formatDuration(call.duration)}` : ""}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.callAction}
                onPress={() => startCallTo(otherUserId, call.type)}
              >
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
              Nessuna chiamata
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              La cronologia delle chiamate apparirà qui
            </Text>
          </View>
        }
        contentContainerStyle={calls.length === 0 ? styles.emptyList : undefined}
      />

      <View style={styles.fabGroup}>
        <Pressable
          style={[styles.fabSmall, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => openPicker("video")}
        >
          <Ionicons name="videocam" size={20} color={colors.primary} />
        </Pressable>
        <Pressable
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => openPicker("voice")}
        >
          <Ionicons name="call" size={24} color="#ffffff" />
        </Pressable>
      </View>

      <Modal visible={showPicker} transparent animationType="slide">
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {callType === "video" ? "Videochiamata" : "Chiamata vocale"}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Seleziona un contatto
            </Text>

            <FlatList
              data={contactList}
              keyExtractor={(item) => item.id}
              style={styles.modalList}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.contactRow,
                    pressed && { backgroundColor: colors.surfaceVariant },
                  ]}
                  onPress={() => startCallTo(item.id, callType)}
                >
                  <Avatar id={item.id} name={item.displayName} size={44} showOnline isOnline={item.isOnline} />
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.text }]}>
                      {item.displayName}
                    </Text>
                    <Text style={[styles.contactBio, { color: colors.textSecondary }]} numberOfLines={1}>
                      @{item.username}
                    </Text>
                  </View>
                  <Ionicons
                    name={callType === "video" ? "videocam" : "call"}
                    size={20}
                    color={colors.primary}
                  />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyModalContainer}>
                  <Text style={[styles.emptyModalText, { color: colors.textMuted }]}>
                    Nessun contatto. Aggiungi contatti per chiamarli.
                  </Text>
                </View>
              }
            />
          </View>
        </Pressable>
      </Modal>
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
  fabGroup: {
    position: "absolute",
    bottom: 20,
    right: 20,
    alignItems: "center",
    gap: 12,
  },
  fabSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#484f58",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  modalList: { paddingHorizontal: 4 },
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
  emptyModalContainer: { alignItems: "center", paddingVertical: 32 },
  emptyModalText: { fontSize: 14 },
});
