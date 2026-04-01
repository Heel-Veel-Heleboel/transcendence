import { BaseSyntheticEvent, useState } from "react";
import { IUser } from "../../shared/types/user";
import { useUserService } from "../../components/providers/User";
import useAxios from "axios-hooks";
import { SubmitPropertyChangeOldNew } from "./Submit";
import { HiddenProfileProperty } from "./ProfileProperty";

export function Password({ user }: { user: IUser }) {
    const userService = useUserService();
    const [, patchEmail] = useAxios(userService.patchEmail(), { manual: true });
    const [showDropdown, setShowDropDown] = useState<boolean>(false);
    const [oldPassword, setOldPassword] = useState<string>();
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
            await patchEmail({
                data: JSON.stringify({ user_id: user.id, user_email: oldPassword }),
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


