import { findByProps, findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import React from "react";
import { Text, View } from "react-native";

const { getChannelId } = findByStoreName("SelectedGuildStore");
const SimplifiedUserProfileContent = findByName("SimplifiedUserProfileContent");

// ⚠️ Replace this with actual API/store data when available
const isBlockedOrUnfriended = (userId: string): string => {
  // Placeholder logic
  // Vendetta may expose friendship/block data via RelationshipStore
  const RelationshipStore = findByStoreName("RelationshipStore");
  const relationshipType = RelationshipStore?.getRelationship(userId);

  if (relationshipType === 2) return "Friend";
  if (relationshipType === 3) return "Blocked";
  if (relationshipType === 0) return "Not friends";
  return "Unknown";
};

const ReviewSection = ({ userId }: { userId: string }) => {
  const status = isBlockedOrUnfriended(userId);
  return (
    <View style={{ padding: 10 }}>
      <Text style={{ color: "white" }}>User ID: {userId}</Text>
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
      profileSections.push(<ReviewSection userId={userId} />);
    }

    return ret;
  });
