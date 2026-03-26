import { Route, Routes, useLocation } from 'react-router-dom'
import { useLayoutEffect } from 'react';
import { Game } from '../pages/Game.tsx'
import { Menu } from '../pages/Menu.tsx'
import { StartMenu } from '../pages/StartMenu.tsx'
import { AuthProvider } from '../components/providers/Auth.tsx';
import { RoomProvider } from '../components/providers/Room.tsx';
import { CONFIG } from '../constants/AppConfig.ts';
import { ErrorBoundary } from 'react-error-boundary';
import { GeneralErrorFallback } from '../components/errors/GeneralErrorFallBack.tsx';
import { Profile } from '../pages/Profile.tsx';
import { Tournament } from '../pages/Tournament.tsx';
import { VisitorProfile } from '../pages/VisitorProfile.tsx';
import { Relationships } from '../pages/Relationships.tsx';

/* v8 ignore start */
export const Router = () => {
    const location = useLocation();
    const currentLocation = location.pathname.split("/")[1];
    useLayoutEffect(() => {
        let name;
        if (typeof currentLocation[0] === 'undefined') {
            name = 'Start Menu';
        } else {
            name = `${currentLocation[0].toUpperCase()}${currentLocation.slice(1,)}`
        }
        document.title = `Transcendance | ${name}`
    }, [])

    return (
        <ErrorBoundary FallbackComponent={GeneralErrorFallback} >
            <AuthProvider>

                <RoomProvider>
                    <Routes>
                        <Route path={CONFIG.START_MENU_NAVIGATION} element={<StartMenu />} />
                        <Route path={CONFIG.MENU_NAVIGATION} element={<Menu />} />
                        <Route path={CONFIG.USER_PROFILE_NAVIGATION} element={<Profile />} />
                        <Route path={CONFIG.USER_RELATIONSHIPS_NAVIGATION} element={<Relationships />} />
                        <Route path={CONFIG.VISITOR_PROFILE_NAVIGATION} element={<VisitorProfile />} />
                        <Route path={CONFIG.TOURNAMENT_NAVIGATION} element={<Tournament />} />
                        <Route path={CONFIG.GAME_NAVIGATION} element={<Game />} />
                    </Routes>
                </RoomProvider>

            </AuthProvider>
        </ErrorBoundary >
    )
}
/* v8 ignore stop */
