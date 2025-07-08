// import React, { useEffect, useRef, useState } from "react";
// import { View, Button, Alert, StyleSheet } from "react-native";
// import {
//   mediaDevices,
//   RTCPeerConnection,
//   RTCIceCandidate,
//   RTCSessionDescription,
//   RTCView,
//   MediaStream,
// } from "react-native-webrtc";
// import { NativeStackScreenProps } from "@react-navigation/native-stack";
// import { io } from "socket.io-client";

// type RootStackParamList = {
//   Call: {
//     conversationId: string;
//     loggedInUserId: string;
//   };
// };

// type Props = NativeStackScreenProps<RootStackParamList, "Call">;

// const socket = io("http://192.168.18.150:3000");

// export default function CallScreen({ route, navigation }: Props) {
//   const { conversationId, loggedInUserId } = route.params;

//   const [localStream, setLocalStream] = useState<MediaStream | null>(null);
//   const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

//   const pc = useRef<RTCPeerConnection | null>(null);

//   useEffect(() => {
//     socket.emit("joinConversation", conversationId);

//     const initCall = async () => {
//       const stream = await mediaDevices.getUserMedia({
//         audio: true,
//         video: true,
//       });
//       setLocalStream(stream);

//       const peer = new RTCPeerConnection({
//         iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
//       });
//       pc.current = peer;

//       const remote = new MediaStream([]);
//       setRemoteStream(remote);

//       stream.getTracks().forEach((track) => {
//         (peer as any).addTrack(track, stream);
//       });

//       peer.onaddstream = (event: any) => {
//         setRemoteStream(event.stream);
//       };

//       peer.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", {
//             convId: conversationId,
//             candidate: event.candidate,
//             from: loggedInUserId,
//           });
//         }
//       };

//       const offer = await peer.createOffer();
//       await peer.setLocalDescription(offer);

//       socket.emit("call-user", {
//         convId: conversationId,
//         offer,
//         from: loggedInUserId,
//       });
//     };

//     initCall();

//     socket.on("call-made", async ({ offer, from }: any) => {
//       if (from === loggedInUserId) return;

//       const stream = await mediaDevices.getUserMedia({
//         audio: true,
//         video: true,
//       });
//       setLocalStream(stream);

//       const peer = new RTCPeerConnection({
//         iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
//       });
//       pc.current = peer;

//       const remote = new MediaStream([]);
//       setRemoteStream(remote);

//       // For react-native-webrtc, use addStream instead of addTrack
//       peer.addStream(stream);

//       peer.onaddstream = (event: any) => {
//         setRemoteStream(event.stream);
//       };

//       peer.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", {
//             convId: conversationId,
//             candidate: event.candidate,
//             from: loggedInUserId,
//           });
//         }
//       };

//       await peer.setRemoteDescription(new RTCSessionDescription(offer));
//       const answer = await peer.createAnswer();
//       await peer.setLocalDescription(answer);

//       socket.emit("answer-call", {
//         convId: conversationId,
//         answer,
//         from: loggedInUserId,
//       });
//     });

//     socket.on("answer-made", async ({ answer }: any) => {
//       await pc.current?.setRemoteDescription(new RTCSessionDescription(answer));
//     });

//     socket.on("ice-candidate", async ({ candidate }: any) => {
//       if (candidate) {
//         await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
//       }
//     });

//     return () => {
//       socket.off("call-made");
//       socket.off("answer-made");
//       socket.off("ice-candidate");

//       pc.current?.close();
//       localStream?.getTracks().forEach((t) => t.stop());
//       remoteStream?.getTracks().forEach((t) => t.stop());
//       setLocalStream(null);
//       setRemoteStream(null);
//     };
//   }, []);

//   const endCall = () => {
//     pc.current?.close();
//     localStream?.getTracks().forEach((t) => t.stop());
//     remoteStream?.getTracks().forEach((t) => t.stop());
//     setLocalStream(null);
//     setRemoteStream(null);
//     navigation.goBack();
//   };

//   return (
//     <View style={styles.container}>
//       {remoteStream ? (
//         <RTCView
//           streamURL={remoteStream.toURL()}
//           style={styles.remote}
//           objectFit="cover"
//           mirror={false}
//         />
//       ) : (
//         <View style={styles.remotePlaceholder} />
//       )}

//       {localStream ? (
//         <RTCView
//           streamURL={localStream.toURL()}
//           style={styles.local}
//           objectFit="cover"
//           mirror
//         />
//       ) : null}

//       <Button title="End Call" onPress={endCall} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "black" },
//   remote: {
//     flex: 1,
//     backgroundColor: "black",
//   },
//   remotePlaceholder: {
//     flex: 1,
//     backgroundColor: "gray",
//   },
//   local: {
//     width: 120,
//     height: 160,
//     position: "absolute",
//     top: 30,
//     right: 10,
//     backgroundColor: "black",
//   },
// });
