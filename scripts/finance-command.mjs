import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {parse}=require('dotenv');
const root=fileURLToPath(new URL('../',import.meta.url));
let env={};for(const name of ['.env','.env.finance.local']){try{env={...env,...parse(await readFile(`${root}packages/api/${name}`))};}catch(e){if(e.code!=='ENOENT')throw e;}}
env={...env,...process.env};
const command=process.argv[2];
const args=command==='migrate'?['node_modules/prisma/build/index.js','migrate','deploy','--schema','packages/api/prisma/schema.prisma']:command==='generate'?['node_modules/prisma/build/index.js','generate','--schema','packages/api/prisma/schema.prisma']:command==='start'?['-r','ts-node/register','-r','tsconfig-paths/register','src/finance.main.ts']:null;
if(!args)throw new Error('Use generate, migrate or start');
const child=spawn(process.execPath,args,{env,cwd:command==='start'?`${root}packages/api`:root,stdio:'inherit'});
child.on('exit',(code,signal)=>{process.exitCode=code??1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
