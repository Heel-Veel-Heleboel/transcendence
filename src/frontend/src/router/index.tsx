import { Route, Routes, useLocation } from 'react-router-dom'
import { useState, useEffect, useLayoutEffect } from 'react';
import { Game } from '../pages/Game.tsx'
import { Menu } from '../pages/Menu.tsx'
import { StartMenu } from '../pages/StartMenu.tsx'
import { AuthProvider } from '../components/Auth.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
})

/* v8 ignore start */
export const Router = () => {
    const [hydrated, setHydrated] = useState(false);
    const location = useLocation();
    const currentLocation = location.pathname.split("/")[1];
    useLayoutEffect(() => {
        setHydrated(true);
        let name;
        if (currentLocation[0] === undefined) {
            name = 'Start Menu';
        } else {
            name = `${currentLocation[0].toUpperCase()}${currentLocation.slice(1,)}`
        }
        document.title = `Transcendance | ${name}`
    }, [])
    console.log('herein router');

    if (hydrated === false) {
        return null;
    }
    console.log('hereafter router');
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Routes>

                    <Route path="/" element={<StartMenu />} />
                    <Route path="/game" element={<Game />} />
                    <Route path="/menu" element={<Menu />} />

                </Routes>
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider >
    )
}
/* v8 ignore stop */
