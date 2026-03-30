import { BaseSyntheticEvent, JSX, useState } from "react";
import api from "../../shared/api/api";
import { getCookie } from "../../shared/utils/cookies";
import { CONFIG } from "../../shared/config/AppConfig";
import { DisplayedProfileProperty } from "./ProfileProperty";
import { SubmitPropertyChange } from "./Submit";
import { IApiResult } from "../../shared/types/api";
import { ResponseValues } from "axios-hooks";

export function Username({ userResult }: { userResult: ResponseValues<any, any, any> }) {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);
    console.log('data');
    console.log(userResult);

    function handleChange() {
        setShowDropDown(!showDropdown);
    }
    if (userResult.loading) {
        <div>loading...</div>
    }
    if (userResult.data) {
        <div>error...</div>
    }
    return (
        <DisplayedProfileProperty title="Username" property={'lol'} dropDown={ChangeUserName(handleChange)} toggleDropDown={handleChange} showDropdown={showDropdown} />
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
