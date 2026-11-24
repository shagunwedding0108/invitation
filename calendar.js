import {venue} from './content.js';
const escape = text => text.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
const timestamp = value => new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
// Fold at 75 UTF-8 octets, including the continuation space (RFC 5545).
function fold(line){let lines=[],current='',size=0;for(const char of line){const bytes=new TextEncoder().encode(char).length;if(size+bytes>75){lines.push(current);current=' ';size=1;}current+=char;size+=bytes;}lines.push(current);return lines.join('\r\n');}
export function calendarFile(events, now = new Date()) {
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ShaGun//Wedding Invitation//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:ShaGun Wedding Celebrations'];
  for(const event of events) lines.push('BEGIN:VEVENT',`UID:${event.id}-202612@shagun-invitation`,`DTSTAMP:${timestamp(now)}`,`DTSTART:${timestamp(event.start)}`,`SUMMARY:${escape(event.name+' — Gunjan & Akshay')}`,`LOCATION:${escape(venue)}`,`DESCRIPTION:${escape(event.description+' All times in the invitation are IST. Directions: https://maps.app.goo.gl/QcaXEiYaYT8HfCFi85')}`,'END:VEVENT');
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n')+'\r\n';
}
export function remaining(start, now=Date.now()){
  const total=Math.max(0,Math.floor((new Date(start).getTime()-now)/1000));
  return {days:Math.floor(total/86400),hours:Math.floor(total/3600)%24,minutes:Math.floor(total/60)%60,seconds:total%60,total};
}
