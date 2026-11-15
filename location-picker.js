let leafletPromise;
function leaflet() {
 if(window.L)return Promise.resolve(window.L);
 if(!leafletPromise)leafletPromise=new Promise((resolve,reject)=>{
  const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';css.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';css.crossOrigin='';document.head.append(css);
  const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';script.crossOrigin='';script.onload=()=>resolve(window.L);script.onerror=()=>{leafletPromise=null;reject(Error('Map library unavailable'));};document.head.append(script);
 });
 return leafletPromise;
}
export function openLocationPicker({lat,lon,language='en',onConfirm}) {
 const ar=language==='ar',t=(en,arabic)=>ar?arabic:en;
 const dialog=document.createElement('dialog');dialog.className='farm-location-dialog';dialog.dir=ar?'rtl':'ltr';
 dialog.innerHTML=`<div class="farm-location-head"><h2>${t('Choose the actual field','اختر موقع الحقل الفعلي')}</h2><button type="button" data-close aria-label="${t('Close','إغلاق')}">×</button></div><p>${t('Select a point on the map, or locate your device and correct the point to your field. This chooses an analysis point, not a field boundary.','اختر نقطة على الخريطة، أو حدد موقع الجهاز ثم صحّح النقطة إلى الحقل. هذه نقطة للتحليل، وليست حدود الحقل.')}</p><button type="button" data-locate>${t('Locate my device','حدد موقع جهازي')} ⌖</button><p data-location-message role="status">${t('Loading map…','جارٍ تحميل الخريطة…')}</p><div class="farm-map" aria-label="${t('Interactive field-location map','خريطة تفاعلية لاختيار موقع الحقل')}"></div><div class="farm-location-coordinates"><label>${t('Latitude','خط العرض')}<input name="mapLat" type="number" step="0.0001" min="-60" max="60" value="${lat}"></label><label>${t('Longitude','خط الطول')}<input name="mapLon" type="number" step="0.0001" min="-180" max="180" value="${lon}"></label><button type="button" data-move>${t('Move point','نقل النقطة')}</button></div><small>${t('Coordinates remain in this page until you confirm. The basemap is provided by OpenStreetMap.','تبقى الإحداثيات في هذه الصفحة حتى تأكيدها. الخريطة الأساسية مقدمة من OpenStreetMap.')}</small><button type="button" data-confirm>${t('Confirm this analysis point','تأكيد نقطة التحليل')}</button>`;
 document.body.append(dialog);dialog.showModal();let map,marker,point={lat,lon},closed=false,accuracy=null;
 const message=dialog.querySelector('[data-location-message]');
 const setPoint=(newLat,newLon)=>{
  if(!Number.isFinite(newLat)||Math.abs(newLat)>60||!Number.isFinite(newLon)||Math.abs(newLon)>180){message.textContent=t('Supported latitude is −60° to 60°; longitude is −180° to 180°.','خط العرض المدعوم من −٦٠° إلى ٦٠°، وخط الطول من −١٨٠° إلى ١٨٠°.');return false;}
  point={lat:newLat,lon:newLon};dialog.querySelector('[name=mapLat]').value=newLat.toFixed(4);dialog.querySelector('[name=mapLon]').value=newLon.toFixed(4);
  if(map){marker.setLatLng([newLat,newLon]);map.panTo([newLat,newLon]);}
  message.textContent=t('Check the point, then confirm your field location.','راجع النقطة ثم أكّد موقع الحقل.');return true;
 };
 const close=()=>{closed=true;map?.remove();dialog.remove();};
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',close,{once:true});
 dialog.querySelector('[data-confirm]').onclick=()=>{if(!dialog.querySelector('[name=mapLat]').value.trim()||!dialog.querySelector('[name=mapLon]').value.trim()){message.textContent=t('Choose both coordinates before confirming.','حدد الإحداثيين قبل التأكيد.');return;}if(!setPoint(Number(dialog.querySelector('[name=mapLat]').value),Number(dialog.querySelector('[name=mapLon]').value)))return;onConfirm({...point,accuracy,method:'user_confirmed_point'});dialog.close();};
 dialog.querySelector('[data-move]').onclick=()=>{accuracy=null;setPoint(Number(dialog.querySelector('[name=mapLat]').value),Number(dialog.querySelector('[name=mapLon]').value));};
 dialog.querySelector('[data-locate]').onclick=()=>{
  if(!navigator.geolocation){message.textContent=t('Device location is unavailable. Select the field on the map.','موقع الجهاز غير متاح. اختر الحقل على الخريطة.');return;}
  message.textContent=t('Waiting for your location permission…','بانتظار إذنك لتحديد الموقع…');
  navigator.geolocation.getCurrentPosition(position=>{
   if(closed)return;accuracy=position.coords.accuracy;
   if(setPoint(position.coords.latitude,position.coords.longitude)){map?.setZoom(13);message.textContent=t('Device accuracy ±','دقة موقع الجهاز ±')+Math.round(accuracy)+' '+t('m. Move the point to your field and confirm.','متر. انقل النقطة إلى الحقل ثم أكّدها.');}
  },()=>{if(!closed)message.textContent=t('Location denied, timed out or unavailable. Select your field on the map or use the coordinate fields.','رُفض الموقع أو انتهت المهلة أو تعذر تحديده. اختر الحقل على الخريطة أو استخدم حقول الإحداثيات.');},{enableHighAccuracy:true,timeout:12000,maximumAge:0});
 };
 leaflet().then(L=>{
  if(closed)return;map=L.map(dialog.querySelector('.farm-map')).setView([lat,lon],8);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
  marker=L.circleMarker([lat,lon],{radius:8,color:'#183f35',fillColor:'#b9d88b',fillOpacity:1}).addTo(map);
  map.on('click',event=>{accuracy=null;setPoint(event.latlng.lat,((event.latlng.lng+180)%360+360)%360-180);});message.textContent=t('Tap your field on the map.','اضغط على موقع الحقل في الخريطة.');map.invalidateSize();
 }).catch(()=>{if(!closed)message.textContent=t('Map unavailable. You can still choose and confirm a point with the coordinate fields.','الخريطة غير متاحة. يمكنك اختيار نقطة وتأكيدها باستخدام حقول الإحداثيات.');});
 return ()=>{if(!closed)dialog.close();};
}
