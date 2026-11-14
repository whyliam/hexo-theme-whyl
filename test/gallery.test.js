'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const helpers = {};
vm.runInNewContext(fs.readFileSync(require.resolve('../scripts/gallery.js'), 'utf8'), {
  hexo:{extend:{helper:{register(name, fn) { helpers[name] = fn; }}}}
});
test('legacy video arrays use the second image as the poster, not as a second video', () => {
  const result = helpers.gallery_media({title:'旅行', photos:['http://video.naaln.com/trip.mp4?x=1', 'http://pics.naaln.com/poster.jpg']});
  assert.equal(result.video.src, 'https://video.naaln.com/trip.mp4?x=1');
  assert.equal(result.cover.src, 'https://pics.naaln.com/poster.jpg');
  assert.equal(result.images.length, 1);
});
test('each photo keeps its own URL and portrait dimensions', () => {
  const result = helpers.gallery_media({photos:['/one.jpg', {src:'/two.jpg', width:800, height:1200, position:'40% 25%'}]});
  assert.equal(result.images[0].src, '/one.jpg');
  assert.equal(result.images[1].src, '/two.jpg');
  assert.equal(result.images[1].height, 1200);
  assert.equal(result.images[1].position, '40% 25%');
});
test('empty arrays, string photos, inline photos and text-only posts remain usable', () => {
  assert.equal(helpers.gallery_media({photos:[]}).cover, null);
  assert.equal(helpers.gallery_media({photos:'/one.jpg'}).cover.src, '/one.jpg');
  assert.equal(helpers.gallery_media({content:'<p><img src="/inline.jpg" alt=""></p>'}).cover.src, '/inline.jpg');
  assert.equal(helpers.gallery_media({content:'Text only'}).images.length, 0);
});
test('video-like names are not classified as videos without a video extension', () => {
  const result = helpers.gallery_media({photos:['/video-trip.jpg']});
  assert.equal(result.video, null);
  assert.equal(result.cover.src, '/video-trip.jpg');
});
test('unsafe schemes are excluded from generated image links', () => {
  ['javascript:alert(1)', 'data:image/svg+xml,foo', '//untrusted.example/a.jpg'].forEach(src => {
    assert.equal(helpers.gallery_url(src), '');
  });
  assert.equal(helpers.gallery_media({photos:['javascript:alert(1)']}).cover, null);
});
const ejs = require('ejs');
const template = fs.readFileSync(require.resolve('../layout/_partial/post/photos.ejs'), 'utf8');
function renderPhotos(post) {
  return ejs.render(template, {post, gallery_media:helpers.gallery_media, url_for:value=>value});
}
test('rendered multi-photo links remain distinct and escape captions', () => {
  const html = renderPhotos({title:'<A & B>',photos:['/first.jpg','/second.jpg']});
  assert.equal((html.match(/data-lightbox/g) || []).length, 2);
  assert.match(html, /href="\/first\.jpg"/);
  assert.match(html, /href="\/second\.jpg"/);
  assert.match(html, /alt="&lt;A &amp; B&gt;"/);
  assert.match(html, /loading="lazy"/);
});
test('rendered videos use a single correctly typed native source', () => {
  const html = renderPhotos({photos:['/movie.webm?version=2','/poster.jpg']});
  assert.match(html, /poster="\/poster\.jpg"/);
  assert.match(html, /type="video\/webm"/);
  assert.equal((html.match(/<source /g) || []).length, 1);
  assert.equal(renderPhotos({photos:[]}).trim(), '');
});
