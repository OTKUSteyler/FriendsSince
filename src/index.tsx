import { findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { React } from "@vendetta/metro/common";
import { getModule } from "@vendetta/metro";

const { View, Text } = React;
const RelationshipStore = findByStoreName("RelationshipStore");

let unpatch: () => void;

function getRelationshipStatus(userId: string): string {
  try {
    const rel = RelationshipStore?.getRelationship(userId);
    console.log(`[FriendsSince] Relationship for ${userId}:`, rel);

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
  } catch (err) {
    console.error("[FriendsSince] Relationship check failed:", err);
    return "Error";
  }
}

function FriendshipStatusTag({ userId }: { userId: string }) {
  const status = getRelationshipStatus(userId);
  return (
    <Text style={{ color: "gray", marginLeft: 10 }}>| Status: {status}</Text>
  );
}

export const onLoad = () => {
  console.log("[FriendsSince] 🟢 Loading plugin...");

  const Component =
    findByName("UserProfile", false) ||
    findByName("UserProfileWrapper", false) ||
    findByName("SimplifiedUserProfileContent", false);

  if (!Component) {
    console.error("[FriendsSince] ❌ Could not find a usable profile component.");
    return;
  }

  console.log("[FriendsSince] ✅ Component hooked:", Component.displayName || Component.name);

  unpatch = after("type", Component, (args, ret) => {
    const userId = args?.[0]?.user?.id;
    if (!userId) {
      console.warn("[FriendsSince] ⚠️ Missing user ID.");
      return ret;
    }

    const targetLine = findInReactTree(ret, (x) =>
      typeof x?.props?.children === "string" &&
      x?.props?.children?.toLowerCase?.().includes("member since")
    );

    if (targetLine && React.isValidElement(targetLine)) {
      const originalChildren = targetLine.props.children;
      targetLine.props.children = (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: "white" }}>{originalChildren}</Text>
          <FriendshipStatusTag userId={userId} />
        </View>
      );
      console.log("[FriendsSince] ✅ Injected next to 'Member Since'");
    } else {
      console.warn("[FriendsSince] ⚠️ Couldn't find 'Member Since' line.");
    }

    return ret;
  });
};

export const onUnload = () => {
  console.log("[FriendsSince] 🔴 Unloading plugin...");
  unpatch?.();
};
