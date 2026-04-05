import {
    createContext,
    useContext,
    useLayoutEffect,
    useState,
    ReactNode,
    JSX,
    useEffect
} from 'react'
import { useNavigate } from 'react-router-dom';
import api from '../../shared/api/api.ts';
import { IAuthContext, IChangePassword, ICredentials, ILogin } from '../../shared/types/auth.ts';
import { AuthService } from '../../shared/api/auth.ts';
import { START_MENU_NAVIGATION } from '../../shared/constants/navigation.ts';
import useUserId from '../hooks/useUserid.tsx';

const service = new AuthService();
const failedToken = '';
const AuthContext = createContext<IAuthContext | undefined>(undefined);

export function useAuth() {
    const authContext = useContext(AuthContext);

    if (authContext === undefined) {
        throw new Error('useAuth has to be used within AuthProvider');
    }

    return authContext;
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
    const [token, setToken] = useState<string>('');
    const [retry, setRetry] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { userId, setUserId, removeUserId } = useUserId();
    const navigate = useNavigate();


    async function register(data: ICredentials) {
        try {
            await service.register(data);
        } catch (e: any) {
            console.error(e)
            // TODO: error handling
        }
    }

    async function logIn(data: ILogin) {
        try {
            const response = await service.login(data);
            console.log(response);
            const accessToken = response.data.access_token;
            const userId = response.data.id;
            setToken(accessToken);
            setUserId(userId);
            setIsAuthenticated(true);
        } catch (e: any) {
            console.error(e)
            setToken(failedToken);
            throw e
            // TODO: error handling
        }
    }

    async function logOut() {
        try {
            const response = await service.logout({ user_id: userId })
            if (response.status === 204) {
                gotoLogin();
            } else {
                throw new Error(`${response.status}`);
            }
        } catch (e: any) {
            console.error(e);
            // TODO: error handling
        }
    }

    async function refresh() {
        try {
            setIsLoading(true);
            const response = await service.refresh({ user_id: userId })
            console.log(response.data.access_token)
            setToken(response.data.access_token);
            setIsAuthenticated(true);
            setIsLoading(false);
        } catch (e: any) {
            console.error(e);
            // TODO: error handling
            failedAuthentication();
        }
    }

    async function changePassword(data: IChangePassword) {
        try {
            const response = await service.changePassword(data)
            if (response.status === 204) {
                gotoLogin();
            } else {
                throw new Error(`${response.status}`);
            }
        } catch (e: any) {
            console.error(e);
            // TODO: error handling
        }
    }

    function gotoLogin() {
        removeUserId();
        setToken('');
        navigate(START_MENU_NAVIGATION);
    }

    useLayoutEffect(() => {
        const authInterceptor = api.interceptors.request.use((config) => {
            config.headers.Authorization = token ? `Bearer ${token}` : config.headers.Authorization;
            return (config);
        })

        return function cleanup() {
            api.interceptors.request.eject(authInterceptor);
        };
    }, [token]);

    useLayoutEffect(() => {
        const refreshIntercept = api.interceptors.response.use((config) => {
            return config;
        }, async (error) => {
            if (error.response?.status === 403) {
                if (retry) {
                    setRetry(false);
                    return Promise.reject(error);
                }
                setRetry(true);
                refresh();
                return api(error.config);
            }
            return Promise.reject(error);
        });

        return function cleanup() {
            api.interceptors.request.eject(refreshIntercept);
        };
    }, [token]);

    function failedAuthentication() {
        setIsAuthenticated(false);
        setIsLoading(false);
        setUserId('');
        setToken(failedToken)
    }

    useEffect(() => {
        async function autoLogin() {
            if (!userId) {
                failedAuthentication();
            } else if (userId && !token) {
                await refresh();
            }
        }
        autoLogin();
    }, [token])



    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, userId, token, register, logIn, logOut, refresh, changePassword }} >
            {children}
        </ AuthContext.Provider>
    )
}

