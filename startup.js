const {app, BrowserWindow, dialog, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');
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
if (!fs.existsSync(path.join(process.cwd(), 'config.json'))){
  fs.writeFileSync(path.join(process.cwd(), 'config.json'),JSON.stringify(blankConfig));
}
const configPath = path.join(process.cwd(), 'config.json');
const config = require(configPath);

function updateConfigFile(){
  fs.writeFileSync(configPath, JSON.stringify(config));
}

/* Electron stuff */
let mainWindow = null;
function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    })
  
    // and load the index.html of the app.
    mainWindow.loadFile('startUp.html')
  
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
      mainWindow.webContents.send('refresh')

    });
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
    if (process.platform !== 'darwin') app.quit()
  })