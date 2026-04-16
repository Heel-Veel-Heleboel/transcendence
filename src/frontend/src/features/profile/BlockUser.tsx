import { useState } from "react";
import { IFriendship } from "../../shared/types/friendship";
import { SubmitPropertyChangeYesNo } from "./Submit";
import { useUserService } from "../../components/providers/User";
import { useAuth } from "../../components/providers/Auth";

export function BlockUser({ friendship, userId, onRefresh }: { friendship: IFriendship | null, userId: string, onRefresh: () => void }) {
    const service = useUserService();
    const auth = useAuth();
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleDropDown() {
        setShowDropDown(!showDropdown);
    }

    async function requestUnblock() {
        try {
            await service.unblockUser({
                blocker_id: Number(auth.userId),
                blocked_id: Number(userId),
            });
            handleDropDown();
            onRefresh();
        } catch (error) {
            console.error("Error unblocking Account:", error);
            alert("unblocking account failed");
        }
    }

    async function requestBlock() {
        try {
            await service.blockUser({
                blocker_id: Number(auth.userId),
                blocked_id: Number(userId),
            });
            handleDropDown();
            onRefresh();
        } catch (error) {
            console.error("Error blocking Account:", error);
            alert("blocking account failed");
        }
    }

    // If blocked by this user (current user is the blocker), show unblock option
    if (friendship && friendship.status === 'BLOCKED' && friendship.isRequester) {
        return (
            <div id="block-user">
                <SubmitPropertyChangeYesNo props={{ title: 'Unblock User', handleDropDown: handleDropDown, showDropdown: showDropdown, yes: requestUnblock, no: handleDropDown }} />
            </div>
        );
    }

    // If we are the blocked party, show nothing (can't unblock yourself)
    if (friendship && friendship.status === 'BLOCKED' && !friendship.isRequester) {
        return null;
    }

    return (
        <div id="block-user">
            <SubmitPropertyChangeYesNo props={{ title: 'Block User', handleDropDown: handleDropDown, showDropdown: showDropdown, yes: requestBlock, no: handleDropDown }} />
        </div>
    );
}
