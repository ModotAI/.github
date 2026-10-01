import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store";
import { useMemo } from "react";

export default function TabLayout() {
  const { colors } = useTheme();
  const chats = useStore((s) => s.chats);

  const totalUnread = useMemo(() => {
    return Object.values(chats).reduce(
      (sum, chat) => sum + (chat.isArchived ? 0 : chat.unreadCount),
      0
    );
  }, [chats]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
        },
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: "700", fontSize: 20 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: "Status",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="radio-button-on" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: "Calls",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="call" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
