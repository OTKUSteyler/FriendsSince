import { findByProps, findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import React from "react";
import { Text } from "react-native"; // Make sure this is imported for <Text>

const { LazyActionSheet } = findByProps("openLazy", "hideActionSheet");
const { getChannelId } = findByStoreName("SelectedGuildStore");
const SimplifiedUserProfileContent = findByName("SimplifiedUserProfileContent");

const ReviewSection = ({ userId }: { userId: string }) => (
  <Text style={{ color: "white", padding: 10 }}>User ID: {userId}</Text>
);

export default () =>
  after("type", SimplifiedUserProfileContent, (args, ret) => {
    const profileSections = findInReactTree(ret, (r) =>
      r?.type?.displayName === "View" &&
      Array.isArray(r?.props?.children) &&
      r.props.children.find(
        (i) => i?.type?.name === "SimplifiedUserProfileAboutMeCard"
      )
    )?.props?.children;

    const userId = args[0]?.user?.id;
    profileSections?.push(<ReviewSection userId={userId} />);
  });
