'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ejs=require('ejs');
const template=fs.readFileSync(require.resolve('../layout/_partial/header.ejs'),'utf8');
const config=fs.readFileSync(require.resolve('../_config.yml'),'utf8');

function configuredMenu(){
  const block=config.match(/^menu:\n([\s\S]*?)(?=^\S|^# Social)/m)?.[1]||'';
  return Object.fromEntries([...block.matchAll(/^  ([^:#]+):\s*([^#\n]*?)(?:\s+#.*)?$/gm)].map(match=>{
    const value=match[2].trim();return [match[1].trim(),value==='true'?true:value==='false'?false:value];
  }));
}
function render(page={},state={},menu=configuredMenu()){
  return ejs.render(template,{
    theme:{menu,social:{instagram:'https://www.instagram.com/why_liam'}},
    config:{title:'Why·Liam·Gallery'},page:{path:'',...page},url_for:value=>value,
    is_archive:()=>Boolean(state.archive),is_home:()=>Boolean(state.home),is_post:()=>Boolean(state.post),
    is_current:href=>href===state.current
  });
}
function current(html){return html.match(/<a[^>]+aria-current="page"[^>]*>([^<]+)<\/a>/)?.[1]||null;}

test('primary browsing links precede utility and external links',()=>{
  const labels=[...render({}, {home:true}).matchAll(/data-nav-section="[^"]+"[^>]*>([^<]+)<\/a>/g)].map(match=>match[1]);
  assert.deepEqual(labels,['作品','照片','影像','归档','关于','Instagram']);
  assert.match(render({}, {home:true}),/href="\/archives\/"[^>]*data-nav-section="Archives"/);
});
test('navigation exposes the correct parent section on representative pages',()=>{
  assert.equal(current(render({}, {home:true})),'作品');
  assert.equal(current(render({category:'photo'})),'照片');
  assert.equal(current(render({categories:{toArray:()=>[{name:'video'}]}},{post:true})),'影像');
  assert.equal(current(render({}, {archive:true})),'归档');
  assert.equal(current(render({tag:'纽约'})),'作品');
  assert.equal(current(render({path:'404.html'})),null);
});
test('custom menu links retain URL-based current state',()=>{
  assert.equal(current(render({}, {current:'/map/'},{Map:'/map/'})),'Map');
});
