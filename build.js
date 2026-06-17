const fs = require('fs');

const html = fs.readFileSync('src/index.html', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8');
const js = fs.readFileSync('src/main.js', 'utf8');

let outHtml = html.replace('<link rel="stylesheet" href="/src/style.css">', `<style>\n${css}\n</style>`);
outHtml = outHtml.replace('<script type="module" src="/src/main.js"></script>', `<script type="module">\n${js}\n</script>`);

fs.writeFileSync('index.html', outHtml);
console.log('Built standalone HTML to ./index.html');
