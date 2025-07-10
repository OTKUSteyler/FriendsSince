import { findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { React } from "@vendetta/metro/common";
import { Text, View } from "react-native";

// Find necessary modules
const SimplifiedUserProfileContent = findByName("SimplifiedUserProfileContent", false);
const RelationshipStore = findByStoreName("RelationshipStore");

// Helper to check friendship/block status
const getRelationshipStatus = (userId: string): string => {
  if (!RelationshipStore) return "Unknown";

  const relationship = RelationshipStore.getRelationship(userId);

  switch (relationship) {
    case 1:
      return "Friend";
    case 2:
      return "Blocked";
    case 0:
      return "Not Friends";
    default:
      return "Unknown";
  }
};

// Component to inject into profile
const StatusSection = ({ userId }: { userId: string }) => {
  const status = getRelationshipStatus(userId);
  return (
    <View style={{ padding: 10 }}>
      <Text style={{ color: "white" }}>User ID: {userId}</Text>
      <Text style={{ color: "gray" }}>Status: {status}</Text>
    </View>
  );
};

export default () =>
  after("type", SimplifiedUserProfileContent, (args, res) => {
    const section = findInReactTree(res, (x) =>
      x?.type?.displayName === "View" &&
      Array.isArray(x?.props?.children) &&
      x?.props?.children?.some(
        (c) => c?.type?.name === "SimplifiedUserProfileAboutMeCard"
      )
    );

    const userId = args?.[0]?.user?.id;

    if (section && userId) {
      section.props.children.push(<StatusSection userId={userId} />);
    }

    return res;
  });
