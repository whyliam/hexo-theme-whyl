const assetVersion=new URL(import.meta.url).searchParams.get('v');
const suffix=assetVersion?`?v=${encodeURIComponent(assetVersion)}`:'';
const [{liquidGlass,isLensSupported},{sampler},{createRefraction},{materialForPixels}]=await Promise.all([
  import(`./vendor/glasswork/lens.mjs${suffix}`),
  import(`./vendor/glasswork/adapt.mjs${suffix}`),
  import(`./vendor/glasswork/refract.mjs${suffix}`),
  import(`./glass-material.mjs${suffix}`)
]);
const options={rim:40,edge:1.1,power:2.6,dispersion:.15};
const reduced=matchMedia('(prefers-reduced-transparency: reduce)');
const forced=matchMedia('(forced-colors: active)');
const dark=matchMedia('(prefers-color-scheme: dark)');
const states=new Map(),cache=new Map();
let scheduled=0;
const geometry=window.WhyLGlassGeometry;
function suppressed(){return reduced.matches||forced.matches;}
async function readable(img){
  const url=img.currentSrc||img.src;
  if(!url)return null;
  if(!cache.has(url))cache.set(url,(async()=>{
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
    let objectURL;
    try{
      const response=await fetch(url,{mode:'cors',cache:'reload',signal:controller.signal});if(!response.ok)return null;
      objectURL=URL.createObjectURL(await response.blob());const photo=new Image();photo.src=objectURL;await photo.decode();return photo;
    }catch{return null;}finally{clearTimeout(timeout);if(objectURL)URL.revokeObjectURL(objectURL);}
  })());
  return cache.get(url);
}
function underPhotos(el){
  if(el.matches('.liquid-link'))return [document.querySelector('.featured-image img')].filter(Boolean);
  if(el.matches('.media-badge'))return [el.closest('.album-cover')?.querySelector('img')].filter(Boolean);
  if(el.closest('.lightbox'))return []; // These controls sit over the dark dialog, not over its image.
  const r=el.getBoundingClientRect();
  return [...document.querySelectorAll('.featured-image img,.album-cover img,.post-gallery img')]
    .filter(img=>geometry.intersection(r,img.getBoundingClientRect()));
}
function fallbackMaterial(el){
  const kind=el.closest('.lightbox')?'dark':(dark.matches?'dark':'light');
  const pixels=kind==='dark'?[[23,33,39]]:[[242,245,247]];
  return materialForPixels(pixels,null,kind);
}
function apply(el,material){
  el.dataset.kind=material.kind;
  for(const [name,value] of Object.entries({'--gw-density':material.density,'--gw-keep':material.keep,'--gw-floor':material.alpha,'--gw-tint-a':material.alpha,'--gw-ink':`rgb(${material.text.join(' ')})`}))el.style.setProperty(name,String(value));
  el.dataset.glassContrast=material.minContrast.toFixed(3);
}
function add(el){
  if(states.has(el))return;
  const state={lens:null,renderer:null,canvas:null,photo:null,material:fallbackMaterial(el),visible:true,token:0};
  states.set(el,state);el.classList.add('gw-glass');apply(el,state.material);observer.observe(el);resize.observe(el);
}
function decorate(){
  document.querySelectorAll('.liquid-link,.media-badge,.site-header,.lightbox button').forEach(add);
}
function clearWebGL(el,state){if(state.renderer)state.renderer.setEnabled(false);delete el.dataset.renderer;}
function setLens(el,state,on){
  if(!state.lens&&on)state.lens=liquidGlass(el,options);
  else state.lens?.update({enabled:on});
}
function webgl(el,state,img,photo){
  if(!el.matches('.liquid-link')||isLensSupported()&&document.documentElement.dataset.glassRenderer!=='webgl')return;
  if(!state.canvas){
    const canvas=document.createElement('canvas');canvas.className='gw-refraction';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;el.before(canvas);state.canvas=canvas;
    canvas.addEventListener('refractionfailed',()=>{clearWebGL(el,state);el.dataset.glassFallback='texture-or-context';});
    canvas.addEventListener('webglcontextrestored',()=>{state.renderer=null;schedule();});
  }
  const r=el.getBoundingClientRect(),parent=el.offsetParent.getBoundingClientRect();
  Object.assign(state.canvas.style,{left:(r.left-parent.left)+'px',top:(r.top-parent.top)+'px',width:r.width+'px',height:r.height+'px',borderRadius:getComputedStyle(el).borderRadius});
  const box=img.getBoundingClientRect(),pos=getComputedStyle(img).objectPosition.split(' ').map(parseFloat);
  const m=geometry.coverMapping(photo.naturalWidth,photo.naturalHeight,box.width,box.height,(pos[0]||0)/100,(pos[1]||0)/100);
  state.source={el:photo,moving:false,cover:{width:m.width,height:m.height,x:r.left-box.left-m.x,y:r.top-box.top-m.y}};
  if(!state.renderer){
    try{state.renderer=createRefraction(state.canvas,{source:()=>state.source,surfaces:()=>{
      const a=state.material,b=el.getBoundingClientRect();return [{x:0,y:0,w:b.width,h:b.height,radius:Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius),b.width/2,b.height/2),rim:Math.max(4,Math.min(40,b.width/3.5,b.height/3.5)),edge:1.1,power:2.6,dispersion:.15,blur:2,saturate:a.saturate,contrast:1,brightness:a.brightness,keep:a.keep}];
    }});}catch{state.renderer=null;}
  }
  if(state.renderer){el.dataset.renderer='webgl';state.renderer.setEnabled(true);setLens(el,state,false);}
}
async function update(el,state){
  if(!el.isConnected)return;
  const token=++state.token,images=underPhotos(el);
  if(suppressed()||!state.visible){clearWebGL(el,state);setLens(el,state,false);if(suppressed())apply(el,state.material);return;}
  setLens(el,state,!el.matches('.liquid-link')||document.documentElement.dataset.glassRenderer!=='webgl');
  const r=el.getBoundingClientRect();
  const crop=document.createElement('canvas');crop.width=Math.max(1,Math.ceil(r.width/8));crop.height=Math.max(1,Math.ceil(r.height/8));
  const ctx=crop.getContext('2d',{willReadFrequently:true});if(!ctx)return;
  const fallback=fallbackMaterial(el),base=fallback.kind==='dark'?[23,33,39]:[242,245,247];
  ctx.fillStyle=`rgb(${base.join(' ')})`;ctx.fillRect(0,0,crop.width,crop.height);
  const sources=(await Promise.all(images.map(async img=>({img,photo:img.naturalWidth?await readable(img):null})))).filter(source=>source.photo);
  if(token!==state.token||!el.isConnected)return;
  for(const {img,photo} of sources){
    const b=img.getBoundingClientRect(),visible=geometry.intersection(r,b);if(!visible)continue;
    const pos=getComputedStyle(img).objectPosition.split(' ').map(parseFloat);
    const m=geometry.coverMapping(photo.naturalWidth,photo.naturalHeight,b.width,b.height,(pos[0]||0)/100,(pos[1]||0)/100);
    ctx.save();ctx.beginPath();ctx.rect((visible.left-r.left)/8,(visible.top-r.top)/8,visible.width/8,visible.height/8);ctx.clip();
    ctx.drawImage(photo,(b.left+m.x-r.left)/8,(b.top+m.y-r.top)/8,m.width/8,m.height/8);ctx.restore();
  }
  // Use upstream's wallpaper sampler, with the already aligned crop as its source.
  const sample=sampler();sample.capture(crop,r.width,r.height);const stats=sample.sample({x:0,y:0,w:r.width,h:r.height});
  if(!stats)return;
  const pixels=ctx.getImageData(0,0,crop.width,crop.height).data,colors=[];
  for(let i=0;i<pixels.length;i+=4)colors.push(pixels[i+3]===255?[pixels[i],pixels[i+1],pixels[i+2]]:[255,255,255]);
  if(colors.length){state.material=materialForPixels(colors,state.material.inkMode);apply(el,state.material);}
  if(sources[0])webgl(el,state,sources[0].img,sources[0].photo);else clearWebGL(el,state);
}
function schedule(){if(!scheduled)scheduled=requestAnimationFrame(()=>{scheduled=0;decorate();for(const [el,state] of states){if(!el.isConnected){state.lens?.destroy();state.renderer?.setEnabled(false);state.canvas?.remove();observer.unobserve(el);resize.unobserve(el);states.delete(el);}else update(el,state);}});}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){const state=states.get(entry.target);if(state){state.visible=entry.isIntersecting;if(!state.visible)clearWebGL(entry.target,state);}}schedule();});
const resize=new ResizeObserver(schedule);
decorate();schedule();
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
document.addEventListener('load',schedule,true);document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const [el,state]of states)clearWebGL(el,state);}else schedule();});
for(const media of [reduced,forced,dark])media.addEventListener('change',schedule);
window.addEventListener('pageshow',schedule);
