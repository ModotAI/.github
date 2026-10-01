import { View, Text, StyleSheet } from "react-native";
import { getAvatarColor, getInitials } from "@/constants/avatars";

interface AvatarProps {
  id: string;
  name: string;
  size?: number;
  imageUrl?: string | null;
  showOnline?: boolean;
  isOnline?: boolean;
}

export function Avatar({ id, name, size = 50, showOnline, isOnline }: AvatarProps) {
  const color = getAvatarColor(id);
  const initials = getInitials(name);
  const fontSize = size * 0.38;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      {showOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              backgroundColor: isOnline ? "#00b894" : "#b2bec3",
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
              borderWidth: size * 0.05,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  initials: {
    color: "#ffffff",
    fontWeight: "700",
  },
  onlineIndicator: {
    position: "absolute",
    borderColor: "#ffffff",
  },
});
