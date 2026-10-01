import { View, TextInput, StyleSheet, Pressable, Platform, Text, Animated, Alert } from "react-native";
import { useState, useRef, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import type { Message } from "@/types";

interface ChatInputProps {
  onSend: (text: string) => void;
  onAttach: () => void;
  onVoice: (uri: string, duration: number, waveform: number[]) => void;
  onSticker: () => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  onSaveEdit: (text: string) => void;
}

export function ChatInput({
  onSend,
  onAttach,
  onVoice,
  onSticker,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSaveEdit,
}: ChatInputProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(editingMessage?.text || "");
  const inputRef = useRef<TextInput>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 100);

  useEffect(() => {
    if (editingMessage) setText(editingMessage.text);
  }, [editingMessage]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  useEffect(() => {
    if (isRecording && recorderState.metering !== undefined) {
      const normalized = Math.max(0, Math.min(1, (recorderState.metering + 60) / 60));
      setWaveformData((prev) => [...prev, normalized]);
    }
  }, [isRecording, recorderState.metering]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (editingMessage) {
      onSaveEdit(trimmed);
    } else {
      onSend(trimmed);
    }
    setText("");
  };

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return;

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setWaveformData([]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  }, [recorder]);

  const stopRecording = useCallback(async (send: boolean) => {
    try {
      await recorder.stop();

      await setAudioModeAsync({ allowsRecording: false });

      if (send) {
        const uri = recorder.uri;
        const durationSec = Math.floor(recorderState.durationMillis / 1000);
        if (uri && durationSec > 0) {
          const sampled = sampleWaveform(waveformData, 32);
          onVoice(uri, durationSec, sampled);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}

    setIsRecording(false);
    setWaveformData([]);
  }, [recorder, recorderState.durationMillis, onVoice, waveformData]);

  const hasText = text.trim().length > 0;
  const displayDuration = Math.floor(recorderState.durationMillis / 1000);
  const minutes = Math.floor(displayDuration / 60);
  const seconds = displayDuration % 60;

  if (isRecording) {
    return (
      <View style={[styles.wrapper, { borderTopColor: colors.border }]}>
        <View style={[styles.recordingBar, { backgroundColor: colors.background }]}>
          <Pressable onPress={() => stopRecording(false)} style={styles.iconButton} hitSlop={8}>
            <Ionicons name="trash-outline" size={24} color={colors.error} />
          </Pressable>

          <View style={styles.recordingCenter}>
            <Animated.View style={[styles.recordDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={[styles.recordTime, { color: colors.text }]}>
              {minutes}:{seconds.toString().padStart(2, "0")}
            </Text>
            <View style={styles.miniWave}>
              {waveformData.slice(-30).map((v, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniBar,
                    { height: 4 + v * 16, backgroundColor: colors.primary },
                  ]}
                />
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => stopRecording(true)}
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { borderTopColor: colors.border }]}>
      {(replyTo || editingMessage) && (
        <View style={[styles.replyBar, { backgroundColor: colors.surfaceVariant, borderLeftColor: colors.primary }]}>
          <View style={styles.replyContent}>
            <Text style={[styles.replyLabel, { color: colors.primary }]}>
              {editingMessage ? "Editing" : "Reply to"}
            </Text>
            <Text style={[styles.replyText, { color: colors.textSecondary }]} numberOfLines={1}>
              {(editingMessage || replyTo)?.text}
            </Text>
          </View>
          <Pressable onPress={editingMessage ? onCancelEdit : onCancelReply} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      )}
      <View style={styles.container}>
        <Pressable onPress={onAttach} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </Pressable>

        <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
          <Pressable style={styles.emojiButton} hitSlop={8} onPress={onSticker}>
            <Ionicons name="happy-outline" size={24} color={colors.textMuted} />
          </Pressable>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            placeholder="Messaggio"
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={4096}
            onSubmitEditing={Platform.OS === "web" ? handleSend : undefined}
          />
        </View>

        {hasText ? (
          <Pressable onPress={handleSend} style={[styles.sendButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="send" size={20} color="#ffffff" />
          </Pressable>
        ) : (
          <Pressable onPress={startRecording} style={styles.iconButton} hitSlop={8}>
            <Ionicons name="mic" size={26} color={colors.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function sampleWaveform(data: number[], targetBars: number): number[] {
  if (data.length === 0) return Array.from({ length: targetBars }, () => 0.3 + Math.random() * 0.7);
  if (data.length <= targetBars) {
    const padded = [...data];
    while (padded.length < targetBars) padded.push(0.15);
    return padded;
  }
  const step = data.length / targetBars;
  return Array.from({ length: targetBars }, (_, i) => {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    const slice = data.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  iconButton: {
    padding: 4,
    marginBottom: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    paddingHorizontal: 4,
    minHeight: 40,
    maxHeight: 120,
  },
  emojiButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    marginHorizontal: 8,
    marginTop: 4,
    borderRadius: 4,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  replyText: {
    fontSize: 13,
  },
  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  recordingCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#d63031",
  },
  recordTime: {
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    minWidth: 40,
  },
  miniWave: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 1.5,
    height: 24,
  },
  miniBar: {
    width: 2.5,
    borderRadius: 1.5,
    minHeight: 3,
  },
});
