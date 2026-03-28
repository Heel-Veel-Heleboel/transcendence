import { Route, Routes, useLocation } from 'react-router-dom'
import { useLayoutEffect } from 'react';
import { Game } from '../pages/Game.tsx'
import { Home } from '../pages/Home.tsx'
import { Login } from '../pages/Login.tsx'
import { AuthProvider } from '../components/providers/Auth.tsx';
import { RoomProvider } from '../components/providers/Room.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import { Profile } from '../pages/Profile.tsx';
import { Tournament } from '../pages/Tournament.tsx';
import { VisitorProfile } from '../pages/VisitorProfile.tsx';
import { Relationships } from '../pages/Relationships.tsx';
import { CONFIG } from '../shared/config/AppConfig.ts';
import { GeneralErrorFallback } from '../features/errors/GeneralErrorFallBack.tsx';

/* v8 ignore start */
export function App() {
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
                        <Route path={CONFIG.START_MENU_NAVIGATION} element={<Login />} />
                        <Route path={CONFIG.MENU_NAVIGATION} element={<Home />} />
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
