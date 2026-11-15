let nextArtId = 0;
const aliases = { spring_wheat: 'wheat', grain_maize: 'maize', soybean: 'legume', grain_sorghum: 'sorghum' };
function keyOf(value) {
  const key = aliases[value] || value;
  return ['wheat', 'barley', 'maize', 'sorghum', 'legume', 'sunflower', 'cover', 'fallow'].includes(key) ? key : 'wheat';
}
function safe(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}
function leaf(fill, vein, width, height, flip) {
  return '<g transform="scale(' + (flip ? -1 : 1) + ' 1)">' +
    '<path d="M0 0 C' + (width*.18) + ' ' + (-height*1.18) + ', ' + (width*.68) + ' ' + (-height*1.48) + ', ' + width + ' ' + (-height*.55) +
    ' C' + (width*.78) + ' ' + (height*.28) + ', ' + (width*.28) + ' ' + (height*.46) + ', 0 0Z" fill="' + fill + '" stroke="#d2d7a1" stroke-opacity=".22" stroke-width="1.1"/>' +
    '<path d="M1 -1 Q' + (width*.46) + ' ' + (-height*.54) + ' ' + (width*.92) + ' ' + (-height*.58) + '" fill="none" stroke="' + vein + '" stroke-opacity=".7" stroke-width="1.05"/>' +
    '<path d="M' + (width*.34) + ' ' + (-height*.36) + ' l' + (width*.13) + ' ' + (-height*.22) + ' M' + (width*.57) + ' ' + (-height*.48) + ' l' + (width*.13) + ' ' + (-height*.22) +
    '" fill="none" stroke="' + vein + '" stroke-opacity=".36" stroke-width=".75"/></g>';
}
function rootSystem(tint) {
  return '<g fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".83">' +
    '<path d="M0 0 C-3 13 -1 25 -8 45 M0 1 C4 15 10 25 8 52 M-1 8 C-16 17 -20 31 -25 39 M3 12 C18 22 20 34 27 43" stroke="' + tint + '" stroke-width="2.4"/>' +
    '<path d="M-8 27 l-11 8 M8 28 l12 10 M-17 20 l-9 7 M17 24 l10 8 M-5 39 l-6 8 M8 40 l7 9 M-25 39 l-4 8 M27 43 l5 7" stroke="#b39b72" stroke-width="1.1"/>' +
    '</g>';
}
function plant(value, x, base, scale, variant, showRoots) {
  const key = keyOf(value);
  const palette = {
    wheat: ['#9aaf65', '#66864b', '#d7b76d'], barley: ['#a6b66c', '#6c8a4d', '#c99c5f'],
    maize: ['#91ad52', '#577f3f', '#c8a64e'], sorghum: ['#96a65a', '#5e8145', '#a97954'],
    legume: ['#72a77b', '#477b60', '#c3a0a1'], sunflower: ['#87a957', '#557d43', '#e1b34f'],
    cover: ['#88a96b', '#537f55', '#d1c17d'], fallow: ['#b1a07a', '#806d50', '#c0a16d']
  };
  const colors = palette[key], light = colors[0], dark = colors[1], head = colors[2];
  const lean = [-5, 3, -2, 5, 0][variant % 5];
  const prefix = 'plant-' + (++nextArtId);
  const stem = '<path d="M0 0 C' + lean + ' -39 ' + (-lean*.45) + ' -88 ' + (lean*.35) + ' -143" fill="none" stroke="' + dark + '" stroke-width="' +
    (key === 'maize' ? 6 : 3.4) + '" stroke-linecap="round"/><path d="M-1 -5 C' + (lean-2) + ' -45 ' + (-lean*.35) + ' -91 ' + (lean*.35-1) + ' -140" fill="none" stroke="#d3d9a3" stroke-opacity=".38" stroke-width="1.05"/>';
  let canopy = '';
  if (key === 'wheat' || key === 'barley') {
    canopy += '<g transform="translate(0 -55) rotate(-42)">' + leaf(light,dark,63,21,false) + '</g>';
    canopy += '<g transform="translate(0 -79) rotate(34)">' + leaf(dark,light,55,18,true) + '</g>';
    canopy += '<g transform="translate(0 -101) rotate(-30)">' + leaf(light,dark,43,15,false) + '</g>';
    canopy += '<g transform="translate(0 -125) rotate(30)">' + leaf(dark,light,34,13,true) + '</g>';
    canopy += '<path d="M0 -133 Q-2 -153 0 -172" fill="none" stroke="' + dark + '" stroke-width="2.5"/><g>';
    for (let i=0;i<7;i++) {
      const y=-132-i*5.8, rx=key==='barley'?4.6:5.2;
      canopy += '<ellipse cx="-4.4" cy="' + y + '" rx="' + rx + '" ry="7.1" transform="rotate(-26 -4.4 ' + y + ')" fill="' + head + '" stroke="#f1d798" stroke-opacity=".3" stroke-width=".7"/>';
      canopy += '<ellipse cx="4.4" cy="' + (y-1.8) + '" rx="' + rx + '" ry="7.1" transform="rotate(25 4.4 ' + (y-1.8) + ')" fill="' + head + '" stroke="#f1d798" stroke-opacity=".3" stroke-width=".7"/>';
      const awn=key==='barley'?48:28;
      canopy += '<path d="M-5 ' + (y-3) + ' l-' + (awn*.55) + ' -' + (awn*.62) + ' M5 ' + (y-4) + ' l' + (awn*.48) + ' -' + (awn*.7) + '" fill="none" stroke="#d8bd7b" stroke-width="' + (key==='barley'?1.35:1.05) + '" stroke-linecap="round" opacity=".88"/>';
    }
    canopy += '</g><path d="M0 -135 Q-11 -151 -8 -163 M0 -142 Q10 -158 8 -168" fill="none" stroke="#e0c783" stroke-width="1" stroke-linecap="round"/>';
  } else if (key === 'maize') {
    canopy += '<g transform="translate(0 -65) rotate(-48)">' + leaf(light,dark,102,28,false) + '</g>';
    canopy += '<g transform="translate(0 -82) rotate(42)">' + leaf(dark,light,92,26,true) + '</g>';
    canopy += '<g transform="translate(0 -108) rotate(-29)">' + leaf(light,dark,82,23,false) + '</g>';
    canopy += '<g transform="translate(0 -122) rotate(29)">' + leaf(dark,light,72,21,true) + '</g>';
    canopy += '<g transform="translate(2 -77) rotate(8)"><path d="M0 0 Q-10 -16 -7 -37 Q0 -51 9 -35 Q13 -13 3 1Z" fill="#6f9145" stroke="#bbca7c" stroke-width="1.2"/>';
    canopy += '<path d="M-4 -4 Q-4 -22 0 -40 Q6 -25 5 -3" fill="#e4c76e" stroke="#b48c45" stroke-width="1.2"/>';
    for(let i=0;i<5;i++)for(let j=0;j<2;j++)canopy+='<circle cx="' + (-2.8+j*5.2) + '" cy="' + (-11-i*6) + '" r="1.7" fill="' + (i%2?'#f0d68a':'#d9ae58') + '" stroke="#956f36" stroke-width=".45"/>';
    canopy += '<path d="M-7 -36 Q-18 -53 -17 -68 M-2 -38 Q-3 -57 3 -71 M5 -37 Q17 -52 20 -66" fill="none" stroke="#d9ba6b" stroke-width="1.4" stroke-linecap="round"/></g>';
    canopy += '<g transform="translate(0 -139)" fill="none" stroke="#b4a16a" stroke-width="1.5" stroke-linecap="round"><path d="M0 0 Q-4 -18 -24 -28 M0 0 Q-3 -20 -12 -34 M0 0 Q2 -22 4 -38 M0 0 Q7 -19 21 -33 M0 0 Q14 -14 29 -19 M-24 -28 l-5 -8 M-12 -34 l-3 -8 M4 -38 l1 -8 M21 -33 l6 -7 M29 -19 l8 -3"/></g>';
  } else if (key === 'sorghum') {
    canopy += '<g transform="translate(0 -53) rotate(-38)">' + leaf(light,dark,72,24,false) + '</g>';
    canopy += '<g transform="translate(0 -81) rotate(37)">' + leaf(dark,light,67,22,true) + '</g>';
    canopy += '<g transform="translate(0 -113) rotate(-26)">' + leaf(light,dark,49,18,false) + '</g>';
    canopy += '<path d="M0 -137 Q-3 -160 0 -169" fill="none" stroke="' + dark + '" stroke-width="2.5"/>';
    canopy += '<g fill="none" stroke="#b89a64" stroke-width="1.45" stroke-linecap="round"><path d="M0 -157 Q-17 -171 -27 -185 M0 -157 Q-8 -177 -9 -190 M0 -157 Q8 -177 10 -190 M0 -157 Q19 -171 29 -184 M0 -157 Q-25 -159 -37 -168 M0 -157 Q25 -160 39 -169"/></g><g fill="' + head + '" stroke="#e0c28a" stroke-opacity=".44" stroke-width=".6">';
    for(let i=0;i<28;i++){const a=i*2.399,rad=8+(i%5)*4;canopy+='<circle cx="' + (Math.cos(a)*rad) + '" cy="' + (-170+Math.sin(a)*rad*.68) + '" r="' + (2.5+(i%3)*.25) + '"/>';}
    canopy += '</g>';
  } else if (key === 'legume') {
    canopy += '<path d="M0 -43 Q-22 -66 -31 -93 M0 -62 Q24 -77 36 -104 M-1 -92 Q-15 -112 -12 -135" fill="none" stroke="' + dark + '" stroke-width="3" stroke-linecap="round"/>';
    canopy += '<g transform="translate(-22 -75)">' + leaf(light,dark,30,18,false) + '</g><g transform="translate(-26 -91) rotate(-55)">' + leaf(dark,light,28,17,true) + '</g><g transform="translate(-12 -122) rotate(-26)">' + leaf(light,dark,27,16,false) + '</g>';
    canopy += '<g transform="translate(23 -87) rotate(24)">' + leaf(light,dark,31,18,true) + '</g><g transform="translate(34 -103) rotate(54)">' + leaf(dark,light,28,17,false) + '</g><g transform="translate(36 -111) rotate(12)">' + leaf(light,dark,25,16,true) + '</g>';
    canopy += '<g transform="translate(-1 -58) rotate(-12)"><path d="M0 0 Q-17 -18 -10 -35 Q7 -48 18 -27 Q15 -7 0 0Z" fill="#84a85e" stroke="#d1dc9f" stroke-width="1"/><path d="M0 0 Q-3 -19 9 -32" fill="none" stroke="#d4dca1" stroke-width="1.2"/><circle cx="-2" cy="-28" r="2.5" fill="#c6a0a5"/><circle cx="4" cy="-31" r="2.3" fill="#d8b3b3"/></g>';
    canopy += '<g fill="none" stroke="#6e8a4e" stroke-width="3" stroke-linecap="round"><path d="M-9 -33 Q-23 -47 -23 -64 Q-5 -57 -9 -33Z M13 -45 Q25 -61 19 -76 Q4 -62 13 -45Z"/></g>';
  } else if (key === 'sunflower') {
    canopy += '<g transform="translate(0 -58) rotate(-38)">' + leaf(light,dark,70,25,false) + '</g><g transform="translate(0 -84) rotate(39)">' + leaf(dark,light,67,23,true) + '</g><g transform="translate(0 -117) rotate(-24)">' + leaf(light,dark,43,17,false) + '</g>';
    canopy += '<path d="M0 -138 Q0 -155 0 -168" stroke="' + dark + '" stroke-width="3" fill="none"/><g transform="translate(0 -174)">';
    for(let i=0;i<18;i++)canopy+='<ellipse cx="0" cy="-17" rx="4.4" ry="11" fill="#d8ad4f" stroke="#f0d48c" stroke-width=".7" transform="rotate(' + (i*20) + ')"/>';
    canopy += '<circle r="10" fill="#493d29" stroke="#a17a38" stroke-width="2"/>';
    for(let i=0;i<18;i++)canopy+='<circle cx="' + (Math.cos(i*2.4)*6) + '" cy="' + (Math.sin(i*2.4)*6) + '" r="1.25" fill="#d2a54d"/>';
    canopy += '</g>';
  } else if (key === 'cover') {
    canopy += '<g transform="translate(0 -44) rotate(-47)">' + leaf(light,dark,47,19,false) + '</g><g transform="translate(0 -63) rotate(42)">' + leaf(dark,light,43,18,true) + '</g><g transform="translate(0 -90) rotate(-35)">' + leaf(light,dark,37,16,false) + '</g><g transform="translate(0 -109) rotate(30)">' + leaf(dark,light,34,15,true) + '</g>';
    canopy += '<g transform="translate(0 -124)">';
    for(let i=0;i<5;i++)canopy+='<path d="M0 0 Q' + ((i-2)*7) + ' -12 ' + ((i-2)*11) + ' -22" fill="none" stroke="' + dark + '" stroke-width="1.7"/><ellipse cx="' + ((i-2)*11) + '" cy="-22" rx="3.8" ry="6" fill="' + (i%2?light:head) + '"/>';
    canopy += '</g>';
  } else {
    canopy += '<path d="M-18 0 Q-17 -17 -29 -30 M-2 0 Q4 -22 -2 -47 M13 0 Q24 -14 29 -35 M28 0 Q35 -13 43 -18" fill="none" stroke="#897653" stroke-width="2.8" stroke-linecap="round"/><path d="M-27 -30 l-10 -5 M-2 -47 l-7 -10 M29 -35 l9 -7 M43 -18 l8 -2" fill="none" stroke="#c1a879" stroke-width="1.3"/>';
  }
  return '<g transform="translate(' + x + ' ' + base + ') scale(' + scale + ')"><ellipse cx="0" cy="2" rx="' + (key==='maize'?13:9) + '" ry="3.1" fill="#17251a" opacity=".22"/>' +
    (showRoots && key!=='fallow' ? rootSystem('#8b795b') : '') + stem + canopy + '</g>';
}
function defs(id) {
  return '<defs>' +
    '<linearGradient id="' + id + '-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c0b7"/><stop offset=".6" stop-color="#d7d7b5"/><stop offset="1" stop-color="#e2c99c"/></linearGradient>' +
    '<linearGradient id="' + id + '-field" x1="0" y1="0" x2=".1" y2="1"><stop offset="0" stop-color="#6c8051"/><stop offset=".45" stop-color="#657448"/><stop offset="1" stop-color="#3d5038"/></linearGradient>' +
    '<linearGradient id="' + id + '-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#806447"/><stop offset=".45" stop-color="#674d39"/><stop offset="1" stop-color="#3d3028"/></linearGradient>' +
    '<radialGradient id="' + id + '-sun"><stop offset="0" stop-color="#f5e4a5"/><stop offset=".8" stop-color="#dfc77d"/><stop offset="1" stop-color="#c4a966"/></radialGradient>' +
    '<filter id="' + id + '-grain-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/><feOffset dy="1" result="offset"/><feComponentTransfer><feFuncA type="linear" slope=".22"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '<pattern id="' + id + '-soil-grain" width="54" height="31" patternUnits="userSpaceOnUse"><circle cx="8" cy="9" r="1.2" fill="#d0b18a" opacity=".28"/><circle cx="32" cy="22" r="1.7" fill="#2c231d" opacity=".3"/><path d="M17 17 l5 -2 M43 7 l4 2" stroke="#c6a27b" stroke-width=".8" opacity=".23"/></pattern></defs>';
}
export function cropBotanicalSVG(value, label) {
  const key=keyOf(value), id='botanical-'+(++nextArtId), positions=[58,119,180,241,302], scales=[.66,.75,.69,.74,.64];
  let plants=''; for(let i=0;i<positions.length;i++)plants+=plant(key,positions[i],158,scales[i],i,true);
  return '<svg class="crop-art-svg crop-art-botanical" viewBox="0 0 360 238" role="img" aria-label="' + safe(label || key + ' botanical illustration') + '" xmlns="http://www.w3.org/2000/svg">' + defs(id) +
    '<path d="M10 161 Q85 155 180 159 T350 160" stroke="#a8b88b" stroke-width="2" fill="none" opacity=".8"/><path d="M0 166 Q80 161 180 165 T360 165 V238 H0Z" fill="url(#' + id + '-soil)"/>' +
    '<path d="M0 186 Q90 179 180 185 T360 183 M0 211 Q95 205 180 211 T360 209" stroke="#b18a61" stroke-opacity=".32" stroke-width="1.3" fill="none"/><rect y="166" width="360" height="72" fill="url(#' + id + '-soil-grain)" opacity=".75"/>' +
    '<g fill="#b29a71" opacity=".65"><ellipse cx="31" cy="184" rx="5" ry="2"/><ellipse cx="91" cy="222" rx="7" ry="2.6"/><ellipse cx="276" cy="190" rx="5.5" ry="2.4"/><ellipse cx="330" cy="220" rx="8" ry="2.5"/></g>' +
    plants + '<path d="M12 160 Q85 154 180 158 T348 159" stroke="#d3d8ac" stroke-width="1" opacity=".42" fill="none"/></svg>';
}
export function cropRowSVG(value, label) {
  const key=keyOf(value), id='row-'+(++nextArtId), positions=[28,82,137,192,247,302,357,410], scales=[.52,.58,.55,.61];
  let plants=''; for(let i=0;i<positions.length;i++)plants+=plant(key,positions[i],126+(i%2)*3,scales[i%4],i,false);
  return '<svg class="crop-art-svg crop-art-row" viewBox="0 0 440 145" role="img" aria-label="' + safe(label || key + ' crop row illustration') + '" xmlns="http://www.w3.org/2000/svg">' + defs(id) +
    '<path d="M0 128 Q100 120 215 126 T440 127" fill="none" stroke="#b6c38d" stroke-width="2.5"/><path d="M0 136 Q110 130 220 134 T440 136" fill="none" stroke="#6c8051" stroke-width="8" opacity=".32"/>' + plants + '</svg>';
}
export function cropFieldSVG(value, options) {
  options=options||{}; const key=keyOf(value), kind=options.kind||'card', wide=kind==='wide'||kind==='banner', id='field-'+(++nextArtId);
  const width=wide?900:620, height=wide?380:360, horizon=wide?190:147, soilTop=wide?305:245, base=wide?296:236, count=wide?16:9, start=wide?28:22, step=(width-start*2)/(count-1);
  let plants='', distant='';
  for(let i=0;i<count;i++){
    const scales=wide?[.68,.72,.76,.7,.79]:[.49,.53,.57,.51,.56];
    plants+=plant(key,start+i*step,base+(i%3)*(wide?2:1.5),scales[i%scales.length],i,true);
  }
  const distantCount=wide?11:7;
  for(let i=0;i<distantCount;i++)distant+=plant(key,(i+.5)*width/distantCount,horizon+(wide?36:27),wide?.23:.18,i+1,false);
  let soilStones='';
  for(let i=0;i<(wide?15:11);i++){
    const x=(i*71+29)%width,y=soilTop+16+(i*17)%95;
    soilStones+='<ellipse cx="' + x + '" cy="' + y + '" rx="' + (3+i%4) + '" ry="' + (1.5+i%2) + '" transform="rotate(' + (i*21) + ' ' + x + ' ' + y + ')"/>';
  }
  let furrows='';
  for(let i=0;i<(wide?7:5);i++)furrows+='<path d="M' + (i*width/(wide?7:5)) + ' ' + (soilTop-1) + ' Q' + (width*.3+i*3) + ' ' + (soilTop-13) + ' ' + (width*.58+i*5) + ' ' + (soilTop+1) + '"/>';
  const label=options.label||key+' field illustration';
  return '<svg class="crop-art-svg crop-art-field crop-art-' + (wide?'wide':'card') + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + safe(label) + '" xmlns="http://www.w3.org/2000/svg">' + defs(id) +
    '<rect width="' + width + '" height="' + height + '" fill="url(#' + id + '-sky)"/><circle cx="' + (width*.79) + '" cy="' + (wide?74:58) + '" r="' + (wide?39:30) + '" fill="url(#' + id + '-sun)" opacity=".94"/>' +
    '<circle cx="' + (width*.79) + '" cy="' + (wide?74:58) + '" r="' + (wide?55:43) + '" fill="#f0dc9e" opacity=".08"/><path d="M' + (width*.06) + ' ' + (wide?72:50) + ' q35 -20 69 -1 q27 -22 57 -3 q27 -15 52 5" fill="none" stroke="#fff4dc" stroke-width="2" stroke-linecap="round" opacity=".22"/>' +
    '<path d="M0 ' + (horizon+21) + ' Q' + (width*.24) + ' ' + (horizon-39) + ' ' + (width*.49) + ' ' + (horizon+4) + ' T' + width + ' ' + (horizon-1) + ' V' + height + ' H0Z" fill="#5e7656" opacity=".56"/>' +
    '<path d="M0 ' + (horizon+48) + ' Q' + (width*.26) + ' ' + (horizon-2) + ' ' + (width*.5) + ' ' + (horizon+29) + ' T' + width + ' ' + (horizon+14) + ' V' + height + ' H0Z" fill="url(#' + id + '-field)"/>' +
    '<path d="M0 ' + (horizon+63) + ' Q' + (width*.3) + ' ' + (horizon+8) + ' ' + (width*.57) + ' ' + (horizon+43) + ' T' + width + ' ' + (horizon+24) + '" stroke="#b4bd7e" stroke-width="2" fill="none" opacity=".42"/>' +
    '<g opacity=".18" fill="none" stroke="#d8d7a7" stroke-width="1.4"><path d="M' + (width*.12) + ' ' + (horizon+55) + ' Q' + (width*.45) + ' ' + (horizon+15) + ' ' + (width*.83) + ' ' + (horizon+51) + '"/><path d="M' + (width*.04) + ' ' + (horizon+79) + ' Q' + (width*.48) + ' ' + (horizon+36) + ' ' + (width*.98) + ' ' + (horizon+80) + '"/></g>' +
    distant + '<path d="M0 ' + soilTop + ' Q' + (width*.28) + ' ' + (soilTop-6) + ' ' + (width*.52) + ' ' + (soilTop+1) + ' T' + width + ' ' + (soilTop-1) + ' V' + height + ' H0Z" fill="url(#' + id + '-soil)"/>' +
    '<path d="M0 ' + (soilTop+22) + ' Q' + (width*.36) + ' ' + (soilTop+16) + ' ' + width + ' ' + (soilTop+20) + ' M0 ' + (soilTop+61) + ' Q' + (width*.42) + ' ' + (soilTop+54) + ' ' + width + ' ' + (soilTop+63) + ' M0 ' + (soilTop+96) + ' Q' + (width*.5) + ' ' + (soilTop+91) + ' ' + width + ' ' + (soilTop+98) + '" stroke="#b58f66" stroke-opacity=".4" stroke-width="2" fill="none"/>' +
    '<rect y="' + soilTop + '" width="' + width + '" height="' + (height-soilTop) + '" fill="url(#' + id + '-soil-grain)" opacity=".78"/><path d="M0 ' + soilTop + ' Q' + (width*.28) + ' ' + (soilTop-6) + ' ' + (width*.52) + ' ' + (soilTop+1) + ' T' + width + ' ' + (soilTop-1) + '" fill="none" stroke="#c4c28b" stroke-width="2.1"/>' +
    '<g fill="#d3bc91" opacity=".35">' + soilStones + '</g><g opacity=".34" stroke="#8b744e" stroke-width="2" fill="none">' + furrows + '</g>' + plants +
    '<path d="M0 ' + (soilTop+4) + ' Q' + (width*.3) + ' ' + (soilTop-2) + ' ' + (width*.52) + ' ' + (soilTop+5) + ' T' + width + ' ' + (soilTop+3) + '" fill="none" stroke="#e1d3a0" stroke-opacity=".38" stroke-width="1"/>' +
    (options.projected?'<path d="M0 0H'+width+'V'+height+'H0Z" fill="#10191b" opacity=".09"/>':'') + '</svg>';
}
