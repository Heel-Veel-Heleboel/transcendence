import { BaseSyntheticEvent, JSX, useState } from "react";
import { getCookie } from "../../components/utils/cookies";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { HiddenProfileProperty } from "./ProfileProperty";
import { SubmitPropertyChangeOldNew } from "./Submit";

export function Password() {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleChange() {
        setShowDropDown(!showDropdown);
    }
    return (
        <HiddenProfileProperty title="Change Password" dropDown={ChangePassword(handleChange)} toggleDropDown={handleChange} showDropdown={showDropdown} />
    )
}

function ChangePassword(resetState: () => void): JSX.Element {
    const [oldPassword, setOldPassword] = useState<string>();
    const [newPassword, setNewPassword] = useState<string>();

    async function handleChangeOld(event: BaseSyntheticEvent) {
        setOldPassword(event.target.value);
    };

    async function handleChangeNew(event: BaseSyntheticEvent) {
        setNewPassword(event.target.value);
    };


    async function handleSubmit(event: BaseSyntheticEvent) {
        event.preventDefault();

        if (!oldPassword) {
            alert("Please give your current password!");
            return;
        }
        if (!newPassword) {
            alert("Please give your new password!");
            return;
        }
        await requestChange();
    };

    async function requestChange() {
        try {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            await api({
                url: CONFIG.REQUEST_PROFILE_CHANGE_PASSWORD,
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify({ user_id: Number(user_id), current_password: oldPassword, new_password: newPassword }),
            })
            resetState();
            alert("Password changed!");
        } catch (error) {
            console.error("Error changing Password:", error);
            alert("Password change failed");
        }
    }
    return (SubmitPropertyChangeOldNew(handleChangeOld, handleChangeNew, handleSubmit, 'Change Password'));
}
