import * as wss from "./wss.js"
import * as constants from "./constants.js"
import * as ui from "./ui.js"
import * as store from "./store.js"

let connectedUserDetails;
let peerConnection;
let dataChannel
const defaultConstraints = {
    audio: true,
    video: true
}

const configuration = {
    iceServers: [
        {
            urls: 'stun:stun.1.google.com:13902'
        }
    ]
}

export const getLocalPreview = async () => {
    try {
        let stream = await navigator.mediaDevices.getUserMedia(defaultConstraints)
        ui.updateLocalVideo(stream)
        store.setCallState(constants.callStates.CALL_AVAILABLE)
        store.setLocalStream(stream)
    } catch (error) {
        console.log("Error trying to access camera");
        console.log(error);
    }
}

export const createPeerConnection = async () => {
    peerConnection = new RTCPeerConnection(configuration)

    dataChannel = peerConnection.createDataChannel("chat")

    peerConnection.ondatachannel = (event) => {
        const dataChannel = event.channel;

        dataChannel.onopen = () => {
            console.log("peer connection is ready to recieve data channel messages");
        }

        dataChannel.onmessage = (event) => {
            console.log("message came from data channel");
            const message = JSON.parse(event.data)
            ui.appendMessage(message)
        }
    }
    peerConnection.onicecandidate = (event) => {
        console.log("getting ice candidate from stun server");
        if (event.candidate) {
            //send our ice candidate to other peer
            wss.sendDataUsingWebRTCSignaling({
                connectedUserSocketId: connectedUserDetails.socketId,
                type: constants.webRTCSignaling.ICE_CANDIDATE,
                candidate: event.candidate
            })
        }
    }

    peerConnection.onconnectstatechange = (event) => {
        if (peerConnection.connectionState === "connected") {
            console.log("successfully connected with other peer");
        }
    }

    // recieving tracks

    const remoteStream = new MediaStream()
    store.setRemoteStream(remoteStream)
    ui.updateRemoteVideo(remoteStream)

    peerConnection.ontrack = (event) => {
        remoteStream.addTrack(event.track)
    }

    //add our stream to peer connection

    //await getLocalPreview()

    if (connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE || connectedUserDetails.callType === constants.callType.VIDEO_STRANGER) {
        const localStream = store.getState().localStream

        for (const track of localStream.getTracks()) {
            peerConnection.addTrack(track, localStream)
        }
    }
}

export const sendMessageUsingDataChannel = (message) => {
    const stringifiedMessage = JSON.stringify(message)
    dataChannel.send(stringifiedMessage)
}

export const sendPreOffer = (callType, calleePersonalCode) => {
    connectedUserDetails = {
        callType,
        socketId: calleePersonalCode,
    }

    if (callType === constants.callType.CHAT_PERSONAL_CODE || callType === constants.callType.VIDEO_PERSONAL_CODE) {
        const data = {
            callType,
            calleePersonalCode
        }
        ui.showCallingDialog(callingDialogRejectCallHandler)
        store.setCallState(constants.callStates.CALL_UNAVAILABLE)
        wss.sendPreOffer(data)
    }
    if (callType === constants.callType.CHAT_STRANGER || callType === constants.callType.VIDEO_STRANGER) {
        const data = {
            callType,
            calleePersonalCode
        }
        store.setCallState(constants.callStates.CALL_UNAVAILABLE)
        wss.sendPreOffer(data)
    }

}

export const handlePreOffer = (data) => {
    const { callType, callerSocketId } = data

    if (!checkCallPossibility()) {
        return sendPreOfferAnswer(constants.preOfferAnswer.CALL_UNAVAILABLE, callerSocketId)
    }

    connectedUserDetails = {
        socketId: callerSocketId,
        callType
    }

    store.setCallState(constants.callStates.CALL_UNAVAILABLE)

    if (callType === constants.callType.CHAT_PERSONAL_CODE || callType === constants.callType.VIDEO_PERSONAL_CODE) {
        ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler)
    }
    if (callType === constants.callType.CHAT_STRANGER || callType === constants.callType.VIDEO_STRANGER) {
        createPeerConnection()
        sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED)
        ui.showCallElements(connectedUserDetails.callType)
    }
}

export const handlePreOfferAnswer = async (data) => {
    const { preOfferAnswer } = data

    console.log("answer came", data);

    if (connectedUserDetails.callType === constants.callType.CHAT_PERSONAL_CODE || connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE) {
        const modal = new bootstrap.Modal(document.getElementById('callingModal'));
        modal.show()
        modal.hide()
        const backdrop = document.querySelector('.modal-backdrop');
        backdrop.remove();
    }

    if (preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND) {
        //show not found
        ui.showInfoDialog("Callee not found", "Please check personal code")
        setIncomingCallsAvailable()
    }

    if (preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE) {
        //show not available
        ui.showInfoDialog("Call is not possible", "Probably callee is busy. Please try again later")
        setIncomingCallsAvailable()
    }

    if (preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED) {
        //show rejected
        ui.showInfoDialog("Call Rejected", "Callee rejected your call")
        setIncomingCallsAvailable()
    }

    if (preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED) {
        //show accepted
        ui.showCallElements(connectedUserDetails.callType)
        await createPeerConnection()
        sendWebRTCOffer()
    }
}

