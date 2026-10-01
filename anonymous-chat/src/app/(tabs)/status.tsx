import { View, Text, FlatList, StyleSheet, Pressable, TextInput, Modal } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";
import { formatLastSeen } from "@/utils/time";

const STATUS_COLORS = ["#6c5ce7", "#00b894", "#e17055", "#0984e3", "#d63031", "#e84393", "#fdcb6e"];

export default function StatusScreen() {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const statuses = useStore((s) => s.statuses);
  const addStatus = useStore((s) => s.addStatus);
  const viewStatus = useStore((s) => s.viewStatus);
  const [showComposer, setShowComposer] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedColor, setSelectedColor] = useState(STATUS_COLORS[0]);
  const [viewingStatus, setViewingStatus] = useState<string | null>(null);

  if (!currentUser) return null;

  const myStatuses = statuses.filter(
    (s) => s.userId === currentUser.id && s.expiresAt > Date.now()
  );
  const otherStatuses = statuses.filter(
    (s) => s.userId !== currentUser.id && s.expiresAt > Date.now()
  );

  const statusUserIds = [...new Set(otherStatuses.map((s) => s.userId))];

  const handlePost = () => {
    if (!statusText.trim()) return;
    addStatus({
      type: "text",
      content: statusText.trim(),
      backgroundColor: selectedColor,
    });
    setStatusText("");
    setShowComposer(false);
  };

  const handleViewStatus = (statusId: string) => {
    setViewingStatus(statusId);
    viewStatus(statusId);
  };

  const currentViewedStatus = statuses.find((s) => s.id === viewingStatus);
  const viewedStatusUser = currentViewedStatus ? users[currentViewedStatus.userId] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable
        style={[styles.myStatusRow, { borderBottomColor: colors.border }]}
        onPress={() => setShowComposer(true)}
      >
        <View style={styles.myStatusAvatar}>
          <Avatar id={currentUser.id} name={currentUser.displayName} size={52} />
          <View style={[styles.addBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={16} color="#ffffff" />
          </View>
        </View>
        <View style={styles.myStatusText}>
          <Text style={[styles.myStatusTitle, { color: colors.text }]}>My Status</Text>
          <Text style={[styles.myStatusSub, { color: colors.textSecondary }]}>
            {myStatuses.length > 0
              ? `${myStatuses.length} update${myStatuses.length > 1 ? "s" : ""}`
              : "Tap to add status update"}
          </Text>
        </View>
      </Pressable>

      {statusUserIds.length > 0 && (
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Recent updates
        </Text>
      )}

      <FlatList
        data={statusUserIds}
        keyExtractor={(item) => item}
        renderItem={({ item: userId }) => {
          const user = users[userId];
          if (!user) return null;
          const userStatuses = otherStatuses.filter((s) => s.userId === userId);
          const latestStatus = userStatuses[userStatuses.length - 1];
          const allViewed = userStatuses.every((s) =>
            s.viewedBy.includes(currentUser.id)
          );

          return (
            <Pressable
              style={styles.statusRow}
              onPress={() => handleViewStatus(latestStatus.id)}
            >
              <View
                style={[
                  styles.statusRing,
                  { borderColor: allViewed ? colors.textMuted : colors.primary },
                ]}
              >
                <Avatar id={user.id} name={user.displayName} size={48} />
              </View>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusName, { color: colors.text }]}>
                  {user.displayName}
                </Text>
                <Text style={[styles.statusTime, { color: colors.textSecondary }]}>
                  {formatLastSeen(latestStatus.createdAt)}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="radio-button-on-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No status updates
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Status updates from your contacts will appear here
            </Text>
          </View>
        }
      />

      <Modal visible={showComposer} animationType="slide" onRequestClose={() => setShowComposer(false)}>
        <View style={[styles.composerContainer, { backgroundColor: selectedColor }]}>
          <View style={styles.composerHeader}>
            <Pressable onPress={() => setShowComposer(false)}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>
            <Pressable onPress={handlePost}>
              <Ionicons name="send" size={24} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.composerContent}>
            <TextInput
              style={styles.composerInput}
              placeholder="Type a status..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={statusText}
              onChangeText={setStatusText}
              multiline
              autoFocus
              maxLength={700}
            />
          </View>

          <View style={styles.colorPicker}>
            {STATUS_COLORS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!viewingStatus}
        animationType="fade"
        onRequestClose={() => setViewingStatus(null)}
      >
        {currentViewedStatus && viewedStatusUser && (
          <Pressable
            style={[styles.statusViewer, { backgroundColor: currentViewedStatus.backgroundColor || colors.primary }]}
            onPress={() => setViewingStatus(null)}
          >
            <View style={styles.statusViewerHeader}>
              <Avatar id={viewedStatusUser.id} name={viewedStatusUser.displayName} size={36} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.statusViewerName}>{viewedStatusUser.displayName}</Text>
                <Text style={styles.statusViewerTime}>
                  {formatLastSeen(currentViewedStatus.createdAt)}
                </Text>
              </View>
              <Pressable style={{ marginLeft: "auto" }} onPress={() => setViewingStatus(null)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>
            <View style={styles.statusViewerContent}>
              <Text style={styles.statusViewerText}>{currentViewedStatus.content}</Text>
            </View>
          </Pressable>
        )}
      </Modal>

      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowComposer(true)}
      >
        <Ionicons name="create" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  myStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  myStatusAvatar: { position: "relative" },
  addBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  myStatusText: { marginLeft: 12 },
  myStatusTitle: { fontSize: 16, fontWeight: "600" },
  myStatusSub: { fontSize: 13, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusRing: {
    borderWidth: 2,
    borderRadius: 28,
    padding: 2,
  },
  statusInfo: { marginLeft: 12 },
  statusName: { fontSize: 16, fontWeight: "500" },
  statusTime: { fontSize: 13, marginTop: 2 },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 8,
  },
  emptyText: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptySubtext: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  composerContainer: { flex: 1 },
  composerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  composerContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  composerInput: {
    fontSize: 28,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  colorPicker: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  colorOptionSelected: {
    borderColor: "#ffffff",
    borderWidth: 3,
  },
  statusViewer: {
    flex: 1,
    justifyContent: "center",
  },
  statusViewerHeader: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  statusViewerName: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  statusViewerTime: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  statusViewerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  statusViewerText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
  },
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
