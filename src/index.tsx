import { findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { React } from "@vendetta/metro/common";

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

function injectFriendStatusToMemberSince(ret: any, userId: string) {
  const memberSinceLine = findInReactTree(ret, (x) =>
    typeof x?.props?.children === "string" &&
    x?.props?.children.toLowerCase().includes("member since")
  );

  if (!memberSinceLine || !userId) {
    console.warn("[FriendsSince] ⚠️ Could not find 'Member Since' text or user ID missing.");
    return;
  }

  const originalText = memberSinceLine.props.children;
  const statusText = getRelationshipStatus(userId);

  memberSinceLine.type = View;
  memberSinceLine.props = {
    style: { flexDirection: "row", alignItems: "center", gap: 6 },
    children: [
      <Text style={{ color: "white" }}>{originalText}</Text>,
      <Text style={{ color: "gray" }}>| Status: {statusText}</Text>
    ]
  };

  console.log("[FriendsSince] ✅ Injected friendship status beside 'Member Since'");
}

export const onLoad = () => {
  console.log("[FriendsSince] 🟢 Loading plugin...");

  const ProfileComponent = findByName("UserProfile", false);

  if (!ProfileComponent) {
    console.error("[FriendsSince] ❌ UserProfile component not found.");
    return;
  }

  unpatch = after("type", ProfileComponent, (args, ret) => {
    const userId = args?.[0]?.user?.id;
    injectFriendStatusToMemberSince(ret, userId);
    return ret;
  });
};

export const onUnload = () => {
  console.log("[FriendsSince] 🔴 Unloading plugin...");
  unpatch?.();
};
