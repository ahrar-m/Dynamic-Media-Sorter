const fs = require('fs');

const script = fs.readFileSync('src/main.js', 'utf8');

const regex = /elements\.([a-zA-Z0-9_]+)\.addEventListener/g;
let match;
const listeners = new Set();
while ((match = regex.exec(script)) !== null) {
    listeners.add(match[1]);
}

const bindElementsBody = script.match(/elements = \{([\s\S]+?)\};/)[1];

for (const listener of listeners) {
    if (!bindElementsBody.includes(listener + ":")) {
        console.log("Found listener for element not in bindElements:", listener);
    }
}
console.log("Done checking.");
