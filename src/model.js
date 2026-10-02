import * as Y from 'yjs';
export const LOCAL='local-edit';
export function addShape(doc,id,type,x,y,color){
 const map=doc.getMap('shapes');doc.transact(()=>{const shape=new Y.Map();for(const [k,v] of Object.entries({type,x,y,color,text:type==='note'?'New idea':'',w:190,h:120}))shape.set(k,v);map.set(id,shape)},LOCAL);
}
export function changeShape(doc,id,values){doc.transact(()=>{const shape=doc.getMap('shapes').get(id);if(shape)for(const [k,v] of Object.entries(values))shape.set(k,v)},LOCAL)}
export function removeShape(doc,id){doc.transact(()=>doc.getMap('shapes').delete(id),LOCAL)}
