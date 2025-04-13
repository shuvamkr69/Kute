import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api"; 
import { getUserId } from "../utils/constants";

interface NotificationItem {
  message: string;
  title: string;
  time: string;
}

const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);


  // Store notifications to AsyncStorage
  const storeNotification = async (notification: NotificationItem[]) => {
    try {
      await AsyncStorage.setItem("notifications", JSON.stringify(notification));
    } catch (error) {
      console.error("Error storing notification:", error);
    }
  };

  // Load Notifications with API Fallback

  const loadNotifications = async () => {
    try {
      const userId = await getUserId();
      console.log(userId)
      const response = await api.get(`/api/v1/users/notifications/${userId}`);
      
      if (response.data) {
        const formattedNotifications = response.data.map((notif: any) => ({
          message: notif.message,
          time: new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setNotifications(formattedNotifications);
        storeNotification(formattedNotifications);
      }
    } catch (error) {
      console.error("API Error:", error);
      const storedNotifications = await AsyncStorage.getItem("notifications");
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
        Alert.alert("Offline Mode", "Showing notifications from local storage.");
      } else {
        Alert.alert("Error", "Failed to load notifications. Please check your connection.");
      }
    }
  };


  // Post Notification to Backend
  const postNotification = async (newNotification: NotificationItem) => {
    try {
      const userId = await getUserId();
      await api.post(`/api/v1/users/notifications/${userId}`, {userId: userId, title: newNotification.title, message: newNotification.message});
      console.log("Notification posted to backend.");
    } catch (error) {
      console.error("Error posting notification:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Listen for Notifications in Foreground
  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const newNotification: NotificationItem = {
        message: notification.request.content.body || "New notification",
        title: notification.request.content.title || "Notification",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setNotifications((prev) => {
        const updatedNotifications = [newNotification, ...prev];
        storeNotification(updatedNotifications);
        postNotification(newNotification); // Send to backend
        return updatedNotifications;
      });
    });

    return () => {
      receivedSubscription.remove();
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      {notifications.length === 0 ? (
        <Text style={styles.noNotifications}>No notifications yet</Text>
      ) : (
        notifications.map((notification, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.message}>{notification.message}</Text>
            <Text style={styles.time}>{notification.time}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", padding: 20 },
  header: { fontSize: 30, fontWeight: "bold", color: "#de822c", textAlign: "center", marginBottom: 20 },
  noNotifications: { fontSize: 16, color: "#B0B0B0", textAlign: "center" },
  card: { backgroundColor: "#1E1E1E", padding: 20, borderRadius: 15, marginBottom: 20, borderColor: "#de822c", borderWidth: 1 },
  message: { fontSize: 16, color: "white", marginBottom: 5 },
  time: { fontSize: 14, color: "#B0B0B0" },
});

export default NotificationsScreen;
