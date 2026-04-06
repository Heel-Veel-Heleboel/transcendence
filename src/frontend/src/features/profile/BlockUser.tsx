import { useState } from "react";
import api from "../../shared/api/api";
import { CONFIG } from "../../shared/config/AppConfig";
import { IFriendship } from "../../shared/types/friendship";
import { SubmitPropertyChangeYesNo } from "./Submit";

export function BlockUser({ friendship }: { friendship: IFriendship | null }) {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleDropDown() {
        setShowDropDown(!showDropdown);
    }
    async function requestUnblock() {
        try {
            await api({
                url: CONFIG.REQUEST_FRIEND_UPDATE,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ id: friendship?.id, status: 'PENDING' }),
            })
            handleDropDown();
            alert("unblocked user!");
        } catch (error) {
            console.error("Error unblocking Account:", error);
            alert("unblocking account failed");
        }
    }

    async function requestBlock() {
        try {
            await api({
                url: CONFIG.REQUEST_FRIEND_UPDATE,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ id: friendship?.id, status: 'BLOCKED' }),
            })
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
                <SubmitPropertyChangeYesNo title='Unblock User' handleDropDown={handleDropDown} showDropdown={showDropdown} yes={requestUnblock} no={handleDropDown} /> :
                <SubmitPropertyChangeYesNo title='Block User' handleDropDown={handleDropDown} showDropdown={showDropdown} yes={requestBlock} no={handleDropDown} />
            }
        </div>
    )

}
