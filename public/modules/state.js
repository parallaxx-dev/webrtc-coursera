let state = {
  userId: null,
  userWebSocketConnection: null,
  roomName: null,
  otherUserId: null,
}

const setState = (newState) => {
  state = {
    ...state,
    ...newState,
  }
}

export const setOtherUserId = (otherUserId) => {
  setState({ otherUserId })
}

export const setRoom = (roomName) => {
  setState({ roomName })
}

export const setUserId = (userId) => {
  setState({ userId })
}

export const setWsConnection = (wsConnection) => {
  setState({ userWebSocketConnection: wsConnection })
}

export const getState = () => {
  return state
}
