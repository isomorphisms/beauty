// Reference fallback. +X subject left, +Y superior, +Z anterior; millimetres.
export const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const scale=(a,n)=>a.map(v=>v*n);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const length=a=>Math.hypot(...a);
export const unit=a=>scale(a,1/(length(a)||1));
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function readTable(text,separator='\t') {
  const lines=text.trim().split(/\r?\n/), keys=lines.shift().split(separator);
  return lines.map(line=>Object.fromEntries(line.split(separator).map((v,i)=>[keys[i],v])));
}
const numbers=s=>s.split(';').map(Number);
export function compileAnatomy(ledger) {
  const actuators=[];
  for(const row of ledger.filter(r=>r.disposition==='independent')) {
    for(const side of row.laterality==='paired'?['L','R']:['U']) {
      const sign=side==='R'?-1:1;
      const mirror=p=>[p[0]*sign,p[1],p[2]];
      actuators.push({...row,id:row.id+(side==='U'?'':'_'+side),region_id:row.id,side,
        origin:mirror(numbers(row.origin_point)),insertion:mirror(numbers(row.insertion_point)),
        radius:numbers(row.influence_radius),jaw:numbers(row.jaw_coefficients),
        hyoid:numbers(row.hyoid_coefficients)});
    }
  }
  const byId=Object.fromEntries(actuators.map(a=>[a.id,a]));
  const aliases={};
  for(const row of ledger.filter(r=>r.disposition==='grouped'))
    for(const side of row.laterality==='paired'?['L','R']:['U']) {
      const suffix=side==='U'?'':'_'+side;
      aliases[row.id+suffix]=row.model_actuators+suffix;
    }
  // Existing 86-region interface retained; old unsplit medial pterygoid drives
  // both anatomical heads with the same activation, without adding anatomy.
  for(const side of ['L','R']) aliases['medial_pterygoid_'+side]=
    ['medial_pterygoid_superficial_'+side,'medial_pterygoid_deep_'+side];
  return {ledger,actuators,byId,aliases};
}
export function validatedActivations(anatomy,inputs={}) {
  const q=Object.fromEntries(anatomy.actuators.map(a=>[a.id,0]));
  for(const [id,value] of Object.entries(inputs)) {
    if(!Number.isFinite(value)||value<0||value>1) throw Error('Invalid activation: '+id);
    const targets=id in q?[id]:anatomy.aliases[id];
    if(!targets) throw Error('Unknown or excluded actuator: '+id);
    for(const target of Array.isArray(targets)?targets:[targets]) {
      if(!(target in q)) throw Error('Unresolved grouped actuator: '+target);
      q[target]=Math.max(q[target],value);
    }
  }
  return q;
}
const driverRules={
 brow_outer_raise:[['frontalis_lateral',1]],brow_inner_raise:[['frontalis_medial',1]],
 brow_lower:[['corrugator_supercilii',1],['depressor_supercilii',.6],['procerus',.35]],
 upper_lid_raise:[['levator_palpebrae_superioris',1]],
 eye_close:[['orbicularis_oculi_palpebral_upper',1],['orbicularis_oculi_palpebral_lower',1]],
 cheek_raise:[['orbicularis_oculi_orbital_inferior',.8],['zygomaticus_major',.25]],
 nose_wrinkle:[['nasalis_transverse',.8],['levator_labii_superioris_alaeque_nasi',.45]],
 nostril_dilate:[['nasalis_alar',1]],
 upper_lip_raise:[['levator_labii_superioris',.75],['levator_labii_superioris_alaeque_nasi',.45],['zygomaticus_minor',.45]],
 lip_corner_raise:[['zygomaticus_major',.85],['levator_anguli_oris',.65]],
 lip_corner_pull:[['risorius',.8],['zygomaticus_major',.2]],
 lip_corner_depress:[['depressor_anguli_oris',.9],['platysma_lower_lip',.25]],
 lower_lip_depress:[['depressor_labii_inferioris',.9],['platysma_lower_lip',.15]],
 chin_raise:[['mentalis',1]]
};
export function controlsToMuscles(anatomy,controlRows,values={}) {
  const valid=new Set(controlRows.map(r=>r.id));
  for(const [id,v] of Object.entries(values))
    if(!valid.has(id)||!Number.isFinite(v)||v<0||v>1) throw Error('Invalid control: '+id);
  const q=validatedActivations(anatomy);
  const recruit=(id,v)=>{if(!(id in q)) throw Error('Bad control wiring: '+id); q[id]=clamp(q[id]+v);};
  const pair=(id,v)=>{for(const side of ['L','R']) recruit(id+'_'+side,v);};
  for(const [id,v] of Object.entries(values)) {
    const match=id.match(/^(.*)_([LR])$/);
    if(match&&driverRules[match[1]]) {
      for(const [driver,gain] of driverRules[match[1]]) recruit(driver+(driver==='procerus'?'':'_'+match[2]),v*gain);
      continue;
    }
    if(['lip_pucker','lip_funnel','lip_press'].includes(id)) {
      for(const region of ['upper_medial','upper_lateral','lower_medial','lower_lateral'])
        pair('orbicularis_oris_'+region,v*(id==='lip_funnel'?.65:id==='lip_press'?.55:1));
      if(id==='lip_funnel') pair('buccinator',v*.3);
    } else if(id==='jaw_open') {
      pair('digastric_anterior',v);pair('geniohyoid',v*.6);pair('mylohyoid',v*.25);
      pair('sternohyoid',v*.85);pair('omohyoid_superior',v*.5);
      pair('lateral_pterygoid_inferior',v*.25);
    } else if(id==='jaw_protrude') {
      pair('lateral_pterygoid_inferior',v*.7);pair('medial_pterygoid_superficial',v*.2);
    } else if(id==='jaw_left'||id==='jaw_right') {
      // Pterygoid contraction pulls jaw contralaterally: +X is subject left.
      recruit('lateral_pterygoid_inferior_'+(id==='jaw_left'?'R':'L'),v*.8);
    } else if(id==='neck_tense') {
      pair('platysma_mandibular',v);pair('platysma_lower_lip',v*.5);
    } else throw Error('Unwired control: '+id);
  }
  // Voluntary opening suppresses closing recruitment at control resolution;
  // direct activation remains available for co-contraction experiments.
  const opening=values.jaw_open||0;
  for(const a of anatomy.actuators) if(a.jaw[0]<0) q[a.id]*=1-opening;
  return q;
}
export const expressions={
 neutral:{},smile:{lip_corner_raise_L:.8,lip_corner_raise_R:.8,cheek_raise_L:.45,cheek_raise_R:.45},
 asymmetric_smile:{lip_corner_raise_L:.9,cheek_raise_L:.3},
 frown:{lip_corner_depress_L:.8,lip_corner_depress_R:.8,brow_lower_L:.4,brow_lower_R:.4},
 brow_raise:{brow_outer_raise_L:.8,brow_outer_raise_R:.8,brow_inner_raise_L:.8,brow_inner_raise_R:.8},
 squint:{cheek_raise_L:.9,cheek_raise_R:.9},blink:{eye_close_L:1,eye_close_R:1},
 nose_flare:{nostril_dilate_L:1,nostril_dilate_R:1},lip_purse:{lip_pucker:.85},
 upper_lip_raise:{upper_lip_raise_L:.8,upper_lip_raise_R:.8},
 lower_lip_depression:{lower_lip_depress_L:.8,lower_lip_depress_R:.8},
 chin_raise:{chin_raise_L:.8,chin_raise_R:.8},jaw_open:{jaw_open:.85},
 protruded_jaw:{jaw_protrude:.9},left_excursion:{jaw_left:.9},right_excursion:{jaw_right:.9},
 smile_open:{lip_corner_raise_L:.8,lip_corner_raise_R:.8,jaw_open:.7},
 purse_cheek:{lip_pucker:.8,lip_funnel:.7}
};
export const activationExamples={
 clench:{masseter_superficial_L:1,masseter_superficial_R:1,temporalis_anterior_L:.55,temporalis_anterior_R:.55},
 retruded_jaw:{temporalis_posterior_L:.8,temporalis_posterior_R:.8},
 unilateral_masseter:{masseter_superficial_L:1},
 purse_compress:{orbicularis_oris_upper_medial_L:.8,orbicularis_oris_upper_medial_R:.8,
  orbicularis_oris_lower_medial_L:.8,orbicularis_oris_lower_medial_R:.8,buccinator_L:.8,buccinator_R:.8}
};
export function solveSkeleton(anatomy,q) {
  let opening=0,protrusion=0,excursion=0,hy=0,hz=0,stabilizers=0;
  for(const a of anatomy.actuators) if(a.hyoid[0]<0) stabilizers+=q[a.id]*Math.abs(a.hyoid[0]);
  const fixation=clamp(stabilizers/1.4);
  let closure=0;
  for(const a of anatomy.actuators) {
    const v=q[a.id];
    const conditional=['digastric_anterior','mylohyoid','geniohyoid'].includes(a.region_id)?fixation:1;
    opening+=v*a.jaw[0]*conditional;closure+=v*Math.max(0,-a.jaw[0]);
    protrusion+=v*a.jaw[1];excursion+=v*a.jaw[2]*(a.side==='R'?-1:1);
    hy+=v*a.hyoid[0]*(a.hyoid[0]>0?1-fixation:.15);hz+=v*a.hyoid[1]*(1-fixation);
  }
  // Passive rest is a closed jaw. Closers oppose opening but cannot rotate
  // through the dental stop. Protrusion/retrusion are signed translations.
  return {opening:clamp(opening*.23,0,.48),protrusion:clamp(protrusion*5,-7,9),
    excursion:clamp(excursion*6,-7,7),clench:clamp(closure/2),
    hyoid:[0,clamp(hy*5,-5,8),clamp(hz*5,-5,7)],fixation};
}
export function transformJaw(p,pose) {
  const hinge=[0,12,0], y=p[1]-hinge[1],z=p[2]-hinge[2];
  const c=Math.cos(pose.opening),s=Math.sin(pose.opening);
  // Condylar forward glide grows with opening; replaceable by a future TMJ law.
  return [p[0]+pose.excursion,hinge[1]+c*y-s*z,z*c+y*s+pose.protrusion+pose.opening*8];
}
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const maskWidth=y=>80-44*smooth((-y-60)/50)-19*smooth((y-75)/35)+11*Math.exp(-(((y-18)/20)**2));
export function jawWeight(p) {return smooth((-p[1]-20)/42);}
function skinJawWeight(p) {
  // Smooth mandibular attachment transition across perioral tissue. Local
  // corner bumps in this weight can fold the thin lip-corner triangles.
  return jawWeight(p);
}
function isMandibularOrigin(a) {
  return ['depressor_anguli_oris','depressor_labii_inferioris','mentalis','mylohyoid','geniohyoid','digastric_anterior'].includes(a.region_id);
}
function isMandibularInsertion(a) {return /^(masseter_|temporalis_|medial_pterygoid_|lateral_pterygoid_)/.test(a.region_id);}
export function posedActuator(a,pose) {
  const origin=isMandibularOrigin(a)?transformJaw(a.origin,pose):a.origin;
  const insertion=isMandibularInsertion(a)?transformJaw(a.insertion,pose):
    add(a.insertion,scale(sub(transformJaw(a.insertion,pose),a.insertion),skinJawWeight(a.insertion)));
  const center=['bulge','mentalis'].includes(a.field)?scale(add(origin,insertion),.5):insertion;
  return {...a,origin,insertion,center};
}
export function influence(a,p) {
  if(a.field==='lid_upper'||a.field==='lid_lower') {
    const eyeX=a.side==='R'?-32:32,eyeY=34;
    // Follow the actual elliptical lid boundary of the neutral mask. Taper
    // outside that margin; a rectangular plateau would collapse adjacent skin.
    const dx=p[0]*80/maskWidth(p[1])-eyeX;
    const margin=8*Math.sqrt(Math.max(0,1-(dx/20)**2));
    return (1-smooth((Math.abs(dx)-18)/10))*
      (1-smooth((Math.abs(p[1]-eyeY)-margin)/12))*
      (1-smooth((Math.abs(p[2]-57)-16)/22));
  }
  const r2=p.reduce((v,x,i)=>v+((x-a.center[i])/a.radius[i])**2,0);
  if(r2>=1) return 0;
  // Compact C2 kernel; no global opposite-side movement.
  return (1-r2)**3;
}
function contraction(a) {return scale(unit(sub(a.origin,a.insertion)),Math.min(7,length(sub(a.origin,a.insertion))*.15));}
export function fieldDelta(a,p) {
  const w=influence(a,p);if(!w)return [0,0,0];
  const base=contraction(a),offset=sub(p,a.center);
  if(a.field==='skeletal'||a.field==='hyoid'||a.field==='none') return [0,0,0];
  if(a.field==='bulge') {
    // Isochoric fiber shortening: determinant λ × λ^-1/2 × λ^-1/2 = 1.
    // Finite tissue envelope makes total skin volume approximate, not exact.
    const fiber=unit(sub(a.origin,a.insertion)),parallel=scale(fiber,dot(offset,fiber));
    const perpendicular=sub(offset,parallel),lambda=.82;
    return scale(add(scale(parallel,lambda-1),scale(perpendicular,1/Math.sqrt(lambda)-1)),w);
  }
  if(a.field==='cheek_compress') return scale(add(base,[0,0,-3]),w);
  if(a.field==='mentalis') return scale(add(base,[0,1.5,4]),w);
  if(a.field==='lip_ring') {
    // Each sector acts toward the shared mouth ellipse, not one offset vector.
    const cx=0,cy=-31;
    const radial=[(cx-p[0])*.24,(cy-p[1])*.38,3.5];
    return scale(radial,w);
  }
  if(a.field.startsWith('lid_')) {
    const eyeY=34;
    if(a.field==='lid_raise') return p[1]>=eyeY?scale([0,6,0],w):[0,0,0];
    const isUpper=a.field==='lid_upper';
    if((p[1]>=eyeY)!==isUpper) return [0,0,0];
    // Retain a thin contact gap at maximum closure so the coarse lid-corner
    // triangles do not flatten into the seam. A future thickness/contact mesh
    // can replace this 4% rest-gap clearance.
    return [0,(eyeY-p[1])*w*.96,0];
  }
  if(a.field==='eye_ring') {
    const cy=34,cx=a.side==='R'?-32:32;
    return scale([(cx-p[0])*.12,(cy-p[1])*.18,1.8],w);
  }
  return scale(base,w);
}
export function createNeutralMesh() {
  const vertices=[],triangles=[],lookup=new Map(),nx=40,ny=55;
  const holes=[{x:0,y:-30,hx:28,hy:4},{x:32,y:34,hx:20,hy:8},{x:-32,y:34,hx:20,hy:8}];
  function position(x,y) {
    for(const h of holes) {
      const dx=x-h.x,dy=y-h.y,m=Math.max(Math.abs(dx/h.hx),Math.abs(dy/h.hy));
      if(m>0&&m<1.5) {
        const factor=m/Math.hypot(dx/h.hx,dy/h.hy),blend=1-smooth((m-1)/.5);
        x=h.x+dx*(1+(factor-1)*blend);y=h.y+dy*(1+(factor-1)*blend);
      }
    }
    const width=maskWidth(y);
    x=x/80*width;
    const faceDepth=54-16*smooth((y-65)/45)-22*smooth((-y-75)/35);
    const z=faceDepth*Math.sqrt(Math.max(.03,1-(x/95)**2))+
      24*Math.exp(-((x/15)**2)-((y-8)/27)**2)+
      15*Math.exp(-((x/35)**2)-((y+31)/22)**2)+
      10*Math.exp(-((x/33)**2)-((y+66)/18)**2);
    return [x,y,z];
  }
  const insideHole=(x,y)=>holes.some(h=>Math.abs(x-h.x)<h.hx&&Math.abs(y-h.y)<h.hy);
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++) {
    const x=-80+i*4,y=-110+j*4;
    if(insideHole(x,y))continue;
    lookup.set(i+','+j,vertices.length);vertices.push(position(x,y));
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++) {
    if(insideHole(-78+i*4,-108+j*4))continue;
    const ids=[[i,j],[i+1,j],[i,j+1],[i+1,j+1]].map(v=>lookup.get(v.join(',')));
    if(ids.some(v=>v===undefined))continue;
    const [a,b,c,d]=ids;triangles.push([a,b,d],[a,d,c]);
  }
  // Every stored vertex must belong to a triangle (holes cannot leave orphans).
  const used=new Set(triangles.flat()),map=new Map([...used].sort((a,b)=>a-b).map((v,i)=>[v,i]));
  const compact=[...map.keys()].map(i=>vertices[i]);
  const indexAt=target=>compact.reduce((best,p,i)=>length(sub(p,target))<length(sub(compact[best],target))?i:best,0);
  const landmarks={chin:[0,-70,65],upper_lip:[0,-26,69],lower_lip:[0,-34,70],
    mouth_L:[28,-30,64],mouth_R:[-28,-30,64],brow_L:[24,50,54],brow_R:[-24,50,54],
    upper_lid_L:[32,42,54],lower_lid_L:[32,26,56],upper_lid_R:[-32,42,54],lower_lid_R:[-32,26,56],
    ala_L:[16,2,76],ala_R:[-16,2,76],masseter_L:[69,-30,29],masseter_R:[-69,-30,29],
    cheek_L:[46,-22,58],cheek_R:[-46,-22,58],submental:[0,-94,31]};
  return {vertices:compact,triangles:triangles.map(t=>t.map(i=>map.get(i))),
    landmarks:Object.fromEntries(Object.entries(landmarks).map(([k,p])=>[k,indexAt(p)])),
    mandible:[[-58,12,0],[-59,-47,19],[-36,-70,48],[0,-73,64],[36,-70,48],[59,-47,19],[58,12,0]],
    hyoid:[[-17,-98,18],[0,-100,21],[17,-98,18]]};
}
export function deform(anatomy,mesh,inputs={}) {
  const q=validatedActivations(anatomy,inputs),pose=solveSkeleton(anatomy,q);
  const fields=anatomy.actuators.filter(a=>q[a.id]>0).map(a=>posedActuator(a,pose));
  // Shared mouth-corner force accumulation, saturated once. All local oral
  // drivers feed the same junction; cheek skin receives the same solved motion.
  const junctions={L:[0,0,0],R:[0,0,0]};
  const corners=Object.fromEntries(['L','R'].map(side=>{
    const corner=side==='L'?[29,-31,63]:[-29,-31,63];
    return [side,add(corner,scale(sub(transformJaw(corner,pose),corner),skinJawWeight(corner)))];
  }));
  for(const a of fields.filter(a=>a.field==='modiolus'))
    junctions[a.side]=add(junctions[a.side],scale(contraction(a),q[a.id]));
  // Buccinator and oral sphincter sectors tension the same junction as corner
  // elevators/depressors. Resolve their local contributions once as well.
  const couplesToCorner=a=>['lip_ring','cheek_compress'].includes(a.field);
  for(const a of fields.filter(couplesToCorner))for(const side of ['L','R'])
    junctions[side]=add(junctions[side],scale(fieldDelta(a,corners[side]),q[a.id]));
  for(const side of ['L','R']) {const n=length(junctions[side]);if(n>9)junctions[side]=scale(junctions[side],9/n);}
  const skeletalVertices=[];
  let vertices=mesh.vertices.map(p=>{
    const jawMotion=scale(sub(transformJaw(p,pose),p),skinJawWeight(p));
    let posed=add(p,jawMotion),delta=[0,0,0];
    skeletalVertices.push(posed);
    const cornerWeight=side=>influence({center:corners[side],radius:[32,30,28]},posed);
    for(const a of fields) if(a.field!=='modiolus') {
      const freeTissue=couplesToCorner(a)?1-Math.max(cornerWeight('L'),cornerWeight('R')):1;
      delta=add(delta,scale(fieldDelta(a,posed),q[a.id]*freeTissue));
    }
    for(const side of ['L','R']) {
      delta=add(delta,scale(junctions[side],cornerWeight(side)));
    }
    const submentalWeight=Math.exp(-((p[0]/32)**2)-((p[1]+96)/20)**2);
    delta=add(delta,scale(pose.hyoid,submentalWeight*.65));
    // Bounded composite displacement guards cheap reference tissue against
    // unrealistic summed shortening; it preserves direction and does not use
    // expression-specific shapes. Shared junction already has its own bound.
    const magnitude=length(delta);if(magnitude>13)delta=scale(delta,13/magnitude);
    return add(posed,delta);
  });
  // Backtracking on tissue strain keeps every rest triangle oriented and above
  // a minimum area. This acts on combined fields, never selects an expression
  // morph, and never attenuates the rigid mandible. Expose it for debug/QA.
  const normal=(vs,t)=>cross(sub(vs[t[1]],vs[t[0]]),sub(vs[t[2]],vs[t[0]]));
  const restNormals=mesh.triangles.map(t=>normal(mesh.vertices,t));
  const safe=vs=>mesh.triangles.every((t,i)=>{
    const n=normal(vs,t),rest=restNormals[i];
    return dot(n,rest)>0&&length(n)>.025*length(rest);
  });
  let tissueScale=1;
  const strainDiagnostics=[];
  if(!safe(vertices)) {
    for(const [i,t] of mesh.triangles.entries()) {
      const n=normal(vertices,t),rest=restNormals[i];
      if(dot(n,rest)<=0||length(n)<=.025*length(rest)) {
        strainDiagnostics.push({triangle:t,rest:t.map(i=>mesh.vertices[i]),requested:t.map(i=>vertices[i])});
        if(strainDiagnostics.length===3)break;
      }
    }
    const deltas=vertices.map((v,i)=>sub(v,skeletalVertices[i]));
    do {
      tissueScale*=.5;
      vertices=skeletalVertices.map((v,i)=>add(v,scale(deltas[i],tissueScale)));
    } while(!safe(vertices)&&tissueScale>1/4096);
    if(!safe(vertices)) throw Error('Skeletal pose folds reference surface: '+JSON.stringify(strainDiagnostics[0]));
  }
  return {vertices,triangles:mesh.triangles,landmarks:mesh.landmarks,pose,q,fields,junctions,tissueScale,strainDiagnostics,
    mandible:mesh.mandible.map(p=>transformJaw(p,pose)),hyoid:mesh.hyoid.map(p=>add(p,pose.hyoid))};
}
export function project(p,yaw=0,pitch=0) {
  const c=Math.cos(yaw),s=Math.sin(yaw),x=c*p[0]+s*p[2],z=-s*p[0]+c*p[2];
  return [x,Math.cos(pitch)*p[1]-Math.sin(pitch)*z,Math.sin(pitch)*p[1]+Math.cos(pitch)*z];
}
