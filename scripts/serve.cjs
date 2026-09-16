// tiny static server for local preview: node scripts-serve.cjs [port]
const http=require("http"),fs=require("fs"),path=require("path");
const root=path.join(__dirname,".."),port=+(process.argv[2]||5178);
const types={".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".svg":"image/svg+xml",".json":"application/json"};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split("?")[0]); if(p==="/")p="/index.html";
  const f=path.join(root,p);
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end("not found");}
  res.writeHead(200,{"Content-Type":types[path.extname(f)]||"application/octet-stream","Cache-Control":"no-store"});
  fs.createReadStream(f).pipe(res);
}).listen(port,"127.0.0.1",()=>console.log("http://127.0.0.1:"+port));
