import { BaseSyntheticEvent, JSX, useState } from "react";
import { getCookie } from "../../components/utils/cookies";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { DisplayedProfileProperty } from "./ProfileProperty";
import { SubmitPropertyChange } from "./Submit";

export function Username({ username }: { username: string | undefined }) {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleChange() {
        setShowDropDown(!showDropdown);
    }
    return (
        <DisplayedProfileProperty title="Username" property={username} dropDown={ChangeUserName(handleChange)} toggleDropDown={handleChange} showDropdown={showDropdown} />
    )
}

function ChangeUserName(resetState: () => void): JSX.Element {
    const [input, setInput] = useState<string>();

    async function handleChange(event: BaseSyntheticEvent) {
        setInput(event.target.value);
    };


    async function handleSubmit(event: BaseSyntheticEvent) {
        event.preventDefault();

        if (!input) {
            alert("Please give a username!");
            return;
        }

        await requestChange();
    };

    async function requestChange() {
        try {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            await api({
                url: CONFIG.REQUEST_PROFILE_CHANGE_USERNAME,
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify({ user_id: Number(user_id), user_name: input }),
            })
            resetState();
            alert("Username changed!");
        } catch (error) {
            console.error("Error changing UserName:", error);
            alert("Username change failed");
        }
    }
    return (SubmitPropertyChange(handleChange, handleSubmit, 'Change Username'));
}
