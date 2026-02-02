import { Route, Routes, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react';
import { Game } from '../pages/Game.tsx'
import { Menu } from '../pages/Menu.tsx'
import { StartMenu } from '../pages/StartMenu.tsx'
import { AuthProvider } from '../components/Auth.tsx';

/* v8 ignore start */
export const Router = () => {
    const [hydrated, setHydrated] = useState(false);
    const location = useLocation();
    const currentLocation = location.pathname.split("/")[1];
    useEffect(() => {
        setHydrated(true);
        let name;
        if (currentLocation[0] === undefined) {
            name = 'Start Menu';
        } else {
            name = `${currentLocation[0].toUpperCase()}${currentLocation.slice(1,)}`
        }
        document.title = `Transcendance | ${name}`
    }, [])

    if (!hydrated) {
        return null;
    }
    return (
        <AuthProvider>
            <Routes>

                <Route path="/" element={<StartMenu />} />
                <Route path="/game" element={<Game />} />
                <Route path="/menu" element={<Menu />} />

            </Routes>
        </AuthProvider>
    )
}
/* v8 ignore stop */
