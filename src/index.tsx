import { findByProps, findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import React from "react";
import { Text, View } from "react-native";

// Get relevant components/stores
const SimplifiedUserProfileContent = findByName("SimplifiedUserProfileContent");
const RelationshipStore = findByStoreName("RelationshipStore");

// Log and evaluate relationship status
function getRelationshipStatus(userId: string): string {
  try {
    const rel = RelationshipStore?.getRelationship(userId);
    let status: string;

    switch (rel) {
      case 1:
      case 2:
        status = "Friend";
        break;
      case 3:
        status = "Blocked";
        break;
      case 0:
        status = "Not Friends";
        break;
      default:
        status = "Unknown";
    }

    console.log(`[FriendsSince] Status for user ${userId}: ${status} (raw: ${rel})`);
    return status;
  } catch (err) {
    console.error(`[FriendsSince] Failed to get status for user ${userId}:`, err);
    return "Error";
  }
}

// UI section showing user ID + status
const ReviewSection = ({ userId }: { userId: string }) => {
  const status = getRelationshipStatus(userId);
  return (
    <View style={{ padding: 10 }}>
      <Text style={{ color: "white" }}>User ID: {userId}</Text>
      <Text style={{ color: "gray" }}>Status: {status}</Text>
    </View>
  );
};

// Patch the profile view
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
