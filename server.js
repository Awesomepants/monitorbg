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
const readline = require('readline');
const target = require('./getIPaddress');
const blankConfig = {
    "imageSequences":{},
    "lastImageSequence":""
}
// read in our configuration file
if (!fs.existsSync('./config.json')){
    fs.writeFileSync('./config.json',JSON.stringify(blankConfig));
}
const configPath = './config.json'
const config = require(configPath);
let neededPath;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
let invalidName = true;
function updateConfigFile(){
    fs.writeFileSync(configPath, JSON.stringify(config));
}
console.log("Welcome to MonitorBG!");
rl.question("To start, enter the name of an existing image sequence, type 'list' to output a list of image Sequences, type 'new' to make a new image sequence, or type 'run' to run the server with the last image sequence given: ",(input) => {
    if(config.imageSequences[input]){
        neededPath = JSON.parse(config.imageSequences[input]);
        console.log('step1');
        config.lastImageSequence = config.imageSequences[input];
        console.log('step2');
        updateConfigFile();
        console.log('step3');
        runServer();
    } else if (input === 'list') {
        console.log("Here are all the (case sensitive!) image sequences to choose from: ");
        Object.keys(config.imageSequences).forEach((key) => {
            console.log(`> ${JSON.stringify(key)}`);
        })
        console.log("Press ctrl+c to quit, then restart the program.");
    } else if (input === 'new') {
        rl.question("Please input the absolute file path of the image sequence folder: ", (filePath) => {
            rl.question("Please input the name you would like to use for this image sequence (Note that if you use the name of an existing image sequence, it will be overwritten): ", (sequenceName) => {
                if(sequenceName==="list" || sequenceName==="new" || sequenceName==="run"){
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
    } else if (input === 'run') {
        neededPath = JSON.parse(config.lastImageSequence);
        runServer();
    } else {
        console.log("I can't recognize this command. Press ctrl+c to exit and try again");
        
    }
})
function runServer(){
    const backgrounds = config.imgSequenceFolder;

    let folder = 'imgsqnce/';
    
    let images = [];
    let DFinternalFrame;
    //initializing the images
    
    console.log(neededPath);
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
    // Creating express app 
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);
    
    app.use(cors());
    //app.use(morgan('dev'));
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
    
    // Port Number
    const port = 5000;
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
    
}

