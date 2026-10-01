import { View, StyleSheet, Pressable, Text } from "react-native";
import { useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useTheme } from "@/hooks/useTheme";
import { formatDuration } from "@/utils/time";

interface AudioWaveformProps {
  uri?: string;
  waveform?: number[];
  duration: number;
  isMine: boolean;
}

const DEFAULT_BARS = 32;

function generateBars(waveform?: number[]): number[] {
  if (waveform && waveform.length > 0) return waveform;
  return Array.from({ length: DEFAULT_BARS }, () => 0.15 + Math.random() * 0.85);
}

export function AudioWaveform({ uri, waveform, duration, isMine }: AudioWaveformProps) {
  const { colors } = useTheme();
  const player = useAudioPlayer(uri ?? null);
  const status = useAudioPlayerStatus(player);
  const bars = useRef(generateBars(waveform)).current;

  const isPlaying = status.playing;
  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;
  const currentTime = Math.floor(status.currentTime);

  const handlePlayPause = useCallback(async () => {
    if (!uri) return;

    if (isPlaying) {
      player.pause();
      return;
    }

    if (status.currentTime >= status.duration && status.duration > 0) {
      await player.seekTo(0);
    }
    player.play();
  }, [uri, isPlaying, player, status.currentTime, status.duration]);

  const activeColor = isMine ? "#ffffff" : colors.primary;
  const inactiveColor = isMine ? "rgba(255,255,255,0.3)" : colors.surfaceVariant;
  const textColor = isMine ? "rgba(255,255,255,0.7)" : colors.textMuted;

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePlayPause} style={styles.playBtn}>
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={24}
          color={activeColor}
        />
      </Pressable>
      <View style={styles.waveContainer}>
        <View style={styles.bars}>
          {bars.map((height, i) => {
            const filled = i / bars.length <= progress;
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: 4 + height * 20,
                    backgroundColor: filled ? activeColor : inactiveColor,
                  },
                ]}
              />
            );
          })}
        </View>
        <Text style={[styles.time, { color: textColor }]}>
          {isPlaying ? formatDuration(currentTime) : formatDuration(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    minWidth: 200,
  },
  playBtn: { padding: 4 },
  waveContainer: { flex: 1, gap: 4 },
  bars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 28,
  },
  bar: {
    flex: 1,
    borderRadius: 1.5,
    minWidth: 2,
    maxWidth: 4,
  },
  time: { fontSize: 11 },
});
