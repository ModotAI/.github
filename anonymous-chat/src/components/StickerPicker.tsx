import { View, Text, StyleSheet, Pressable, Modal, FlatList } from "react-native";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";

interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (sticker: string) => void;
}

const STICKER_PACKS: { name: string; icon: string; stickers: string[] }[] = [
  {
    name: "Faccine",
    icon: "happy-outline",
    stickers: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
      "🙂", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘",
      "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪",
      "😝", "🤑", "🤗", "🤭", "🫢", "🤫", "🤔", "🫡",
      "😐", "😑", "😶", "🫥", "😏", "😒", "🙄", "😬",
      "😮‍💨", "🤥", "🫨", "😌", "😔", "😪", "🤤", "😴",
    ],
  },
  {
    name: "Gesti",
    icon: "hand-left-outline",
    stickers: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳",
      "🫴", "🫷", "🫸", "👌", "🤌", "🤏", "✌️", "🤞",
      "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕",
      "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛",
      "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏",
      "💪", "🦾", "🖤", "❤️", "🩷", "💜", "💙", "💚",
    ],
  },
  {
    name: "Animali",
    icon: "paw-outline",
    stickers: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
      "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵",
      "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤",
      "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄",
      "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🪲",
      "🐢", "🐍", "🦎", "🦂", "🦀", "🐙", "🦑", "🐠",
    ],
  },
  {
    name: "Cibo",
    icon: "pizza-outline",
    stickers: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇",
      "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥",
      "🥝", "🍅", "🍆", "🥑", "🫛", "🥦", "🥬", "🌶️",
      "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🫔",
      "🍗", "🍖", "🥩", "🍣", "🍱", "🍛", "🍜", "🍝",
      "☕", "🍵", "🧃", "🥤", "🍺", "🍻", "🥂", "🍷",
    ],
  },
  {
    name: "Oggetti",
    icon: "cube-outline",
    stickers: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🎱",
      "🎮", "🕹️", "🎲", "🧩", "🎭", "🎨", "🎬", "🎤",
      "🎧", "🎵", "🎶", "🎹", "🥁", "🎷", "🎺", "🪗",
      "💻", "🖥️", "📱", "⌨️", "🖱️", "💾", "📷", "🎥",
      "🔑", "🗝️", "🔒", "🔓", "💡", "🔦", "🕯️", "🧲",
      "💎", "💰", "💳", "✈️", "🚀", "🛸", "🌍", "⭐",
    ],
  },
];

export function StickerPicker({ visible, onClose, onSelect }: StickerPickerProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const pack = STICKER_PACKS[activeTab];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{pack.name}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
            {STICKER_PACKS.map((p, i) => (
              <Pressable
                key={p.name}
                style={[styles.tab, activeTab === i && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab(i)}
              >
                <Ionicons
                  name={p.icon as any}
                  size={22}
                  color={activeTab === i ? colors.primary : colors.textMuted}
                />
              </Pressable>
            ))}
          </View>

          <FlatList
            data={pack.stickers}
            numColumns={8}
            keyExtractor={(item, i) => `${pack.name}-${i}`}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <Pressable
                style={styles.stickerCell}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.stickerEmoji}>{item}</Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "50%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "700" },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  grid: { padding: 8 },
  stickerCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "12.5%",
  },
  stickerEmoji: { fontSize: 28 },
});
