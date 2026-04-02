export const START_MENU_PAGE = '/';
export const ENTRY_PAGE = '/entry';
export const CREDITS_PAGE = '/credits';
export const REGISTER_PAGE = '/register';
export const LOGIN_PAGE = '/login';
export const HOME_PAGE = '/home';
export const PROFILE_PAGE = '/profile';
export const USER_PAGE = '/me';
export const RELATIONSHIPS_PAGE = '/relationships';
export const VISITOR_PAGE = '/:userId';
export const GAME_PAGE = '/game/:gameMode/:matchId/:roomId';
export const TOURNAMENT_BASE = '/tournament';
export const TOURNAMENT_PAGE = '/:tournamentId';

export const START_MENU_NAVIGATION = START_MENU_PAGE;
export const CREDITS_NAVIGATION = CREDITS_PAGE;
export const ENTRY_NAVIGATION = ENTRY_PAGE;
export const REGISTER_NAVIGATION = ENTRY_PAGE + REGISTER_PAGE;
export const LOGIN_NAVIGATION = ENTRY_PAGE + LOGIN_PAGE;
export const HOME_NAVIGATION = HOME_PAGE;
export const USER_NAVIGATION = PROFILE_PAGE + USER_PAGE;
export const RELATIONSHIPS_NAVIGATION =
  PROFILE_PAGE + USER_PAGE + RELATIONSHIPS_PAGE;
export const VISITOR_NAVIGATION = PROFILE_PAGE + VISITOR_PAGE;
export const GAME_NAVIGATION = GAME_PAGE;
export const TOURNAMENT_NAVIGATION = TOURNAMENT_BASE + TOURNAMENT_PAGE;
export const TOURNAMENT_NAVIGATION_REDIRECT = (tournamentId: string) => {
  return `${TOURNAMENT_BASE}/${tournamentId}`;
};
export const QUIT_REDIRECT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
