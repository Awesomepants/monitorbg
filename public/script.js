var socket = io();
const image = document.getElementById("bg-image-wrapper");
/*fetch('/latestFrame')
.then((res) => {
    console.log(JSON.parse(res))
    image.innerHTML = '<img id="bg-image" src="/latestFrame"/>';
})*/
socket.on("frameChange", () => {
    window.location.reload(false);
})