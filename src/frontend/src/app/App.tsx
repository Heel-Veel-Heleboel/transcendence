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
import { GAME_NAVIGATION, ENTRY_PAGE, REGISTER_PAGE, LOGIN_PAGE, START_MENU_PAGE, CREDITS_PAGE, HOME_PAGE, PROFILE_PAGE, USER_PAGE, RELATIONSHIPS_PAGE, VISITOR_PAGE, TOURNAMENT_BASE, TOURNAMENT_PAGE, TWO_FACTOR_PAGE, TOURNAMENT_CREATION_PAGE } from '../shared/constants/navigation.ts';
import { Entry } from '../pages/Entry.tsx';
import { Register } from '../pages/Register.tsx';
import { Credits } from '../pages/Credits.tsx';
import { Login } from '../pages/Login.tsx';
import { NotFound } from '../features/errors/NotFound.tsx';
import { PrivateRoutes } from '../components/routing/PrivateRoutes.tsx';
import { AutoLogin } from '../components/routing/AutoLoginRoutes.tsx';
import { UserProvider } from '../components/providers/User.tsx';
import { TwoFactorLogin } from '../pages/TwoFactorLogin.tsx';
import { TournamentCreation } from '../pages/TournamentCreation.tsx';
import { MatchProvider } from '../components/providers/Match.tsx';

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
            <AuthProvider >
                <UserProvider>
                    <MatchProvider>
                        <RoomProvider>
                            <Routes>
                                <Route element={<AutoLogin />}>
                                    <Route path={START_MENU_PAGE} element={<StartMenu />} />
                                    <Route path={ENTRY_PAGE}  >
                                        <Route index element={<Entry />} />
                                        <Route path={REGISTER_PAGE} element={<Register />} />
                                        <Route path={LOGIN_PAGE} element={<Login />} />
                                        <Route path={TWO_FACTOR_PAGE} element={<TwoFactorLogin />} />
                                    </Route   >
                                </Route>
                                <Route path={CREDITS_PAGE} element={<Credits />} />
                                <Route element={<PrivateRoutes />}>
                                    <Route path={HOME_PAGE} element={<Home />} />
                                    <Route path={PROFILE_PAGE} >
                                        <Route path={USER_PAGE} element={<Profile />} >
                                            <Route path={RELATIONSHIPS_PAGE} element={<Relationships />} />
                                        </Route>
                                        <Route path={VISITOR_PAGE} element={<VisitorProfile />} />
                                    </Route >
                                    <Route path={TOURNAMENT_BASE} element={<Tournament />} >
                                        <Route path={TOURNAMENT_PAGE} element={<Tournament />} />
                                        <Route path={TOURNAMENT_CREATION_PAGE} element={<TournamentCreation />} />
                                    </Route  >
                                    <Route path={GAME_NAVIGATION} element={<Game />} />
                                </Route>
                                <Route path={'*'} element={<NotFound />} />
                            </Routes>
                        </RoomProvider>
                    </MatchProvider>
                </UserProvider>

            </AuthProvider>
        </ErrorBoundary >
    )
}
/* v8 ignore stop */
