import { BaseSyntheticEvent, JSX, useState } from "react";
import { getCookie } from "../../components/utils/cookies";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { DisplayedProfileProperty } from "./ProfileProperty";
import { SubmitPropertyChange } from "./Submit";

export function Email({ email }: { email: string | undefined }) {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleChange() {
        setShowDropDown(!showDropdown);
    }
    return (
        <DisplayedProfileProperty title="Email" property={email} dropDown={ChangeEmail(handleChange)} toggleDropDown={handleChange} showDropdown={showDropdown} />
    )
}

function ChangeEmail(resetState: () => void): JSX.Element {
    const [input, setInput] = useState<string>();

    async function handleChange(event: BaseSyntheticEvent) {
        setInput(event.target.value);
    };

    async function handleSubmit(event: BaseSyntheticEvent) {
        event.preventDefault();

        if (!input) {
            alert("Please give a email!");
            return;
        }
        await requestChange();
    };

    async function requestChange() {
        try {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            await api({
                url: CONFIG.REQUEST_PROFILE_CHANGE_EMAIL,
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify({ user_id: Number(user_id), user_email: input }),
            })
            resetState();
            alert("Email changed!");
        } catch (error) {
            console.error("Error changing Email:", error);
            alert("Email change failed");
        }
    }
    return (SubmitPropertyChange(handleChange, handleSubmit, 'Change Email'));
}
