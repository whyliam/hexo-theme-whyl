'use strict';
// Keep the legacy photos: [video, poster] format, and allow richer image metadata.
const videoPattern = /\.(mp4|webm|ogv|mov)(?:[?#]|$)/i;
function mediaUrl(value) {
  const url = String(value || '').trim();
  if (!url || /^(?!https?:)[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('//')) return '';
  // These are the original site's image/video origins; both support HTTPS.
  return url.replace(/^http:\/\/(pics|video)\.naaln\.com\//i, 'https://$1.naaln.com/');
}
function galleryMedia(post) {
  let photos = post.photos || [];
  if (!Array.isArray(photos)) photos = [photos];
  const normalized = photos.map(photo => {
    const item = typeof photo === 'string' ? {src: photo} : (photo || {});
    const src = mediaUrl(item.src || item.url);
    return {src, alt: item.alt || post.title || '', width: Number(item.width) || null,
      height: Number(item.height) || null, position: /^\d{1,3}% \d{1,3}%$/.test(item.position || '') ? item.position : '50% 50%'};
  }).filter(photo => photo.src);
  const video = normalized.find(photo => videoPattern.test(photo.src));
  const images = normalized.filter(photo => !videoPattern.test(photo.src));
  const inline = String(post.content || '').match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  const explicit = typeof post.cover === 'string' ? {src: mediaUrl(post.cover)} : post.cover;
  const cover = explicit && mediaUrl(explicit.src) ? Object.assign({position: '50% 50%', alt: post.title || ''}, explicit, {src: mediaUrl(explicit.src)}) : images[0] || (inline ? {src: mediaUrl(inline[1]), alt: post.title || '', position: '50% 50%'} : null);
  return {images, video: video || null, cover};
}
hexo.extend.helper.register('gallery_media', galleryMedia);
hexo.extend.helper.register('gallery_url', mediaUrl);
