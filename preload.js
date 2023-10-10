//require our dependencies
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
let configLoaded = false;
let listBuilt = false;
let DOMloaded = false;
let imgSqnces;
let config;

/* Ask for our data */ 
ipcRenderer.send('SendData');
/* Building the startup screen */
ipcRenderer.on('diahrrea', (event, args)=>{
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
            alert("please enter a name for the new image sequence");
        } else {
            ipcRenderer.send('hey-open-my-dialog-now',{name:newName});
        }
    })

        Object.keys(imgSqnces).forEach((key) => {
        li = document.createElement("li");
        li.innerHTML = `${key} <br/>`// <button>Use Image Sequence</button> <button>Delete Image Sequence</button> <br/>`;
        useButton = document.createElement("button");
        useButton.innerHTML = 'Use Image Sequence';
        useButton.addEventListener('click',()=>{
            ipcRenderer.send('start-server',{name:key});
        });
        li.appendChild(useButton);
        deleteButton = document.createElement("button");
        deleteButton.innerHTML = 'Delete Image Sequence';
        deleteButton.addEventListener('click',()=>{
            ipcRenderer.send('delete-sequence',{name:key});
            //li.remove();
        });
        li.appendChild(deleteButton);
        


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


