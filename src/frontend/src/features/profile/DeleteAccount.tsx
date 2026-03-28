import { useState } from "react";
import { useAuth } from "../../components/providers/Auth";
import api from "../../shared/api/api";
import { getCookie } from "../../shared/utils/cookies";
import { CONFIG } from "../../shared/config/AppConfig";
import { SubmitPropertyChangeYesNo } from "./Submit";


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
        <SubmitPropertyChangeYesNo title='Delete User' handleDropDown={handleDropDown} showDropdown={showDropdown} yes={requestDelete} no={handleDropDown} />
    )
}
