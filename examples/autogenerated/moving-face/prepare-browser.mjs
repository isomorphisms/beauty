// Test-host dependency unpacking only; no device build or installation.
// Avoid package archive UID restoration inside a root-mapped container.
import {createReadStream,createWriteStream,mkdirSync,chmodSync} from 'node:fs';
import {createBrotliDecompress} from 'node:zlib';
import {pipeline} from 'node:stream/promises';
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
const [packagePath,outputPath]=process.argv.slice(2);
if(!packagePath||!outputPath)throw Error('Supply absolute Chromium package and extraction directories');
const root=resolve(packagePath),output=resolve(outputPath),require=createRequire(join(root,'package.json'));
const {extract}=require('tar-fs');mkdirSync(output,{recursive:true});
await pipeline(createReadStream(join(root,'bin/chromium.br')),createBrotliDecompress(),createWriteStream(join(output,'chromium')));
chmodSync(join(output,'chromium'),0o700);
for(const name of ['fonts','swiftshader'])await pipeline(createReadStream(join(root,'bin/'+name+'.tar.br')),createBrotliDecompress(),extract(output,{chown:false}));
console.log('PASS unpacked test-host browser without restoring foreign archive owners:',join(output,'chromium'));
