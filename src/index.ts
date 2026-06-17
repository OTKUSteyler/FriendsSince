import { findByStoreName, findByName } from "@vendetta/metro";
import { after, unpatchAll } from "@vendetta/patcher";
import { FluxDispatcher } from "@vendetta/metro/common";

const RelationshipStore = findByStoreName("RelationshipStore");
const SelectedGuildStore = findByStoreName("SelectedGuildStore");
const GuildMemberStore = findByStoreName("GuildMemberStore");
const { getSince, isFriend } = RelationshipStore;

const BioText = findByName("BioText", false);


interface CachedData {
    joinedAt?: number; 
}

const cache = new Map<string, Map<string, CachedData>>();

function cacheData(guildId: string, userId: string, patch: Partial<CachedData>) {
    if (!cache.has(guildId)) cache.set(guildId, new Map());
    const scope = cache.get(guildId)!;
    scope.set(userId, { ...(scope.get(userId) ?? {}), ...patch });
}

function getCached(guildId: string, userId: string): CachedData | undefined {
    return cache.get(guildId)?.get(userId);
}


function snowflakeToMs(id: string): number {
    return Number(BigInt(id) >> 22n) + 1420070400000;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}


let pendingMember: string | null = null;
let forceUpdateCallback: (() => void) | null = null;


function onGuildMembersChunk(data: any) {
    const guildId = String(data.guild_id);
    for (const member of data.members ?? []) {
        const userId = String(member.user?.id);
        const joinedAt = member.joined_at
            ? new Date(member.joined_at).getTime()
            : -1;
        cacheData(guildId, userId, { joinedAt });
        if (pendingMember === userId && forceUpdateCallback) {
            pendingMember = null;
            const cb = forceUpdateCallback;
            forceUpdateCallback = null;
            cb();
        }
    }
}

FluxDispatcher.subscribe("GUILD_MEMBERS_CHUNK", onGuildMembersChunk);


function requestGuildMember(guildId: string, userId: string, onDone: () => void) {
    if (pendingMember === userId) return;

    const existing = GuildMemberStore.getMember(guildId, userId);
    if (existing?.joinedAt) {
        cacheData(guildId, userId, { joinedAt: new Date(existing.joinedAt).getTime() });
        onDone();
        return;
    }

    pendingMember = userId;
    forceUpdateCallback = onDone;
    FluxDispatcher.dispatch({
        type: "GUILD_MEMBERS_REQUEST",
        guildIds: [guildId],
        userIds: [userId],
    });
}


function appendTo(res: any, text: string) {
    const children = res.props.children;
    if (typeof children === "string") {
        res.props.children += text;
    } else if (Array.isArray(children)) {
        children.push(text);
    } else if (children != null) {
        res.props.children = [children, text];
    } else {
        res.props.children = text;
    }
}

function alreadyContains(res: any, text: string): boolean {
    const children = res.props.children;
    const str = Array.isArray(children)
        ? children.join("")
        : typeof children === "string"
        ? children
        : "";
    return str.includes(text);
}


after("default", BioText, ([props], res, instance) => {
    if (!res?.props || !props.userId) return res;

    const userId = String(props.userId);
    const guildId = String(SelectedGuildStore.getGuildId() ?? "0");
    const inGuild = guildId !== "0";

    if (isFriend(userId)) {
        const since = getSince(userId);
        if (since) {
            const friendLine = `\n\nFriends since: ${formatDate(since)}`;
            if (!alreadyContains(res, "Friends since:")) {
                appendTo(res, friendLine);
            }
        }
    }

    if (inGuild) {
        const cached = getCached(guildId, userId);

        if (cached?.joinedAt !== undefined) {
            
            const memberLine = cached.joinedAt === -1
                ? "\n\nMember since: -"
                : `\n\nMember since: ${formatDate(cached.joinedAt)}`;

            if (!alreadyContains(res, "Member since:")) {
                appendTo(res, memberLine);
            }
        } else {
            const rerender = () => instance?.forceUpdate?.();
            requestGuildMember(guildId, userId, rerender);

            if (!alreadyContains(res, "Member since:")) {
                appendTo(res, "\n\nMember since: …");
            }
        }
    }

    return res;
});


export const onUnload = () => {
    FluxDispatcher.unsubscribe("GUILD_MEMBERS_CHUNK", onGuildMembersChunk);
    unpatchAll();
    cache.clear();
};
