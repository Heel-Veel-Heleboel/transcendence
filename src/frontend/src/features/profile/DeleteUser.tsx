import { useState } from "react";
import { SubmitPropertyChangeYesNo } from "./Submit";
import { useUserService } from "../../components/providers/User";
import { useAuth } from "../../components/providers/Auth";

export function DeleteUser() {
    const auth = useAuth();
    const userService = useUserService();
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleDropDown() {
        setShowDropDown(!showDropdown);
    }

    async function requestDelete() {
        try {
            await userService.deleteUser();
            handleDropDown();
            alert("Deleted account!");
            try { await auth.refresh(); } catch { }
        } catch (error) {
            console.error("Error deleting Account:", error);
            alert("Deleting account failed");
        }
    }
    return (
        <SubmitPropertyChangeYesNo props={{ title: 'Delete User', handleDropDown, showDropdown, yes: requestDelete, no: handleDropDown }} />
    )
}
