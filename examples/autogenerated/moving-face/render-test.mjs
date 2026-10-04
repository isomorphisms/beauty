import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readTable,compileAnatomy,createNeutralMesh,deform,controlsToMuscles,expressions,activationExamples} from './model.mjs';
import {renderFace} from './render.mjs';
const require=createRequire(import.meta.url);
const dependency=name=>require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?
 process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/'+name:name);
const {createCanvas}=dependency('@napi-rs/canvas'),sharp=dependency('sharp');
const ledger=readTable(readFileSync(new URL('../../../anatomy/musculature.tsv',import.meta.url),'utf8'));
const controls=readTable(readFileSync(new URL('../../../facial-mask/controls.csv',import.meta.url),'utf8'),',');
const anatomy=compileAnatomy(ledger),mesh=createNeutralMesh(),canvas=createCanvas(540,570),ctx=canvas.getContext('2d');
const dir=new URL('../../../evidence/canvas/',import.meta.url);mkdirSync(dir,{recursive:true});
let neutral;
const receipts=['fixture\tpixel_RMS_vs_neutral\tjaw_open_rad\tanterior_mm\tleft_mm\ttissue_scale'];
const fixtures={...Object.fromEntries(Object.entries(expressions).map(([n,c])=>[n,controlsToMuscles(anatomy,controls,c)])),...activationExamples,
 close_from_open:{...controlsToMuscles(anatomy,controls,{jaw_open:1}),...activationExamples.clench}};
for(const [name,q] of Object.entries(fixtures)){
 const face=deform(anatomy,mesh,q);renderFace(ctx,mesh,face,{debug:false});
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 if(name==='neutral')neutral=new Uint8ClampedArray(pixels);
 let sum=0;for(let i=0;i<pixels.length;i+=4)for(let j=0;j<3;j++)sum+=(pixels[i+j]-neutral[i+j])**2;
 const rms=Math.sqrt(sum/(canvas.width*canvas.height*3));
 if(name!=='neutral')assert(rms>.1,name+' must alter visible pixels');
 writeFileSync(new URL(name+'.png',dir),canvas.toBuffer('image/png'));
 receipts.push([name,rms.toFixed(4),face.pose.opening,face.pose.protrusion,face.pose.excursion,face.tissueScale].join('\t'));
 console.log('PASS Canvas render',name,'pixel RMS',rms.toFixed(3));
}
// Debug influence and posed skeletal landmarks are rendered through same path.
const debug=deform(anatomy,mesh,activationExamples.unilateral_masseter);
renderFace(ctx,mesh,debug,{debug:true,labels:true,actuator:anatomy.byId.masseter_superficial_L,yaw:.38});
writeFileSync(new URL('anatomical-debug.png',dir),canvas.toBuffer('image/png'));
writeFileSync(new URL('canvas-fixtures.tsv',dir),receipts.join('\n')+'\n');
const tiles=['neutral','smile','asymmetric_smile','blink','jaw_open','clench','retruded_jaw','unilateral_masseter'],composite=[];
for(const [i,name] of tiles.entries()){
 const input=await sharp(fileURLToPath(new URL(name+'.png',dir))).resize(270,285).png().toBuffer();
 composite.push({input,left:(i%4)*270,top:Math.floor(i/4)*315+30});
 const title=Buffer.from('<svg width="270" height="30"><rect width="270" height="30" fill="#17232c"/><text x="12" y="21" fill="#d4e3e6" font-size="15" font-family="sans-serif">'+name.replaceAll('_',' ')+'</text></svg>');
 composite.push({input:title,left:(i%4)*270,top:Math.floor(i/4)*315});
}
await sharp({create:{width:1080,height:630,channels:3,background:'#17232c'}}).composite(composite).png().toFile(fileURLToPath(new URL('expression-contact-sheet.png',dir)));
console.log('PASS rendered Canvas fixtures:',Object.keys(fixtures).length,'(CPU Canvas evidence; separate from browser acceptance)');
