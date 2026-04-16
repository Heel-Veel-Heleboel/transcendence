// INFO: according to https://docs.colyseus.io/room#table-of-websocket-close-codes
// 3000-3999 are customizable for client
// 4011-4999 are customizable for server

export const closeCodes = {
  NORMAL_CLOSURE: 1000, //        Normal WebSocket closure
  GOING_AWAY: 1001, //            Browser/tab closing
  NO_STATUS_RECEIVED: 1005, //    No status in close frame
  ABNORMAL_CLOSURE: 1006, //      Connection closed unexpectedly
  FAILED_TO_JOIN: 3000, //        Client failed to join room
  CONSENTED: 4000, //             Client left with consent (room.leave())
  SERVER_SHUTDOWN: 4001, //       Server graceful shutdown (production)
  WITH_ERROR: 4002, //            Closed due to an error
  FAILED_TO_RECONNECT: 4003, //   All reconnection attempts failed
  MAY_TRY_RECONNECT: 4010, //     Server shutdown in dev mode (allows reconnect)
  FAILED_TO_FINISH: 4011, //       Server failed to send match result
  CLIENT_GAME_CRASH: 4012 //      One of the clients had a game crash caused by internal code
};
