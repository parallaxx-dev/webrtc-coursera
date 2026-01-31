import * as state from "./state.js"
import * as ui from "./ui.js"
import * as constants from "./constants.js"
import * as rtc from "./webrtc.js"

export function registerSocketEvents(wsClientConnection) {
  state.setWsConnection(wsClientConnection)

  wsClientConnection.onopen = () => {
    ui.logToCustomConsole("You have connected with our websocket server")

    wsClientConnection.onmessage = handleMessage
    wsClientConnection.onclose = handleClose
    wsClientConnection.onerror = handleError
  }
}

function handleMessage(incomingMessageEventObject) {
  const message = JSON.parse(incomingMessageEventObject.data)

  switch (message.label) {
    case constants.labels.NORMAL_SERVER_PROCESS:
      normalServerProcess(message.data)
      break
    case constants.labels.WEBRTC_PROCESS:
      webrtcServerProcess(message.data)
      break
    default:
      console.log("Unknown server message label: ", message.label)
  }
}

function webrtcServerProcess(data) {
  switch (data.type) {
    case constants.type.WEBRTC.OFFER:
      handleOffer(data)
      break
    case constants.type.WEBRTC.ANSWER:
      handleAnswer(data)
      break
    case constants.type.WEBRTC.ICE_CANDIDATES:
      handleIceCandidates(data)
      break
    default:
      console.log("Unkown message type: ", data.type)
  }
}

export function handleIceCandidates(data) {
  console.log("Recieved ice candidate: ", data.candidate)
  ui.logToCustomConsole("Recieved ice candidates")
  rtc.processRemoteIceCandidates(data.candidate)
}

export function sendIceCandidate(candidate) {
  const candidateMessage = {
    label: constants.labels.WEBRTC_PROCESS,
    data: {
      type: constants.type.WEBRTC.ICE_CANDIDATES,
      candidate,
      otherUserId: state.getState().otherUserId,
    },
  }
  state
    .getState()
    .userWebSocketConnection.send(JSON.stringify(candidateMessage))
}

function handleAnswer(data) {
  console.log("Recieved the answer: ", data.answer)
  ui.logToCustomConsole("Recieved the answer")
  rtc.processAnswer(data.answer)
}

export function sendAnswer(answer) {
  const answerMessage = {
    label: constants.labels.WEBRTC_PROCESS,
    data: {
      answer,
      otherUserId: state.getState().otherUserId,
      type: constants.type.WEBRTC.ANSWER,
      roomName: state.getState().roomName,
    },
  }
  state.getState().userWebSocketConnection.send(JSON.stringify(answerMessage))
}

function handleOffer(data) {
  ui.logToCustomConsole("WebRTC offer has been recieved")
  console.log(data.offer)
  rtc.startWebRTCProcess(false, data.offer)
}

function normalServerProcess(data) {
  switch (data.type) {
    case constants.type.ROOM_JOIN.RESPONSE_SUCCESS:
      joinRoomSuccessHandler(data)
      break
    case constants.type.ROOM_JOIN.RESPONSE_FAILURE:
      ui.logToCustomConsole(data.message)
      break
    case constants.type.ROOM_JOIN.NOTIFY:
      joinNotificationHandler(data)
      break
    case constants.type.ROOM_EXIT.NOTIFY:
      exitNotificationHandler(data)
      break
    case constants.type.ROOM_DISONNECTION.NOTIFY:
      exitNotificationHandler(data)
      break
    default:
      console.log("Unknown server message type: ", data.type)
  }
}

export function sendOffer(offer) {
  const message = {
    label: constants.labels.WEBRTC_PROCESS,
    data: {
      type: constants.type.WEBRTC.OFFER,
      offer,
      otherUserId: state.getState().otherUserId,
      roomName: state.getState().roomName,
    },
  }
  state.getState().userWebSocketConnection.send(JSON.stringify(message))
  ui.logToCustomConsole("Offer has been sent")
}

export function exitNotificationHandler(data) {
  const { message, otherUserId } = data

  ui.logToCustomConsole(message)
  ui.updateUiForRemainingUser(otherUserId)
}

export function joinRoom(roomName, userId) {
  const message = {
    label: constants.labels.NORMAL_SERVER_PROCESS,
    data: {
      type: constants.type.ROOM_JOIN.REQUEST,
      roomName,
      userId,
    },
  }
  state.getState().userWebSocketConnection.send(JSON.stringify(message))
}

export function exitRoom(roomName, userId) {
  const exitMessage = {
    label: constants.labels.NORMAL_SERVER_PROCESS,
    data: {
      roomName,
      userId,
      type: constants.type.ROOM_EXIT.REQUEST,
    },
  }
  state.getState().userWebSocketConnection.send(JSON.stringify(exitMessage))
}

function joinNotificationHandler(data) {
  alert(`User ${data.joineeId} has joined the room`)
  ui.logToCustomConsole(data.message)
  ui.updateCreatorsRoom()
  state.setOtherUserId(data.joineeId)
}

function joinRoomSuccessHandler(data) {
  state.setOtherUserId(data.otherUserId)
  state.setRoom(data.roomName)
  ui.joineeToProceedToRoom()

  // we can start the webRTC connection establishment process
  rtc.startWebRTCProcess(true)
}

function handleClose() {
  ui.logToCustomConsole("You have been disconnected from our websocket server")
}

function handleError() {
  console.log("Something went wrong with the WS connection")
}
