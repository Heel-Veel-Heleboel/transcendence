import {
    createContext,
    useRef,
    useContext,
    useEffect,
    useLayoutEffect,
    useState,
    ReactNode,
    JSX
} from 'react'
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../../shared/config/AppConfig.ts';
import api from '../../shared/api/api.ts';
import { createCookie, getCookie } from '../../shared/utils/cookies.ts';
import { ERRORS } from '../../shared/errors/Errors.ts';
import { IAuthContext, IAuthService, ICredentials } from '../../shared/types/auth.ts';
import { AuthService } from '../../shared/api/auth.ts';

const instance = new AuthService();
const AuthContext = createContext<IAuthContext | undefined>(undefined);

const userCookieName = 'user_id';

export function useAuth() {
    const authContext = useContext(AuthContext);

    if (authContext === undefined) {
        throw new Error(ERRORS.AUTH_INVALID_SCOPE);
    }

    return authContext;
}

const defaultAuthService = {
    putPassword: () => instance.putPassword(),
    deleteAccount: () => instance.deleteAccount()
}


export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>('');
    const [authService, setAuthService] = useState<IAuthService>(defaultAuthService)
    const navigate = useNavigate();
    const isFetching = useRef(false);

    useEffect(() => {
        async function fetchAccess() {
            refresh();
        }

        fetchAccess();
    }, []);

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
            if (error.response.status === 403) {
                refresh();
                // TODO: check if following if statement works when access_token is actually implemented
                if (token === null)
                    return Promise.reject(error);
                return api(error.config);
            }
            return Promise.reject(error);
        });

        return function cleanup() {
            api.interceptors.request.eject(refreshIntercept);
        };
    }, [token]);

    function setUser(accessToken: string | null, userId: string, expiration: number) {
        setToken(accessToken);
        setUserId(userId);
        createCookie(userCookieName, userId, expiration);
    }

    function getUser() {
        const cookie = getCookie(userCookieName);
        if (!cookie) {
            gotoLogin();
            return;
        }
        setUserId(cookie);
        return cookie;
    }

    function logOutUser() {
        setUser(null, '', -1);
        gotoLogin();
    }

    async function register(credentials: ICredentials) {
        try {
            await api({
                url: CONFIG.REQUEST_REGISTER,
                method: CONFIG.REQUEST_REGISTER_METHOD,
                headers: CONFIG.REQUEST_REGISTER_HEADERS,
                data: JSON.stringify({ email: credentials.email, user_name: credentials.username, password: credentials.password }),
            })
        } catch (e: any) {
            if (e.response.status === CONFIG.REQUEST_REGISTER_CREDENTIALS_TAKEN) {
                throw new Error(ERRORS.AUTH_CREDS_TAKEN);
            }
            throw new Error(`unknown error: ${e.message}`);
        }
    }

    async function logIn(credentials: ICredentials) {
        try {
            const response = await api({
                url: CONFIG.REQUEST_SIGNIN,
                method: CONFIG.REQUEST_SIGNIN_METHOD,
                headers: CONFIG.REQUEST_SIGNIN_HEADERS,
                data: JSON.stringify({ email: credentials.email, username: credentials.username, password: credentials.password }),
            })
            const accessToken = response.data.access_token;
            const userId = response.data.id;
            setUser(accessToken, userId, 7)
        } catch (e: any) {
            throw new Error(`unknown error: ${e.message}`);
        }
    }

    async function logOut() {
        try {
            const user = getUser();
            if (!user) {
                throw new Error('no user found');
            }
            const response = await api({
                url: CONFIG.REQUEST_LOGOUT,
                method: CONFIG.REQUEST_LOGOUT_METHOD,
                headers: CONFIG.REQUEST_LOGOUT_HEADERS,
                data: JSON.stringify({ user_id: user }),
            })
            if (response.status === CONFIG.REQUEST_LOGOUT_SUCCESFULL) {
                logOutUser();
            } else {
                throw new Error(`Response status: ${response.status}`);
            }
        } catch (e: any) {
            throw new Error(`unknown error: ${e.message}`);
        }
    }

    async function refresh() {
        if (isFetching.current) return; // Prevent duplicate requests
        isFetching.current = true;
        try {
            const user = getUser();
            if (!user) {
                throw new Error(ERRORS.AUTH_NO_USER);
            }
            const response = await api({
                url: CONFIG.REQUEST_REFRESH,
                method: CONFIG.REQUEST_REFRESH_METHOD,
                headers: CONFIG.REQUEST_REFRESH_HEADERS,
                data: JSON.stringify({ user_id: user }),
            })
            setToken(response.data.access_token);
        } catch (e: any) {
            console.error(e);
            gotoLogin();
        } finally {
            isFetching.current = false;
        }
    }


    function gotoLogin() {
        setToken(null);
        navigate(CONFIG.START_MENU_NAVIGATION);
    }

    useEffect(() => {
        setAuthService(
            {
                putPassword: () => instance.putPassword(),
                deleteAccount: () => instance.deleteAccount()
            }
        )
    }, [userId])

    return (
        <AuthContext.Provider value={{ token, userId, register, logIn, logOut, refresh, gotoLogin, service: authService }} >
            {children}
        </ AuthContext.Provider>
    )
}

