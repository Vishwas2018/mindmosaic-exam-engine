import http from "node:http";
const DELAY = Number(process.argv[2] || 40000);
http.createServer((req, res) => {
  const forward = () => {
    const p = http.request({ host: "127.0.0.1", port: 3400, path: req.url, method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    p.on("error", () => res.destroy());
    req.pipe(p);
  };
  if (req.url.startsWith("/_next/image")) setTimeout(forward, DELAY); else forward();
}).listen(3401, () => console.log("slow proxy up"));
