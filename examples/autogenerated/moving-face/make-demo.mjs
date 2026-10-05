import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const ledger=read('../../../anatomy/musculature.tsv'),controls=read('../../../facial-mask/controls.csv');
// Bundled data and exact runtime source make file:// execution self-contained.
// JSON here encodes strings into ECMAScript source; no JSON anatomical files.
let html=read('demo-body.html').replace('/* MODEL */',()=>
 'const LEDGER_TEXT='+JSON.stringify(ledger)+';\nconst CONTROL_TEXT='+JSON.stringify(controls)+';\n'+read('model.mjs').replace(/^export /gm,''));
html=html.replace('/* RENDER */',()=>read('render.mjs').replace(/^import .*;\n/,'').replace(/^export /gm,''));
const output=new URL('../../../demo/moving-face.html',import.meta.url);
if(process.argv.includes('--check')) {
 if(readFileSync(output,'utf8')!==html)throw Error('Stale demo: regenerate from canonical sources');
 console.log('PASS bundled demo matches exact canonical source');
}else {
 mkdirSync(new URL('../../../demo/',import.meta.url),{recursive:true});
 writeFileSync(output,html);
 console.log('PASS standalone demo generated from canonical ledger, controls and runtime');
}
