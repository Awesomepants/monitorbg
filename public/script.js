var socket = io();
window.onload = () => {
    const image = document.getElementById("bg-image");
    const elem = document.body;
    const fullscreenButton = document.getElementById("fullScreenButton");
    
let imageProps = {
    x:0,
    y:0,
    size: 100,
    color: "#000000"
}
socket.on("setImageProps", (props) => {
    imageProps = props;
    console.log("eyy");
    image.style.filter = `blur(${imageProps.blur/10}px)`
    image.style.left = `${imageProps.x}px`;
    image.style.top =  `${imageProps.y * -1}px`;
    image.style.height = `${imageProps.size}px`;
    document.body.style.backgroundColor = imageProps.color;
    
})
socket.on("frameChange", () => {
    console.log("frameChange");
    image.src=`/latestFrame?${new Date().getTime()}`;
})
function openFullscreen() {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }
  }
  image.addEventListener("click", openFullscreen);


}
