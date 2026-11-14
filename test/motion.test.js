'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), vm=require('node:vm'),fs=require('node:fs');
function setup(native=false,reduced=false){
 const listeners={},classes=new Set(),timers=[],assigned=[];
 const window={addEventListener:(name,fn)=>listeners[name]=fn};if(native)window.onpageswap=null;
 vm.runInNewContext(fs.readFileSync(require.resolve('../source/js/gallery-motion.js'),'utf8'),{window,matchMedia:()=>({matches:reduced}),document:{addEventListener:(name,fn)=>listeners[name]=fn,documentElement:{classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)}}},location:{href:'https://example.com/',origin:'https://example.com',pathname:'/',search:'',assign:v=>assigned.push(v)},URL,setTimeout:fn=>timers.push(fn)});
 return {listeners,classes,timers,assigned};
}
function click(state,href,extra={}){
 let prevented=false;const link={href,target:'',hasAttribute:()=>false};
 state.listeners.click?.({target:{closest:()=>link},button:0,preventDefault:()=>prevented=true,...extra});return prevented;
}
test('native transitions leave navigation to the browser',()=>assert.equal(setup(true).listeners.click,undefined));
test('fallback fades then navigates and clears state on history restoration',()=>{
 const s=setup();assert.equal(click(s,'https://example.com/albums/'),true);assert.ok(s.classes.has('page-leaving'));s.timers[0]();assert.equal(s.assigned[0],'https://example.com/albums/');s.listeners.pageshow();assert.equal(s.classes.size,0);
});
test('modified clicks, external links, anchors and reduced motion keep default behavior',()=>{
 assert.equal(click(setup(),'https://other.example/'),false);
 assert.equal(click(setup(),'https://example.com/#albums'),false);
 assert.equal(click(setup(),'https://example.com/albums/',{ctrlKey:true}),false);
 assert.equal(click(setup(false,true),'https://example.com/albums/'),false);
});
