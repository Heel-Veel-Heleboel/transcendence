import axios from 'axios';
import {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useState,
    JSX
} from 'react'

const AuthContext = createContext(undefined);

export function useAuth() {
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error('useAuth has to be used within AuthProvider');
    }

    return authContext;
}

export function AuthProvider({ children }: { children: JSX.Element }) {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAccess() {
            try {
                // NOTE: check how we will check if user is already logged in in or not
                // const response = await fetch("get/user")
                // if (!response.ok) {
                //     throw new Error(`Response status: ${response.status}`);
                // }
                // const result = await response.json();
                // setToken(result.accessToken);
            } catch {
                setToken(null);
            }
        }

        // NOTE: needs to be with await or not?
        fetchAccess();
    }, []);

    useLayoutEffect(() => {
        const authInterceptor = axios.interceptors.request.use((config) => {
            config.headers.Authorization = !config._retry && token ? `Bearer ${token}` : config.headers.Authorization;
            return (config);
        })

        return function cleanup() {
            axios.interceptors.request.eject(authInterceptor);
        };
    }, [token]);

    useLayoutEffect(() => {
        const refreshInterceptor = axios.interceptors.response.use((response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (
                    // TODO: change to actual unauthorized error status
                    error.response.status === 404
                ) {
                    try {
                        const response = await axios.get('get/refreshtoken');
                        setToken(response.data.accessToken);

                        // NOTE: following two lines could be removed, as setToken sets token anyway for request interceptor to be used
                        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                        originalRequest._retry = true;
                        return axios(originalRequest);
                    } catch {
                        setToken(null);
                    }
                }

                return Promise.reject(error);
            }
        )
        return function cleanup() {
            axios.interceptors.request.eject(refreshInterceptor);
        };
    }, []);
}


