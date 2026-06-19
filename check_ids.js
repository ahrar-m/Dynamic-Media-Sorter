const fs = require('fs');

const mainJs = fs.readFileSync('src/main.js', 'utf8');
const indexHtml = fs.readFileSync('src/index.html', 'utf8');

const regex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const missing = [];
while ((match = regex.exec(mainJs)) !== null) {
    const id = match[1];
    if (!indexHtml.includes('id="' + id + '"') && !indexHtml.includes("id='" + id + "'")) {
        missing.push(id);
    }
}
console.log("Missing IDs in index.html:", missing);
