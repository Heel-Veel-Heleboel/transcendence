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
import { CONFIG } from '../constants/AppConfig';
import { useNavigate } from 'react-router-dom';
import api from './Api';
import { getCookie, createCookie } from '../utils/cookies';

interface ICredentials {
    email: string;
    username: string;
    password: string;
}

interface IAuthContext {
    token: string | null;
    register: Function;
    logIn: Function;
    logOut: Function;
    refresh: Function;
    gotoLogin: Function;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export function useAuth() {
    const authContext = useContext(AuthContext);

    if (authContext === undefined) {
        throw new Error('useAuth has to be used within AuthProvider');
    }

    return authContext;
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
    const [token, setToken] = useState<string | null>(null);
    const navigate = useNavigate();
    const isFetching = useRef(false);

    useEffect(() => {
        async function fetchAccess() {
            refreshAttempt();
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
                refreshAttempt();
                // TODO: check if followinf if statement works when access_token is actually implemented
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

    async function register(credentials: ICredentials) {
        try {
            const response = await api({
                url: CONFIG.REQUEST_REGISTER,
                method: CONFIG.REQUEST_REGISTER_METHOD,
                headers: CONFIG.REQUEST_REGISTER_HEADERS,
                data: JSON.stringify({ email: credentials.email, user_name: credentials.username, password: credentials.password }),
            })
        } catch (e: any) {
            if (e.response.status === CONFIG.REQUEST_REGISTER_CREDENTIALS_TAKEN) {
                throw new Error("credentials are already in use");
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
            setToken(response.data.access_token);
            createCookie('user_id', response.data.id, 7);
            console.log(response);
        } catch (e: any) {
            throw new Error(`unknown error: ${e.message}`);
        }
    }

    async function logOut() {
        try {
            const user = getCookie('user_id');
            const response = await api({
                url: CONFIG.REQUEST_LOGOUT,
                method: CONFIG.REQUEST_LOGOUT_METHOD,
                headers: CONFIG.REQUEST_LOGOUT_HEADERS,
                data: JSON.stringify({ user_id: user }),
            })
            if (response.status === CONFIG.REQUEST_LOGOUT_SUCCESFULL) {
                createCookie('user_id', '', -1);
                gotoLogin();
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
            const user = getCookie('user_id');
            if (!user) {
                throw new Error('No user logged in');
            }
            const response = await api({
                url: CONFIG.REQUEST_REFRESH,
                method: CONFIG.REQUEST_REFRESH_METHOD,
                headers: CONFIG.REQUEST_REFRESH_HEADERS,
                data: JSON.stringify({ user_id: user }),
            })
            setToken(response.data.access_token);
            console.log('succesfull refresh');
        } catch (e: any) {
            console.error(e);
            setToken(null);
        } finally {
            isFetching.current = false;
        }
    }

    function refreshAttempt() {
        try {
            console.log('trying to refresh');
            refresh();
        } catch {
            gotoLogin();
        }
    }

    function gotoLogin() {
        setToken(null);
        navigate('/');
    }

    return (
        <AuthContext.Provider value={{ token, register, logIn, logOut, refresh, gotoLogin }} >
            {children}
        </ AuthContext.Provider>
    )
}

