import * as store from "./store.js"
import * as wss from "./wss.js"
import * as webRTCHandler from "./webRTCHandler.js"
import * as recordingUtils from "./recordingUtils.js"
import * as constants from "./constants.js"
import * as ui from "./ui.js"

// initialization of socketIO connection
const socket = io("/")
wss.registerSocketEvents(socket)

//webRTCHandler.getLocalPreview()

//register event for personal code copy button
const personalCodeCopyButon = document.getElementById("personal_code_copy_button")
personalCodeCopyButon.addEventListener("click", () => {
     const personalCode = store.getState().socketId
     navigator.clipboard && navigator.clipboard.writeText(personalCode) // checks if the navigator obj exists incase of older browsers
})

//register event for connection buttons
const personalCodeChatButon = document.getElementById("personal_code_chat_button")
const personalCodeVideoButon = document.getElementById("personal_code_video_button")

personalCodeChatButon.addEventListener("click", () => {
     console.log("chat btn");
     const calleePersonalCode = document.getElementById("personal_code_input")
     const callType = constants.callType.CHAT_PERSONAL_CODE
     webRTCHandler.sendPreOffer(callType, calleePersonalCode.value)
})

personalCodeVideoButon.addEventListener("click", () => {
     console.log("video btn");
     const calleePersonalCode = document.getElementById("personal_code_input")
     const callType = constants.callType.VIDEO_PERSONAL_CODE
     webRTCHandler.sendPreOffer(callType, calleePersonalCode.value)
})

// event listeners for video call buttons
const micButton = document.getElementById("mic_button");
micButton.addEventListener('click', () => {
     const localStream = store.getState().localStream;
     const micEnabled = localStream.getAudioTracks()[0].enabled;
     localStream.getAudioTracks()[0].enabled = !micEnabled;
     ui.updateMicButton(micEnabled, micButton)
})

const cameraButton = document.getElementById("camera_button");
cameraButton.addEventListener('click', () => {
     const localStream = store.getState().localStream;
     const cameraEnabled = localStream.getVideoTracks()[0].enabled;
     localStream.getVideoTracks()[0].enabled = !cameraEnabled;
     ui.updateCameraButton(cameraEnabled, cameraButton)
})

const switchForScreenSharingButton = document.getElementById("share_button");
switchForScreenSharingButton.addEventListener('click', () => {
     const screenSharingActive = store.getState().screenSharingActive;
     webRTCHandler.switchBetweenCameraAndScreenSharing(screenSharingActive)
})

//messenger 
const newMessageInput = document.getElementById("new_message_input");
newMessageInput.addEventListener('keydown', (event) => {
     console.log("change occured");
     const key = event.key

     if (key === 'Enter') {
          webRTCHandler.sendMessageUsingDataChannel(event.target.value)
          ui.appendMessage(event.target.value,true)
          newMessageInput.value=""
     }
})

const sendMessageButton = document.getElementById("send_message_button");
sendMessageButton.addEventListener('click', () => {
     const message = newMessageInput.value

     webRTCHandler.sendMessageUsingDataChannel(message)
     ui.appendMessage(newMessageInput.value ,true)
     newMessageInput.value=""
})

//recording
const startRecordingButton = document.getElementById("start_recording_button")
startRecordingButton.addEventListener('click', () => {
     recordingUtils.startRecording()
     ui.showRecordingPanel()
})

const stopRecordingButton = document.getElementById("stop_recording_button")
stopRecordingButton.addEventListener('click', () => {
     recordingUtils.stopRecording()
     ui.resetRecordingButton()
})