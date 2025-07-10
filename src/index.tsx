import { before } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";

let unpatch: () => void;

export const onLoad = () => {
  const MessageHeader = findByProps("MessageTimestamp", "MessageHeader");

  unpatch = before("default", MessageHeader, ([props]: any) => {
    const userId = props.message?.author?.id;

    if (!userId) return;

    const relationship = getRelationshipStatus(userId);
    if (relationship) {
      props.children.push(
        <View style={{ padding: 10 }}>
          <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
            Friendship Info
          </Text>
        </View>
      );
    }
  });
};

export const onUnload = () => {
  unpatch?.();
};

const getRelationshipStatus = (userId: string) => {
  // Replace with your actual logic
  return "Friend";
};

const { View, Text } = React;
