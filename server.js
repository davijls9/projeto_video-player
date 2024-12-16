const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Diretórios do servidor
const ROOT_DIR = __dirname;
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const STATIC_DIR = path.join(ROOT_DIR, 'static');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');

// Função para servir arquivos estáticos
function serveStatic(filePath, res) {
    const ext = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.mp4': 'video/mp4',
    }[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

// Função para servir arquivos de vídeo com streaming
function serveVideo(filePath, res, req) {
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            console.error("Arquivo não encontrado ou erro ao acessar:", filePath);
            res.writeHead(404);
            res.end('404 Not Found');
            return;
        }

        const range = req.headers.range;
        const fileSize = stats.size;

        if (range) {
            const [start, end] = range.replace(/bytes=/, '').split('-');
            const chunkStart = parseInt(start, 10);
            const chunkEnd = end ? parseInt(end, 10) : fileSize - 1;
            const chunkSize = chunkEnd - chunkStart + 1;

            console.log(`Servindo vídeo com range: ${chunkStart}-${chunkEnd} (${chunkSize} bytes)`);

            res.writeHead(206, {
                'Content-Range': `bytes ${chunkStart}-${chunkEnd}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
            });

            const stream = fs.createReadStream(filePath, { start: chunkStart, end: chunkEnd });
            stream.pipe(res);

            stream.on('error', (streamErr) => {
                console.error("Erro no streaming do vídeo:", streamErr);
                res.end();
            });
        } else {
            console.log(`Servindo vídeo inteiro (${fileSize} bytes)`);
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            });

            const stream = fs.createReadStream(filePath);
            stream.pipe(res);

            stream.on('error', (streamErr) => {
                console.error("Erro no streaming do vídeo:", streamErr);
                res.end();
            });
        }
    });
}

// Servidor HTTP
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    if (parsedUrl.pathname === '/' && method === 'GET') {
        const videoFiles = fs.readdirSync(UPLOADS_DIR).filter(file => file.endsWith('.mp4'));
        const videoList = videoFiles.map(file => `<li><a href="/play/${file}">${file}</a></li>`).join('');
        const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.html'), 'utf8');
        const html = template.replace('{{videos}}', videoList);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);

    } else if (parsedUrl.pathname.startsWith('/play/') && method === 'GET') {
        const fileName = parsedUrl.pathname.replace('/play/', '');
        const videoPath = `/uploads/${fileName}`;
        const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'player.html'), 'utf8');
        const html = template.replace('{{video_url}}', videoPath);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);

    } else if (parsedUrl.pathname.startsWith('/uploads/') && method === 'GET') {
        const videoFile = path.join(UPLOADS_DIR, parsedUrl.pathname.replace('/uploads/', ''));
        serveVideo(videoFile, res, req);

    } else if (parsedUrl.pathname.startsWith('/static/') && method === 'GET') {
        const staticFile = path.join(STATIC_DIR, parsedUrl.pathname.replace('/static/', ''));
        serveStatic(staticFile, res);

    } else {
        res.writeHead(404);
        res.end('404 Not Found');
    }
});

// Inicializa o servidor
server.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
