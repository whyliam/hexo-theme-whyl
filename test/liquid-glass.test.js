'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {coverMapping,intersection}=require('../source/js/liquid-glass');
test('landscape photo crops horizontally in a portrait box with chosen focal point',()=>{
 const m=coverMapping(2400,1600,400,600,.75,.5);
 assert.deepEqual(m,{width:900,height:600,x:-375,y:0});
 // Same pixel under the centre of the capsule samples the identical source UV.
 const imageX=300, localX=60;assert.equal((imageX+localX-m.x)/m.width,735/900);
});
test('portrait photo crops vertically on desktop',()=>assert.deepEqual(coverMapping(800,1200,1200,600,.5,.25),{width:1200,height:1800,x:0,y:-300}));
test('matching aspect ratio keeps origin stable at every focal point',()=>{
 for(const position of [0,.5,1])assert.deepEqual(coverMapping(2400,1600,1200,800,position,position),{width:1200,height:800,x:0,y:0});
});
test('cropping keeps original aspect ratio across mobile resize',()=>{
 for(const [w,h] of [[1280,595],[350,394],[280,315]]){
  const m=coverMapping(2400,1600,w,h,.5,.5);assert.ok(m.width>=w&&m.height>=h);assert.equal(m.width/m.height,1.5);
 }
});
test('photo coverage enters a sticky glass surface continuously at its edge',()=>{
 const header={left:0,top:20,right:1200,bottom:96};
 assert.equal(intersection(header,{left:0,top:96,right:1200,bottom:700}),null);
 const one=intersection(header,{left:0,top:95,right:1200,bottom:700});
 const two=intersection(header,{left:0,top:94,right:1200,bottom:700});
 assert.equal(one.height,1);
 assert.equal(two.height,2);
 assert.equal(two.width,one.width);
});
