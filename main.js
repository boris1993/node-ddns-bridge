const http = require("http");
const url = require("url");
const cloudflareHandler = require("./cloudflare");

const PORT = 8080;

const server = http.createServer(async (req, res) => {
    let urlParts = url.parse(req.url, true);
    switch (urlParts.pathname) {
        case "/cloudflare":
            const {zoneId, token, domain, address} = urlParts.query;

            let [status, message] = await cloudflareHandler.handle(zoneId, token, domain, address);
            res.writeHead(status).end(message);
            return;
        case "/healthcheck":
            res.writeHead(200).end("ok");
            return;
        default:
            res.writeHead(404).end("badagent");
            return;
    }
});

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
