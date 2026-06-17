const fs = require('fs');

const html = fs.readFileSync('src/index.html', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8');
const js = fs.readFileSync('src/main.js', 'utf8');
const workerJs = fs.readFileSync('src/worker.js', 'utf8');

let outHtml = html.replace(/<link[^>]*rel="stylesheet"[^>]*href=".*?style\.css"[^>]*>/i, `<style>\n${css}\n</style>`);

const jsWithWorker = `window.WORKER_CODE = ${JSON.stringify(workerJs)};\n\n` + js;
outHtml = outHtml.replace(/<script[^>]*type="module"[^>]*src=".*?main\.js"[^>]*><\/script>/i, `<script type="module">\n${jsWithWorker}\n</script>`);

fs.writeFileSync('index.html', outHtml);
console.log('Built standalone HTML to ./index.html');
