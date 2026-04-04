import {
    createContext,
    useRef,
    useContext,
    useLayoutEffect,
    useState,
    ReactNode,
    JSX
} from 'react'
import { useNavigate } from 'react-router-dom';
import api from '../../shared/api/api.ts';
import { IAuthContext, ICredentials } from '../../shared/types/auth.ts';
import { AuthService } from '../../shared/api/auth.ts';
import { UseAxios } from 'axios-hooks';
import { START_MENU_NAVIGATION } from '../../shared/constants/navigation.ts';
import { AxiosRequestConfig } from 'axios';
import useUserId from '../hooks/useUserid.tsx';

const instance = new AuthService();
const AuthContext = createContext<IAuthContext | undefined>(undefined);

export function useAuth() {
    const authContext = useContext(AuthContext);

    if (authContext === undefined) {
        throw new Error('useAuth has to be used within AuthProvider');
    }

    return authContext;
}

export function AuthProvider({ useAxios, children }: { useAxios: UseAxios, children: ReactNode }): JSX.Element {
    const isFetching = useRef(false);
    const [token, setToken] = useState<string>('');
    const { userId, setUserId, removeUserId } = useUserId();
    const navigate = useNavigate();
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
    const [, postRefresh] = useAxios(
        instance.postRefresh(),
        { manual: true }
    );
    const [, exePutPassword] = useAxios(
        instance.putPassword(),
        { manual: true }
    );

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
            setToken(accessToken);
            setUserId(userId);
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
                gotoLogin();
            } else {
                throw new Error(`${response.status}`);
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
            const response = await postRefresh({
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
            const response = await exePutPassword(config)
            if (response.status === 204) {
                gotoLogin();
            } else {
                throw new Error(`${response.status}`);
            }
        } catch (e: any) {
            console.error(e);
            // TODO: error handling
            throw e
        }
    }

    function gotoLogin() {
        removeUserId();
        setToken('');
        navigate(START_MENU_NAVIGATION);
    }

    useLayoutEffect(() => {
        async function exeRefresh() {
            await refresh();
        }

        exeRefresh();
    }, [])

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

    return (
        <AuthContext.Provider value={{ IsAuthenticated: !!token, userId, token, register, logIn, logOut, refresh, putPassword }} >
            {children}
        </ AuthContext.Provider>
    )
}

