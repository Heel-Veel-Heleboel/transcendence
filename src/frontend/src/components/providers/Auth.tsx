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
import api from '../../shared/api/api.ts';
import { createCookie, getCookie } from '../../shared/utils/cookies.ts';
import { IAuthContext, ICredentials } from '../../shared/types/auth.ts';
import { AuthService } from '../../shared/api/auth.ts';
import { UseAxios } from 'axios-hooks';
import { START_MENU_NAVIGATION } from '../../shared/constants/navigation.ts';
import { AxiosRequestConfig } from 'axios';

const instance = new AuthService();
const AuthContext = createContext<IAuthContext | undefined>(undefined);

const userCookieName = 'user_id';

export function useAuth() {
    const authContext = useContext(AuthContext);

    if (authContext === undefined) {
        throw new Error('useAuth has to be used within AuthProvider');
    }

    return authContext;
}

export function AuthProvider({ useAxios, children }: { useAxios: UseAxios, children: ReactNode }): JSX.Element {
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>('');
    const navigate = useNavigate();
    const isFetching = useRef(false);
    const [, postRegister] = useAxios(
        instance.postRegister(),
        { manual: true }
    );
    const [, postLogIn] = useAxios(
        instance.postLogIn(),
        { manual: true }
    );
    const [, postLogOut] = useAxios(
        instance.postLogOut(),
        { manual: true }
    );
    const [, exePutPassword] = useAxios(
        instance.putPassword(),
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
        } catch (e: any) {
            console.error(e)
            // TODO: error handling
            throw e
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
        } catch (e: any) {
            console.error(e)
            // TODO: error handling
            throw e
        }
    }

    async function logOut() {
        try {
            const response = await postLogOut({
                data: JSON.stringify({ user_id: userId })
            })
            if (response.status === 204) {
                logOutUser();
            } else {
                throw new Error(` ${response.status}`);
            }
        } catch (e: any) {
            console.error(e);
            // TODO: error handling
            throw e
        }
    }

    async function refresh() {
        if (isFetching.current) return; // INFO: Prevent duplicate requests
        isFetching.current = true;
        try {
            const response = await postLogOut({
                data: JSON.stringify({ user_id: userId })
            })
            setToken(response.data.access_token);
        } catch (e: any) {
            console.error(e);
            // TODO: error handling
            gotoLogin();
            throw e
        } finally {
            isFetching.current = false;
        }
    }

    async function putPassword(config: AxiosRequestConfig) {
        try {
            const user = getUser();
            if (!user) {
                throw new Error('no user found');
            }
            const response = await exePutPassword(config)
            if (response.status === 204) {
                logOutUser();
            } else {
                throw new Error(` ${response.status}`);
            }
        } catch (e: any) {
            console.error(e);
            // TODO: error handling
            throw e
        }
    }


    function gotoLogin() {
        setToken(null);
        navigate(START_MENU_NAVIGATION);
    }

    return (
        <AuthContext.Provider value={{ token, userId, register, logIn, logOut, refresh, gotoLogin, putPassword }} >
            {children}
        </ AuthContext.Provider>
    )
}

