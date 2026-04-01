import { BaseSyntheticEvent, useState } from "react";
import { IUser } from "../../shared/types/user";
import { SubmitPropertyChangeOldNew } from "./Submit";
import { HiddenProfileProperty } from "./ProfileProperty";
import { useAuth } from "../../components/providers/Auth";

export function Password({ user }: { user: IUser }) {
    const auth = useAuth();
    const [showDropdown, setShowDropDown] = useState<boolean>(false);
    const [currentPassword, setOldPassword] = useState<string>();
    const [newPassword, setNewPassword] = useState<string>();

    async function handleChangeOld(event: BaseSyntheticEvent) {
        setOldPassword(event.target.value);
    };

    async function handleChangeNew(event: BaseSyntheticEvent) {
        setNewPassword(event.target.value);
    };

    function handleDropdown() {
        setShowDropDown(!showDropdown);
    }


    async function handleSubmit(event: BaseSyntheticEvent) {
        event.preventDefault();

        if (!currentPassword) {
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
            await auth.putPassword({
                data: JSON.stringify({ user_id: user.id, current_password: currentPassword, new_password: newPassword }),
            })
            handleDropdown();
            alert("Password changed!");
        } catch (error) {
            console.error("Error changing Password:", error);
            alert("Password change failed");
        }
    }
    return (
        <HiddenProfileProperty title="Password" toggleDropDown={handleDropdown} showDropdown={showDropdown} >
            <SubmitPropertyChangeOldNew props={{ handleChangeOld, handleChangeNew, handleSubmit, buttonText: 'Change Password' }} />
        </HiddenProfileProperty >
    )
}


