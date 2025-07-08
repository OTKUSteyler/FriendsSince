import { findByProps, findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import React from "react";
import { Text, View } from "react-native";

const SimplifiedUserProfileContent = findByName("SimplifiedUserProfileContent");

// Gets user relationship (friend, blocked, etc.)
const getRelationshipStatus = (userId: string): string => {
  const RelationshipStore = findByStoreName("RelationshipStore");
  const relationshipType = RelationshipStore?.getRelationship(userId);

  switch (relationshipType) {
    case 1:
      return "Incoming Friend Request";
    case 2:
      return "Friend";
    case 3:
      return "Blocked";
    case 4:
      return "Blocked by Them";
    case 0:
    default:
      return "Not Friends";
  }
};

// Custom section in profile
const FriendStatusSection = ({ userId }: { userId: string }) => {
  const status = getRelationshipStatus(userId);

  return (
    <View style={{ padding: 10 }}>
      <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
        Friendship Info
      </Text>
      <Text style={{ color: "gray", marginTop: 4 }}>User ID: {userId}</Text>
      <Text style={{ color: "gray" }}>Status: {status}</Text>
    </View>
  );
};

export default () =>
  after("type", SimplifiedUserProfileContent, (args, ret) => {
    const profileSections = findInReactTree(ret, (r) =>
      r?.type?.displayName === "View" &&
      Array.isArray(r?.props?.children) &&
      r.props.children.find(
        (i) => i?.type?.name === "SimplifiedUserProfileAboutMeCard"
      )
    )?.props?.children;

    const userId = args?.[0]?.user?.id;
    if (profileSections && userId) {
      profileSections.push(<FriendStatusSection userId={userId} />);
    }

    return ret;
  });
