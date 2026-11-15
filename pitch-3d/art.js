const point=(x,y,z=0)=>[320+(x-y)*.8,135+(x+y)*.38-z];
const pair=p=>p.map(n=>n.toFixed(1)).join(',');
const polygon=(points,fill,extra='')=>'<polygon points="'+points.map(pair).join(' ')+'" fill="'+fill+'" '+extra+'/>';
export function farmSVG(mode='mixed'){
 let p=(x,y,z=0)=>point(x,y,z),parts=[];
 const dry=mode==='dry',layers=mode==='layers',docs=mode==='documents';
 parts.push('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="520" viewBox="0 0 640 520" role="img" aria-label="Conceptual isometric field and soil cutaway, not measured crop growth"><defs><linearGradient id="soilLeft" x2="0" y2="1"><stop stop-color="#82603a"/><stop offset="1" stop-color="#3e3024"/></linearGradient><linearGradient id="soilRight" x2="1" y2="1"><stop stop-color="#5e482e"/><stop offset="1" stop-color="#322a21"/></linearGradient></defs>');
 parts.push('<ellipse cx="321" cy="449" rx="238" ry="27" fill="#071912" opacity=".65"/>');
 const offset=layers?65:0;
 parts.push(polygon([p(0,300),p(300,300),p(300,300,-65),p(0,300,-65)],'url(#soilLeft)'));
 parts.push(polygon([p(300,0),p(300,300),p(300,300,-65),p(300,0,-65)],'url(#soilRight)'));
 for(let d=18;d<60;d+=16){
  let a=p(0,300,-d),b=p(300,300,-d),c=p(300,0,-d);
  parts.push('<path d="M'+pair(a)+' L'+pair(b)+' L'+pair(c)+'" fill="none" stroke="#ab8953" stroke-width="2" opacity=".3"/>');
 }
 parts.push(polygon([p(0,0,offset),p(300,0,offset),p(300,300,offset),p(0,300,offset)],dry?'#69593c':'#5f7540'));
 for(let k=0;k<6;k++){
  let y=k*50+8;parts.push(polygon([p(4,y,offset+.5),p(296,y,offset+.5),p(296,y+27,offset+.5),p(4,y+27,offset+.5)],k%2?'#536334':dry?'#806b46':'#71864b','opacity=".75"'));
 }
 for(let y=22;y<300;y+=43)for(let x=22;x<300;x+=43){
  if(dry&&(Math.round(x+y)%3===0))continue;
  let z=offset,base=p(x,y,z),height=dry?18:(x<140?36:47),top=p(x,y,z+height),gold=x>140&&!layers;
  parts.push('<path d="M'+pair(base)+' L'+pair(top)+'" stroke="'+(gold?'#bfa367':'#a1bb70')+'" stroke-width="2.7" stroke-linecap="round"/>');
  for(let side of [-1,1]){
   let b=p(x,y,z+height*.4),tip=[b[0]+side*12,b[1]-13],control=[b[0]+side*15,b[1]-2];
   parts.push('<path d="M'+pair(b)+' Q'+pair(control)+' '+pair(tip)+' Q'+pair([b[0]+side*2,b[1]-13])+' '+pair(b)+'" fill="'+(gold?'#c3a45f':'#91ae63')+'"/>');
  }
  if(gold)parts.push('<ellipse cx="'+top[0]+'" cy="'+(top[1]+4)+'" rx="3.6" ry="9" fill="#dac286" transform="rotate(-10 '+top.join(' ')+')"/>');
 }
 for(let x=30;x<300;x+=48){let a=p(x,300,-5),b=p(x+8,300,-46);parts.push('<path d="M'+pair(a)+' Q'+pair([a[0]-10,a[1]+25])+' '+pair(b)+'" stroke="#c4b185" stroke-width="1.2" opacity=".55" fill="none"/>');}
 if(layers){
  parts.push(polygon([p(0,0,130),p(300,0,130),p(300,300,130),p(0,300,130)],'#b4c6bd','opacity=".15" stroke="#b8d7ce" stroke-width="1.2" stroke-dasharray="5 5"'));
  for(let x=60;x<300;x+=60){let a=p(x,0,130),b=p(x,300,130);parts.push('<path d="M'+pair(a)+' L'+pair(b)+'" stroke="#c0dbcf" opacity=".2"/>');}
 }
 if(docs){
  for(let i=0;i<3;i++){let x=110+i*90,y=30+i*30;parts.push(polygon([[x,y],[x+170,y+35],[x+170,y+150],[x,y+115]],i===2?'#d4dfbd':'#6e865f'));for(let j=0;j<4;j++)parts.push('<path d="M'+(x+20)+' '+(y+37+j*18)+' l110 23" stroke="#304d3a" stroke-width="3" opacity=".4"/>');}
 }else{
  let sat='<g transform="translate(455 45) rotate(-12)"><path d="M-50 18L-14 8L-10 35L-46 45Z M15 1L51-9L55 18L19 28Z" fill="#4c8193" stroke="#a9c9bd" stroke-width="1.2"/><path d="M-40 16L-36 41 M-28 13L-24 38 M27-2L31 24 M39-5L43 21" stroke="#98bdc0" stroke-width="1" opacity=".5"/><path d="M-14 8L3-1L19 1L23 30L7 39L-10 35Z" fill="#c3cdb5"/><path d="M3-1L7 39L23 30L19 1Z" fill="#849784"/><path d="M-3 7L0-14 M-4-14L4-14" stroke="#c7d8bc" stroke-width="2"/></g>';
  parts.push(sat);
  parts.push('<path d="M466 98Q440 130 430 167 M444 94Q422 119 409 154" fill="none" stroke="#bed69b" opacity=".35" stroke-dasharray="4 6" stroke-width="1.5"/>');
 }
 parts.push('</svg>');return parts.join('');
}
