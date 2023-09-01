import * as constants from "./constants.js"
import * as elements from "./elements.js"
import * as webRTCHandler from "./webRTCHandler.js"

export const updatePersonalCode = (personalCode) => {
    const personalCodeParagraph = document.getElementById("personal_code_paragraph")
    personalCodeParagraph.innerHTML = personalCode
}

export const updateLocalVideo = (stream) => {
    const localVideo = document.getElementById("local_video")
    localVideo.srcObject = stream 

    localVideo.addEventListener("loadedmetadata",()=>{
        localVideo.play()
    })
}

export const updateRemoteVideo = (stream) => {
    const remoteVideo = document.getElementById("remote_video")
    remoteVideo.srcObject = stream  
}

export const showIncomingCallDialog = (callType, acceptCallHandler, rejectCallHandler) => {
    const callTypeInfo = callType === constants.callType.CHAT_PERSONAL_CODE ? "Chat" : "Video"
    const incomingCallDialog = elements.getIncomingCallDialog(callTypeInfo,acceptCallHandler,rejectCallHandler)
}

export const showCallingDialog = (rejectCallHandler) => {
     
    elements.getCallingDialog(rejectCallHandler)
} 

export const showInfoDialog = (head,body) => {
     
     elements.getInfoDialog(head,body)
} 

export const showCallElements = (callType) => {
     
    if (callType === constants.callType.CHAT_PERSONAL_CODE ) {
        showChatCallElements()
    }
    if (callType === constants.callType.VIDEO_PERSONAL_CODE ) {
        //webRTCHandler.getLocalPreview()
        showVideoCallElements()
    }
} 

const showChatCallElements = ()=>{
    const finishConnectionChatButtonContainer = document.getElementById('finish_chat_button_container')
    showElement(finishConnectionChatButtonContainer)

    const newMessageInput = document.getElementById('new_message')
    showElement(newMessageInput)

    //block panel
    disableDashboard()
}

const showVideoCallElements = ()=>{
    const callButtons = document.getElementById('call_buttons')
    showElement(callButtons)

    const localVideo = document.getElementById('local_video')
    showElement(localVideo)

    const remoteVideo = document.getElementById('remote_video')
    showElement(remoteVideo)

    const newMessageInput = document.getElementById('new_message')
    showElement(newMessageInput)

    //block panel
    disableDashboard()
}

//ui call buttons
export const updateMicButton = (micActive,micButton)=>{
    micActive?micButton.innerHTML="mute":micButton.innerHTML="unmute"
}

export const updateCameraButton = (cameraActive,cameraButton)=>{
    cameraActive?cameraButton.innerHTML="camon":cameraButton.innerHTML="camoff"
}

// ui messages
export const appendMessage = (message,right=false)=>{
    const messagesContainer = document.getElementById("messages-con")
    const messageElement = right?elements.getRightMessage(message):elements.getLeftMessage(message)
    messagesContainer.appendChild(messageElement)
}

export const clearMessager = ()=>{
    const messagesContainer = document.getElementById("messages-con")
       
    messagesContainer.querySelectorAll("*").forEach(n=>n.remove())
}

// recording 
export const showRecordingPanel = ()=>{
    const recordingButtons = document.getElementById("video_recording_buttons")
       
    showElement(recordingButtons)

    //hide start recording button if it is active
    const startRecordingButton = document.getElementById("start_recording_button")
    hideElement(startRecordingButton)
}

export const resetRecordingButton = ()=>{ 

    //hide start recording button if it is active
    const startRecordingButton = document.getElementById("start_recording_button")
    showElement(startRecordingButton)

    const recordingButtons = document.getElementById("video_recording_buttons") 
    hideElement(recordingButtons)

}

//ui helper functions

const enableDashboard = ()=>{
    const dashboardBlocker = document.getElementById('left')
    if(dashboardBlocker.classList.contains("disabled-con")){
        dashboardBlocker.classList.remove("disabled-con")
    }
}
const disableDashboard = ()=>{
    const dashboardBlocker = document.getElementById('left')
    if(!dashboardBlocker.classList.contains("disabled-con")){
        dashboardBlocker.classList.add("disabled-con")
    }
}
const hideElement = (element)=>{
    if(!element.classList.contains("display-none")){
        element.classList.add("display-none")
    }
}
const showElement = (element)=>{
    if(element.classList.contains("display-none")){
        element.classList.remove("display-none")
    }
}

