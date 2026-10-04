import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const dependency=name=>require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?
  process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/'+name:name);
const {chromium}=dependency('playwright'),{PNG}=dependency('pngjs');
const evidence=new URL('../../../evidence/browser/',import.meta.url);mkdirSync(evidence,{recursive:true});
const browserOptions={headless:true};
if(process.env.BEAUTY_CHROMIUM_EXECUTABLE){
 browserOptions.executablePath=process.env.BEAUTY_CHROMIUM_EXECUTABLE;
 browserOptions.args=['--no-sandbox','--no-zygote','--disable-gpu'];
}else if(process.env.BEAUTY_CHROMIUM_MODULE){
 const packaged=(await import(process.env.BEAUTY_CHROMIUM_MODULE)).default;
 browserOptions.executablePath=await packaged.executablePath();
 browserOptions.args=packaged.args;
}
const browser=await chromium.launch(browserOptions);
try {
 const page=await browser.newPage({viewport:{width:1150,height:1100}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(new URL('../../../demo/moving-face.html',import.meta.url).href);
 await page.waitForFunction(()=>window.beautyState);
 await page.locator('#debug').uncheck();
 const canvas=page.locator('#face');
 const capture=async name=>{const path=fileURLToPath(new URL(name+'.png',evidence));await canvas.screenshot({path});return PNG.sync.read(readFileSync(path));};
 const neutral=await capture('neutral');
 const rms=image=>{
   assert.equal(image.width,neutral.width);assert.equal(image.height,neutral.height);
   let sum=0;for(let i=0;i<image.data.length;i+=4)for(let j=0;j<3;j++)sum+=(image.data[i+j]-neutral.data[i+j])**2;
   return Math.sqrt(sum/(image.width*image.height*3));
 };
 const receipts=['fixture\tpixel_RMS_vs_neutral\tjaw_open_rad\tanterior_mm\tleft_mm\ttissue_scale'];
 for(const name of ['smile','asymmetric_smile','frown','brow_raise','squint','blink','nose_flare','lip_purse','upper_lip_raise','lower_lip_depression','chin_raise','jaw_open','close_from_open','clench','protruded_jaw','retruded_jaw','left_excursion','right_excursion','smile_open','unilateral_masseter','purse_compress']){
   await page.locator('[data-expression="'+name+'"]').click();
   const image=await capture(name),difference=rms(image);
   assert(difference>.15,name+' must alter actual face pixels');
   const state=await page.evaluate(()=>({pose:window.beautyState.face.pose,scale:window.beautyState.face.tissueScale}));
   const p=state.pose;
   if(name==='jaw_open')assert(p.opening>.2);
   if(name==='close_from_open')assert(p.opening<.15);
   if(name==='protruded_jaw')assert(p.protrusion>3);
   if(name==='retruded_jaw')assert(p.protrusion<-3);
   if(name==='left_excursion')assert(p.excursion>2);
   if(name==='right_excursion')assert(p.excursion<-2);
   receipts.push([name,difference.toFixed(4),p.opening,p.protrusion,p.excursion,state.scale].join('\t'));
   console.log('PASS rendered',name,'pixel RMS',difference.toFixed(3));
 }
 await page.locator('#reset').click();
 await page.selectOption('#muscle','masseter_superficial_L');
 await page.locator('#activation').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert(await page.evaluate(()=>window.beautyState.face.q.masseter_superficial_L===1&&window.beautyState.face.q.masseter_superficial_R===0));
 await page.locator('#bilateral').check();
 assert(await page.evaluate(()=>window.beautyState.face.q.masseter_superficial_R===1));
 await page.locator('#reset').click();
 const reset=await capture('reset');assert.equal(rms(reset),0,'reset reproduces exact neutral pixels');
 await page.locator('#debug').check();
 await canvas.screenshot({path:fileURLToPath(new URL('browser-anatomical-debug.png',evidence))});
 await page.locator('#animate').click();
 await page.waitForFunction(()=>window.beautyState.face.q.masseter_superficial_L>.2);
 await page.locator('#reset').click();
 assert(await page.evaluate(()=>Object.values(window.beautyState.face.q).every(v=>v===0)));
 const position=await canvas.boundingBox();await page.mouse.move(position.x+200,position.y+200);await page.mouse.down();await page.mouse.move(position.x+280,position.y+220);await page.mouse.up();
 assert(await page.evaluate(()=>Math.abs(window.beautyState.yaw)>.1));
 await page.locator('#front').click();assert(await page.evaluate(()=>window.beautyState.yaw===0));
 await page.setViewportSize({width:576,height:1152});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'phone-width layout must not overflow');
 await page.screenshot({path:fileURLToPath(new URL('phone-width-demo.png',evidence)),fullPage:true});
 assert.deepEqual(errors,[],'no browser runtime errors');
 writeFileSync(new URL('rendered-fixtures.tsv',evidence),receipts.join('\n')+'\n');
 // Exact screenshots assembled for review; no synthesized expressions.
 const sharp=dependency('sharp'),tiles=['neutral','smile','asymmetric_smile','blink','jaw_open','clench','retruded_jaw','unilateral_masseter'];
 const composite=[];
 for(const [i,name] of tiles.entries()){
   const tile=await sharp(fileURLToPath(new URL(name+'.png',evidence))).resize(270,285).png().toBuffer();
   composite.push({input:tile,left:(i%4)*270,top:Math.floor(i/4)*315+30});
   const title=Buffer.from('<svg width="270" height="30"><rect width="270" height="30" fill="#17232c"/><text x="12" y="21" fill="#d4e3e6" font-size="15" font-family="sans-serif">'+name.replaceAll('_',' ')+'</text></svg>');
   composite.push({input:title,left:(i%4)*270,top:Math.floor(i/4)*315});
 }
 await sharp({create:{width:1080,height:630,channels:3,background:'#17232c'}}).composite(composite).png().toFile(fileURLToPath(new URL('expression-contact-sheet.png',evidence)));
 console.log('PASS headless browser: 21 rendered fixtures, paired activation, reset, orbit and 576px layout');
} finally {await browser.close();}
