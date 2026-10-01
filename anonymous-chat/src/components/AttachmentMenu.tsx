import { View, Text, StyleSheet, Pressable, Modal, Animated } from "react-native";
import { useEffect, useRef } from "react";
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
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const handlers: Record<string, () => void> = {
    onCamera,
    onGallery,
    onVideo,
    onDocument,
    onSticker,
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface },
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              }],
            },
          ]}
        >
          <Pressable>
            <View style={styles.handle} />
            <View style={styles.grid}>
              {ITEMS.map((item) => (
                <Pressable
                  key={item.key}
                  style={styles.item}
                  onPress={() => {
                    onClose();
                    setTimeout(() => handlers[item.handler](), 300);
                  }}
                >
                  <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={24} color="#ffffff" />
                  </View>
                  <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Animated.View>
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
