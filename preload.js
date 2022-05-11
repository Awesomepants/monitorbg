//require our dependencies
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
let configLoaded = false;
let listBuilt = false;
let DOMloaded = false;
let imgSqnces;
let config;

/* Building the startup screen */
ipcRenderer.on('diahrrea', (event, args)=>{
    console.log("DIAHREA BETTER WIPE");
    config = args.config;
    imgSqnces = config.imageSequences;
    configLoaded = true;
    if(DOMloaded && !listBuilt){
        buildSequenceList();
    }
})
const buildSequenceList = () => {
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
    listBuilt = true;


}
window.addEventListener("DOMContentLoaded", () => {
    DOMloaded = true;
    if(configLoaded && !listBuilt){
        buildSequenceList();
    }
})

ipcRenderer.on('refresh',() => {
    window.location.reload(true);
})


