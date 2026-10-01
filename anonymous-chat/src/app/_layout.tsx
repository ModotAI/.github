import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const initialize = useStore((s) => s.initialize);
  const currentUser = useStore((s) => s.currentUser);
  const hydrated = useStore((s) => s._hydrated);

  useEffect(() => {
    if (hydrated && !currentUser) {
      initialize();
    }
  }, [hydrated, currentUser, initialize]);

  if (!hydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.header },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="chat/info"
          options={{ title: "Chat Info", presentation: "modal" }}
        />
        <Stack.Screen
          name="new-chat"
          options={{ title: "New Chat", presentation: "modal" }}
        />
        <Stack.Screen
          name="new-group"
          options={{ title: "New Group", presentation: "modal" }}
        />
        <Stack.Screen
          name="add-contact"
          options={{ title: "Add Contact", presentation: "modal" }}
        />
        <Stack.Screen
          name="call"
          options={{ headerShown: false, presentation: "fullScreenModal", animation: "fade" }}
        />
        <Stack.Screen
          name="profile"
          options={{ title: "Profile", presentation: "modal" }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
