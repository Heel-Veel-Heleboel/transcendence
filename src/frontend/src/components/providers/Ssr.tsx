import { createContext, ReactNode, useContext, useEffect, useLayoutEffect, useState, } from 'react';
import { ISsrContext } from '../../shared/types/ssr';

const SsrContext = createContext<ISsrContext>({ userIdCookie: '' });

export function useSsr() { return useContext(SsrContext); }

export function SsrProvider({ userId, children }: { userId: string, children: ReactNode }) {
    const [userIdCookie, setUserIdCookie] = useState<string>('');

    useLayoutEffect(() => {
        if (typeof userId !== 'undefined') {
            setUserIdCookie(userId);
        }
    }, [])


    return (
        <SsrContext.Provider value={{
            userIdCookie: userIdCookie
        }}>
            {children}
        </SsrContext.Provider >
    );
}
