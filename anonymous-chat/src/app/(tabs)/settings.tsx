import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";
import { generateInviteCode } from "@/utils/crypto";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const [notifications, setNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeen, setLastSeen] = useState(true);

  if (!currentUser) return null;

  const inviteCode = generateInviteCode();

  const sections = [
    {
      title: "Privacy",
      items: [
        {
          icon: "eye-off",
          label: "Last Seen",
          toggle: true,
          value: lastSeen,
          onToggle: setLastSeen,
        },
        {
          icon: "checkmark-done",
          label: "Read Receipts",
          toggle: true,
          value: readReceipts,
          onToggle: setReadReceipts,
        },
        {
          icon: "lock-closed",
          label: "Blocked Contacts",
          onPress: () => {},
        },
        {
          icon: "finger-print",
          label: "App Lock",
          onPress: () => {},
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: "notifications",
          label: "Push Notifications",
          toggle: true,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: "musical-notes",
          label: "Message Sound",
          onPress: () => {},
        },
      ],
    },
    {
      title: "Chat",
      items: [
        {
          icon: "image",
          label: "Chat Wallpaper",
          onPress: () => {},
        },
        {
          icon: "text",
          label: "Font Size",
          onPress: () => {},
        },
        {
          icon: "cloud-download",
          label: "Media Auto-Download",
          onPress: () => {},
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          icon: "share-social",
          label: `Invite Code: ${inviteCode}`,
          onPress: () => {
            Alert.alert("Invite Code", `Share this code: ${inviteCode}`);
          },
        },
        {
          icon: "help-circle",
          label: "Help & FAQ",
          onPress: () => {},
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
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
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
            "Reset Identity",
            "This will generate a new anonymous identity. All your data will remain but your ID will change. Continue?",
            [
              { text: "Cancel", style: "cancel" },
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
          Reset Anonymous Identity
        </Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
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
  settingLabel: { flex: 1, fontSize: 16 },
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
  copyIdInfo: {
    flex: 1,
    gap: 2,
  },
  copyIdLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
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
});
