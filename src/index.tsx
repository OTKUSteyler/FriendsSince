import { findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { React, ReactNative } from "@vendetta/metro/common";

const { Text, View } = ReactNative;

let unpatch: () => void;

export const onLoad = () => {
    const RelationshipStore = findByStoreName("RelationshipStore");
    const MessageHeader = findByName("MessageHeader", false);

    unpatch = after("type", MessageHeader.prototype, ([args], res) => {
        const userId = args?.message?.authorId;
        if (!userId) return res;

        const status = RelationshipStore.getRelationshipStatus(userId);
        if (!status) return res;

        const header = findInReactTree(res, (x) => x?.props?.timestamp);

        if (header) {
            header.props.children.push(
                <View style={{ padding: 10 }}>
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
                        Friendship Info
                    </Text>
                </View>
            );
        }

        return res;
    });
};

export const onUnload = () => {
    unpatch?.();
};
