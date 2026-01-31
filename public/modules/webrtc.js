import * as state from "./state.js"
import * as ui from "./ui.js"
import * as ws from "./ws.js"
let pc

let dataChannel

let remoteIceCandidates = []

let localStream

let webRTCConfigurations

export async function fetchwebRTCConfigurations() {
  try {
    const res = await fetch("/ice-config", { method: "GET" })
    webRTCConfigurations = await res.json()
  } catch (error) {
    console.log("Error fetching webRTC configurations")
    ui.logToCustomConsole("Error fetching webRTC configurations")
  }
}

export async function startWebRTCProcess(isOfferer, remoteOffer = null) {
  let offer
  let answer
  ui.logToCustomConsole("Starting WebRTC connection establishment")
  createRTCPeerConnection()
  console.log("local session description: ", pc.localDescription)
  if (isOfferer) {
    createDataChannel(isOfferer)
  }
  await startCamera()

  if (isOfferer) {
    offer = await pc.createOffer()
    ui.logToCustomConsole("successfully created the offer")
    console.log("Created the offer: ", offer)

    await pc.setLocalDescription(offer)
    ui.logToCustomConsole("attached the offer to the peer connection object")

    console.log("updated local description: ", pc.localDescription)

    ws.sendOffer(offer)
  } else {
    if (!remoteOffer) {
      console.log("Remote offer missing")
      return
    }
    await pc.setRemoteDescription(remoteOffer)
    if (remoteIceCandidates.length != 0) {
      for (const candidate of remoteIceCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
      console.log("Added remote ice candidates")
      ui.logToCustomConsole("added remote ice candidates")
      remoteIceCandidates = []
    }
    ui.logToCustomConsole("attached the remote offer to the remote description")
    console.log("updated remote description: ", pc.remoteDescription)
    answer = await pc.createAnswer()
    ui.logToCustomConsole("Successfully created the answer")
    console.log("Answer generated: ", answer)
    await pc.setLocalDescription(answer)
    ui.logToCustomConsole("attached the answer to the local description")
    console.log("updated local description: ", pc.localDescription)
    ws.sendAnswer(answer)
  }
}

export async function processRemoteIceCandidates(candidate) {
  if (pc.remoteDescription) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (error) {
      console.log("Error trying to add ice candidates to the pc object")
    }
  } else {
    remoteIceCandidates.push(candidate)
  }
}

export async function processAnswer(answer) {
  await pc.setRemoteDescription(answer)
  ui.logToCustomConsole("attached the answer to remote description")
  if (remoteIceCandidates.length != 0) {
    for (const candidate of remoteIceCandidates) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
    ui.logToCustomConsole("added the remote ice candidates")
    remoteIceCandidates = []
  }
}

async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  })
  ui.DOM.localVideo.srcObject = localStream
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream)
  })
}

function createDataChannel(isOfferer) {
  if (!isOfferer) return

  dataChannel = pc.createDataChannel("chat-room")
  registerDataTransferEventListeners()
  ui.logToCustomConsole("Data channel created")
}

function registerDataTransferEventListeners() {
  dataChannel.addEventListener("message", (e) => {
    console.log(e.data)
    ui.addIncomingMessageToUi(e.data)
  })

  dataChannel.addEventListener("close", (e) => {
    console.log("data channel has been closed")
  })

  dataChannel.addEventListener("open", (e) => {
    console.log("data channel has been opened")
  })
}

export function createRTCPeerConnection() {
  pc = new RTCPeerConnection(webRTCConfigurations)

  pc.addEventListener("connectionstatechange", (e) => {
    console.log("connection state change detected: ", pc.connectionState)
    ui.logToCustomConsole(`Connection state changed to: ${pc.connectionState}`)
    if (pc.connectionState === "connected") {
      ui.updateUiForConnectedState()
    }
    if (pc.connectionState === "disconnected") {
      closePeerConnection()
    }
  })

  pc.ondatachannel = (e) => {
    console.log("📡 DataChannel received")
    dataChannel = e.channel
    registerDataTransferEventListeners()
  }

  pc.addEventListener("signalingstatechange", (e) => {
    console.log("signaling state change detected: ", pc.signalingState)
    ui.logToCustomConsole("signaling state changed to: ", pc.signalingState)
  })

  pc.ontrack = (e) => {
    ui.DOM.remoteVideo.srcObject = e.streams[0]
  }

  pc.addEventListener("icecandidate", (e) => {
    ui.logToCustomConsole("ice agent has generated an ice candidate")
    if (e.candidate) {
      console.log("ICE: ", e.candidate)
      ws.sendIceCandidate(e.candidate)
    }
  })
}

export async function sendMessageViaDataChannel(message) {
  console.log("📤 sending:", message, dataChannel.readyState)
  await dataChannel.send(message)
}

export function closePeerConnection() {
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      track.stop()
    })
    localStream = null
  }

  if (dataChannel) {
    dataChannel.close()
    dataChannel = null
  }

  if (pc) {
    pc.close()
    pc = null
  }
}
