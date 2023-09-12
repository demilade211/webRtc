export const getIncomingCallDialog = (callTypeInfo, acceptCallHandler, rejectCallHandler) => {
    console.log("getting incoming call dialog");
    let modalBody = document.getElementById('m-body')
    let acceptCallButton = document.getElementById('accept_call')
    let rejectCallButton = document.getElementById('reject_call')

    const modal = new bootstrap.Modal(document.getElementById('myModal'));  
    modalBody.innerHTML = `Incoming ${callTypeInfo} call`

    acceptCallButton.addEventListener("click",()=>{
        acceptCallHandler()
        modal.hide()
       
    })

    rejectCallButton.addEventListener("click",()=>{
        rejectCallHandler()
        modal.hide()
       
    })
    modal.show()
}

export const getCallingDialog = (rejectCallHandler) => {
    console.log("getting call dialog"); 
    const modal = new bootstrap.Modal(document.getElementById('callingModal'));  
    modal.show()
    let endCall = document.getElementById('calling_reject')
    endCall.addEventListener("click",()=>{
        rejectCallHandler() 
        modal.hide()
    })
}

export const getInfoDialog = (head,body) => {
    console.log("getting call dialog"); 
    let modalTitle = document.getElementById('i-title')
    let modalBody = document.getElementById('i-body')

    modalTitle.innerHTML = head
    modalBody.innerHTML = body

    const modal = new bootstrap.Modal(document.getElementById('infoModal'));  
    modal.show()
    
}

export const getLeftMessage  = (message) => { 
    const messageContainer = document.createElement("div")
    messageContainer.classList.add("message_left_container");
    const messageParagraph = document.createElement("p")
    messageParagraph.classList.add("message_left_paragraph")
    messageParagraph.innerHTML = message;
    messageContainer.appendChild(messageParagraph)

    return messageContainer;
}

export const getRightMessage  = (message) => { 
    const messageContainer = document.createElement("div")
    messageContainer.classList.add("message_right_container");
    const messageParagraph = document.createElement("p")
    messageParagraph.classList.add("message_right_paragraph")
    messageParagraph.innerHTML = message;
    messageContainer.appendChild(messageParagraph)

    return messageContainer;
}
 