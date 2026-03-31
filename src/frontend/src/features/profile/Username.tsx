import { BaseSyntheticEvent, useState } from "react";
import { DisplayedProfileProperty } from "./ProfileProperty";
import { SubmitPropertyChange } from "./Submit";
import { IUser } from "../../shared/types/user";
import { useUserService } from "../../components/providers/User";
import useAxios from "axios-hooks";

export function Username({ user }: { user: IUser }) {
    const userService = useUserService();
    const [, patchName] = useAxios(userService.patchUsername());
    const [showDropdown, setShowDropDown] = useState<boolean>(false);
    const [input, setInput] = useState<string>();

    function handleDropdown() {
        setShowDropDown(!showDropdown);
    }

    async function handleInput(event: BaseSyntheticEvent) {
        setInput(event.target.value);
    };

    async function handleSubmit(event: BaseSyntheticEvent) {
        event.preventDefault();

        if (!input) {
            alert("Please give a Username!");
            return;
        }
        await requestChange();
    };

    async function requestChange() {
        try {
            await patchName({
                data: JSON.stringify({ user_id: user.id, user_name: input }),
            })
            handleDropdown();
            alert("Username changed!");
        } catch (error) {
            console.error("Error changing Username:", error);
            alert("Username change failed");
        }
    }
    return (
        <DisplayedProfileProperty title="Username" property={user.name} toggleDropDown={handleDropdown} showDropdown={showDropdown} >
            <SubmitPropertyChange handleChange={handleInput} handleSubmit={handleSubmit} buttonText={'Change Username'} />
        </DisplayedProfileProperty >
    )
}

