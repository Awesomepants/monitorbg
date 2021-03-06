//require our dependencies
const express = require('express')
const cors = require('cors')
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const udp = require('dgram');
const UDPport = 8888;
const { Buffer } = require('buffer');
const readline = require('readline');
const target = require('./getIPaddress');
const open = require('open');

console.log("app starting");
const blankConfig = {
    "imageSequences":{},
    "lastImageSequence":"",
    "image-settings":{
        "x":0,
        "y":0,
        "size":720,
        "color":"#000000"
    }
}
let pictureProperties = {
    x:0,
    y:0,
    size:720,
    color:"#000000"
}
// read in our configuration file, or create it if it doesn't exist
if (!fs.existsSync(path.join(process.cwd(), 'config.json'))){
    fs.writeFileSync(path.join(process.cwd(), 'config.json'),JSON.stringify(blankConfig));
}
const configPath = path.join(process.cwd(), 'config.json');
const config = require(configPath);
pictureProperties = config["image-settings"]
let neededPath;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
function updateConfigFile(){
    fs.writeFileSync(configPath, JSON.stringify(config));
}
  // Creating express app 
  const expressServer = express();
  const server = http.createServer(expressServer);
  expressServer.use(cors());
  expressServer.post('/newsequence',(req, res, next) => {
      console.log("heyyy")
  })

function startUp(){
    console.log("Welcome to MonitorBG!");
console.log("Here are all the (case sensitive!) image sequences to choose from: ");
        Object.keys(config.imageSequences).forEach((key) => {
            console.log(`> ${JSON.stringify(key)}`);
        })
rl.question("To start, enter the name of an existing image sequence or type 'new' to make a new image sequence: ",(input) => {
    if(config.imageSequences[input]){
        neededPath = JSON.parse(config.imageSequences[input]);
        console.log('step1');
        config.lastImageSequence = config.imageSequences[input];
        console.log('step2');
        updateConfigFile();
        console.log('step3');
        runServer();
    } else if (input === 'new') {
        rl.question("Please input the absolute file path of the image sequence folder: ", (filePath) => {
            rl.question("Please input the name you would like to use for this image sequence (Note that if you use the name of an existing image sequence, it will be overwritten): ", (sequenceName) => {
                if(sequenceName==="new"){
                    sequenceName = `_${sequenceName}`;
                    console.log(`Your sequence has been names ${sequenceName} to avoid conflicting with the command names`);
                    
                }
                config.imageSequences[sequenceName] = JSON.stringify(filePath);
                updateConfigFile();
                neededPath = filePath;
                console.log(`Added ${sequenceName}`);
                runServer();
            })
        })
    } else {
        console.log("I can't recognize this command. Press ctrl+c to exit and try again");
        
    }
})
}

//startUp();



//this gets called once the user input has been evaluated and the program is ready to start
function runServer(){
    rl.close();
    const backgrounds = config.imgSequenceFolder;

    let images = [];
    let DFinternalFrame;
    //initializing the images
    
    
    console.log('Indexing images...');
    fs.readdir(path.resolve(neededPath), function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //listing all files using forEach
        files.forEach(function (file) {
    
            images.push(file);
        });
    });
    console.log('Indexing Complete');
    let frameCount = 0;
  
    const io = new Server(server);
    
    

    expressServer.use(express.static('public'));
 
    // Creating UDP server
    const UDPserver = udp.createSocket('udp4');
    let paused = false;
    function updateFrames() {
        io.emit('frameChange',frameCount);
    }
    function advanceFrame() {
        if(!paused){
            frameCount ++;
            updateFrames();
        }
        
    }
    function previousFrame(){
        if(!paused){
            frameCount --;
            updateFrames();   
        }
 
    }

    function setFrame(frameSet){
        frameCount = frameSet;
        updateFrames();
    }
    //Our HTTP listeners for integration with BOATS and the manual controller:
    
    expressServer.get('/latestFrame',(req, res) => {
        res.sendFile(path.join(neededPath,images[frameCount % images.length]));
    })
    expressServer.get('/connect',(req, res) => {
        res.json('Connection was successful');
    })
    expressServer.get('/advanceFrame',(req, res) => {
        advanceFrame();
        res.json(frameCount);
    })
    expressServer.get('/deletePreviousFrame',(req, res) => {
        previousFrame();
        res.json(frameCount);
    })
    expressServer.post('/setFrame', (req, res) => {
        frameCount = req.body.frame;
        updateFrames();
        res.json(frameCount);
    })
 
    //Our UDP listeners for integration with DragonFrame:
    
    UDPserver.on('listening',function() {
        const UDPaddress = UDPserver.address();
        const UDPport = UDPaddress.port;
    })
    
    UDPserver.on('message',function(msg,info){
        const DFmessage = JSON.parse(msg.toString());
        const event = DFmessage.event;
         if(event === 'hello'){
            UDPserver.send(Buffer.from('{"command":"hello","version":1.0}'),info.port,'localhost',function(error){
                if(error){
               client.close();
                }else{
               console.log('Completed "Hello" protocol with dragonframe');
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
        
        }
       });
    UDPserver.on('error',function(error){
        console.log('Error: ' + error);
        UDPserver.close();
      });
    //Our socket.io listeners for the controller
    io.on("connect", (socket)=> {
        io.emit("setImageProps", pictureProperties);
        socket.on("togglePause",()=>{
            paused = !paused;
            io.emit("pauseToggled",paused);
        })
        socket.on("setFrame", (frameValue)=>{
            setFrame(frameValue);
        })
        socket.on("moveAndResize", (sizeObject)=>{
            pictureProperties = sizeObject;
            io.emit("setImageProps", pictureProperties);
        })
        
        socket.on("makeDefault", (pictureProps)=>{
            pictureProperties = pictureProps;
            config["image-settings"] = pictureProperties;
            console.log("writing to config file, do not close program...");
            fs.writeFileSync(configPath, JSON.stringify(config));
            console.log("writing complete");
        })
    })

    // Port Number
    const port = 8888;
    // Server setup
    server.listen(port, () => {
        console.log(`MonitorBG is listening on PORT ${port}`);
        console.log('Access the display by typing the following into any web browser: ');
    for( key in target){
        console.log(`${target[key]}:${port} (for ${key})`);
    }
        console.log(`or simply localhost:${port}, for this computer`);
    console.log('Connect DragonFrame by going to scene -> connections -> add connection, selecting "JSON" from the top down list, entering the folliwng into the text box, and then pressing "connect"');
    console.log(`127.0.0.1:${port}`);
        console.log("Use ctrl+c to quit at any time");
    })
    UDPserver.bind(port);
    open(`http://localhost:${port}/controller`);
    
}

