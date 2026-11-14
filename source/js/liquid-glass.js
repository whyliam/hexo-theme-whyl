/* Geometry shared by the Glasswork adapter and coordinate tests. */
(function(root){
  function coverMapping(imageWidth, imageHeight, boxWidth, boxHeight, x, y) {
    const scale = Math.max(boxWidth / imageWidth, boxHeight / imageHeight);
    return {width:imageWidth * scale, height:imageHeight * scale,
      x:(boxWidth-imageWidth*scale)*x, y:(boxHeight-imageHeight*scale)*y};
  }
  const api={coverMapping};
  if(typeof module==='object'&&module.exports)module.exports=api;else {
    root.WhyLGlassGeometry=api;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),seen=new WeakSet();
    function decorate(){document.querySelectorAll('.site-navigation a,.menu-toggle,.lightbox button,.liquid-link').forEach(el=>{
      if(seen.has(el))return;seen.add(el);el.classList.add('glass-control');
      let frame=0,target=[0,0],value=[0,0];
      function settle(){frame=0;if(reduced.matches||!el.isConnected)return;
        value=value.map((v,i)=>v+(target[i]-v)*.25);
        el.style.setProperty('--shine-x',(50+value[0]*40)+'%');el.style.setProperty('--shine-y',(50+value[1]*40)+'%');
        if(Math.abs(value[0]-target[0])+Math.abs(value[1]-target[1])>.005)frame=requestAnimationFrame(settle);
      }
      el.addEventListener('pointermove',event=>{if(reduced.matches||event.pointerType==='touch')return;const r=el.getBoundingClientRect();target=[(event.clientX-r.left)/r.width-.5,(event.clientY-r.top)/r.height-.5];if(!frame)frame=requestAnimationFrame(settle);});
      el.addEventListener('pointerleave',()=>{target=[0,0];if(!frame)frame=requestAnimationFrame(settle);});
      reduced.addEventListener('change',()=>{target=[0,0];value=[0,0];if(frame)cancelAnimationFrame(frame);frame=0;el.style.removeProperty('--shine-x');el.style.removeProperty('--shine-y');});
    });}
    decorate();new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});
  }
}(typeof window==='undefined'?globalThis:window));
