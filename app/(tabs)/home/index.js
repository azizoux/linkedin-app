import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import axios from "axios";

import { AntDesign } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { SimpleLineIcons } from "@expo/vector-icons";
import moment from "moment";
import { useRouter } from "expo-router";

const index = () => {
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState();
  const [posts, setPosts] = useState([]);
  const [showFullText, setShowFullText] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const MAX_LINES = 2;
  const router = useRouter();
  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const decodedToken = jwt_decode(token);
      const userId = decodedToken.userId;
      setUserId(userId);
    };

    fetchUser();
  }, []);
  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(
        `http://172.20.10.4:5000/profile/${userId}`
      );
      const userData = response.data.user;
      setUser(userData);
    } catch (error) {
      console.log("error fetching user profile", error);
    }
  };
  useEffect(() => {
    if (userId) {
      fetchAllPosts();
    }
  }, [userId, isLiked]);
  const fetchAllPosts = async () => {
    try {
      const response = await axios.get("http://172.20.10.4:5000/all-posts");
      if (response.status === 200) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.log("error fetching posts", error);
    }
  };
  const toggleShowFullText = () => {
    setShowFullText(!showFullText);
  };
  const handleLikePost = async (postId) => {
    console.log("postId:", postId);
    try {
      const response = await axios.post(
        `http://172.20.10.4:5000/like/${postId}/${userId}`
      );
      if (response.status === 200) {
        const updatedPost = response.data.post;
        setIsLiked(updatedPost.likes.some((like) => like.user === userId));
      }
    } catch (error) {
      console.log("Error liking/unliking the post", error);
    }
  };
  return (
    <ScrollView>
      <View
        style={{
          flexDirection: "row",
          padding: 10,
          alignItems: "center",
          gap: 4,
        }}
      >
        <Pressable onPress={() => router.push("home/profile")}>
          <Image
            style={{ width: 30, height: 30, borderRadius: 15 }}
            source={{ uri: user?.profileImage }}
          />
        </Pressable>
        <Pressable
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginHorizontal: 7,
            gap: 10,
            backgroundColor: "white",
            borderRadius: 3,
            height: 30,
            flex: 1,
          }}
        >
          <AntDesign
            style={{ marginLeft: 10 }}
            name="search1"
            size={20}
            color="black"
          />
          <TextInput placeholder="Search" />
        </Pressable>
        <Ionicons name="chatbox-ellipses-outline" size={24} color="black" />
      </View>
      <View>
        {posts?.map((item, index) => (
          <View key={index}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Image
                style={{ width: 60, height: 60, borderRadius: 30 }}
                source={{ uri: item?.user?.profileImage }}
              />
              <View>
                <Text style={{ fontSize: 15, fontWeight: "600" }}>
                  {item?.user?.name}
                </Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    width: 230,
                    color: "gray",
                    fontSize: 15,
                    fontWeight: "400",
                  }}
                >
                  Engineer Graduate | Linkedin Member
                </Text>
                <Text>{moment(item?.createdAt).format("MMMM Do YYYY")}</Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Entypo name="dots-three-vertical" size={20} color="black" />
                <Feather name="x" size={20} color="black" />
              </View>
            </View>
            <View
              style={{ marginTop: 10, marginHorizontal: 10, marginBottom: 12 }}
            >
              <Text
                style={{ fontSize: 15 }}
                numberOfLines={showFullText ? undefined : MAX_LINES}
              >
                {item?.description}
              </Text>
              {!showFullText && (
                <Pressable onPress={toggleShowFullText}>
                  <Text>{showFullText ? "" : "See more..."}</Text>
                </Pressable>
              )}
            </View>
            <Image
              style={{ width: "100%", height: 240 }}
              source={{ uri: item?.imageUrl }}
            />
            {item?.likes?.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  padding: 10,
                }}
              >
                <SimpleLineIcons name="like" size={16} color="#0072B1" />
                <Text style={{ color: "gray" }}>{item?.likes.length}</Text>
              </View>
            )}
            <View
              style={{
                height: 2,
                borderColor: "#E0E0E0",
                borderWidth: 2,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-around",
                marginVertical: 10,
              }}
            >
              <Pressable onPress={() => handleLikePost(item?._id)}>
                <AntDesign
                  style={{ textAlign: "center" }}
                  name="like2"
                  size={24}
                  color={isLiked ? "#0072B1" : "gray"}
                />
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    color: isLiked ? "#0072B1" : "gray",
                    marginTop: 2,
                  }}
                >
                  Like
                </Text>
              </Pressable>
              <Pressable>
                <FontAwesome
                  style={{ textAlign: "center" }}
                  name="comment-o"
                  size={24}
                  color="gray"
                />
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    color: "gray",
                    marginTop: 2,
                  }}
                >
                  Comment
                </Text>
              </Pressable>
              <Pressable>
                <Ionicons
                  style={{ textAlign: "center" }}
                  name="md-share-outline"
                  size={24}
                  color="gray"
                />

                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    color: "gray",
                    marginTop: 2,
                  }}
                >
                  Share
                </Text>
              </Pressable>
              <Pressable>
                <Feather
                  style={{ textAlign: "center" }}
                  name="send"
                  size={24}
                  color="gray"
                />
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    color: "gray",
                    marginTop: 2,
                  }}
                >
                  Send
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default index;

const styles = StyleSheet.create({});
