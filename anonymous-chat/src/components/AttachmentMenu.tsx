import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface AttachmentMenuProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onVideo: () => void;
  onDocument: () => void;
  onSticker: () => void;
}

const ITEMS = [
  { key: "camera", icon: "camera", label: "Camera", color: "#d63031", handler: "onCamera" },
  { key: "gallery", icon: "images", label: "Galleria", color: "#6c5ce7", handler: "onGallery" },
  { key: "video", icon: "videocam", label: "Video", color: "#e17055", handler: "onVideo" },
  { key: "document", icon: "document", label: "Documento", color: "#0984e3", handler: "onDocument" },
  { key: "sticker", icon: "happy", label: "Sticker", color: "#00b894", handler: "onSticker" },
] as const;

export function AttachmentMenu({
  visible,
  onClose,
  onCamera,
  onGallery,
  onVideo,
  onDocument,
  onSticker,
}: AttachmentMenuProps) {
  const { colors } = useTheme();

  const handlers: Record<string, () => void> = {
    onCamera,
    onGallery,
    onVideo,
    onDocument,
    onSticker,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.handle} />
          <View style={styles.grid}>
            {ITEMS.map((item) => (
              <Pressable
                key={item.key}
                style={styles.item}
                onPress={() => {
                  handlers[item.handler]();
                  onClose();
                }}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={24} color="#ffffff" />
                </View>
                <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#484f58",
    alignSelf: "center",
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  item: {
    alignItems: "center",
    width: 72,
    gap: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12, fontWeight: "500" },
});
