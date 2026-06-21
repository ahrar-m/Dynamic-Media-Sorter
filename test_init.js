const fs = require('fs');

const html = fs.readFileSync('src/index.html', 'utf8');
const script = fs.readFileSync('src/main.js', 'utf8');

const idRegex = /id=["']([^"']+)["']/g;
const htmlIds = new Set();
let match;
while ((match = idRegex.exec(html)) !== null) {
    htmlIds.add(match[1]);
}

const getElementRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let errorFound = false;
while ((match = getElementRegex.exec(script)) !== null) {
    if (!htmlIds.has(match[1])) {
        console.error("Missing ID in HTML:", match[1]);
        errorFound = true;
    }
}

if (!errorFound) console.log("All getElementById calls map to valid HTML IDs.");

// check classList or addEventListener calls on elements mapping to see if there's an obvious bug
