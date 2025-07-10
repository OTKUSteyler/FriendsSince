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

const ReviewSection = ({ userId }: { userId: string }) => {
  const status = getRelationshipStatus(userId);
  return (
    <View style={{ padding: 10 }}>
      <Text style={{ color: "white" }}>User ID: {userId}</Text>
      <Text style={{ color: "gray" }}>Status: {status}</Text>
    </View>
  );
};

function dumpComponentNames() {
  try {
    const allModules = Object.values(getModule(m => m?.default?.displayName));
    console.log("[FriendsSince] Dumping possible component names:");
    allModules.forEach((m: any) => {
      const name = m?.default?.displayName || m?.default?.name || m?.displayName || "Unknown";
      if (name !== "Unknown") console.log("➤", name);
    });
  } catch (e) {
    console.warn("[FriendsSince] Couldn't dump component names:", e);
  }
}

export const onLoad = () => {
  console.log("[FriendsSince] 🟢 Loading plugin...");

  // Dump components to help debugging
  dumpComponentNames();

  const Component =
    findByName("SimplifiedUserProfileContent", false) ||
    findByName("UserProfile", false) ||
    findByName("UserProfileWrapper", false);

  if (!Component) {
    console.error("[FriendsSince] ❌ Component not found. Tried multiple options.");
    return;
  }

  console.log("[FriendsSince] ✅ Component found:", Component?.name || Component?.displayName || "Unnamed");

  try {
    unpatch = after("type", Component, (args, ret) => {
      const userId = args?.[0]?.user?.id;
      console.log("[FriendsSince] Hooked userId:", userId);

      const section = findInReactTree(ret, (x) =>
        x?.type?.displayName === "View" &&
        Array.isArray(x?.props?.children) &&
        x.props.children.some(
          (i) => i?.type?.name === "SimplifiedUserProfileAboutMeCard"
        )
      );

      if (!section) {
        console.warn("[FriendsSince] ⚠️ Profile section not found.");
      } else if (!userId) {
        console.warn("[FriendsSince] ⚠️ User ID missing.");
      } else {
        section.props.children.push(<ReviewSection userId={userId} />);
        console.log("[FriendsSince] ✅ ReviewSection injected.");
      }

      return ret;
    });
  } catch (err) {
    console.error("[FriendsSince] ❌ Failed to hook component:", err);
  }
};

export const onUnload = () => {
  console.log("[FriendsSince] 🔴 Unloading plugin...");
  unpatch?.();
};
