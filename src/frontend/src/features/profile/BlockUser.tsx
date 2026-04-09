import { useState } from "react";
import { IFriendship } from "../../shared/types/friendship";
import { SubmitPropertyChangeYesNo } from "./Submit";
import { useUserService } from "../../components/providers/User";

export function BlockUser({ friendship }: { friendship: IFriendship }) {
    const service = useUserService();
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleDropDown() {
        setShowDropDown(!showDropdown);
    }
    async function requestUnblock() {
        try {
            await service.setFriendshipStatus({ id: String(friendship.id), status: 'PENDING' })
            handleDropDown();
            alert("unblocked user!");
        } catch (error) {
            console.error("Error unblocking Account:", error);
            alert("unblocking account failed");
        }
    }

    async function requestBlock() {
        try {
            await service.setFriendshipStatus({ id: String(friendship.id), status: 'BLOCKED' })
            handleDropDown();
            alert("blocked user!");
        } catch (error) {
            console.error("Error blocking Account:", error);
            alert("blocking account failed");
        }
    }

    return (
        <div id="block-user">
            {friendship && friendship?.status === 'BLOCKED' ?
                <SubmitPropertyChangeYesNo props={{ title: 'Unblock User', handleDropDown: handleDropDown, showDropdown: showDropdown, yes: requestUnblock, no: handleDropDown }} /> :
                <SubmitPropertyChangeYesNo props={{ title: 'Block User', handleDropDown: handleDropDown, showDropdown: showDropdown, yes: requestBlock, no: handleDropDown }} />
            }
        </div>
    )

}
