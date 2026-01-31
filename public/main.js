import * as ui from "./modules/ui.js"
import * as ws from "./modules/ws.js"
import * as ajax from "./modules/ajax.js"
import * as state from "./modules/state.js"
import * as rtc from "./modules/webrtc.js"

const userId = Math.round(Math.random() * 1000000)

ui.initializeUi(userId)

const protocol = location.protocol === "https:" ? "wss" : "ws"
const wsUrl = `${protocol}://${location.host}/?userId=${userId}`

const wsClientConnection = new WebSocket(wsUrl)

ws.registerSocketEvents(wsClientConnection)

await rtc.fetchwebRTCConfigurations()

ui.DOM.createRoomButton.addEventListener("click", (e) => {
  const roomName = ui.DOM.inputRoomNameElement.value
  if (!roomName) {
    return alert("Your room needs a name")
  }
  ui.logToCustomConsole(
    `WS server is checking whether room ${roomName} is available...`,
  )
  ajax.createRoom(roomName, userId)
})

ui.DOM.destroyRoomButton.addEventListener("click", (e) => {
  ajax.destroyRoom()
})

ui.DOM.joinRoomButton.addEventListener("click", (e) => {
  const roomName = ui.DOM.inputRoomNameElement.value
  if (!roomName) {
    return alert("Enter the room name to join a room")
  }
  ws.joinRoom(roomName, userId)
})

ui.DOM.exitButton.addEventListener("click", (e) => {
  const roomName = state.getState().roomName
  ui.destroyerToProceedToRoom()
  ws.exitRoom(roomName, userId)
  rtc.closePeerConnection()
  ui.logToCustomConsole("You have left the room")
})
