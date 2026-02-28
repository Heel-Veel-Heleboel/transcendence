import { Route, Routes, useLocation } from 'react-router-dom'
import { useState, useLayoutEffect } from 'react';
import { Game } from '../pages/Game.tsx'
import { Menu } from '../pages/Menu.tsx'
import { StartMenu } from '../pages/StartMenu.tsx'
import { AuthProvider } from '../components/providers/Auth.tsx';
import { RoomProvider } from '../components/providers/Room.tsx';
import { CONFIG } from '../constants/AppConfig.ts';

/* v8 ignore start */
export const Router = () => {
    const [hydrated, setHydrated] = useState(false);
    const location = useLocation();
    const currentLocation = location.pathname.split("/")[1];
    useLayoutEffect(() => {
        setHydrated(true);
        let name;
        if (typeof currentLocation[0] === 'undefined') {
            name = 'Start Menu';
        } else {
            name = `${currentLocation[0].toUpperCase()}${currentLocation.slice(1,)}`
        }
        document.title = `Transcendance | ${name}`
    }, [])

    if (hydrated === false) {
        return null;
    }
    return (
        <AuthProvider>
            <RoomProvider>
                <Routes>

                    <Route path={CONFIG.START_MENU_NAVIGATION} element={<StartMenu />} />
                    <Route path={CONFIG.MENU_NAVIGATION} element={<Menu />} />
                    <Route path={CONFIG.GAME_NAVIGATION} element={<Game />} />
                </Routes>
            </RoomProvider>
        </AuthProvider>
    )
}
/* v8 ignore stop */
