import { React } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";

const { Text, View } = React;

let unpatch: () => void;

export const onLoad = () => {
  const MessageHeader = findByProps("MessageTimestamp", "MessageHeader");

  unpatch = before("default", MessageHeader, ([props]: any) => {
    props.children.push(
      <View style={{ padding: 4 }}>
        <Text style={{ color: "white", fontSize: 12 }}>👥 Friends since 2023</Text>
      </View>
    );
  });
};

export const onUnload = () => {
  unpatch?.();
};
