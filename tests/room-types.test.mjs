import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Rooms} from '../server/rooms.mjs';
test('room identifiers require strings rather than coerced objects',()=>{
 const rooms=new Rooms('/unused');
 for(const name of [null,true,123,['board'],{toString(){return 'board';}}])assert.throws(()=>rooms.get(name),/Invalid room/);
 const doc=rooms.get('board');assert.equal(rooms.get('board'),doc);doc.destroy();
});
