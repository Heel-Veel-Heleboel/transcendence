import axios from 'axios';
import {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useState,
    ReactNode,
    JSX
} from 'react'
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../constants/AppConfig';

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
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export function useAuth() {
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error('useAuth has to be used within AuthProvider');
    }

    return authContext;
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<number>(0);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchAccess() {
            try {
                refresh();
            } catch {
                setToken(null);
                navigate('/');
            }
        }

        // NOTE: needs to be with await or not?
        fetchAccess();
    }, []);

    useLayoutEffect(() => {
        const authInterceptor = axios.interceptors.request.use((config) => {
            config.headers.Authorization = token ? `Bearer ${token}` : config.headers.Authorization;
            return (config);
        })

        return function cleanup() {
            axios.interceptors.request.eject(authInterceptor);
        };
    }, [token]);

    //TODO: fix looping issue
    useLayoutEffect(() => {
        const refreshInterceptor = axios.interceptors.response.use((response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (
                    // TODO: change to actual unauthorized error status
                    error.response.status === 500
                ) {
                    try {
                        refresh();

                        // NOTE: following two lines could be removed, as setToken sets token anyway for request interceptor to be used
                        // originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                        // originalRequest._retry = true;
                        return axios(originalRequest);
                    } catch {
                        setToken(null);
                        navigate('/');
                    }
                }

                return Promise.reject(error);
            }
        )
        return function cleanup() {
            axios.interceptors.request.eject(refreshInterceptor);
        };
    }, []);

    async function register(credentials: ICredentials) {
        try {
            const response = await axios({
                url: CONFIG.REQUEST_REGISTER,
                method: CONFIG.REQUEST_REGISTER_METHOD,
                headers: CONFIG.REQUEST_REGISTER_HEADERS,
                data: JSON.stringify({ email: credentials.email, user_name: credentials.username, password: credentials.password }),
            })
            // if (response.status !== 201) {
            //     throw new Error(`Response status: ${response.status}`);
            // }
            console.log(response);
        } catch (error: any) {
            if (error.message === '500') {
                throw new Error("credentials are already used");
            }
            throw new Error(`unknown error with status code: ${error.message}`)
        }
    }

    async function logIn(credentials: ICredentials) {
        try {
            const response = await axios({
                url: CONFIG.REQUEST_SIGNIN,
                method: CONFIG.REQUEST_SIGNIN_METHOD,
                headers: CONFIG.REQUEST_SIGNIN_HEADERS,
                data: JSON.stringify({ email: credentials.email, username: credentials.username, password: credentials.password }),
            })
            // if (response.status !== 200) {
            //     throw new Error(`Response status: ${response.status}`);
            // }
            console.log(response);
            // TODO: delete when refresh_token is implemented as http-only from auth server
            setUser(response.data.id);
            setToken(response.data.access_token);
            createCookie("refresh_token", response.data.refresh_token, 7);
        } catch (error: any) {
            throw new Error(`unknown error with status code: ${error.message}`)
        }
    }

    async function logOut() {
        try {
            const response = await axios({
                url: CONFIG.REQUEST_LOGOUT,
                method: CONFIG.REQUEST_LOGOUT_METHOD,
                headers: CONFIG.REQUEST_LOGOUT_HEADERS,
                // TODO: delete refresh_token once http-only is implemented
                data: JSON.stringify({ user_id: user, refresh_token: getCookie('refresh_token') }),
            })
            if (response.status === 204) {
                navigate('/');
            }
            else {
                throw new Error(`Response status: ${response.status}`);
            }
            console.log(response);
        } catch (error: any) {
            throw new Error(`unknown error with status code: ${error.message}`)
        }
    }

    async function refresh() {
        try {
            const response = await axios({
                url: CONFIG.REQUEST_REFRESH,
                method: CONFIG.REQUEST_REFRESH_METHOD,
                headers: CONFIG.REQUEST_REFRESH_HEADERS,
                // TODO: delete refresh_token once http-only is implemented
                data: JSON.stringify({ user_id: user, refresh_token: getCookie('refresh_token') }),
            })
            if (response.status === 500) {
                throw new Error(`Response status: ${response.status}`);
            }
            setToken(response.data.accessToken);
            console.log(response);
        } catch (error: any) {
            navigate('/');
            throw new Error(`unknown error with status code: ${error.message}`)
        }
    }

    return (
        <AuthContext.Provider value={{ token, register, logIn, logOut }}>
            {children}
        </AuthContext.Provider>
    )
}


// TODO: delete when refresh_token is implemented as http-only from auth server
function createCookie(name: string, value: string, days: number) {
    let expires;
    if (days) {
        let date = new Date();
        date.setDate(date.getDate() + days);
        expires = "; expires=" + date;
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name: string): string {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return "";
}
