const config = require('./config.json');
console.log(JSON.stringify(config.imageSequences["Nessie"]));
console.log(JSON.parse(JSON.stringify(config.imageSequences["Nessie"])));