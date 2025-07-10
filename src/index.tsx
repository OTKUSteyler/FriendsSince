import { findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import React from "react";
import { Text, View } from "react-native";

const SimplifiedUserProfileContent = findByName("SimplifiedUserProfileContent");

const RelationshipStore = findByStoreName("RelationshipStore");

if (!SimplifiedUserProfileContent) {
  console.error("[FriendsSince] SimplifiedUserProfileContent not found");
}

if (!RelationshipStore) {
  console.error("[FriendsSince] RelationshipStore not found");
}

const getRelationshipStatus = (userId: string): string => {
  const relation = RelationshipStore?.getRelationship?.(userId);
  switch (relation) {
    case 2:
      return "Friend";
    case 3:
      return "Blocked";
    case 0:
      return "Not friends";
    default:
      return "Unknown";
  }
};

const StatusView = ({ userId }: { userId: string }) => {
  const status = getRelationshipStatus(userId);
  return (
    <View style={{ padding: 10 }}>
      <Text style={{ color: "white" }}>User ID: {userId}</Text>
      <Text style={{ color: "gray" }}>Status: {status}</Text>
    </View>
  );
};

export default () => {
  console.log("[FriendsSince] Plugin loaded");

  if (!SimplifiedUserProfileContent) return;

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
      profileSections.push(<StatusView userId={userId} />);
      console.log(`[FriendsSince] Injected status view for ${userId}`);
    } else {
      console.warn("[FriendsSince] Failed to inject status view");
    }

    return ret;
  });
};
