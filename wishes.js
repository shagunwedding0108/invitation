import {wishesEndpoint} from './wish-config.js';

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const isSaved=result=>result?.saved===true||result?.received===true;
function statusURL(id){
  const url=new URL(wishesEndpoint);
  url.searchParams.set('action','status');
  url.searchParams.set('receipt',id);
  url.searchParams.set('_',crypto.randomUUID());
  return url;
}
async function receiptFetch(id){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6000);
  try{
    const response=await fetch(statusURL(id),{method:'GET',mode:'cors',credentials:'omit',cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error('Receipt HTTP '+response.status);
    return isSaved(await response.json());
  }finally{clearTimeout(timer);}
}
function receiptJSONP(id){
  return new Promise((resolve,reject)=>{
    const callback='shagunReceipt_'+crypto.randomUUID().replaceAll('-','');
    const script=document.createElement('script');
    let timeout;
    function cleanup(){clearTimeout(timeout);script.remove();delete window[callback];}
    window[callback]=result=>{cleanup();resolve(isSaved(result));};
    script.onerror=()=>{cleanup();reject(new Error('Receipt script could not be loaded'));};
    const url=statusURL(id);url.searchParams.set('callback',callback);
    script.src=url.href;
    timeout=setTimeout(()=>{cleanup();reject(new Error('Receipt check timed out'));},7000);
    document.head.append(script);
  });
}
async function receipt(id){
  // Either CORS JSON or JSONP may succeed, depending on browser and deployment.
  try{
    await Promise.any([receiptFetch(id),receiptJSONP(id)].map(async check=>{
      if(!await check)throw new Error('Receipt not found yet');
      return true;
    }));
    return true;
  }catch{return false;}
}
export function connectWishForm(){
  const form=document.querySelector('#wish-form');
  const button=document.querySelector('#send-wish');
  const status=document.querySelector('#wish-feedback');
  let pending=null,busy=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||!form.reportValidity())return;
    const name=form.elements.name.value.trim(),blessing=form.elements.blessing.value.trim();
    if(!name||!blessing){status.textContent='Please enter your name and a blessing.';return;}
    if(!wishesEndpoint){status.textContent='Wish delivery is being connected. Please try again shortly.';return;}
    if(!pending||pending.name!==name||pending.blessing!==blessing)pending={id:crypto.randomUUID(),name,blessing};
    busy=true;button.disabled=true;form.elements.name.disabled=true;form.elements.blessing.disabled=true;button.textContent='Sending…';status.textContent='Sending your blessing…';
    const data=new URLSearchParams({action:'submit',receipt:pending.id,id:pending.id,name:pending.name,message:pending.blessing,blessing:pending.blessing,lang:document.documentElement.lang==='hi'?'hi':'en',website:form.elements.website.value});
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),15000);
      try{
        await fetch(wishesEndpoint,{method:'POST',mode:'no-cors',credentials:'omit',body:data,signal:controller.signal});
      }catch(error){
        // A request can be saved by Apps Script before a redirect or browser error.
        // Continue to verify the receipt even if the POST promise rejects.
        console.warn('Wish POST response unavailable; checking saved receipt.',error);
      }finally{clearTimeout(timer);}
      status.textContent='Confirming your blessing…';
      let confirmed=false;
      for(let attempt=0;attempt<4;attempt++){
        if(await receipt(pending.id)){confirmed=true;break;}
        if(attempt<3)await pause(1500);
      }
      if(!confirmed){
        status.textContent='Your wish was sent for processing, but we couldn’t verify delivery. Please retry if needed; the same submission won’t be saved twice.';
        console.warn('Wish receipt could not be verified.');
      }else{
        status.textContent='Thank you! Your wedding wish has been received.';
        form.reset();pending=null;
      }
    }finally{busy=false;button.disabled=false;form.elements.name.disabled=false;form.elements.blessing.disabled=false;button.textContent='Send my wish';}
  });
}
