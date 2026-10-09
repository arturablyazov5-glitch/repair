import fs from 'node:fs';
const norm=s=>s.replace(/<[^>]+>/g,'').replace(/&nbsp;| /g,' ').replace(/[‑‐]/g,'-').replace(/ё/g,'е').replace(/Ё/g,'Е').replace(/\s+/g,' ').toLowerCase();
const src=norm(fs.readFileSync('/home/user/repair/agent-context/reviews.md','utf8'));
const html=fs.readFileSync('/home/user/repair/index.html','utf8');
const qs=[...html.matchAll(/«([^«»]{12,400})»/g)].map(m=>m[1]);
for(const q of new Set(qs)){const frags=norm(q).split(/…|\.\.\.+/).map(s=>s.trim()).filter(s=>s.length>6);
 if(!frags.length)continue; const bad=frags.filter(f=>!src.includes(f)); if(bad.length && frags.length) console.log(bad.length===frags.length?'NOTQUOTE?':'MISMATCH', '|', q.slice(0,90), '||', bad.map(b=>b.slice(0,60)).join(' / '));}
