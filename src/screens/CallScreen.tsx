import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Platform } from "react-native";
import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  RenderModeType,
} from "react-native-agora";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

const APP_ID = "4d7b55e46ef24a85825bd1ea354610f0"; // 🔑 Replace with your Agora App ID

export type RootStackParamList = {
  CallScreen: {
    channelId: string;
    isCaller: boolean;
  };
};

type CallScreenProps = NativeStackScreenProps<RootStackParamList, "CallScreen">;

const CallScreen: React.FC<CallScreenProps> = ({ route, navigation }) => {
  const { channelId, isCaller } = route.params;
  const engineRef = useRef<IRtcEngine | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);

  useEffect(() => {
    const initAgora = async () => {
      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      engine.initialize({
        appId: APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      engine.enableAudio();
      engine.registerEventHandler({
        onUserJoined: (_connection, uid) => setRemoteUid(uid),
        onUserOffline: () => setRemoteUid(null),
      });

      await engine.joinChannel(null, channelId, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
    };

    initAgora();

    return () => {
      const engine = engineRef.current;
      if (engine) {
        engine.leaveChannel();
        engine.release();
      }
    };
  }, [channelId]);

  return (
    <View style={styles.container}>
      {remoteUid ? (
        <RtcSurfaceView
          style={styles.full}
          canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }}
          connection={{ channelId }}
        />
      ) : (
        <View style={styles.waitingWrapper}>
          <Text style={styles.waitingText}>Waiting for user to join…</Text>
        </View>
      )}

      {/* Optional: Show local preview here if needed
      <RtcSurfaceView
        style={styles.localPreview}
        canvas={{ uid: 0, renderMode: RenderModeType.RenderModeHidden }}
      />
      */}

      <TouchableOpacity
        style={styles.hangup}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.hangupText}>Hang Up</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CallScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  full: {
    flex: 1,
  },
  waitingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  waitingText: {
    color: "white",
    fontSize: 18,
  },
  hangup: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "red",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 999,
  },
  hangupText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  localPreview: {
    width: 120,
    height: 160,
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
});
