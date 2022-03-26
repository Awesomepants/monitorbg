const express = require('express')
const cors = require('cors')
const morgan = require('morgan');

let frameCount = 0;
// Creating express app 
const app = express()

app.use(cors());
app.use(morgan('dev'));



app.get('/connect',(req, res) => {
    res.json('Connection was successful');
})
app.get('/advanceFrame',(req, res) => {
    frameCount ++;
    res.json(frameCount);
})
app.get('/deletePreviousFrame',(req, res) => {
    frameCount --;
    res.json(frameCount);
})
app.post('/setFrame', (req, res) => {

})

// Port Number
const port = 81;

// Server setup
app.listen(port, () => {
    console.log(`Server running on port ${port}.`)
});