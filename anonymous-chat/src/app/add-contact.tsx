import { View, Text, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";

export default function AddContactScreen() {
  const { colors } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const contacts = useStore((s) => s.contacts);
  const findOrCreateUser = useStore((s) => s.findOrCreateUser);
  const addContact = useStore((s) => s.addContact);
  const [query, setQuery] = useState("");
  const [foundUser, setFoundUser] = useState<ReturnType<typeof findOrCreateUser>>(null);
  const [searched, setSearched] = useState(false);

  if (!currentUser) return null;

  const handleSearch = () => {
    if (!query.trim()) return;
    const user = findOrCreateUser(query.trim());
    setFoundUser(user);
    setSearched(true);
  };

  const handleAdd = () => {
    if (!foundUser) return;
    if (foundUser.id === currentUser.id) {
      Alert.alert("Errore", "Non puoi aggiungere te stesso");
      return;
    }
    if (contacts[foundUser.id]) {
      Alert.alert("Contatto esistente", "Questo utente è già nei tuoi contatti");
      return;
    }
    addContact(foundUser.id);
    Alert.alert("Contatto aggiunto", `${foundUser.displayName} è stato aggiunto ai contatti`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Cerca un utente tramite username o ID anonimo per aggiungerlo ai contatti.
      </Text>

      <View style={[styles.inputRow, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="at" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Username o ID..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setSearched(false);
            setFoundUser(null);
          }}
          onSubmitEditing={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <Pressable onPress={handleSearch} style={[styles.searchBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="search" size={18} color="#ffffff" />
        </Pressable>
      </View>

      {searched && !foundUser && (
        <View style={styles.resultContainer}>
          <Ionicons name="person-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
            Nessun utente trovato
          </Text>
          <Text style={[styles.notFoundHint, { color: colors.textMuted }]}>
            Controlla l'username o l'ID e riprova
          </Text>
        </View>
      )}

      {foundUser && (
        <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Avatar id={foundUser.id} name={foundUser.displayName} size={56} showOnline isOnline={foundUser.isOnline} />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{foundUser.displayName}</Text>
            <Text style={[styles.userHandle, { color: colors.textSecondary }]}>@{foundUser.username}</Text>
            <Text style={[styles.userBio, { color: colors.textMuted }]} numberOfLines={1}>
              {foundUser.bio}
            </Text>
          </View>
          {contacts[foundUser.id] ? (
            <View style={[styles.addedBadge, { backgroundColor: colors.success + "20" }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.addedText, { color: colors.success }]}>Aggiunto</Text>
            </View>
          ) : foundUser.id === currentUser.id ? (
            <View style={[styles.addedBadge, { backgroundColor: colors.textMuted + "20" }]}>
              <Text style={[styles.addedText, { color: colors.textMuted }]}>Tu</Text>
            </View>
          ) : (
            <Pressable
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
            >
              <Ionicons name="person-add" size={18} color="#ffffff" />
              <Text style={styles.addBtnText}>Aggiungi</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.tipsContainer}>
        <Text style={[styles.tipsTitle, { color: colors.textSecondary }]}>Suggerimento</Text>
        <Text style={[styles.tipsText, { color: colors.textMuted }]}>
          Ogni utente ha un username unico visibile nel suo profilo. Chiedi all'altra persona il suo username per trovarla.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  description: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  resultContainer: { alignItems: "center", paddingVertical: 40, gap: 8 },
  notFoundText: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  notFoundHint: { fontSize: 13 },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
    gap: 12,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: "600" },
  userHandle: { fontSize: 14, marginTop: 2 },
  userBio: { fontSize: 13, marginTop: 4 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  addBtnText: { color: "#ffffff", fontWeight: "600", fontSize: 14 },
  addedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addedText: { fontWeight: "600", fontSize: 13 },
  tipsContainer: {
    marginTop: 32,
    padding: 16,
    gap: 8,
  },
  tipsTitle: { fontSize: 13, fontWeight: "600", textTransform: "uppercase" },
  tipsText: { fontSize: 14, lineHeight: 20 },
});
