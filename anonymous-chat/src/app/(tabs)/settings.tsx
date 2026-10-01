import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";
import { generateInviteCode } from "@/utils/crypto";
import type { FontSizeOption, MediaAutoDownload, ChatWallpaper } from "@/types";

type SettingItem = {
  icon: string;
  label: string;
  subtitle?: string;
  toggle?: boolean;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
};

const FONT_SIZE_OPTIONS: { key: FontSizeOption; label: string; preview: number }[] = [
  { key: "small", label: "Piccolo", preview: 13 },
  { key: "normal", label: "Normale", preview: 15 },
  { key: "large", label: "Grande", preview: 18 },
];

const AUTO_DOWNLOAD_OPTIONS: { key: MediaAutoDownload; label: string; desc: string }[] = [
  { key: "always", label: "Sempre", desc: "Scarica con qualsiasi connessione" },
  { key: "wifi", label: "Solo Wi-Fi", desc: "Scarica solo con connessione Wi-Fi" },
  { key: "never", label: "Mai", desc: "Non scaricare automaticamente" },
];

const WALLPAPER_OPTIONS: { key: ChatWallpaper; label: string; color: string; color2?: string }[] = [
  { key: "default", label: "Predefinito", color: "#ece5dd" },
  { key: "dark", label: "Scuro", color: "#0a0a0a" },
  { key: "gradient1", label: "Aurora", color: "#667eea", color2: "#764ba2" },
  { key: "gradient2", label: "Tramonto", color: "#f093fb", color2: "#f5576c" },
  { key: "gradient3", label: "Oceano", color: "#4facfe", color2: "#00f2fe" },
  { key: "solid1", label: "Lilla", color: "#dfe6e9" },
  { key: "solid2", label: "Menta", color: "#ddffd9" },
  { key: "solid3", label: "Pesca", color: "#ffecd2" },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [showDownloadPicker, setShowDownloadPicker] = useState(false);

  if (!currentUser) return null;

  const inviteCode = generateInviteCode();
  const fontLabel = FONT_SIZE_OPTIONS.find((f) => f.key === settings.fontSize)?.label || "Normale";
  const downloadLabel = AUTO_DOWNLOAD_OPTIONS.find((d) => d.key === settings.mediaAutoDownload)?.label || "Solo Wi-Fi";

  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: "Privacy",
      items: [
        {
          icon: "eye-off",
          label: "Ultimo accesso",
          toggle: true,
          value: settings.showLastSeen,
          onToggle: (v: boolean) => updateSettings({ showLastSeen: v }),
        },
        {
          icon: "checkmark-done",
          label: "Conferme di lettura",
          toggle: true,
          value: settings.readReceipts,
          onToggle: (v: boolean) => updateSettings({ readReceipts: v }),
        },
        {
          icon: "lock-closed",
          label: "Contatti bloccati",
          onPress: () => router.push("/blocked-contacts"),
        },
        {
          icon: "finger-print",
          label: "Blocco app",
          toggle: true,
          value: settings.appLock,
          onToggle: (v: boolean) => {
            updateSettings({ appLock: v });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (v) {
              Alert.alert(
                "Blocco app attivato",
                "L'app richiederà l'autenticazione biometrica o PIN all'apertura."
              );
            }
          },
        },
      ],
    },
    {
      title: "Notifiche",
      items: [
        {
          icon: "notifications",
          label: "Notifiche push",
          toggle: true,
          value: settings.pushNotifications,
          onToggle: (v: boolean) => updateSettings({ pushNotifications: v }),
        },
        {
          icon: "musical-notes",
          label: "Suono messaggi",
          toggle: true,
          value: settings.messageSound,
          onToggle: (v: boolean) => {
            updateSettings({ messageSound: v });
            if (v) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ],
    },
    {
      title: "Chat",
      items: [
        {
          icon: "image",
          label: "Sfondo chat",
          onPress: () => setShowWallpaperPicker(true),
        },
        {
          icon: "text",
          label: "Dimensione testo",
          subtitle: fontLabel,
          onPress: () => setShowFontPicker(true),
        },
        {
          icon: "cloud-download",
          label: "Download automatico",
          subtitle: downloadLabel,
          onPress: () => setShowDownloadPicker(true),
        },
      ],
    },
    {
      title: "Info",
      items: [
        {
          icon: "share-social",
          label: "Codice invito",
          subtitle: inviteCode,
          onPress: async () => {
            await Clipboard.setStringAsync(inviteCode);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Copiato!", `Codice invito copiato: ${inviteCode}`);
          },
        },
        {
          icon: "help-circle",
          label: "Aiuto & FAQ",
          onPress: () => router.push("/help"),
        },
        {
          icon: "information-circle",
          label: "Informazioni",
          onPress: () => {
            Alert.alert(
              "Anonymous Chat",
              "Piattaforma di messaggistica anonima\nVersione 1.0.0\n\nRealizzata con Expo SDK 57"
            );
          },
        },
      ],
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable
        style={[styles.profileRow, { borderBottomColor: colors.border }]}
        onPress={() => router.push("/profile")}
      >
        <Avatar id={currentUser.id} name={currentUser.displayName} size={64} />
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {currentUser.displayName}
          </Text>
          <Text style={[styles.profileBio, { color: colors.textSecondary }]}>
            {currentUser.bio}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={[styles.copyIdRow, { backgroundColor: colors.surface }]}
        onPress={async () => {
          await Clipboard.setStringAsync(currentUser.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Copiato!", "Il tuo ID anonimo è stato copiato negli appunti. Condividilo per farti trovare.");
        }}
      >
        <View style={[styles.copyIdIcon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="finger-print" size={22} color={colors.primary} />
        </View>
        <View style={styles.copyIdInfo}>
          <Text style={[styles.copyIdLabel, { color: colors.textSecondary }]}>Il tuo ID anonimo</Text>
          <Text style={[styles.copyIdValue, { color: colors.text }]} numberOfLines={1}>
            {currentUser.id}
          </Text>
        </View>
        <Ionicons name="copy-outline" size={20} color={colors.primary} />
      </Pressable>

      {sections.map((section) => (
        <View key={section.title}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {section.title}
          </Text>
          <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
            {section.items.map((item, index) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.settingRow,
                  pressed && !item.toggle && { backgroundColor: colors.surfaceVariant },
                  index < section.items.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={item.toggle ? undefined : item.onPress}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={colors.primary}
                  style={styles.settingIcon}
                />
                <View style={styles.settingLabelContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  {"subtitle" in item && item.subtitle ? (
                    <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
                {item.toggle ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={item.value ? colors.primary : colors.textMuted}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Pressable
        style={[styles.dangerButton, { borderColor: colors.error }]}
        onPress={() => {
          Alert.alert(
            "Reset Identità",
            "Verrà generata una nuova identità anonima. I tuoi dati resteranno ma il tuo ID cambierà. Continuare?",
            [
              { text: "Annulla", style: "cancel" },
              {
                text: "Reset",
                style: "destructive",
                onPress: () => useStore.getState().initialize(),
              },
            ]
          );
        }}
      >
        <Ionicons name="refresh" size={20} color={colors.error} />
        <Text style={[styles.dangerText, { color: colors.error }]}>
          Reset Identità Anonima
        </Text>
      </Pressable>

      <View style={{ height: 40 }} />

      {/* Font Size Picker */}
      <OptionPickerModal
        visible={showFontPicker}
        onClose={() => setShowFontPicker(false)}
        title="Dimensione testo"
        colors={colors}
      >
        {FONT_SIZE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.optionRow, { borderBottomColor: colors.border }]}
            onPress={() => {
              updateSettings({ fontSize: opt.key });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFontPicker(false);
            }}
          >
            <Text style={{ color: colors.text, fontSize: opt.preview }}>{opt.label}</Text>
            <Text style={[styles.optionPreview, { color: colors.textMuted, fontSize: opt.preview }]}>
              Anteprima testo
            </Text>
            {settings.fontSize === opt.key && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </Pressable>
        ))}
      </OptionPickerModal>

      {/* Wallpaper Picker */}
      <OptionPickerModal
        visible={showWallpaperPicker}
        onClose={() => setShowWallpaperPicker(false)}
        title="Sfondo chat"
        colors={colors}
      >
        <View style={styles.wallpaperGrid}>
          {WALLPAPER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={[
                styles.wallpaperItem,
                settings.chatWallpaper === opt.key && { borderColor: colors.primary, borderWidth: 3 },
              ]}
              onPress={() => {
                updateSettings({ chatWallpaper: opt.key });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowWallpaperPicker(false);
              }}
            >
              <View style={[styles.wallpaperPreview, { backgroundColor: opt.color }]}>
                {settings.chatWallpaper === opt.key && (
                  <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                )}
              </View>
              <Text style={[styles.wallpaperLabel, { color: colors.text }]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </OptionPickerModal>

      {/* Auto-Download Picker */}
      <OptionPickerModal
        visible={showDownloadPicker}
        onClose={() => setShowDownloadPicker(false)}
        title="Download automatico media"
        colors={colors}
      >
        {AUTO_DOWNLOAD_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.optionRow, { borderBottomColor: colors.border }]}
            onPress={() => {
              updateSettings({ mediaAutoDownload: opt.key });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowDownloadPicker(false);
            }}
          >
            <View style={styles.optionInfo}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
              <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
            </View>
            {settings.mediaAutoDownload === opt.key && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </Pressable>
        ))}
      </OptionPickerModal>
    </ScrollView>
  );
}

function OptionPickerModal({
  visible,
  onClose,
  title,
  colors,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  profileInfo: { flex: 1, marginLeft: 12 },
  profileName: { fontSize: 20, fontWeight: "700" },
  profileBio: { fontSize: 14, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    textTransform: "uppercase",
  },
  sectionContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingIcon: { marginRight: 12 },
  settingLabelContainer: { flex: 1 },
  settingLabel: { fontSize: 16 },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  copyIdRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  copyIdIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  copyIdInfo: { flex: 1, gap: 2 },
  copyIdLabel: { fontSize: 12, fontWeight: "500" },
  copyIdValue: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dangerText: { fontSize: 16, fontWeight: "600" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 16,
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
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  optionPreview: { flex: 1, textAlign: "right" },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: "500" },
  optionDesc: { fontSize: 12, marginTop: 2 },
  wallpaperGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    paddingVertical: 8,
  },
  wallpaperItem: {
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 4,
  },
  wallpaperPreview: {
    width: 64,
    height: 96,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  wallpaperLabel: { fontSize: 11, fontWeight: "500" },
});
