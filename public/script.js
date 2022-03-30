var socket = io();
const image = document.getElementById("bg-image");
let imageProps = {
    x:0,
    y:0,
    size: 100,
    color: "#000000"
}
socket.on("setImageProps", (props) => {
    imageProps = props;
    console.log("eyy");
    image.style.left = `${imageProps.x}px`;
    image.style.top =  `${imageProps.y * -1}px`;
    image.style.height = `${imageProps.size}px`;
    document.body.style.backgroundColor = imageProps.color;
    
})
socket.on("frameChange", () => {
    console.log("frameChange");
    image.src=`/latestFrame?${new Date().getTime()}`;
})