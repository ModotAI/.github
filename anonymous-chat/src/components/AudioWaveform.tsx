import { View, StyleSheet, Pressable, Text } from "react-native";
import { useEffect, useRef, useState, useCallback } from "react";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const bars = useRef(generateBars(waveform)).current;

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (!uri) return;

    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.didJustFinish || status.positionMillis >= (status.durationMillis || 0)) {
            await soundRef.current.setPositionAsync(0);
          }
          await soundRef.current.playAsync();
          setIsPlaying(true);
          return;
        }
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          const dur = status.durationMillis || duration * 1000;
          setProgress(dur > 0 ? status.positionMillis / dur : 0);
          setCurrentTime(Math.floor(status.positionMillis / 1000));
          if (status.didJustFinish) {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
          }
        }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch {}
  }, [uri, isPlaying, duration]);

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
