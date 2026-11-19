import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
const path = new URL('../packages/api/.env.finance.local',import.meta.url);
let existing='';try{existing=await readFile(path,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
const present=new Set(existing.split('\n').filter(l=>!l.trim().startsWith('#')).map(l=>l.split('=')[0].trim()));
const password=randomBytes(24).toString('hex');
const defaults={FINANCE_DB_PASSWORD:password,DATABASE_URL:`postgresql://helios:${password}@127.0.0.1:55433/helios_finance?schema=public`,FINANCE_TOKEN_KEY:randomBytes(32).toString('hex'),SESSION_SECRET:randomBytes(32).toString('hex')};
let result=existing||'# Generated local finance settings. Server only. Never commit this file.\n';
for(const [key,value]of Object.entries(defaults))if(!present.has(key))result+=`${key}="${value}"\n`;
await writeFile(path,result,{mode:0o600});
console.log('Local finance environment prepared; existing values preserved. Provider keys remain in packages/api/.env.');
