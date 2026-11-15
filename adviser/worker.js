import { MODEL, GUIDANCE, rankVectors } from './knowledge.js';
let extractor,documents;
self.onmessage=async({data})=>{
 try{
  if(!extractor){
   self.postMessage({status:'loading'});
   const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
   env.allowLocalModels=false;env.backends.onnx.wasm.numThreads=1;
   extractor=await pipeline('feature-extraction',MODEL.id,{revision:MODEL.revision,dtype:'q8',device:'wasm',progress_callback:p=>{if(p.status==='progress')self.postMessage({status:'download',file:p.file,progress:p.progress});}});
   documents=(await extractor(GUIDANCE.map(p=>p.title+'. '+p.text),{pooling:'mean',normalize:true})).tolist();
  }
  const started=performance.now();
  const query=(await extractor(data.question,{pooling:'mean',normalize:true})).tolist()[0];
  self.postMessage({status:'result',ranked:rankVectors(query,documents),dimensions:query.length,model:MODEL,ms:performance.now()-started});
 }catch(error){self.postMessage({status:'error',message:error.message});}
};
