import { findByProps, findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import React from "react";
import { Text, View } from "react-native";

// Relationship check function
const getRelationshipStatus = (userId: string): string => {
  const RelationshipStore = findByStoreName("RelationshipStore");
  const type = RelationshipStore?.getRelationship(userId);

  switch (type) {
    case 1:
      return "Pending";
    case 2:
      return "Friend";
    case 3:
      return "Blocked";
    case 4:
      return "Incoming Request";
    default:
      return "Not friends";
  }
};

const SimplifiedUserProfileContent = findByName("SimplifiedUserProfileContent");

// Display section
const ReviewSection = ({ userId }: { userId: string }) => {
  const status = getRelationshipStatus(userId);
  return (
    <View style={{ padding: 10 }}>
      <Text style={{ color: "white" }}>User ID: {userId}</Text>
      <Text style={{ color: "gray", fontSize: 14 }}>Status: {status}</Text>
    </View>
  );
};

// Patch profile
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
