const express = require('express')
const cors = require('cors')
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');


const backgrounds = './backgrounds/';

let folder = 'imgsqnce/';
let neededPath;
let images = [];
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
let frameCount = 1;
// Creating express app 
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(morgan('dev'));
app.use(express.static('public'));

function updateFrames() {
    io.emit('frameChange',frameCount);
}
app.get('/latestFrame',(req, res) => {
    res.sendFile(path.join(neededPath,images[frameCount]));
    
    
})
app.get('/connect',(req, res) => {
    res.json('Connection was successful');
})
app.get('/advanceFrame',(req, res) => {
    frameCount ++;
    updateFrames();
    res.json(frameCount);
})
app.get('/deletePreviousFrame',(req, res) => {
    frameCount --;
    updateFrames();
    res.json(frameCount);
})
app.post('/setFrame', (req, res) => {

})
io.on("connect", (socket) => {
    console.log(`CONNECTED ${socket}`)
})
// Port Number
const port = 5000;
console.log(JSON.stringify(images[1]));
// Server setup
server.listen(port, () => {
    console.log(`NU is listening on PORT ${port}`)
})
