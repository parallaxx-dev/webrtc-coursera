  import express from "express"
  import morgan from "morgan"
  import helmet from "helmet"
  import http from "http"
  import { connect } from "http2"
  import { WebSocketServer } from "ws"
  import cors from "cors"
  import * as constants from "./constants.js"

  const app = express()
  app.use(morgan("tiny"))
  app.use(express.static("public"))
  app.use(helmet())
  app.use(
    cors({
      origin: "*",
      methods: "*",
    }),
  )

  const server = http.createServer(app)

  const connections = []

  const rooms = []

  const PORT = process.env.PORT || 8080

  app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/public/index.html")
  })

  app.get("/ice-config", (req, res) => {
    res.json({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
            "stun:stun4.l.google.com:19302",
          ],
        },
        {
          urls: "stun:stun.relay.metered.ca:80",
        },
        {
          urls: "turn:in.relay.metered.ca:80",
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_PASSWORD,
        },
        {
          urls: "turn:in.relay.metered.ca:80?transport=tcp",
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_PASSWORD,
        },
        {
          urls: "turn:in.relay.metered.ca:443",
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_PASSWORD,
        },
        {
          urls: "turns:in.relay.metered.ca:443?transport=tcp",
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_PASSWORD,
        },
      ],
    })
  })

  app.post("/create-room", (req, res) => {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", () => {
      const { roomName, userId } = JSON.parse(body)
      const existingRoom = rooms.find((room) => room.roomName === roomName)

      if (existingRoom) {
        const failureMessage = {
          data: {
            message:
              "The room is not available, please try a different room or join one.",
            type: constants.type.ROOM_CHECK.RESPONSE_FAILURE,
          },
        }
        return res.status(401).json(failureMessage)
      }

      rooms.push({
        roomName,
        peer1: userId,
        peer2: null,
      })

      const successMessage = {
        data: {
          message: "Room successfully created",
          type: constants.type.ROOM_CHECK.RESPONSE_SUCCESS,
        },
      }

      return res.status(200).json(successMessage)
    })
  })

  app.post("/destroy-room", (req, res) => {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", () => {
      const { roomName, userId } = JSON.parse(body)
      const existingRoom = rooms.findIndex((room) => room.roomName === roomName)

      if (existingRoom === -1) {
        const failureMessage = {
          data: {
            message: "Room does not exist",
            type: constants.type.ROOM_DESTROY.RESPONSE_FAILURE,
          },
        }
        return res.status(404).json(failureMessage)
      }

      rooms.splice(existingRoom, 1)

      const successMessage = {
        data: {
          message: "Room successfully destroyed",
          type: constants.type.ROOM_CHECK.RESPONSE_SUCCESS,
        },
      }

      return res.status(200).json(successMessage)
    })
  })

  const wss = new WebSocketServer({ server })

  wss.on("connection", (ws, req) => handleConnection(ws, req))

  function joinRoomHandler(data) {
    const { userId, roomName } = data
    const existingRoom = rooms.find((room) => room.roomName === data.roomName)
    let otherUserId = null
    if (!existingRoom) {
      console.log("A user tried to join, but the room does not exists")

      const failureMessage = {
        label: constants.labels.NORMAL_SERVER_PROCESS,
        data: {
          type: constants.type.ROOM_JOIN.RESPONSE_FAILURE,
          message: "The room does not exists",
        },
      }

      sendWebSocketMessageToUser(failureMessage, userId)
      return
    }

    if (existingRoom.peer1 && existingRoom.peer2) {
      console.log("A user tried to join, but the room was full")
      const failureMessage = {
        label: constants.labels.NORMAL_SERVER_PROCESS,
        data: {
          type: constants.type.ROOM_JOIN.RESPONSE_FAILURE,
          message: "The room is full",
        },
      }
      sendWebSocketMessageToUser(failureMessage, userId)
      return
    }

    console.log("A user is attempting to join a room")
    if (!existingRoom.peer1) {
      existingRoom.peer1 = userId
      otherUserId = existingRoom.peer2
      console.log(`added user ${userId} as peer1`)
    } else {
      existingRoom.peer2 = userId
      otherUserId = existingRoom.peer1
      console.log(`added user ${userId} as peer2`)
    }

    const successMessage = {
      label: constants.labels.NORMAL_SERVER_PROCESS,
      data: {
        type: constants.type.ROOM_JOIN.RESPONSE_SUCCESS,
        roomName: existingRoom.roomName,
        otherUserId: otherUserId,
        message: `You have successfully joined the room ${existingRoom.roomName}`,
      },
    }
    sendWebSocketMessageToUser(successMessage, userId)

    const notificationMessage = {
      label: constants.labels.NORMAL_SERVER_PROCESS,
      data: {
        type: constants.type.ROOM_JOIN.NOTIFY,
        joineeId: userId,
        message: `User ${userId} has joined your room`,
      },
    }

    sendWebSocketMessageToUser(notificationMessage, otherUserId)

    return
  }

  function handleConnection(ws, req) {
    const userId = extractUserId(req)
    console.log(`User: ${userId} connected to WS server`)
    addConnection(ws, userId)
    ws.on("message", (data) => handleMessage(data))
    ws.on("close", () => handleDisconnection(userId))
    ws.on("error", () => console.log("There was error in WS server"))
  }

  function handleMessage(data) {
    try {
      const message = JSON.parse(data.toString())
      switch (message.label) {
        case constants.labels.NORMAL_SERVER_PROCESS:
          normalServerProcessing(message.data)
          break
        case constants.labels.WEBRTC_PROCESS:
          webrtcServerProcessing(message.data)
          break
        default:
          console.log("Unknown label: ", message.label)
      }
    } catch (error) {
      console.log("Failed to parse the message", error)
      return
    }
  }

  function webrtcServerProcessing(data) {
    switch (data.type) {
      case constants.type.WEBRTC.OFFER:
        processOffer(data)
        break
      case constants.type.WEBRTC.ANSWER:
        processOffer(data)
        break
      case constants.type.WEBRTC.ICE_CANDIDATES:
        processCandidateExchange(data)
        break
      default:
        console.log("Unknown message type: ", data.type)
    }
  }

  function processCandidateExchange(data) {
    const { otherUserId } = data
    const candidateMessage = {
      label: constants.labels.WEBRTC_PROCESS,
      data,
    }
    sendWebSocketMessageToUser(candidateMessage, otherUserId)
    console.log(`Ice candidates has been sent to user ${otherUserId}`)
  }

  function processOffer(data) {
    const { otherUserId } = data
    const offerMessage = {
      label: constants.labels.WEBRTC_PROCESS,
      data,
    }
    sendWebSocketMessageToUser(offerMessage, otherUserId)
    console.log(`Offer has been sent to other user ${otherUserId}`)
  }

  function normalServerProcessing(data) {
    switch (data.type) {
      case constants.type.ROOM_JOIN.REQUEST:
        joinRoomHandler(data)
        break
      case constants.type.ROOM_EXIT.REQUEST:
        exitRoomHandler(data)
        break
      default:
        console.log("Unknown message type: ", data.type)
    }
  }

  function exitRoomHandler(data) {
    const { roomName, userId } = data
    const existingRoom = rooms.find((room, index) => room.roomName === roomName)
    if (!existingRoom) {
      console.log(`Room ${roomName} not found`)
      return
    }
    const otherUserId =
      existingRoom.peer1 === userId ? existingRoom.peer2 : existingRoom.peer1

    if (existingRoom.peer1 === userId) {
      existingRoom.peer1 = null
      console.log(
        `Peer 1 ${userId} removed from the room ${roomName}: `,
        existingRoom,
      )
    } else {
      existingRoom.peer2 = null
      console.log(
        `Peer 2 ${userId} removed from the room ${roomName}: `,
        existingRoom,
      )
    }

    rooms.forEach((room, index) => {
      if (room.peer1 === userId) {
        room.peer1 = null
      }
      if (room.peer2 === userId) {
        room.peer2 = null
      }
      if (room.peer1 === null && room.peer2 === null) {
        rooms.splice(index, 1)
      }
    })
    console.log(`User ${userId} removed from connections`)
    console.log(`Total connected users: ${connections.length}`)

    const notificationMessage = {
      label: constants.labels.NORMAL_SERVER_PROCESS,
      data: {
        type: constants.type.ROOM_EXIT.NOTIFY,
        message: `User ${userId} has left the room, another user can join.`,
      },
    }

    sendWebSocketMessageToUser(notificationMessage, otherUserId)
    return
  }

  function handleDisconnection(userId) {
    const connectionIndex = connections.findIndex(
      (conn) => conn.userId === userId,
    )
    if (connectionIndex === -1) {
      console.log(`User ${userId} is not connected`)
      return
    }
    connections.splice(connectionIndex, 1)

    rooms.forEach((room, index) => {
      const otherUserId = room.peer1 === userId ? room.peer2 : room.peer1
      const notificationMessage = {
        label: constants.labels.NORMAL_SERVER_PROCESS,
        data: {
          type: constants.type.ROOM_DISONNECTION.NOTIFY,
          message: `The user ${userId} has disconnected`,
          otherUserId: userId,
          roomName: room.roomName,
        },
      }

      if (otherUserId) {
        sendWebSocketMessageToUser(notificationMessage, otherUserId)
      }

      if (room.peer1 === userId) {
        room.peer1 = null
      }
      if (room.peer2 === userId) {
        room.peer2 = null
      }
      if (room.peer1 === null && room.peer2 === null) {
        rooms.splice(index, 1)
      }
    })
    console.log(`User ${userId} removed from connections`)
    console.log(`Total connected users: ${connections.length}`)
  }

  function addConnection(ws, userId) {
    connections.push({ wsConnection: ws, userId })
    console.log(`User ${userId} connected`)
    console.log(`Total connected users: ${connections.length}`)
  }

  function extractUserId(req) {
    const query = new URLSearchParams(req.url.split("?")[1])
    return Number(query.get("userId"))
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log("Sever listening...")
  })

  function sendWebSocketMessageToUser(message, sendUserId) {
    const userConnection = connections.find(
      (connObj) => connObj.userId === sendUserId,
    )
    if (userConnection && userConnection.wsConnection) {
      userConnection.wsConnection.send(JSON.stringify(message))
      console.log(`Message send to user ${sendUserId}`)
    } else {
      console.log(`User ${sendUserId} not found`)
    }
  }
