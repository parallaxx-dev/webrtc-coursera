import * as state from "./state.js"
import * as rtc from "./webrtc.js"

const user_session_id_element = document.getElementById("session_id_display")
const infoModalButton = document.getElementById("info_modal_button")
const infoModalContainer = document.getElementById(
  "info_modal_content_container",
)
const closeModalButton = document.getElementById("close")
const consoleDisplay = document.getElementById("console_display")
const inputRoomNameElement = document.getElementById("input_room_channel_name")
const landingPageContainer = document.getElementById("landing_page_container")
const joinRoomButton = document.getElementById("join_button")
const createRoomButton = document.getElementById("create_room_button")
const roomNameHeadingTag = document.getElementById("room_name_heading_tag")
const roomInterface = document.getElementById("room_interface")
const messagesContainer = document.getElementById("messages")
const messageInputField = document.getElementById("message_input_field")
const messageInputContainer = document.getElementById("message_input")
const sendMessageButton = document.getElementById("send_message_button")
const destroyRoomButton = document.getElementById("destroy_button")
const exitButton = document.getElementById("exit_button")

const offerorButtonsContainer = document.getElementById(
  "offeror_process_buttons",
)
const offerorCreatePcButton = document.getElementById("create_pc")
const offerorAddDataTypeButton = document.getElementById("add_data_type")
const offerorCreateOfferButton = document.getElementById("create_offer")
const offerorUpdateLocalDescriptionButton = document.getElementById(
  "update_local_description",
)
const offerorSendOfferButton = document.getElementById("send_offer")
const offerorSetRemoteDescriptionButton = document.getElementById(
  "set_remote_description",
)
const offerorIceButton = document.getElementById("ice_offeror")

const offereeButtonsContainer = document.getElementById(
  "offeree_process_buttons",
)
const offereeCreatePcButton = document.getElementById("offeree_create_pc")
const offereeAddDataTypeButton = document.getElementById(
  "offeree_add_data_type",
)
const offereeUpdateRemoteDescriptionButton = document.getElementById(
  "offeree_update_remote_description",
)
const offereeCreateAnswerButton = document.getElementById(
  "offeree_create_answer",
)
const offereeUpdateLocalDescriptionButton = document.getElementById(
  "offeree_update_local_description",
)
const offereeSendAnswerButton = document.getElementById("offeree_send_answer")
const offereeIceButton = document.getElementById("ice_offeree")

// video media

const localVideo = document.getElementById("local_stream")
const remoteVideo = document.getElementById("remote_stream")

export const DOM = {
  createRoomButton,
  inputRoomNameElement,
  destroyRoomButton,
  joinRoomButton,
  exitButton,
  localVideo,
  remoteVideo,
}

export function initializeUi(userId) {
  user_session_id_element.innerHTML = `Your session id is: ${userId}`
  state.setUserId(userId)
  setupModalEvents()
}

function setupModalEvents() {
  infoModalButton.onclick = openModal
  closeModalButton.onclick = closeModal

  window.onclick = function (event) {
    if (event.target === infoModalContainer) {
      closeModal()
    }
  }
}

export function updateUiForConnectedState() {
  messageInputContainer.classList.remove("hide")
  messageInputContainer.classList.add("show")
  messagesContainer.innerHTML = ""

  messageInputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessageButton.click()
    }
  })
  sendMessageButton.addEventListener("click", async (e) => {
    rtc.sendMessageViaDataChannel(messageInputField.value)
    addOutgoingMessageToUi(messageInputField.value)
  })
}

export function addOutgoingMessageToUi(message) {
  const userTag = "YOU"
  const formattedMessage = `${userTag}: ${message}`
  const messageElement = document.createElement("div")
  messageElement.textContent = formattedMessage
  messagesContainer.appendChild(messageElement)
  messageInputField.value = ""
  messagesContainer.scrollTop = messagesContainer.scrollHeight
}

inputRoomNameElement.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    createRoomButton.click()
  }
})

function openModal() {
  infoModalContainer.classList.add("show")
  infoModalContainer.classList.remove("hide")
}

function closeModal() {
  infoModalContainer.classList.add("hide")
  infoModalContainer.classList.remove("show")
}

export function addIncomingMessageToUi(message) {
  const userTag = state.getState().otherUserId
  const formattedMessage = `${userTag}: ${message}`
  const messageElement = document.createElement("div")
  messageElement.textContent = formattedMessage
  messagesContainer.appendChild(messageElement)
  messagesContainer.scrollTop = messagesContainer.scrollHeight
}

export function creatorToProceedToRoom() {
  landingPageContainer.style.display = "none"
  exitButton.classList.add("hide")
  roomInterface.classList.remove("hide")
  roomNameHeadingTag.textContent = `You are in room ${state.getState().roomName}`
}

export function updateUiForRemainingUser(otherUserId) {
  alert(`User ${otherUserId} left the room`)
  state.setOtherUserId(null)
  messagesContainer.innerHTML = "Waiting for the peer to join..."
}

export function destroyerToProceedToRoom() {
  landingPageContainer.style.display = "block"
  exitButton.classList.remove("hide")
  roomInterface.classList.add("hide")
  roomNameHeadingTag.textContent = ""
}

export function joineeToProceedToRoom() {
  landingPageContainer.style.display = "none"
  destroyRoomButton.classList.add("hide")
  roomInterface.classList.remove("hide")
  messagesContainer.innerHTML = "pls wait connecting via WebRTC"
  roomNameHeadingTag.textContent = `You are in room ${state.getState().roomName}`
}

export function updateCreatorsRoom() {
  destroyRoomButton.classList.add("hide")
  exitButton.classList.remove("hide")
  messagesContainer.innerHTML = "pls wait connecting via WebRTC"
}

export function logToCustomConsole(
  message,
  color = "#FFFFFF",
  highlight = false,
  highlightColor = "#ffff83",
) {
  const messageElement = document.createElement("div")
  messageElement.classList.add("console-message")
  messageElement.textContent = message
  messageElement.style.color = color

  if (highlight) {
    messageElement.style.backgroundColor = highlightColor
    messageElement.style.fontWeight = "bold"
    messageElement.style.padding = "5px"
    messageElement.style.borderRadius = "3px"
    messageElement.style.transition = "background-color 0.5s ease"
  }

  consoleDisplay.appendChild(messageElement)
  consoleDisplay.scrollTop = consoleDisplay.scrollHeight
}
