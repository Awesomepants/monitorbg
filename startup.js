//imports

const {app, BrowserWindow, dialog, ipcMain} = require('electron');
if(require('electron-squirrel-startup')) app.quit();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const udp = require('dgram');
const { Buffer } = require('buffer');
const target = require('./getIPaddress');
const open = require('open');


//variables and constants
let switchingModes = false;
let pictureProperties = {
  x:0,
  y:0,
  size:720,
  color:"#000000"
}

const blankConfig = {
  "imageSequences":{},
  "lastImageSequence":"",
  "image-settings":{
      "x":0,
      "y":0,
      "size":720,
      "color":"#000000",
      "blur":0
  }
}
if (!fs.existsSync(path.join(__dirname, 'config.json'))){
  fs.writeFileSync(path.join(__dirname, 'config.json'),JSON.stringify(blankConfig));

}
const configPath = path.join(__dirname, 'config.json');
const config = require(configPath);
  // Port Number
  const port = 8888;
function updateConfigFile(){
  fs.writeFileSync(configPath, JSON.stringify(config));
  //mainWindow.webContents.send('refresh');
}
pictureProperties = config["image-settings"];
// The code that gets run once the image sequence has been selected and it's time to switch from sequence choosing mode to server running mode

function runServer(sqnceName){
  let images = config.imageSequences[sqnceName];
   // Creating express app 
  const expressServer = express();
  const server = http.createServer(expressServer);
  expressServer.use(cors());

  console.log('Indexing Complete');
  let frameCount = 0;

  const io = new Server(server);
  
  

  expressServer.use(express.static(path.join(__dirname, 'public')));

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
      res.sendFile(images[frameCount]);
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
      //const UDPport = UDPaddress.port;
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


  // Server setup
  server.listen(port, () => {
    UDPserver.bind(port);
    mainWindow.close();
    createControllerWindow();
    open(`http://localhost:${port}`);
    switchingModes = false;
  })
  
 
}

/* Electron stuff */
let mainWindow = null;
function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      icon: __dirname + '/icon.ico',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    })
  
    // and load the index.html of the app.
    mainWindow.loadFile('startUp.html')
  
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
  }
  function createControllerWindow () {
    // Create the browser window.
    controllerWindow = new BrowserWindow({
      width: 600,
      height: 720,
      icon: __dirname + '/icon.ico',
    })
  
    // and load the index.html of the app.
    controllerWindow.loadURL(`http://localhost:${port}/controller`)
  
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
  }
  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow()
    ipcMain.on('hey-open-my-dialog-now', async (event, args) => {
      const name = args.name;
      const sequence = await dialog.showOpenDialog({properties: ['openFile', 'multiSelections']});
      config.imageSequences[name] = sequence.filePaths;
      updateConfigFile();
      mainWindow.webContents.send('refresh');

    });
    ipcMain.on('start-server', (event, args) => {
      switchingModes = true;
      const sequenceName = args.name;
      runServer(sequenceName);
    });
    ipcMain.on('delete-sequence', (event, args) => {
      const sequenceName = args.name;
      if(config.imageSequences[sequenceName]){
        delete config.imageSequences[sequenceName];
        updateConfigFile();
        mainWindow.webContents.send('refresh');
        
      }
    })
    ipcMain.on('SendData',(event, args) => {
      mainWindow.webContents.send('diahrrea', {config});
    })
    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
    
  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin' && !switchingModes) app.quit()
  })

