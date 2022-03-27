//require our dependencies
const express = require('express')
const cors = require('cors')
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const udp = require('dgram');
const UDPport = 8888;
const { Buffer } = require('buffer');


const backgrounds = './backgrounds/';

let folder = 'imgsqnce/';
let neededPath;
let images = [];
let DFinternalFrame;
//initializing the images
neededPath = path.join(__dirname, path.join(backgrounds, folder));
console.log(neededPath);
console.log('Indexing images...');
fs.readdir(neededPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        //console.log(file);
        images.push(file);
    });
});
console.log('Indexing Complete');
let frameCount = 0;
// Creating express app 
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(morgan('dev'));
app.use(express.static('public'));

// Creating UDP server
const UDPserver = udp.createSocket('udp4');

function updateFrames() {
    io.emit('frameChange',frameCount);
}
function advanceFrame() {
    frameCount ++;
    updateFrames();
}
function previousFrame(){
    frameCount --;
    updateFrames();
}
//Our HTTP listeners for integration with BOATS and the manual controller:

app.get('/latestFrame',(req, res) => {
    res.sendFile(path.join(neededPath,images[frameCount % images.length]));
})
app.get('/connect',(req, res) => {
    res.json('Connection was successful');
})
app.get('/advanceFrame',(req, res) => {
    advanceFrame();
    res.json(frameCount);
})
app.get('/deletePreviousFrame',(req, res) => {
    previousFrame();
    res.json(frameCount);
})
app.post('/setFrame', (req, res) => {

})
io.on("connect", (socket) => {
    console.log(`CONNECTED ${socket}`)
})

//Our UDP listeners for integration with DragonFrame:

UDPserver.on('listening',function() {
    const UDPaddress = UDPserver.address();
    const UDPport = UDPaddress.port;
    console.log(`UDP server is listening at port ${UDPport}`)
})

UDPserver.on('message',function(msg,info){
    const DFmessage = JSON.parse(msg.toString());
    const event = DFmessage.event;
     if(event === 'hello'){
        UDPserver.send(Buffer.from('{"command":"hello","version":1.0}'),info.port,'localhost',function(error){
            if(error){
           client.close();
            }else{
           console.log('Data sent !');
            }
         });
    } else if(event === 'captureComplete') {
        console.log(`Shot frame ${DFmessage.frame}`);
        DFinternalFrame = DFmessage.frame;
        advanceFrame();
    } else if (event === 'delete') {
        console.log('deleted frame');
        previousFrame();
        
    } else if (event === 'position'){
        /*
        console.log('Position Event');

        const newFrame = parseFloat(DFmessage.frame);
        console.log('newFrame: ' + newFrame);
        console.log('DFinternalFrame: ' + DFinternalFrame);
        if(newFrame === DFinternalFrame - 1){
            console.log('user deleted most recent frame');
        }
        DFinternalFrame = parseFloat(newFrame);
        */
    }
   });
UDPserver.on('error',function(error){
    console.log('Error: ' + error);
    UDPserver.close();
  });
//UDPserver.bind(UDPport);





// Port Number
const port = 5000;
// Server setup
server.listen(port, () => {
    console.log(`NU is listening on PORT ${port}`)
})
UDPserver.bind(port);
