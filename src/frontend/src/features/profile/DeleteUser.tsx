import { useState } from "react";
import { SubmitPropertyChangeYesNo } from "./Submit";
import { IUser } from "../../shared/types/user";
import { useUserService } from "../../components/providers/User";
import { useNavigate } from "react-router-dom";
import { HOME_NAVIGATION } from "../../shared/constants/navigation";

export function DeleteUser({ user }: { user: IUser }) {
    const navigate = useNavigate();
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
            navigate(HOME_NAVIGATION);
        } catch (error) {
            console.error("Error deleting Account:", error);
            alert("Deleting account failed");
        }
    }
    return (
        <SubmitPropertyChangeYesNo props={{ title: 'Delete User', handleDropDown, showDropdown, yes: requestDelete, no: handleDropDown }} />
    )
}
