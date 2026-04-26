import { BaseSyntheticEvent, useState } from "react";
import { DisplayedProfileProperty } from "./ProfileProperty";
import { SubmitPropertyChange } from "./Submit";
import { IUser } from "../../shared/types/user";
import { useUserService } from "../../components/providers/User";
import { extractApiError } from "../../shared/utils/error";

export function Username({ user, onUpdate }: { user: IUser, onUpdate: () => void }) {
    const userService = useUserService();
    const [showDropdown, setShowDropDown] = useState<boolean>(false);
    const [input, setInput] = useState<string>('');

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
            await userService.setUsername(input)
            handleDropdown();
            onUpdate();
            alert("Username changed!");
        } catch (error) {
            console.error("Error changing Username:", error);
            alert(`Username change failed: ${extractApiError(error)}`);
        }
    }
    return (
        <DisplayedProfileProperty title="Username" property={user.name} toggleDropDown={handleDropdown} showDropdown={showDropdown} >
            <SubmitPropertyChange props={{ handleChange: handleInput, handleSubmit, buttonText: 'Change Username' }} />
        </DisplayedProfileProperty >
    )
}

