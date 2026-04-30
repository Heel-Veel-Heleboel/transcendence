
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/Auth"
import { HOME_NAVIGATION } from "../../shared/constants/navigation";
import { useEffect } from "react";
import useUserId from "../hooks/useUserid";

export function AutoLogin() {
    const auth = useAuth();
    const userId = useUserId();

    if (!userId) {
        return (
            <Outlet />
        )
    }

    useEffect(() => { }, [auth.isAuthenticated]);

    return (
        auth.isAuthenticated ? <Navigate to={HOME_NAVIGATION} /> : auth.isLoading ? <div><h1>attempting auto-login</h1></div> : <Outlet />
    )
}
