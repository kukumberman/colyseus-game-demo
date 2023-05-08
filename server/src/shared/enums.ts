export enum MessageType {
  Ping = "ping",
  Pong = "pong",
  Input = "input",
  Rotation = "rotation",
  FetchConfig = "fetchConfig",
}

// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
// https://docs.colyseus.io/colyseus/server/room/#leavecode-number
export enum RoomLeaveCode {
  AbnormalClosure = 1006, // usually happens when server uses hot-reload
  MaxPingReached = 4001,
}
