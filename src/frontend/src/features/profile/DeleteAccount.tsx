import { useState } from "react";
import { useAuth } from "../../components/providers/Auth";
import { SubmitPropertyChangeYesNo } from "./Submit";
import { IUser } from "../../shared/types/user";
import useAxios from "axios-hooks";

export function DeleteAccount({ user }: { user: IUser }) {
    const auth = useAuth();
    const [, deleteAccount] = useAxios(auth.service.deleteAccount(), { manual: true });
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleDropDown() {
        setShowDropDown(!showDropdown);
    }

    async function requestDelete() {
        try {
            await deleteAccount({
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
