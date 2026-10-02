import * as Y from 'yjs';import {existsSync,readFileSync,mkdirSync,writeFileSync,renameSync} from 'node:fs';import {join} from 'node:path';
export class Rooms{
 constructor(dir){this.dir=dir;this.docs=new Map()}
 get(room){if(!/^[a-z0-9-]{1,64}$/.test(room))throw Error('Invalid room');if(this.docs.has(room))return this.docs.get(room);const doc=new Y.Doc(),path=join(this.dir,room+'.bin');if(existsSync(path))Y.applyUpdate(doc,readFileSync(path));doc.on('update',()=>{mkdirSync(this.dir,{recursive:true});writeFileSync(path+'.tmp',Y.encodeStateAsUpdate(doc));renameSync(path+'.tmp',path)});this.docs.set(room,doc);return doc}
}
