import { View, Text, StyleSheet, Pressable } from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useStore } from "@/store";
import { Avatar } from "@/components/Avatar";
import { formatDuration } from "@/utils/time";

export default function CallScreen() {
  const { userId, type, callId: existingCallId } = useLocalSearchParams<{
    userId: string;
    type: "voice" | "video";
    callId?: string;
  }>();

  const users = useStore((s) => s.users);
  const startCall = useStore((s) => s.startCall);
  const endCall = useStore((s) => s.endCall);
  const otherUser = users[userId ?? ""];

  const [callId, setCallId] = useState(existingCallId || "");
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(type === "video");
  const [callState, setCallState] = useState<"ringing" | "connected" | "ended">("ringing");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!existingCallId && userId && type) {
      const id = startCall(userId, type);
      setCallId(id);
    }
    const connectDelay = setTimeout(() => {
      setCallState("connected");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);

    return () => {
      clearTimeout(connectDelay);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const handleEnd = useCallback(() => {
    if (callId) endCall(callId);
    setCallState("ended");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => router.back(), 300);
  }, [callId, endCall]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeaker((s) => !s);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOn((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  if (!otherUser) return null;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.callType}>
          {type === "video" ? "Videochiamata" : "Chiamata vocale"}
        </Text>
        <Avatar id={otherUser.id} name={otherUser.displayName} size={100} />
        <Text style={styles.callerName}>{otherUser.displayName}</Text>
        <Text style={styles.callStatus}>
          {callState === "ringing"
            ? "Chiamata in corso..."
            : callState === "connected"
            ? formatDuration(elapsed)
            : "Terminata"}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? "mic-off" : "mic"}
            size={28}
            color={isMuted ? "#000000" : "#ffffff"}
          />
          <Text style={[styles.controlLabel, isMuted && styles.controlLabelActive]}>
            {isMuted ? "Attiva" : "Muto"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
          onPress={toggleSpeaker}
        >
          <Ionicons
            name={isSpeaker ? "volume-high" : "volume-medium"}
            size={28}
            color={isSpeaker ? "#000000" : "#ffffff"}
          />
          <Text style={[styles.controlLabel, isSpeaker && styles.controlLabelActive]}>
            Speaker
          </Text>
        </Pressable>

        {type === "video" && (
          <Pressable
            style={[styles.controlBtn, !isVideoOn && styles.controlBtnActive]}
            onPress={toggleVideo}
          >
            <Ionicons
              name={isVideoOn ? "videocam" : "videocam-off"}
              size={28}
              color={!isVideoOn ? "#000000" : "#ffffff"}
            />
            <Text style={[styles.controlLabel, !isVideoOn && styles.controlLabelActive]}>
              Video
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.bottomSection}>
        <Pressable style={styles.endBtn} onPress={handleEnd}>
          <Ionicons name="call" size={32} color="#ffffff" style={{ transform: [{ rotate: "135deg" }] }} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 60,
  },
  topSection: { alignItems: "center", gap: 12 },
  callType: { color: "#8b949e", fontSize: 14, fontWeight: "500", marginBottom: 16 },
  callerName: { color: "#ffffff", fontSize: 28, fontWeight: "700", marginTop: 16 },
  callStatus: { color: "#8b949e", fontSize: 16 },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    paddingHorizontal: 40,
  },
  controlBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  controlBtnActive: { backgroundColor: "#ffffff" },
  controlLabel: { color: "#ffffff", fontSize: 11, fontWeight: "500", marginTop: 2 },
  controlLabelActive: { color: "#000000" },
  bottomSection: { alignItems: "center" },
  endBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#d63031",
    alignItems: "center",
    justifyContent: "center",
  },
});
