export const CONFIG = Object.create({
  // DefaultStartMenu
  MENU_OPTION_LOGIN_TEXT: 'LOGIN',
  MENU_OPTION_CREDITS_TEXT: 'CREDITS',
  MENU_OPTION_QUIT_TEXT: 'QUIT',
  MENU_OPTION_MARGIN: 10,
  QUIT_REDIRECT: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',

  // LiveChat
  LIVE_CHAT_LOGO: 'beehive.png', // accreditation: <a href="https://www.flaticon.com/free-icons/hive" title="hive icons">Hive icons created by gravisio - Flaticon</a>
  LIVE_CHAT_TITLE: 'UrlChat',
  LIVE_CHAT_ROOMS_TITLE: 'Rooms',
  LIVE_CHAT_CHAT_TITLE: 'Chat',
  LIVE_CHAT_USERS_TITLE: 'Users',

  // TitleBar
  MINIMIZE_LOGO: 'minimize.png', // accreditation: <a href="https://www.flaticon.com/free-icons/minus-button" title="minus button icons">Minus button icons created by Circlon Tech - Flaticon</a>
  MINIMIZE_ALT: 'minimize',
  MAXIMIZE_LOGO: 'maximize.png', // accreditation: <a href="https://www.flaticon.com/free-icons/maximize" title="maximize icons">Maximize icons created by Ranah Pixel Studio - Flaticon</a>
  MAXIMIZE_ALT: 'maximize',
  CLOSE_LOGO: 'close.png', // accreditation: <a href="https://www.flaticon.com/free-icons/close" title="close icons">Close icons created by Pixel perfect - Flaticon</a>
  CLOSE_ALT: 'close',

  // GamesAvailable
  GAMES_QUICK_PLAY_TITLE: 'Quick Play',
  GAMES_DEFAULT_PLAY_TITLE: 'Default',
  GAMES_CUSTOM_PLAY_TITLE: 'Customized',

  // LOGIN PAGE
  LOGIN_PAGE_LOGO: 'logo.png',
  LOGIN_PAGE_ALT: 'Login Page Logo',

  // ToolBar / Widgets
  PROFILE_LOGO: 'profile.png',
  PROFILE_TITLE: 'profile',
  SETTINGS_LOGO: 'settings.png',
  SETTINGS_TITLE: 'settings',
  LOGOUT_LOGO: 'logout.png',
  DEFAULT_LOCALE: 'en-GB',
  MATCHMAKING_TITLE: 'speedmatching',
  MATCHMAKING_LOGO: 'speedmatching.png', // <a href="https://www.flaticon.com/free-icons/matchmaker" title="matchmaker icons">Matchmaker icons created by Smashicons - Flaticon</a>
  TOURNAMENT_TITLE: 'gymkhana',
  TOURNAMENT_LOGO: 'gymkhana.png',
  NEOFETCH_TITLE: 'trinityfetch',
  NEOFETCH_LOGO: 'trinityfetch.png', // <a href="https://www.flaticon.com/free-icons/crocodile" title="crocodile icons">Crocodile icons created by Freepik - Flaticon</a>
  MUSICPLAYER_TITLE: 'mtvx',
  MUSICPLAYER_LOGO: 'mtvx.png', // <a href="https://www.flaticon.com/free-icons/vinyl" title="vinyl icons">Vinyl icons created by Roundicons - Flaticon</a>

  // URLs
  REQUEST_SIGNIN: 'http://localhost:3000/api/auth/login',
  REQUEST_SIGNIN_METHOD: 'POST',
  REQUEST_SIGNIN_HEADERS: {
    'Content-Type': 'application/json'
  },
  REQUEST_REGISTER: 'http://localhost:3000/api/auth/register',
  REQUEST_REGISTER_METHOD: 'POST',
  REQUEST_REGISTER_HEADERS: {
    'Content-Type': 'application/json'
  }
});
