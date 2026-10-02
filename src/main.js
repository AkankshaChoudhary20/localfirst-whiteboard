import * as Y from 'yjs';import {addShape,changeShape,removeShape,LOCAL} from './model.js';import {openDatabase,loadRoom,saveRoom} from './persistence.js';import './style.css';
const $=id=>document.getElementById(id),canvas=$('board'),ctx=canvas.getContext('2d');
const room=new URL(location.href).searchParams.get('room')||'studio';
if(!/^[a-z0-9-]{1,64}$/.test(room))throw Error('Invalid room name.');$('room').value=room;
const doc=new Y.Doc(),shapes=doc.getMap('shapes'),undo=new Y.UndoManager(shapes,{trackedOrigins:new Set([LOCAL])});
let selected='',socket,reconnect,drag=null,preview=null,lastCursor=0,peers={},db;
const myId=crypto.randomUUID(),myColor=['#0e7490','#a21caf','#166534'][Math.floor(Math.random()*3)];
function status(text){$('status').textContent=text}
function send(data){if(socket?.readyState===WebSocket.OPEN)socket.send(data)}
function connect(){
 if($('offline').checked)return;
 status('Connecting…');socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/room/${room}`);socket.binaryType='arraybuffer';
 socket.onopen=()=>{send(Y.encodeStateAsUpdate(doc));status('Connected · changes sync live')};
 socket.onmessage=e=>{try{if(typeof e.data==='string'){const data=JSON.parse(e.data);if(data.type==='presence'){peers=data.peers;draw()}}else Y.applyUpdate(doc,new Uint8Array(e.data),'remote')}catch{status('Sync error; local changes retained')}};
 socket.onclose=()=>{peers={};draw();status($('offline').checked?'Offline · saved in this browser':'Disconnected · retrying');if(!$('offline').checked)reconnect=setTimeout(connect,2000)};
 socket.onerror=()=>status('Server unavailable · local editing works');
}
function draw(){
 ctx.clearRect(0,0,1600,1000);ctx.fillStyle='#fafcfd';ctx.fillRect(0,0,1600,1000);ctx.fillStyle='#d4e0e6';for(let x=20;x<1600;x+=30)for(let y=20;y<1000;y+=30){ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill()}
 for(const [id,shape] of shapes){if(!(shape instanceof Y.Map))continue;const s=shape.toJSON();if(preview?.id===id){s.x=preview.x;s.y=preview.y}if(!Number.isFinite(s.x)||!Number.isFinite(s.y))continue;ctx.fillStyle=s.color||'#fde68a';ctx.strokeStyle=id===selected?'#0e7490':'#9fb2bb';ctx.lineWidth=id===selected?4:1;ctx.beginPath();if(s.type==='circle')ctx.ellipse(s.x+s.w/2,s.y+s.h/2,s.w/2,s.h/2,0,0,Math.PI*2);else ctx.rect(s.x,s.y,s.w,s.h);ctx.fill();ctx.stroke();ctx.fillStyle='#172b36';ctx.font='18px system-ui';const words=String(s.text||'').split(' ');let line='',row=0;for(const word of words){if(ctx.measureText(line+word).width>s.w-24&&line){ctx.fillText(line,s.x+12,s.y+30+row*24,s.w-24);line='';row++;if(row>2)break}line+=word+' '}ctx.fillText(line,s.x+12,s.y+30+row*24,s.w-24)}
 for(const [id,p] of Object.entries(peers)){if(id===myId||!Number.isFinite(p.x))continue;ctx.fillStyle=p.color||'#0e7490';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+10,p.y+20);ctx.lineTo(p.x+15,p.y+10);ctx.closePath();ctx.fill();ctx.font='12px system-ui';ctx.fillText('Collaborator',p.x+18,p.y+20)}
}
function list(){const options=[new Option('None','')];for(const [id,s] of shapes){if(s instanceof Y.Map)options.push(new Option(`${s.get('type')} · ${String(s.get('text')||id).slice(0,35)}`,id))}$('objects').replaceChildren(...options);if(!shapes.has(selected))selected='';$('objects').value=selected;if(document.activeElement!==$('text'))$('text').value=shapes.get(selected)?.get('text')||'';draw()}
function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*1600,y:(e.clientY-r.top)/r.height*1000}}
function clamp(x,y){return {x:Math.max(0,Math.min(1410,x)),y:Math.max(0,Math.min(880,y))}}
canvas.onpointerdown=e=>{const p=point(e);if($('tool').value!=='select'){selected=crypto.randomUUID();const pos=clamp(p.x,p.y);addShape(doc,selected,$('tool').value,pos.x,pos.y,$('color').value);$('tool').value='select';list();return}selected='';for(const [id,s] of [...shapes].reverse()){if(!(s instanceof Y.Map))continue;const v=s.toJSON();if(p.x>=v.x&&p.x<=v.x+v.w&&p.y>=v.y&&p.y<=v.y+v.h){selected=id;drag={id,dx:p.x-v.x,dy:p.y-v.y};canvas.setPointerCapture(e.pointerId);break}}list()};
canvas.onpointermove=e=>{const p=point(e);if(drag){preview={id:drag.id,...clamp(p.x-drag.dx,p.y-drag.dy)};draw()}if(Date.now()-lastCursor>50){send(JSON.stringify({type:'cursor',id:myId,...p,color:myColor}));lastCursor=Date.now()}};
canvas.onpointerup=()=>{if(preview){changeShape(doc,preview.id,{x:preview.x,y:preview.y})}drag=null;preview=null;draw()};canvas.onpointercancel=()=>{drag=null;preview=null;draw()};
$('objects').onchange=()=>{selected=$('objects').value;list()};$('update').onclick=()=>{if(selected)changeShape(doc,selected,{text:$('text').value})};$('delete').onclick=()=>{if(selected)removeShape(doc,selected)};$('undo').onclick=()=>undo.undo();$('redo').onclick=()=>undo.redo();
for(const [id,dx,dy] of [['left',-10,0],['right',10,0],['up',0,-10],['down',0,10]])$(id).onclick=()=>{const s=shapes.get(selected);if(s)changeShape(doc,selected,clamp(s.get('x')+dx,s.get('y')+dy))};
$('offline').onchange=()=>{clearTimeout(reconnect);if($('offline').checked){socket?.close();status('Offline · saved in this browser')}else connect()};
$('join').onclick=()=>{if(!/^[a-z0-9-]{1,64}$/.test($('room').value)){$('message').textContent='Use 1–64 lowercase letters, digits or hyphens.';return}location.href='/?room='+$('room').value};
$('export').onclick=()=>{const a=document.createElement('a');a.download=room+'.png';a.href=canvas.toDataURL('image/png');a.click()};
try{db=await openDatabase();const saved=await loadRoom(db,room);if(saved)Y.applyUpdate(doc,new Uint8Array(saved),'load');doc.on('update',(update,origin)=>{saveRoom(db,room,Y.encodeStateAsUpdate(doc)).catch(()=>status('Local save failed; export your work'));if(origin!=='remote')send(update)});shapes.observeDeep(list);list();connect()}catch(error){status('Local storage unavailable');$('message').textContent=error.message}
if(import.meta.env.PROD&&'serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{$('message').textContent='Offline page caching unavailable; keep this tab open.'});
