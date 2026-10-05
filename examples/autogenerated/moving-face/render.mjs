import {project,sub,cross,unit,dot,influence,posedActuator,scale} from './model.mjs';
// Projection is a view of the actual posed mesh. No expression image/morph data.
export function renderFace(ctx,mesh,face,options={}) {
  const width=ctx.canvas.width,height=ctx.canvas.height;
  const yaw=options.yaw||0,pitch=options.pitch||0,zoom=Math.min(width/220,height/260);
  const screen=p=>{const v=project(p,yaw,pitch);return [width/2+zoom*(v[0]-Math.sin(yaw)*35),height*.48-zoom*v[1],v[2]];};
  ctx.fillStyle='#17232c';ctx.fillRect(0,0,width,height);
  ctx.strokeStyle='#22323e';ctx.lineWidth=1;
  for(let x=width/2%40;x<width;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
  for(let y=height/2%40;y<height;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
  // Fixed eyeballs beneath the eyelid aperture. Surface triangles cover them.
  for(const side of [-1,1]) {
    const c=screen([side*34.5,34,51]);ctx.beginPath();
    ctx.ellipse(c[0],c[1],zoom*24*Math.cos(yaw),zoom*14,0,0,Math.PI*2);
    ctx.fillStyle='#e7e2d3';ctx.fill();ctx.beginPath();ctx.arc(c[0],c[1],zoom*7,0,Math.PI*2);
    ctx.fillStyle='#526c66';ctx.fill();ctx.beginPath();ctx.arc(c[0],c[1],zoom*3.5,0,Math.PI*2);ctx.fillStyle='#121b20';ctx.fill();
  }
  const mouth=screen([0,-31,56]);ctx.fillStyle='#28151e';ctx.fillRect(mouth[0]-zoom*37,mouth[1]-zoom*12,zoom*74,zoom*55);
  const points=face.vertices.map(screen),light=unit([-.35,.55,1]);
  const triangles=face.triangles.map(t=>({t,depth:t.reduce((s,i)=>s+points[i][2],0)/3})).sort((a,b)=>a.depth-b.depth);
  const selected=options.actuator?posedActuator(options.actuator,face.pose):null;
  const heatWeights=selected?face.vertices.map(p=>influence(selected,p)):null;
  for(const {t} of triangles) {
    const n=unit(cross(sub(face.vertices[t[1]],face.vertices[t[0]]),sub(face.vertices[t[2]],face.vertices[t[0]])));
    const brightness=.55+.45*Math.max(0,dot(n,light));
    let color=[205,153,123].map(v=>Math.round(v*brightness));
    if(selected&&options.debug){const w=t.reduce((s,i)=>s+heatWeights[i],0)/3;color=color.map((v,i)=>Math.round(v*(1-w)+[75,222,189][i]*w));}
    ctx.beginPath();ctx.moveTo(...points[t[0]].slice(0,2));ctx.lineTo(...points[t[1]].slice(0,2));ctx.lineTo(...points[t[2]].slice(0,2));ctx.closePath();
    ctx.fillStyle=`rgb(${color})`;ctx.fill();
    ctx.strokeStyle=options.wireframe?'#314b4b':ctx.fillStyle;ctx.lineWidth=options.wireframe?.45:.65;ctx.stroke();
  }
  // Boundary paths include real eye/mouth holes and the continuous mask rim.
  const edgeCounts=new Map();for(const t of mesh.triangles)for(let k=0;k<3;k++){
    const edge=[t[k],t[(k+1)%3]].sort((a,b)=>a-b),key=edge.join(',');edgeCounts.set(key,(edgeCounts.get(key)||0)+1);
  }
  for(const [key,count] of edgeCounts)if(count===1){
    const [a,b]=key.split(',').map(Number),p=mesh.vertices[a];
    ctx.strokeStyle=p[1]>20&&p[1]<46&&Math.abs(p[0])<60?'#59443e':p[1]>-38&&p[1]<-22&&Math.abs(p[0])<35?'#86534d':'#aa7f68';
    ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(...points[a].slice(0,2));ctx.lineTo(...points[b].slice(0,2));ctx.stroke();
  }
  // Brows follow sampled skin, rather than independently animated strokes.
  const nearest=p=>mesh.vertices.reduce((best,v,i)=>dot(sub(v,p),sub(v,p))<dot(sub(mesh.vertices[best],p),sub(mesh.vertices[best],p))?i:best,0);
  for(const side of [-1,1]){
    ctx.beginPath();for(let k=0;k<7;k++){
      const i=nearest([side*(17+k*5),49+Math.sin(k/6*Math.PI)*4,50]),p=points[i];
      if(k===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
    }ctx.strokeStyle='#5b4337';ctx.lineWidth=3.4;ctx.stroke();
  }
  if(options.debug) {
    const line=(path,color)=>{ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();path.map(screen).forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();};
    line(face.mandible,'#ffd275');line(face.hyoid,'#86bafa');
    for(const [name,i] of Object.entries(mesh.landmarks)){
      const p=points[i];ctx.fillStyle='#e8f4f1';ctx.beginPath();ctx.arc(p[0],p[1],2.2,0,Math.PI*2);ctx.fill();
      if(options.labels){ctx.font='10px sans-serif';ctx.fillText(name,p[0]+4,p[1]-3);}
    }
    if(selected){line([selected.origin,selected.insertion],'#73ffcf');
      for(const p of [selected.origin,selected.insertion]){const s=screen(p);ctx.beginPath();ctx.arc(s[0],s[1],4,0,Math.PI*2);ctx.fillStyle='#73ffcf';ctx.fill();}
    }
  }
  ctx.font='12px sans-serif';ctx.fillStyle='#cbd9dd';ctx.fillText('Subject right',10,height-12);ctx.fillText('Subject left',width-86,height-12);
  return points;
}
