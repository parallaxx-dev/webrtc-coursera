import * as ui from "./ui.js"
import * as state from "./state.js"
import * as constants from "./constants.js"

export async function createRoom(roomName, userId) {
  try {
    const response = await fetch("/create-room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomName, userId }),
    })

    const res = await response.json()
    if (res.data.type === constants.type.ROOM_CHECK.RESPONSE_FAILURE) {
      ui.logToCustomConsole(res.data.message)
    }

    if (res.data.type === constants.type.ROOM_CHECK.RESPONSE_SUCCESS) {
      state.setRoom(roomName)
      ui.logToCustomConsole("Room Created")
      ui.logToCustomConsole("Waiting for other peer")
      ui.creatorToProceedToRoom()
    }
  } catch (error) {
    console.log("Error occured while creating the room")
    ui.logToCustomConsole("Something went wrong while creating the room")
  }
}

export async function destroyRoom() {
  try {
    const response = await fetch("/destroy-room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomName: state.getState().roomName,
        userId: state.getState().userId,
      }),
    })

    const res = await response.json()
    if (res.data.type === constants.type.ROOM_DESTROY.RESPONSE_FAILURE) {
      ui.logToCustomConsole(res.data.message)
    }

    if (res.data.type === constants.type.ROOM_CHECK.RESPONSE_SUCCESS) {
      state.setRoom(null)
      ui.logToCustomConsole("Room Destroyed")
      ui.destroyerToProceedToRoom()
    }
  } catch (error) {
    console.log("Error occured while creating the room")
    ui.logToCustomConsole("Something went wrong while creating the room")
  }
}

export async function joinRoom(roomName) {
  try {
    const response = await fetch("/join-room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomName: roomName,
        userId: state.getState().userId,
      }),
    })

    const res = await response.json()
    if (res.data.type === constants.type.ROOM_JOIN.RESPONSE_FAILURE) {
      ui.logToCustomConsole(res.data.message)
    }

    if (res.data.type === constants.type.ROOM_JOIN.RESPONSE_SUCCESS) {
      ui.logToCustomConsole("Room successfully joined")
    }
  } catch (error) {
    console.log("Error occured while creating the room")
    ui.logToCustomConsole("Something went wrong while creating the room")
  }
}
