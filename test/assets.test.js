'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ejs=require('ejs');

const head=fs.readFileSync(require.resolve('../layout/_partial/head.ejs'),'utf8');
const footer=fs.readFileSync(require.resolve('../layout/_partial/after-footer.ejs'),'utf8');
const glasswork=fs.readFileSync(require.resolve('../source/js/glasswork.js'),'utf8');
const config=fs.readFileSync(require.resolve('../_config.yml'),'utf8');
const packageJson=require('../package.json'),packageLock=require('../package-lock.json');
const version=config.match(/^version:\s*(\S+)$/m)?.[1];

function renderHead(version){
  return ejs.render(head,{
    theme:{version},config:{title:'Gallery'},page:{path:''},
    is_archive:()=>false,is_post:()=>false,strip_html:value=>value,
    gallery_media:()=>({cover:null}),full_url_for:value=>`https://example.test/${value}`,
    url_for:value=>`/${value}`
  });
}

function renderFooter(version){
  return ejs.render(footer,{
    theme:{version},url_for:value=>`/${value}`,
    partial:()=>''
  });
}

test('theme assets use the configured version as a cache key',()=>{
  assert.ok(version);
  assert.equal(packageJson.version,version);
  assert.equal(packageLock.version,version);
  assert.equal(packageLock.packages[''].version,version);
  const html=renderHead(version)+renderFooter(version);
  for(const asset of ['css/gallery.css','css/glasswork.css','js/liquid-glass.js','js/gallery-motion.js','js/gallery.js','js/glasswork.js']){
    assert.match(html,new RegExp(`${asset.replaceAll('.','\\.')}\\?v=${version.replaceAll('.','\\.')}`));
  }
  assert.match(glasswork,/new URL\(import\.meta\.url\)\.searchParams\.get\('v'\)/);
  for(const module of ['vendor/glasswork/lens.mjs','vendor/glasswork/adapt.mjs','vendor/glasswork/refract.mjs','glass-material.mjs']){
    assert.ok(glasswork.includes(`import(\`./${module}\${suffix}\`)`),`${module} must inherit the entry module cache key`);
  }
});
