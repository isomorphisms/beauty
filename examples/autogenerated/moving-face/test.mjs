import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readTable,compileAnatomy,controlsToMuscles,validatedActivations,createNeutralMesh,
 deform,expressions,activationExamples,posedActuator,influence,fieldDelta,sub,dot,length,
 solveSkeleton,project,transformJaw} from './model.mjs';
const ledger=readTable(readFileSync(new URL('../../../anatomy/musculature.tsv',import.meta.url),'utf8'));
const controls=readTable(readFileSync(new URL('../../../facial-mask/controls.csv',import.meta.url),'utf8'),',');
const legacy=readTable(readFileSync(new URL('../../../facial-mask/muscle-regions.csv',import.meta.url),'utf8'),',');
const anatomy=compileAnatomy(ledger),mesh=createNeutralMesh();
let tests=0;
function test(name,fn){fn();tests++;console.log('PASS',name);}
const controlFace=v=>deform(anatomy,mesh,controlsToMuscles(anatomy,controls,v));
const neutral=controlFace({});
const point=(face,name)=>face.vertices[mesh.landmarks[name]];
const displacement=(face,name)=>sub(point(face,name),point(neutral,name));
const changed=face=>Math.sqrt(face.vertices.reduce((sum,p,i)=>sum+length(sub(p,mesh.vertices[i]))**2,0)/mesh.vertices.length);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normal=(vertices,t)=>cross(sub(vertices[t[1]],vertices[t[0]]),sub(vertices[t[2]],vertices[t[0]]));
const required=`frontalis_medial frontalis_lateral occipitalis temporoparietalis corrugator_supercilii depressor_supercilii procerus orbicularis_oculi_palpebral_upper orbicularis_oculi_palpebral_lower orbicularis_oculi_orbital_superior orbicularis_oculi_orbital_inferior orbicularis_oculi_lacrimal nasalis_transverse nasalis_alar depressor_septi_nasi levator_labii_superioris_alaeque_nasi levator_labii_superioris zygomaticus_minor zygomaticus_major levator_anguli_oris risorius buccinator orbicularis_oris_upper_medial orbicularis_oris_upper_lateral orbicularis_oris_lower_medial orbicularis_oris_lower_lateral incisivus_labii_superioris incisivus_labii_inferioris depressor_anguli_oris depressor_labii_inferioris mentalis platysma_mandibular platysma_lower_lip auricularis_anterior auricularis_superior auricularis_posterior helicis_major helicis_minor tragicus antitragicus transversus_auriculae obliquus_auriculae masseter_superficial masseter_intermediate masseter_deep temporalis_anterior temporalis_middle temporalis_posterior medial_pterygoid_superficial medial_pterygoid_deep lateral_pterygoid_superior lateral_pterygoid_inferior digastric_anterior digastric_posterior mylohyoid geniohyoid stylohyoid sternohyoid omohyoid_superior omohyoid_inferior sternothyroid thyrohyoid genioglossus hyoglossus styloglossus palatoglossus tongue_superior_longitudinal tongue_inferior_longitudinal tongue_transverse tongue_vertical tensor_veli_palatini levator_veli_palatini palatopharyngeus musculus_uvulae sternocleidomastoid_sternal sternocleidomastoid_clavicular`.split(' ');
test('audited anatomy cannot silently disappear',()=>{
 assert.equal(new Set(ledger.map(r=>r.id)).size,ledger.length);
 for(const id of required)assert(ledger.some(r=>r.id===id),id);
 for(const row of ledger){
  for(const key of ['canonical_name','laterality','origin_region','insertion_region','principal_pull','affected_tissue','skeletal_structure','effect','innervation','model_actuators','disposition','reason','visibility','source'])assert(row[key]?.length,row.id+':'+key);
  assert(['independent','grouped','excluded'].includes(row.disposition));
  if(row.disposition==='excluded')assert.equal(row.model_actuators,'none');
 }
});
test('all attachments and finite influence regions are valid',()=>{
 const fields=new Set(['pull','lid_upper','lid_lower','lid_raise','eye_ring','modiolus','cheek_compress','lip_ring','mentalis','bulge','skeletal','hyoid']);
 for(const a of anatomy.actuators){
  assert(fields.has(a.field),a.id);assert(a.origin.every(Number.isFinite));assert(a.insertion.every(Number.isFinite));
  assert.equal(a.radius.length,3);assert(a.radius.every(v=>Number.isFinite(v)&&v>0));
  assert(a.jaw.every(Number.isFinite));assert(a.hyoid.every(Number.isFinite));
  assert(ledger.some(r=>r.id===a.region_id));
  if(a.field==='pull'||a.field==='modiolus')assert(length(sub(a.origin,a.insertion))>0,a.id);
 }
});
test('36 controls and historical 86 inputs stay addressable',()=>{
 assert.equal(controls.length,36);assert.equal(legacy.reduce((n,r)=>n+Number(r.actuator_count),0),86);
 for(const row of controls){const q=controlsToMuscles(anatomy,controls,{[row.id]:1});assert(Object.values(q).some(v=>v>0),row.id);}
 for(const row of legacy)for(const side of row.laterality==='bilateral'?['L','R']:['']){
  const id=row.id+(side?'_'+side:'');assert.doesNotThrow(()=>validatedActivations(anatomy,{[id]:1}),id);
 }
});
test('grouped entries resolve without losing anatomical identity',()=>{
 for(const row of ledger.filter(r=>r.disposition==='grouped'))for(const side of ['L','R']){
  const q=validatedActivations(anatomy,{[row.id+'_'+side]:.7});
  assert.equal(q[row.model_actuators+'_'+side],.7);
  assert.equal(q[row.model_actuators+'_'+(side==='L'?'R':'L')],0);
 }
});
test('all dispositions and provenance counts agree with the canonical partition',()=>{
 const sources=readTable(readFileSync(new URL('../../../anatomy/sources.tsv',import.meta.url),'utf8'));
 const counts=Object.fromEntries(['independent','grouped','excluded'].map(d=>[d,ledger.filter(r=>r.disposition===d).length]));
 assert.deepEqual(counts,{independent:52,grouped:5,excluded:48});assert.equal(ledger.length,105);
 for(const row of ledger)assert(sources.some(s=>s.id===row.source),row.id+' missing provenance');
});
test('paired muscles have independent sides',()=>{
 for(const row of ledger.filter(r=>r.disposition==='independent'&&r.laterality==='paired')){
  const q=validatedActivations(anatomy,{[row.id+'_L']:1});
  assert.equal(q[row.id+'_L'],1);assert.equal(q[row.id+'_R'],0);
 }
});
test('neutral is exactly neutral surface and skeleton',()=>{
 assert.deepEqual(neutral.vertices,mesh.vertices);assert.deepEqual(neutral.mandible,mesh.mandible);
 assert.equal(neutral.pose.opening,0);assert.equal(changed(neutral),0);
});
test('connected mesh, no orphan vertices, finite triangle area',()=>{
 const adjacency=mesh.vertices.map(()=>new Set());
 for(const t of mesh.triangles){assert(length(normal(mesh.vertices,t))>1e-5);for(const i of t)for(const j of t)adjacency[i].add(j);}
 const visited=new Set([0]),queue=[0];while(queue.length)for(const i of adjacency[queue.pop()])if(!visited.has(i)){visited.add(i);queue.push(i);}
 assert.equal(visited.size,mesh.vertices.length);
});
test('finite contraction fields pull toward anchors and preserve locality',()=>{
 for(const a0 of anatomy.actuators.filter(a=>a.field==='pull')){
  const a=posedActuator(a0,neutral.pose),delta=fieldDelta(a,a.insertion);
  assert(dot(delta,sub(a.origin,a.insertion))>0,a.id);
  assert.equal(influence(a,[a.center[0]+a.radius[0]*2,a.center[1],a.center[2]]),0);
 }
});
test('all independent muscles affect skin or a represented skeleton state',()=>{
 for(const a of anatomy.actuators){
  const face=deform(anatomy,mesh,{[a.id]:1});
  const skeletal=length(sub(face.pose.hyoid,[0,0,0]))+Math.abs(face.pose.protrusion)+Math.abs(face.pose.excursion)+face.pose.opening;
  assert(changed(face)>1e-5||skeletal>1e-5,a.id+' has no geometric effect');
 }
});
test('projected expression landmarks have expected directions',()=>{
 const cases=[['smile','mouth_L',1,1],['asymmetric_smile','mouth_L',1,1],['frown','mouth_L',1,-1],
 ['brow_raise','brow_L',1,1],['nose_flare','ala_L',0,1],['upper_lip_raise','upper_lip',1,1],
 ['lower_lip_depression','lower_lip',1,-1],['chin_raise','chin',1,1],['jaw_open','chin',1,-1],
 ['left_excursion','chin',0,1],['right_excursion','chin',0,-1]];
 for(const [expression,landmark,axis,sign] of cases){
  const face=controlFace(expressions[expression]);
  const d=sub(project(point(face,landmark)),project(point(neutral,landmark)));
  assert(d[axis]*sign>.05,expression+': '+d);
 }
 const asym=controlFace(expressions.asymmetric_smile);
 assert(displacement(asym,'mouth_L')[1]>displacement(asym,'mouth_R')[1]+.5);
});
test('blink closes lid gap separately from squint',()=>{
 const gap=face=>point(face,'upper_lid_L')[1]-point(face,'lower_lid_L')[1];
 const blink=controlFace(expressions.blink),squint=controlFace(expressions.squint);
 assert(gap(blink)<gap(neutral)*.35,'blink gap '+gap(blink));
 assert(gap(squint)>gap(blink)+2,'squint must not be identical to blink');
 assert(displacement(squint,'cheek_L')[1]>0);
});
test('oral sphincter is circumferential with protrusion',()=>{
 const purse=controlFace(expressions.lip_purse);
 assert(displacement(purse,'mouth_L')[0]<0);assert(displacement(purse,'mouth_R')[0]>0);
 assert(displacement(purse,'upper_lip')[1]<0);assert(displacement(purse,'lower_lip')[1]>0);
 assert(displacement(purse,'upper_lip')[2]>0);assert(displacement(purse,'lower_lip')[2]>0);
});
test('mentalis protrudes chin/lower lip; buccinator compresses cheek',()=>{
 const mental=controlFace(expressions.chin_raise),cheek=deform(anatomy,mesh,{buccinator_L:1});
 assert(displacement(mental,'chin')[2]>.1);assert(displacement(mental,'lower_lip')[2]>.1);
 assert(displacement(cheek,'cheek_L')[2]<-.1);
});
test('mandible opens and closes against opposing recruitment',()=>{
 const q=controlsToMuscles(anatomy,controls,{jaw_open:1});
 const opened=deform(anatomy,mesh,q);
 const closed=deform(anatomy,mesh,{...q,...activationExamples.clench});
 assert(opened.pose.opening>.2);assert(closed.pose.opening<opened.pose.opening-.1);
 assert(opened.mandible[3][1]<neutral.mandible[3][1]-10);
 assert(closed.mandible[3][1]>opened.mandible[3][1]+5);
 assert(displacement(opened,'lower_lip')[1]<-1);assert(displacement(opened,'submental')[1]<-1);
 // Rigid skeletal distances remain unchanged under all supported poses.
 for(const face of [opened,closed])assert(Math.abs(length(sub(face.mandible[0],face.mandible[3]))-length(sub(mesh.mandible[0],mesh.mandible[3])))<1e-8);
});
test('free versus stabilized hyoid changes accessory opening mechanics',()=>{
 const free=solveSkeleton(anatomy,validatedActivations(anatomy,{digastric_anterior_L:1,digastric_anterior_R:1}));
 const fixed=solveSkeleton(anatomy,validatedActivations(anatomy,{digastric_anterior_L:1,digastric_anterior_R:1,sternohyoid_L:1,sternohyoid_R:1,omohyoid_superior_L:1,omohyoid_superior_R:1}));
 assert(free.hyoid[1]>fixed.hyoid[1]);assert(fixed.opening>free.opening+.1);
});
test('posterior temporalis retrudes rather than duplicating anterior closure',()=>{
 const anterior=deform(anatomy,mesh,{temporalis_anterior_L:.8,temporalis_anterior_R:.8});
 const posterior=deform(anatomy,mesh,activationExamples.retruded_jaw);
 assert(posterior.pose.protrusion<-3);assert.equal(anterior.pose.protrusion,0);
 assert(posterior.mandible[3][2]<neutral.mandible[3][2]-3);
});
test('unilateral pterygoid produces excursion unlike bilateral recruitment',()=>{
 const unilateral=deform(anatomy,mesh,{lateral_pterygoid_inferior_L:1});
 const bilateral=deform(anatomy,mesh,{lateral_pterygoid_inferior_L:1,lateral_pterygoid_inferior_R:1});
 assert(unilateral.pose.excursion<-3);assert.equal(bilateral.pose.excursion,0);
 assert(bilateral.pose.protrusion>unilateral.pose.protrusion);
});
test('masseter changes ramus fullness with independent side activation',()=>{
 const face=deform(anatomy,mesh,activationExamples.unilateral_masseter);
 assert(displacement(face,'masseter_L')[0]>.05,'outward ramus: '+displacement(face,'masseter_L'));
 assert(length(displacement(face,'masseter_L'))>length(displacement(face,'masseter_R'))+.05);
 assert(face.pose.clench>0);
 const a=posedActuator(anatomy.byId.masseter_superficial_L,neutral.pose);
 const fiber=sub(a.origin,a.insertion),p=a.origin;
 assert(dot(fieldDelta(a,p),fiber)<0,'bulge shortens along fiber axis');
});
test('smile plus open jaw composes skin field with skeletal motion',()=>{
 const face=controlFace(expressions.smile_open),open=controlFace({jaw_open:.7});
 assert(face.pose.opening>.1);
 assert(point(face,'mouth_L')[1]>point(open,'mouth_L')[1]+.5);
 assert(face.q.zygomaticus_major_L>0&&face.q.digastric_anterior_L>0);
 assert(length(displacement(face,'chin'))>5);
});
test('shared modiolus includes sphincter and cheek loading, plus antagonism',()=>{
 const z=deform(anatomy,mesh,{zygomaticus_major_L:.5});
 const d=deform(anatomy,mesh,{depressor_anguli_oris_L:.5});
 const both=deform(anatomy,mesh,{zygomaticus_major_L:.5,depressor_anguli_oris_L:.5});
 assert(both.junctions.L.every((v,i)=>Math.abs(v-z.junctions.L[i]-d.junctions.L[i])<1e-9));
 assert(length(deform(anatomy,mesh,{buccinator_L:1}).junctions.L)>0);
 assert(length(deform(anatomy,mesh,{orbicularis_oris_upper_lateral_L:1}).junctions.L)>0);
 assert.equal(length(both.junctions.R),0);
});
test('signed anterior jaw motion is visible in an oblique landmark projection',()=>{
 const protrude=controlFace(expressions.protruded_jaw),retrude=deform(anatomy,mesh,activationExamples.retruded_jaw);
 const rest=project(point(neutral,'chin'),.6);
 assert(project(point(protrude,'chin'),.6)[0]>rest[0]+1);
 assert(project(point(retrude,'chin'),.6)[0]<rest[0]-1);
});
test('all fixtures, single actuators and antagonism stay finite without folds',()=>{
 const fixtures=[...Object.entries(expressions).map(([name,c])=>[name,controlsToMuscles(anatomy,controls,c)]),
  ...Object.entries(activationExamples),...anatomy.actuators.map(a=>[a.id,{[a.id]:1}]),
  ['all_controls',controlsToMuscles(anatomy,controls,Object.fromEntries(controls.map(r=>[r.id,1])))],
  ['all_muscles',Object.fromEntries(anatomy.actuators.map(a=>[a.id,1]))]];
 for(const [name,q] of fixtures){
  const face=deform(anatomy,mesh,q);assert.equal(face.vertices.length,mesh.vertices.length);assert.deepEqual(face.triangles,mesh.triangles);
  for(const p of face.vertices)assert(p.every(Number.isFinite),name);
  for(const t of mesh.triangles){const n=normal(face.vertices,t),base=normal(mesh.vertices,t);
   assert(length(n)>.005*length(base),name+' collapsed triangle '+t);
   assert(dot(n,base)>0,name+' inverted triangle '+t);
  }
  if(name!=='neutral')assert(changed(face)>1e-5,name+' visible RMS');
 }
});
test('bad activations and control wiring fail closed',()=>{
 for(const v of [NaN,Infinity,-.1,1.1])assert.throws(()=>deform(anatomy,mesh,{mentalis_L:v}));
 assert.throws(()=>deform(anatomy,mesh,{fake_muscle:1}));
 assert.throws(()=>controlsToMuscles(anatomy,controls,{fake_control:1}));
 assert.throws(()=>deform(anatomy,mesh,{occipitalis_L:1}));
});
test('deterministic mixed recruitment remains finite and connected',()=>{
 let seed=1787;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let k=0;k<24;k++){
  const q=Object.fromEntries(anatomy.actuators.map(a=>[a.id,random()])),face=deform(anatomy,mesh,q);
  assert(face.vertices.every(p=>p.every(Number.isFinite)));assert.deepEqual(face.triangles,mesh.triangles);
  for(const t of mesh.triangles)assert(dot(normal(face.vertices,t),normal(mesh.vertices,t))>0);
 }
});
console.log('PASS',tests,'structural/behavior tests;',ledger.length,'entries;',anatomy.actuators.length,'independent actuators;',mesh.vertices.length,'vertices;',mesh.triangles.length,'triangles');
