window.onload = () => {
    const socket = io();
    const noJSwarning = document.getElementById("no-js-warning");
    noJSwarning.style.display = "none";
    const frameCount = document.getElementById("frame-count");
    const frameSubmit = document.getElementById("frame-submit");
    const pauseButton = document.getElementById("pause");
    const pauseStatusDisplay = document.getElementById("pause-status");
    const xPositionForm = document.getElementById("x-position");
    const yPositionForm = document.getElementById("y-position");
    const sizeForm = document.getElementById("size");
    const colorForm = document.getElementById("color");
    const defaultButton = document.getElementById("default-button");
    const blurForm = document.getElementById("blur");
    let pictureProperties = {
        x: 0,
        y: 0,
        size: 0,
        color: '#000000'
    }
    pauseButton.addEventListener("click",()=>{
        socket.emit("togglePause");
    })
    frameSubmit.addEventListener("click",()=>{
        socket.emit("setFrame",frameCount.value);
    })
    function sendUpdatedAttributes(){
        socket.emit("moveAndResize",pictureProperties);
    }
    blurForm.addEventListener("change",()=>{
        pictureProperties.blur = blurForm.value;
        sendUpdatedAttributes();
    })
    xPositionForm.addEventListener("change",()=>{
        pictureProperties.x = xPositionForm.value;
        sendUpdatedAttributes();
    });
    yPositionForm.addEventListener("change",()=>{
        pictureProperties.y = yPositionForm.value;
        sendUpdatedAttributes();
    });
    sizeForm.addEventListener("change",()=>{
        pictureProperties.size = sizeForm.value;
        sendUpdatedAttributes();
    });
    colorForm.addEventListener("change", () => {
        pictureProperties.color = colorForm.value;
        sendUpdatedAttributes();
    })
    defaultButton.addEventListener("click", () => {
        socket.emit("makeDefault", pictureProperties);
    })
    
    socket.on("setImageProps",(props) => {
        pictureProperties = props;
        xPositionForm.value = pictureProperties.x;
        yPositionForm.value = pictureProperties.y;
        sizeForm.value = pictureProperties.size;
        colorForm.value = pictureProperties.color;
    })
    socket.on("frameChange", (frameNumber)=>{
        frameCount.value = frameNumber;
    })
    socket.on("pauseToggled",(pauseStatus)=>{
        console.log("Pause Status:" + pauseStatus)
        if(pauseStatus){
            pauseStatusDisplay.innerHTML = "Background is paused";
        } else {
            pauseStatusDisplay.innerHTML = "Background is not paused";
        }
    })
}
