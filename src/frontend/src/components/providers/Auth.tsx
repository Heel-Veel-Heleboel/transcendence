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
import { UseAxios } from 'axios-hooks';

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
    postRegister: () => instance.postRegister(),
}


export function AuthProvider({ useAxios, children }: { useAxios: UseAxios, children: ReactNode }): JSX.Element {
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>('');
    const [authService, setAuthService] = useState<IAuthService>(defaultAuthService)
    const navigate = useNavigate();
    const isFetching = useRef(false);
    const [registerResult, postRegister] = useAxios(
        instance.postRegister(),
        { manual: true }
    );
    const [loginResult, postLogIn] = useAxios(
        instance.postLogIn(),
        { manual: true }
    );

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
            await postRegister(
                {
                    data: JSON.stringify({ email: credentials.email, user_name: credentials.user_name, password: credentials.password }),
                }
            )
            return (registerResult);
        } catch (e: any) {
            console.error(e)
            return ({ data: undefined, loading: false, error: e });
        }
    }

    async function logIn(credentials: ICredentials) {
        try {
            const response = await postLogIn(
                {
                    data: JSON.stringify({ email: credentials.email, user_name: credentials.user_name, password: credentials.password }),
                }
            )
            const accessToken = response.data.access_token;
            const userId = response.data.id;
            setUser(accessToken, userId, 7)
            return ({ data: undefined, loading: loginResult.loading, error: loginResult.error })
        } catch (e: any) {
            console.error(e)
            return ({ data: undefined, loading: false, error: e });
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
                postRegister: () => instance.postRegister(),
            }
        )
    }, [userId])

    return (
        <AuthContext.Provider value={{ token, userId, register, logIn, logOut, refresh, gotoLogin, service: authService }} >
            {children}
        </ AuthContext.Provider>
    )
}

