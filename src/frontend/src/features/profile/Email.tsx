import { BaseSyntheticEvent, useState } from "react";
import { DisplayedProfileProperty } from "./ProfileProperty";
import { SubmitPropertyChange } from "./Submit";
import { IUser } from "../../shared/types/user";
import { useUserService } from "../../components/providers/User";

export function Email({ user }: { user: IUser }) {
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
            alert("Please give a Email!");
            return;
        }
        await requestChange();
    };

    async function requestChange() {
        try {
            await userService.setEmail(input)
            handleDropdown();
            alert("Email changed!");
        } catch (error) {
            console.error("Error changing Email:", error);
            alert("Email change failed");
        }
    }
    return (
        <DisplayedProfileProperty title="Email" property={user.email} toggleDropDown={handleDropdown} showDropdown={showDropdown} >
            <SubmitPropertyChange props={{ handleChange: handleInput, handleSubmit, buttonText: 'Change Email' }} />
        </DisplayedProfileProperty >
    )
}


