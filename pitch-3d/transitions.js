// Standard PresentationML fade; optional Office 2010 duration preserves older-viewer fallback.
export function withFadeTransition(xml,durationMs=600){
 if(!xml.includes('<p:sld ')||!xml.includes('</p:cSld>'))throw Error('Expected a PresentationML slide');
 if(!Number.isInteger(durationMs)||durationMs<100||durationMs>2000)throw Error('Invalid transition duration');
 let result=xml.replace(/<p:transition\b[^>]*\/>/g,'').replace(/<p:transition\b[\s\S]*?<\/p:transition>/g,'');
 if(!result.includes('xmlns:p14='))result=result.replace('<p:sld ','<p:sld xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" ');
 if(!result.includes('xmlns:mc='))result=result.replace('<p:sld ','<p:sld xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ');
 if(!result.includes('mc:Ignorable='))result=result.replace('<p:sld ','<p:sld mc:Ignorable="p14" ');
 else result=result.replace(/mc:Ignorable="([^"]*)"/,(_,list)=>'mc:Ignorable="'+([...new Set([...list.split(/\s+/),'p14'])].join(' '))+'"');
 const transition='<p:transition spd="med" advClick="1" p14:dur="'+durationMs+'"><p:fade thruBlk="0"/></p:transition>';
 const anchor=result.includes('</p:clrMapOvr>')?'</p:clrMapOvr>':'</p:cSld>';
 return result.replace(anchor,anchor+transition);
}
