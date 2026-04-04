import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/Auth"
import { LOGIN_NAVIGATION } from "../../shared/constants/navigation";
import useUserId from "../hooks/useUserid";
import { useEffect } from "react";

export function PrivateRoutes() {
    const auth = useAuth();
    console.log('isAuthenticated');
    console.log(auth.isAuthenticated);

    useEffect(() => { }, [auth.isAuthenticated]);

    return (
        auth.isAuthenticated ? <Outlet /> : auth.isLoading ? <div><h1>loading</h1></div> : <Navigate to={LOGIN_NAVIGATION} />
    )
}
