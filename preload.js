//require our dependencies
const express = require('express')
const cors = require('cors')
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const udp = require('dgram');
const { Buffer } = require('buffer');
const readline = require('readline');
const target = require('./getIPaddress');
const open = require('open');
const { dialog, ipcRenderer, ipcMain } = require('electron');
/* Code stolen from server.js */
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

if (!fs.existsSync(path.join(process.cwd(), 'config.json'))){
    fs.writeFileSync(path.join(process.cwd(), 'config.json'),JSON.stringify(blankConfig));
}
const configPath = path.join(process.cwd(), 'config.json');
const config = require(configPath);
const imgSqnces = config.imageSequences;
pictureProperties = config["image-settings"];
/* Building the startup screen */

window.addEventListener("DOMContentLoaded", () => {

    const sequenceList = document.getElementById("FART");
    const newSequence = document.getElementById("new-sequence");
    const newNameForm = document.getElementById("name-input");
    newSequence.addEventListener('click', async (event) => {
        event.preventDefault();
        const newName = newNameForm.value;
        if(newName === ""){
            alert("please choose a valid name");
        } else {
            ipcRenderer.send('hey-open-my-dialog-now',{name:newName});
        }
    })
    Object.keys(imgSqnces).forEach((key) => {
        li = document.createElement("li");
        li.innerHTML = `<button> ${key}</button>`;
        li.addEventListener('click',()=>{
            ipcRenderer.send('start-server',{name:key})
        })
        sequenceList.appendChild(li);
    })

})

function updateConfigFile(){
    fs.writeFileSync(configPath, JSON.stringify(config));
}
 

ipcRenderer.on('refresh',() => {
    window.location.reload(true);
})

