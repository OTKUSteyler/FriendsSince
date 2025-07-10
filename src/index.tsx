import { findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { React } from "@vendetta/metro/common";

const { View, Text } = React;

// Get the RelationshipStore to check friend/block status
const RelationshipStore = findByStoreName("RelationshipStore");
const SimplifiedUserProfileContent = findByName("SimplifiedUserProfileContent", false);

let unpatch: () => void;

const ReviewSection = ({ userId }: { userId: string }) => {
  const status = (() => {
    const rel = RelationshipStore?.getRelationship(userId);
    switch (rel) {
      case 1:
      case 2:
        return "Friend";
      case 3:
        return "Blocked";
      case 0:
        return "Not Friends";
      default:
        return "Unknown";
    }
  })();

  return (
    <View style={{ padding: 10 }}>
      <Text style={{ color: "white" }}>Status: {status}</Text>
    </View>
  );
};

export const onLoad = () => {
  if (!SimplifiedUserProfileContent) {
    console.error("Failed to load SimplifiedUserProfileContent");
    return;
  }

  unpatch = after("type", SimplifiedUserProfileContent, (args, ret) => {
    const userId = args?.[0]?.user?.id;

    const section = findInReactTree(ret, (x) =>
      x?.type?.displayName === "View" &&
      Array.isArray(x?.props?.children) &&
      x.props.children.some(
        (i) => i?.type?.name === "SimplifiedUserProfileAboutMeCard"
      )
    );

    if (!userId || !section) return;
    section.props.children.push(<ReviewSection userId={userId} />);
    return ret;
  });
};

export const onUnload = () => unpatch?.();
