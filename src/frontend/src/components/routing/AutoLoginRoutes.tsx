
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/Auth"
import { HOME_NAVIGATION, LOGIN_NAVIGATION } from "../../shared/constants/navigation";
import { useEffect } from "react";
import useUserId from "../hooks/useUserid";

export function AutoLogin() {
    const auth = useAuth();
    const userId = useUserId();
    console.log('in auto login');

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