const sendWebRTCOffer = async () => {
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constants.webRTCSignaling.OFFER,
        offer
    })
}

export const handleWebRTCOffer = async (data) => {
    await peerConnection.setRemoteDescription(data.offer)
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constants.webRTCSignaling.ANSWER,
        answer
    })
}

export const handleWebRTCAnswer = async (data) => {
    console.log("handling webrtc answer");
    await peerConnection.setRemoteDescription(data.answer)
}

export const handleWebRTCCandidate = async (data) => {
    try {
        await peerConnection.addIceCandidate(data.candidate)
    } catch (error) {
        console.log("error when tring to recieve icecandidate");
        console.log(error);
    }
}

const acceptCallHandler = () => {
    console.log("call accepted");
    createPeerConnection()
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED)
    ui.showCallElements(connectedUserDetails.callType)
}

const rejectCallHandler = () => {
    console.log("call rejected");
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED)
    setIncomingCallsAvailable()
}

const callingDialogRejectCallHandler = () => {
    const data = {
        connectedUserSocketId: connectedUserDetails.socketId
    }

    closePeerConnectionAndResetState();

    wss.sendUserHangUp(data)
}

const sendPreOfferAnswer = (preOfferAnswer, callerSocketId = null) => {
    const SocketId = callerSocketId ? callerSocketId : connectedUserDetails.socketId
    const data = {
        callerSocketId: SocketId,
        preOfferAnswer
    }
    wss.sendPreOfferAnswer(data)
}

let screenSharingStream

export const switchBetweenCameraAndScreenSharing = async (screenSharingActive) => {
    if (screenSharingActive) {
        const localStream = store.getState().localStream
        const senders = peerConnection.getSenders();
        const sender = senders.find(val => {
            return val.track.kind === localStream.getVideoTracks()[0].kind
        })

        if (sender) {
            sender.replaceTrack(localStream.getVideoTracks()[0])
        }

        store.getState().screenSharingStream.getTracks().forEach(track => track.stop())

        store.setScreenSharingActive(!screenSharingActive)

        //add to local preview
        ui.updateLocalVideo(localStream)

    } else {
        console.log("switching for screen sharing");
        try {
            screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            })
            store.setScreenSharingStream(screenSharingStream)

            //replace track which sender is sending change to shared screen
            const senders = peerConnection.getSenders();

            const sender = senders.find(val => {
                return val.track.kind === screenSharingStream.getVideoTracks()[0].kind
            })

            if (sender) {
                sender.replaceTrack(screenSharingStream.getVideoTracks()[0])
            }

            store.setScreenSharingActive(!screenSharingActive)

            //add to local preview
            ui.updateLocalVideo(screenSharingStream)
        } catch (error) {
            console.log("error occured when trying to set screen sharing stream");
            console.log(error);
        }
    }
}

// hang up
export const handleHangUp = () => {
    console.log("finishing the call");
    const data = {
        connectedUserSocketId: connectedUserDetails.socketId
    }

    wss.sendUserHangUp(data)
    closePeerConnectionAndResetState()
}

export const handleConnectedUserHangedUp = () => {
    console.log("connected peer hanged up");
    closePeerConnectionAndResetState()
    const modal = new bootstrap.Modal(document.getElementById('myModal'));
    modal.show()
    modal.hide()
    const backdrop = document.querySelector('.modal-backdrop');
    backdrop.remove();
}

const closePeerConnectionAndResetState = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null
    }

    // active mic and camera
    if (connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE || connectedUserDetails.callType === constants.callType.VIDEO_STRANGER) {
        store.getState().localStream.getVideoTracks()[0].enabled = true
        store.getState().localStream.getAudioTracks()[0].enabled = true
    }

    ui.updateUIAfterHangUp(connectedUserDetails.callType)
    setIncomingCallsAvailable()
    connectedUserDetails = null

}

const checkCallPossibility = (callType) => {
    const callState = store.getState().callState

    if (callState === constants.callStates.CALL_AVAILABLE) {
        return true
    }

    if ((callType === constants.callType.VIDEO_PERSONAL_CODE || callType === constants.callType.VIDEO_STRANGER) && callState === constants.callStates.CALL_AVAILABLE_ONLY_CHAT) {
        return false
    }

    return false
}

const setIncomingCallsAvailable = (callType) => {
    const localStream = store.getState().localStream
    if (localStream) {
        store.setCallState(constants.callStates.CALL_AVAILABLE)
    } else {
        store.setCallState(constants.callStates.CALL_AVAILABLE_ONLY_CHAT)
    }
}