'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('Glasswork material reaches 4.5 contrast for dark, light and busy photos in both kinds',async()=>{
 const {materialForPixels}=await import('../source/js/glass-material.mjs');
 for(const pixels of [[[0,0,0]],[[255,255,255]],[[127,127,127]],[[0,0,0],[255,255,255],[255,0,0],[0,255,255]]])
 for(const kind of ['light','dark']){const m=materialForPixels(pixels,null,kind);assert.ok(m.minContrast>=4.5,`${kind}: ${m.minContrast}`);assert.ok(m.alpha<=1);}
});
test('Glasswork chooses light ink over dark photos and dark ink over bright photos',async()=>{
 const {materialForPixels}=await import('../source/js/glass-material.mjs');
 assert.equal(materialForPixels([[0,0,0]]).kind,'dark');assert.equal(materialForPixels([[255,255,255]]).kind,'light');
});
