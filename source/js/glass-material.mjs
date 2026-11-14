const assetVersion=new URL(import.meta.url).searchParams.get('v');
const suffix=assetVersion?`?v=${encodeURIComponent(assetVersion)}`:'';
const {pickInk,adapt,tintFloor,contrast,luma}=await import(`./vendor/glasswork/adapt.mjs${suffix}`);
export function materialForPixels(colors, previous, forcedKind) {
  const values=colors.map(luma).sort((a,b)=>a-b);
  const luminance=values.reduce((sum,n)=>sum+n,0)/values.length;
  const texture=values.at(-1)-values[0];
  const ink=forcedKind ? (forcedKind==='dark'?'light':'dark') : pickInk(luminance,previous);
  const kind=ink==='light'?'dark':'light';
  const color=[0,1,2].map(i=>colors.reduce((sum,c)=>sum+c[i],0)/colors.length);
  const adaptation=adapt({luminance,texture,color},ink);
  const tone=kind==='dark'?{saturate:1.6,brightness:.8,tint:[30,30,34],ink:[245,245,247],thin:.16,dense:.38}:{saturate:1.8,brightness:1.06,tint:[255,255,255],ink:[29,29,31],thin:.06,dense:.22};
  // Verify actual sampled colors after tone, not just mean brightness.
  const toned=colors.map(c=>{
    let rgb=c.map(n=>n/255),gray=rgb[0]*.213+rgb[1]*.715+rgb[2]*.072;
    rgb=rgb.map(n=>(gray+(n-gray)*tone.saturate)*tone.brightness);
    gray=rgb[0]*.213+rgb[1]*.715+rgb[2]*.072;
    return rgb.map(n=>Math.min(255,Math.max(0,(gray+(n-gray)*adaptation.saturate)*255)));
  });
  const reads=a=>toned.every(rgb=>contrast(tone.ink,rgb.map((v,i)=>v+(tone.tint[i]-v)*a))>=4.5);
  let low=0,high=1;for(let i=0;i<18;i++){const mid=(low+high)/2;if(reads(mid))high=mid;else low=mid;}
  const floor=tintFloor(luminance,texture,ink,luma(tone.tint));
  const alpha=Math.min(1,Math.max(high,floor,tone.thin+(tone.dense-tone.thin)*adaptation.density));
  return {kind,inkMode:ink,alpha,density:adaptation.density,keep:adaptation.saturate,...tone,text: tone.ink,
    minContrast:Math.min(...toned.map(rgb=>contrast(tone.ink,rgb.map((v,i)=>v+(tone.tint[i]-v)*alpha))))};
}
