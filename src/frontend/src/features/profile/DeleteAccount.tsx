import { useState } from "react";
import { useAuth } from "../../components/providers/Auth";
import { getCookie } from "../../components/utils/cookies";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";


export function DeleteAccount() {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);
    const auth = useAuth();

    function handleDropDown() {
        setShowDropDown(!showDropdown);
    }

    async function requestDelete() {
        try {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            await api({
                url: CONFIG.REQUEST_PROFILE_DELETE,
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify({ user_id: Number(user_id) }),
            })
            handleDropDown();
            alert("Deleted account!");
            auth.gotoLogin();
        } catch (error) {
            console.error("Error deleting Account:", error);
            alert("Deleting account failed");
        }
    }
    return (
        <div id="delete-account">
            <div className="flex flex-col">
                <div className="w-full">
                    <button onClick={handleDropDown}>Delete User</button>
                </div>
            </div>
            {
                showDropdown &&
                <div className="w-full border flex py-2">
                    <div className="w-2/5">
                        <span>Are you sure?: </span>
                    </div>
                    <div className="flex w-3/5">
                        <button className="border w-1/2" onClick={requestDelete}>Yes</button>
                        <button className="border w-1/2" onClick={handleDropDown}>No</button>
                    </div>
                </div>
            }
        </div>
    )
}
