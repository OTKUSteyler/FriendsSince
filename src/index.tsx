import { findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { React } from "@vendetta/metro/common";

const { View, Text } = React;

const RelationshipStore = findByStoreName("RelationshipStore");
const SimplifiedUserProfileContent = findByName("SimplifiedUserProfileContent");

const ReviewSection = ({ userId }: { userId: string }) => {
  const status = (() => {
    const relation = RelationshipStore?.getRelationship(userId);
    if (relation === 1 || relation === 2) return "Friend";
    if (relation === 3) return "Blocked";
    if (relation === 0) return "Not friends";
    return "Unknown";
  })();

  return (
    <View style={{ padding: 10 }}>
      <Text style={{ color: "white" }}>Status: {status}</Text>
    </View>
  );
};

let unpatch: () => void;

export const onLoad = () => {
  unpatch = after("type", SimplifiedUserProfileContent, (args, ret) => {
    const userId = args?.[0]?.user?.id;

    const aboutMeSection = findInReactTree(ret, (x) =>
      x?.type?.displayName === "View" &&
      Array.isArray(x?.props?.children) &&
      x.props.children.some(
        (i) => i?.type?.name === "SimplifiedUserProfileAboutMeCard"
      )
    );

    if (!aboutMeSection || !userId) return;

    aboutMeSection.props.children.push(<ReviewSection userId={userId} />);
    return ret;
  });
};

export const onUnload = () => {
  unpatch?.();
};
