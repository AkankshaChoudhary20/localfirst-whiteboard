import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {extname,resolve,sep} from 'node:path';import {WebSocketServer,WebSocket} from 'ws';import * as Y from 'yjs';import {Rooms} from './rooms.mjs';import {upgradeRoom} from './upgrade.mjs';
const root=resolve('dist'),rooms=new Rooms(process.env.BOARD_DB||'data/rooms'),clients=new Map();
const server=createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const path=resolve(root,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));if(!path.startsWith(root+sep)){res.writeHead(403);res.end();return}const content=await readFile(path);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[extname(path)]||'application/octet-stream');res.end(content)}catch{res.writeHead(404);res.end('Build the app with npm run build before using the production server.')}});
const wss=new WebSocketServer({noServer:true,maxPayload:1024*1024});
server.on('upgrade',(req,socket,head)=>{const room=upgradeRoom(req.url,req.headers.origin,req.headers.host);if(!room){socket.destroy();return}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,room))});
wss.on('connection',(ws,room)=>{
 const doc=rooms.get(room);if(!clients.has(room))clients.set(room,new Set());const set=clients.get(room);set.add(ws);ws.cursor=null;
 const broadcast=(data,binary=false)=>{for(const c of set)if(c.readyState===WebSocket.OPEN)c.send(data,{binary})};
 const presence=()=>broadcast(JSON.stringify({type:'presence',peers:Object.fromEntries([...set].filter(c=>c.cursor).map(c=>[c.cursor.id,c.cursor]))}));
 ws.send(Y.encodeStateAsUpdate(doc),{binary:true});
 ws.on('message',(data,binary)=>{try{if(binary){Y.applyUpdate(doc,new Uint8Array(data),'remote');broadcast(data,true)}else{const c=JSON.parse(data.toString());if(c.type==='cursor'&&typeof c.id==='string'&&c.id.length<80&&Number.isFinite(c.x)&&Number.isFinite(c.y)&&/^#[a-f0-9]{6}$/i.test(c.color)){ws.cursor=c;presence()}}}catch{ws.close(1003,'Invalid update')}});
 ws.on('close',()=>{set.delete(ws);presence()});ws.on('error',()=>ws.close());
});
server.listen(Number(process.env.PORT||1234),'127.0.0.1',()=>console.log('Whiteboard server: http://127.0.0.1:'+(process.env.PORT||1234)));
