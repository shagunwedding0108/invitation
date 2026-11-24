import {events,memories,venue} from './content.js';
import {calendarFile,remaining} from './calendar.js';
import {connectWishForm} from './wishes.js';
const $ = selector => document.querySelector(selector);
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}

// The invitation stays closed until the guest deliberately opens it.
window.scrollTo({top:0,behavior:'instant'});
window.addEventListener('pageshow',()=>{if(document.body.classList.contains('invitation-closed'))window.scrollTo({top:0,behavior:'instant'});});
// Natural scrolling and chapter navigation are available after opening.
const menuButton=$('.menu-toggle'),menu=$('#mobile-menu');
function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');}
menuButton.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
menu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
matchMedia('(min-width:701px)').addEventListener('change',e=>{if(e.matches)closeMenu();});

for(const event of events){
  const article=document.createElement('article');article.className='event-row event-'+event.id;article.dataset.day=event.group;
  const day=document.createElement('div');day.className='event-day';
  const date=document.createElement('strong');date.textContent=event.date;
  const time=document.createElement('time');time.dateTime=event.start;time.textContent=event.time+' · IST';day.append(date,time);
  const copy=document.createElement('div');copy.className='event-copy';
  const heading=document.createElement('h3');heading.textContent=event.name;
  const text=document.createElement('p');text.textContent=event.description;copy.append(heading,text);
  const calendar=document.createElement('button');calendar.className='event-calendar';calendar.type='button';calendar.textContent='Add to calendar';calendar.setAttribute('aria-label',`Add ${event.name} to calendar`);calendar.addEventListener('click',()=>downloadCalendar([event]));
  const atmosphere=document.createElement('div');atmosphere.className='event-atmosphere';atmosphere.setAttribute('aria-hidden','true');
  const location=document.createElement('p');location.className='event-venue';
  const pin=document.createElementNS('http://www.w3.org/2000/svg','svg');pin.setAttribute('viewBox','0 0 24 24');pin.setAttribute('aria-hidden','true');
  const pinPath=document.createElementNS('http://www.w3.org/2000/svg','path');pinPath.setAttribute('d','M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z');pin.append(pinPath);
  const locationText=document.createElement('span');locationText.textContent=venue.split(',')[0]+' · Pench';location.append(pin,locationText);
  article.append(atmosphere,day,copy,location,calendar);$('#event-list').append(article);
}
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{
  const filter=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(tab=>tab.setAttribute('aria-pressed',String(tab===button)));
  let count=0;document.querySelectorAll('.event-row').forEach(row=>{row.hidden=filter!=='all'&&row.dataset.day!==filter;if(!row.hidden)count++;});
  $('#filter-status').textContent=`${count} celebrations shown${filter==='12'?', including Pheras at 3 AM on 13 December':''}.`;
});
function downloadCalendar(selected){
  const url=URL.createObjectURL(new Blob([calendarFile(selected)],{type:'text/calendar;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=selected.length===1?`ShaGun-${selected[0].id}.ics`:'ShaGun-All-Celebrations.ics';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  toast('Calendar file downloaded. Open it in your calendar to add the celebrations.');
}
$('#all-calendar').addEventListener('click',()=>downloadCalendar(events));
function updateCountdown(){const count=remaining(events[0].start);for(const unit of ['days','hours','minutes','seconds'])$('#'+unit).textContent=String(count[unit]).padStart(2,'0');if(!count.total){$('#countdown-title').textContent='The celebrations have begun';$('.countdown-note').textContent='With love, Gunjan & Akshay';}}
updateCountdown();setInterval(updateCountdown,1000);

const lightbox=$('#lightbox');let currentPhoto=0,photoTrigger=null,touchStart=null;
function showPhoto(index){currentPhoto=(index+memories.length)%memories.length;const photo=memories[currentPhoto];$('#lightbox-image').src='assets/'+photo.file;$('#lightbox-image').alt=photo.alt;$('#lightbox-caption').textContent=photo.caption+` · ${currentPhoto+1} / ${memories.length}`;}
memories.forEach((photo,index)=>{const button=document.createElement('button');button.className='gallery-item';button.type='button';button.setAttribute('aria-label','View photo: '+photo.caption);const image=document.createElement('img');image.src='assets/'+photo.file;image.alt=photo.alt;image.loading='lazy';image.decoding='async';const caption=document.createElement('span');caption.textContent=photo.caption;button.append(image,caption);button.addEventListener('click',()=>{photoTrigger=button;showPhoto(index);lightbox.showModal();});$('#gallery').append(button);});
$('.lightbox-close').addEventListener('click',()=>lightbox.close());
$('.lightbox-prev').addEventListener('click',()=>showPhoto(currentPhoto-1));
$('.lightbox-next').addEventListener('click',()=>showPhoto(currentPhoto+1));
lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowRight')showPhoto(currentPhoto+1);if(e.key==='ArrowLeft')showPhoto(currentPhoto-1);});
lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
lightbox.addEventListener('close',()=>photoTrigger?.focus());
lightbox.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0].clientX;},{passive:true});
lightbox.addEventListener('touchend',e=>{if(touchStart===null)return;const delta=e.changedTouches[0].clientX-touchStart;if(Math.abs(delta)>50)showPhoto(currentPhoto+(delta<0?1:-1));touchStart=null;},{passive:true});

connectWishForm();

const music=$('#music'),musicToggle=$('#music-toggle');
function syncMusic(){const playing=!music.paused;musicToggle.setAttribute('aria-pressed',String(playing));musicToggle.setAttribute('aria-label',playing?'Pause invitation music':'Play invitation music');$('.music-label').textContent=playing?'Pause music':'Play music';}
musicToggle.addEventListener('click',async()=>{try{if(music.paused){music.volume=.35;await music.play();}else music.pause();}catch{toast('Music couldn’t start. Please try again.');}syncMusic();});
$('#open-invitation').addEventListener('click',()=>{
  // play() runs directly inside this user gesture for mobile autoplay policies.
  document.body.classList.remove('invitation-closed');
  music.volume=.35;
  try { Promise.resolve(music.play()).catch(()=>toast('Tap the music control to start the soundtrack.')); } catch { toast('Tap the music control to start the soundtrack.'); }
  $('#open-invitation').setAttribute('aria-expanded','true');
  $('#invitation-title').focus({preventScroll:true});
  $('#invitation').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
});
music.addEventListener('pause',syncMusic);music.addEventListener('play',syncMusic);music.addEventListener('error',()=>toast('The music file could not be loaded.'));

if('IntersectionObserver'in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.documentElement.classList.add('js-motion');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.04});
  document.querySelectorAll('.reveal').forEach(section=>observer.observe(section));
}
