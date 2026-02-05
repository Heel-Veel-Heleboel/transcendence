import axios from 'axios';
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
import { CONFIG } from '../constants/AppConfig';
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
    const [user, setUser] = useState<number>(0);
    const navigate = useNavigate();
    const isFetching = useRef(false);

    useEffect(() => {
        async function fetchAccess() {
            try {
                console.log('trying to refresh');
                refresh();
            } catch {
                gotoLogin();
            }
        }

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

    async function register(credentials: ICredentials) {
        try {
            const response = await axios({
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
            const response = await axios({
                url: CONFIG.REQUEST_SIGNIN,
                method: CONFIG.REQUEST_SIGNIN_METHOD,
                headers: CONFIG.REQUEST_SIGNIN_HEADERS,
                data: JSON.stringify({ email: credentials.email, username: credentials.username, password: credentials.password }),
            })
            setUser(response.data.id);
            setToken(response.data.access_token);
            // createCookie('user_id', response.data.id, 7);
            console.log(response);
        } catch (e: any) {
            throw new Error(`unknown error: ${e.message}`);
        }
    }

    async function logOut() {
        try {
            const response = await axios({
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
            const usr = getCookie('user_id');
            if (!usr) {
                throw new Error('No user logged in');
            }
            console.log(usr);
            const response = await axios({
                url: CONFIG.REQUEST_REFRESH,
                method: CONFIG.REQUEST_REFRESH_METHOD,
                headers: CONFIG.REQUEST_REFRESH_HEADERS,
                data: JSON.stringify({ user_id: usr }),
            })
            setToken(response.data.accessToken);
            console.log('succesfull refresh');
        } catch (e: any) {
            console.error(e);
            setToken(null);
        } finally {
            isFetching.current = false;
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

