import { Route, Routes, useLocation } from 'react-router-dom'
import { useLayoutEffect } from 'react';
import { Game } from '../pages/Game.tsx'
import { Home } from '../pages/Home.tsx'
import { StartMenu } from '../pages/StartMenu.tsx'
import { AuthProvider } from '../components/providers/Auth.tsx';
import { RoomProvider } from '../components/providers/Room.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import { Profile } from '../pages/Profile.tsx';
import { Tournament } from '../pages/Tournament.tsx';
import { VisitorProfile } from '../pages/VisitorProfile.tsx';
import { Relationships } from '../pages/Relationships.tsx';
import { GeneralErrorFallback } from '../features/errors/GeneralErrorFallBack.tsx';
import { UserProvider } from '../components/providers/User.tsx';
import { CREDITS_NAVIGATION, GAME_NAVIGATION, HOME_NAVIGATION, ENTRY_NAVIGATION, REGISTER_NAVIGATION, LOGIN_NAVIGATION, START_MENU_NAVIGATION, TOURNAMENT_NAVIGATION, USER_PROFILE_NAVIGATION, USER_RELATIONSHIPS_NAVIGATION, VISITOR_PROFILE_NAVIGATION } from '../shared/constants/navigation.ts';
import { Entry } from '../pages/Entry.tsx';
import { Register } from '../pages/Register.tsx';
import { Credits } from '../pages/Credits.tsx';
import { configureApi } from '../shared/api/configure.ts';
import api from '../shared/api/api.ts';
import { Login } from '../pages/Login.tsx';

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

    const useAxiosInstance = configureApi(api);

    return (
        <ErrorBoundary FallbackComponent={GeneralErrorFallback} >
            <AuthProvider useAxios={useAxiosInstance}>
                <UserProvider>
                    <RoomProvider>
                        <Routes>
                            <Route path={START_MENU_NAVIGATION} element={<StartMenu />} />
                            <Route path={ENTRY_NAVIGATION} element={<Entry />} />
                            <Route path={REGISTER_NAVIGATION} element={<Register />} />
                            <Route path={LOGIN_NAVIGATION} element={<Login />} />
                            <Route path={CREDITS_NAVIGATION} element={<Credits />} />
                            <Route path={HOME_NAVIGATION} element={<Home />} />
                            <Route path={USER_PROFILE_NAVIGATION} element={<Profile />} />
                            <Route path={USER_RELATIONSHIPS_NAVIGATION} element={<Relationships />} />
                            <Route path={VISITOR_PROFILE_NAVIGATION} element={<VisitorProfile />} />
                            <Route path={TOURNAMENT_NAVIGATION} element={<Tournament />} />
                            <Route path={GAME_NAVIGATION} element={<Game />} />
                        </Routes>
                    </RoomProvider>
                </UserProvider>
            </AuthProvider>
        </ErrorBoundary >
    )
}
/* v8 ignore stop */
