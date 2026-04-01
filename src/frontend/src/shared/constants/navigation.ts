export const START_MENU_NAVIGATION = '/';
export const CREDITS_NAVIGATION = '/credits';
export const ENTRY_NAVIGATION = '/entry';
export const REGISTER_NAVIGATION = '/entry/register';
export const LOGIN_NAVIGATION = '/entry/login';
export const HOME_NAVIGATION = '/home';
export const USER_PROFILE_NAVIGATION = '/profile/me';
export const USER_RELATIONSHIPS_NAVIGATION = '/profile/me/relationships';
export const VISITOR_PROFILE_NAVIGATION = '/profile/:userId';
export const GAME_NAVIGATION = '/game/:gameMode/:matchId/:roomId';
export const TOURNAMENT_NAVIGATION = '/tournament/:tournamentId';
export const TOURNAMENT_NAVIGATION_REDIRECT = (tournamentId: string) => {
  return `/tournament/${tournamentId}`;
};
export const QUIT_REDIRECT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
