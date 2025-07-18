import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api";
import { getUserId } from "../utils/constants";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Image } from "react-native";
import BackButton from "../components/BackButton";

interface NotificationItem {
  message: string;
  title: string;
  time: string;
}

const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useFocusEffect(
    //polling for fetching notifications
    useCallback(() => {
      // Start polling every 10 seconds when screen is focused
      const interval = setInterval(() => {
        loadNotifications();
      }, 3000); // 10 seconds

      // Clear interval when screen is unfocused
      return () => clearInterval(interval);
    }, [])
  );

  const storeNotification = async (notification: NotificationItem[]) => {
    try {
      await AsyncStorage.setItem("notifications", JSON.stringify(notification));
    } catch (error) {
      console.error("Error storing notification:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const userId = await getUserId();
      const response = await api.get(`/api/v1/users/notifications/${userId}`);
      if (response.data) {
        const formattedNotifications = response.data.map((notif: any) => ({
          title: notif.title || "Notification",
          message: notif.message,
          time: new Date(notif.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setNotifications(formattedNotifications);
        storeNotification(formattedNotifications);
      }
    } catch (error) {
      console.error("API Error:", error);
      const storedNotifications = await AsyncStorage.getItem("notifications");
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
        Alert.alert(
          "Offline Mode",
          "Showing notifications from local storage."
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to load notifications. Please check your connection."
        );
      }
    }
  };

  const postNotification = async (newNotification: NotificationItem) => {
    try {
      const userId = await getUserId();
      await api.post(`/api/v1/users/notifications/${userId}`, {
        userId: userId,
        title: newNotification.title,
        message: newNotification.message,
      });
    } catch (error) {
      console.error("Error posting notification:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const newNotification: NotificationItem = {
          title: notification.request.content.title || "Notification",
          message: notification.request.content.body || "New notification",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setNotifications((prev) => {
          const updatedNotifications = [newNotification, ...prev];
          storeNotification(updatedNotifications);
          postNotification(newNotification);
          return updatedNotifications;
        });
      }
    );

    return () => {
      receivedSubscription.remove();
    };
  }, []);

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title="Notifications" />
      {notifications.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <Image
            source={require("../assets/icons/penguin.png")}
            style={{ width: 150, height: 150, marginBottom: 20 }}
          />

          <Text style={styles.noNotifications}>No notifications</Text>
        </View>
      ) : (
        <ScrollView style={styles.container}>
          {notifications.map((notification, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>{notification.title}</Text>
                <Text style={styles.time}>{notification.time}</Text>
              </View>
              <Text style={styles.message}>{notification.message}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#de822c",
    marginBottom: 20,
  },
  noNotificationsContainer: {
    flex: 1,
    justifyContent: "center", // centers vertically
    alignItems: "center", // centers horizontally
    paddingHorizontal: 20, // optional: adds spacing for smaller screens
  },
  noNotifications: {
    fontSize: 16,
    color: "#B0B0B0",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: "#de822c",
    elevation: 4,
    shadowColor: "#de822c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#de822c",
    flex: 1,
    flexWrap: "wrap",
  },
  message: {
    fontSize: 15,
    color: "#DADADA",
    marginTop: 4,
    lineHeight: 20,
  },
  time: {
    fontSize: 13,
    color: "#888",
    marginLeft: 10,
  },

  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
});

export default NotificationsScreen;
