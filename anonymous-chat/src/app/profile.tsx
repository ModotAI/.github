import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const updateProfile = useStore((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [edited, setEdited] = useState(false);

  if (!currentUser) return null;

  const handleSave = () => {
    updateProfile({
      displayName: displayName.trim() || currentUser.displayName,
      username: username.trim() || currentUser.username,
      bio: bio.trim(),
    });
    setEdited(false);
    Alert.alert("Saved", "Your profile has been updated");
  };

  const handleChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setEdited(true);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          <Avatar id={currentUser.id} name={displayName || currentUser.displayName} size={100} />
          <Pressable style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={20} color="#ffffff" />
          </Pressable>
        </View>
        <Text style={[styles.userId, { color: colors.textMuted }]}>
          ID: {currentUser.id.slice(0, 16)}...
        </Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Display Name</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.text, borderBottomColor: colors.border }]}
            value={displayName}
            onChangeText={handleChange(setDisplayName)}
            placeholder="Your display name"
            placeholderTextColor={colors.textMuted}
            maxLength={30}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Username</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.text, borderBottomColor: colors.border }]}
            value={username}
            onChangeText={handleChange(setUsername)}
            placeholder="Your username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            maxLength={20}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Bio</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.text, borderBottomColor: colors.border }]}
            value={bio}
            onChangeText={handleChange(setBio)}
            placeholder="Tell something about yourself..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={140}
          />
          <Text style={[styles.charCount, { color: colors.textMuted }]}>
            {bio.length}/140
          </Text>
        </View>
      </View>

      {edited && (
        <Pressable
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </Pressable>
      )}

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your identity is completely anonymous. No phone number, email, or personal information is required.
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="lock-closed" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            All messages are end-to-end encrypted. Only you and the recipient can read them.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatarWrapper: {
    position: "relative",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  userId: {
    fontSize: 12,
    marginTop: 12,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },
  formSection: {
    paddingHorizontal: 24,
    gap: 24,
  },
  field: {},
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  fieldInput: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  saveButton: {
    marginHorizontal: 24,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

