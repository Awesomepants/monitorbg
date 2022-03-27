var socket = io();
const image = document.getElementById("bg-image");
/*fetch('/latestFrame')
.then((res) => {
    console.log(JSON.parse(res))
    image.innerHTML = '<img id="bg-image" src="/latestFrame"/>';
})*/
socket.on("frameChange", () => {
    //const timestamp = new Date().getTime();
    console.log("frameChange");
    //image.src="";
    image.src=`/latestFrame?${new Date().getTime()}`;
})