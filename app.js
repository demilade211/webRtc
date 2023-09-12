import express from "express";
import morgan from "morgan"
import cors from "cors";
import http from "http"

const app = express();
const server = http.createServer(app)
const io = require('socket.io')(server);

app.use(cors());
app.use(morgan('dev'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));//to handle url encoded data 

app.use(express.static("public"))

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '/public/index.html'))
})

let connectedPeers = [];
let connectedPeersStrangers = [];

io.on('connection', (socket) => {
    connectedPeers.push(socket.id)
    console.log(connectedPeers,"users online");

    socket.on("pre-offer", (data) => {
        const { calleePersonalCode, callType } = data

        const connectedPeer = connectedPeers.find(val => val === calleePersonalCode ) 
        if (connectedPeer) {
            const data = {
                callerSocketId: socket.id,
                callType,
            }

            io.to(calleePersonalCode).emit("pre-offer", data)

        }else{
            const data = {
                preOfferAnswer:"CALLEE_NOT_FOUND"
            }
            io.to(socket.id).emit("pre-offer-answer", data)

        }
    })
    socket.on('pre-offer-answer', (data) => { 

        const connectedPeer = connectedPeers.find(val => val === data.callerSocketId )
         
        if (connectedPeer) { 
            io.to(data.callerSocketId).emit("pre-offer-answer", data)

        }
         
    })
    socket.on('webRTC-signaling', (data) => {
        console.log("wwebrtc ");
        console.log(data);

        const {connectedUserSocketId} = data

        const connectedPeer = connectedPeers.find(val => val === connectedUserSocketId )
         
        if (connectedPeer) { 
            io.to(connectedUserSocketId).emit("webRTC-signaling", data)

        }
         
    })
    socket.on('user-hanged-up', (data) => {
        console.log("hanged up"); 

        const {connectedUserSocketId} = data

        const connectedPeer = connectedPeers.find(val => val === connectedUserSocketId )
         
        if (connectedPeer) { 
            io.to(connectedUserSocketId).emit("user-hanged-up")

        }
         
    })
    socket.on('stranger-connection-status', (data) => {
        const {status} = data

        if (status) { 
            connectedPeersStrangers.push(socket.id)
        } else {
            const newConnectedPeersStrangers = connectedPeersStrangers.filter(val=>val!==socket.id)
            connectedPeersStrangers =newConnectedPeersStrangers
        }
        console.log(connectedPeersStrangers,"strangers online");
         
    })
    socket.on('get-stranger-socket-id', () => {
        let randomStrangerSocketId;
        const filteredConnectedPeersStrangers = connectedPeersStrangers.filter(val=>val!==socket.id)

        if(filteredConnectedPeersStrangers.length > 0){
            randomStrangerSocketId = filteredConnectedPeersStrangers[Math.floor(Math.random()*filteredConnectedPeersStrangers.length)]
        }else{
            randomStrangerSocketId = null;
        }

        const data = {
            randomStrangerSocketId
        }

        io.to(socket.id).emit("stranger-socket-id",data)
         
    })
    socket.on('disconnect', () => {
        console.log("user disconnected");
        connectedPeers.splice(connectedPeers.indexOf(socket.id), 1) 
        console.log(socket.id);
        console.log(connectedPeers);
    })
});


export default server;