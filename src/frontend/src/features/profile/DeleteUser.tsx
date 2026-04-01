import { useState } from "react";
import { SubmitPropertyChangeYesNo } from "./Submit";
import { IUser } from "../../shared/types/user";
import { useUserService } from "../../components/providers/User";
import { useAuth } from "../../components/providers/Auth";

export function DeleteUser({ user }: { user: IUser }) {
    const auth = useAuth();
    const userService = useUserService();
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleDropDown() {
        setShowDropDown(!showDropdown);
    }

    async function requestDelete() {
        try {
            await userService.deleteUser({
                data: JSON.stringify({ user_id: Number(user.id) })
            });
            handleDropDown();
            alert("Deleted account!");
            auth.gotoLogin();
        } catch (error) {
            console.error("Error deleting Account:", error);
            alert("Deleting account failed");
        }
    }
    return (
        <SubmitPropertyChangeYesNo props={{ title: 'Delete User', handleDropDown, showDropdown, yes: requestDelete, no: handleDropDown }} />
    )
}
