/* Film: All data under samma tak. Allt ritas som en ren funktion av tiden, så att varje bildruta går att söka fram och rendera till video. */
(function(){
'use strict';
var W=1920,H=1080,g=null;
var C={slate:'#273D4C',deep:'#18262F',red:'#D1403B',white:'#FFFFFF',paper:'#F2F4F5',mint:'#A9DCC8',mist:'#C3CFD6',steel:'#6F8290',line:'#D3DBE0'};
var FD='"Schibsted Grotesk","Helvetica Neue",Arial,sans-serif',FM='"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace';
var NB=' ';

/* ---------- matematik ---------- */
function clamp(x,a,b){a=a===undefined?0:a;b=b===undefined?1:b;return x<a?a:x>b?b:x;}
function lerp(a,b,t){return a+(b-a)*t;}
function seg(t,a,b){return clamp((t-a)/(b-a));}
function pop(t,t0,d){return clamp((t-t0)/(d||.5));}
function out3(x){return 1-Math.pow(1-x,3);}
function out5(x){return 1-Math.pow(1-x,5);}
function in3(x){return x*x*x;}
function io3(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}
function back(x){var c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);}
function smooth(x){return x*x*(3-2*x);}
function hash(i){var x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function kf(keys,t,ease){
  if(t<=keys[0][0])return keys[0].slice(1);
  for(var i=1;i<keys.length;i++){if(t<=keys[i][0]){var a=keys[i-1],b=keys[i],p=(ease||io3)((t-a[0])/(b[0]-a[0]));return a.slice(1).map(function(v,j){return lerp(v,b[j+1],p);});}}
  return keys[keys.length-1].slice(1);
}

/* ---------- ritprimitiver ---------- */
function bg(c){g.fillStyle=c;g.fillRect(0,0,W,H);}
function setFont(w,size,fam){g.font=w+' '+size+'px '+(fam||FD);}
function T(str,x,y,o){
  g.save();setFont(o.w||800,o.size||40,o.fam);g.fillStyle=o.c||C.slate;g.textAlign=o.al||'left';g.textBaseline='alphabetic';
  if(o.ls!==undefined&&'letterSpacing' in g)g.letterSpacing=o.ls+'px';
  if(o.alpha!==undefined)g.globalAlpha*=o.alpha;
  g.fillText(str,x,y);g.restore();
}
function measure(str,w,size,fam,ls){g.save();setFont(w,size,fam);if(ls!==undefined&&'letterSpacing' in g)g.letterSpacing=ls+'px';var m=g.measureText(str).width;g.restore();return m;}
/* text som stiger upp bakom en kant */
function rise(str,x,y,p,o){
  if(p<=0)return;var size=o.size,e=out5(clamp(p)),q=o.out?in3(clamp(o.out)):0;
  if(q>=1)return;
  g.save();g.beginPath();g.rect(-4000,y-size*1.08,12000,size*1.36);g.clip();
  T(str,x,y+(1-e)*size*1.2-q*size*1.25,o);g.restore();
}
function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function disc(x,y,r,c){g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
function polyPartial(pts,p,col,lw){
  if(p<=0)return;var tot=0,L=[],i;
  for(i=1;i<pts.length;i++){var d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);L.push(d);tot+=d;}
  var left=tot*clamp(p);g.strokeStyle=col;g.lineWidth=lw;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(pts[0][0],pts[0][1]);
  for(i=1;i<pts.length&&left>0;i++){var k=Math.min(1,left/L[i-1]);g.lineTo(lerp(pts[i-1][0],pts[i][0],k),lerp(pts[i-1][1],pts[i][1],k));left-=L[i-1];}
  g.stroke();
}
function tick(x,y,s,col,lw){g.strokeStyle=col;g.lineWidth=lw;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x-.5*s,y+.02*s);g.lineTo(x-.14*s,y+.36*s);g.lineTo(x+.52*s,y-.38*s);g.stroke();}
function stamp(x,y,r,p){
  if(p<=0)return;var e=out5(p);g.save();g.globalAlpha*=clamp(p*3);g.translate(x,y);g.rotate(lerp(-.6,0,e));var s=lerp(1.9,1,e);g.scale(s,s);
  disc(0,0,r,C.mint);tick(0,0,r*.92,C.slate,r*.2);g.restore();
}
function lock(x,y,s,col){g.save();g.translate(x,y);g.strokeStyle=col;g.lineWidth=s*.14;g.lineCap='round';g.beginPath();g.arc(0,-s*.12,s*.26,Math.PI,Math.PI*2);g.stroke();g.fillStyle=col;rr(-s*.42,-s*.12,s*.84,s*.62,s*.12);g.fill();g.restore();}
/* bil i profil: 0 kombi, 1 halvkombi, 2 suv. Ruta 120 x 48 */
function car(x,y,s,col,type,glass){
  g.save();g.translate(x,y);g.scale(s,s);g.fillStyle=col;g.strokeStyle=col;g.lineWidth=5;g.lineJoin='round';
  var top=type===2?3:8,roofEnd=type===0?99:type===1?82:94,tail=type===0?113:type===1?108:113;
  g.beginPath();g.moveTo(5,35);g.lineTo(6,25);g.lineTo(30,21);g.lineTo(46,top);g.lineTo(roofEnd,top);g.lineTo(tail,21);g.lineTo(115,24);g.lineTo(115,35);g.closePath();g.fill();g.stroke();
  g.fillStyle=glass;
  g.beginPath();g.moveTo(37,21);g.lineTo(49,top+4);g.lineTo(64,top+4);g.lineTo(64,21);g.closePath();g.fill();
  g.beginPath();g.moveTo(69,21);g.lineTo(69,top+4);g.lineTo(roofEnd-3,top+4);g.lineTo(tail-9,21);g.closePath();g.fill();
  [30,92].forEach(function(wx){disc(wx,36,12.5,glass);disc(wx,36,9.5,col);disc(wx,36,3.6,glass);});
  g.restore();
}
function exTag(col){T('EXEMPELDATA',1810,1048,{fam:FM,w:500,size:20,c:col,al:'right',ls:3,alpha:.85});}
function cap(str,lt,a,b,col,bar){
  if(lt<a||lt>b+.35)return;var pin=pop(lt,a,.55),pout=pop(lt,b,.3),e=out5(pin);
  g.save();g.globalAlpha*=1-pout;g.fillStyle=bar||C.red;g.fillRect(110,1002-58*e,10,58*e);g.restore();
  rise(str,142,990,pin,{size:54,w:800,c:col||C.slate,out:pout});
}
function kicker(str,col,sq){g.fillStyle=sq||C.red;g.fillRect(110,40,18,18);T(str,142,57,{fam:FM,w:500,size:22,c:col||C.slate,ls:4});}

/* rapportkort med ett nyckeltal */
function rep(x,y,w,name,num,p,hot,outline){
  if(p<=0)return;var e=out5(p),k=w/640,h=400*k;
  g.save();g.globalAlpha*=clamp(p*2.5);g.translate(0,(1-e)*120);
  rr(x,y,w,h,26*k);g.fillStyle=C.white;g.fill();if(outline){g.strokeStyle=C.slate;g.lineWidth=4;g.stroke();}
  T(name,x+48*k,y+82*k,{fam:FM,w:500,size:26*k,c:C.steel,ls:4});
  T('Ståtid, snitt',x+48*k,y+150*k,{w:500,size:44*k,c:C.slate});
  var col=hot?C.red:C.slate;T(num,x+44*k,y+332*k,{w:900,size:200*k,c:col});
  var nw=measure(num,900,200*k);T('dagar',x+44*k+nw+22*k,y+332*k,{w:800,size:70*k,c:col});
  g.restore();
}

/* ---------- Scen: öppning ---------- */
function sOpen(lt){
  bg(C.paper);
  var hot=lt>3.6,sh=hot?Math.sin(lt*70)*14*Math.exp(-(lt-3.6)*5):0;
  rep(250+sh,150,640,'RAPPORT A','47',pop(lt,.3,.7),hot,true);
  rep(1030-sh,150,640,'RAPPORT B','52',pop(lt,.75,.7),hot,true);
  var pb=pop(lt,3.6,.45);
  if(pb>0){g.save();g.translate(960,350);var s=back(pb);g.scale(s,s);disc(0,0,64,C.red);g.strokeStyle=C.white;g.lineWidth=11;g.lineCap='round';
    g.beginPath();g.moveTo(-26,-12);g.lineTo(26,-12);g.moveTo(-26,12);g.lineTo(26,12);g.moveTo(-12,30);g.lineTo(12,-30);g.stroke();g.restore();}
  rise('Två rapporter ger olika svar',250,770,pop(lt,1.7,.7),{size:104,w:900,c:C.slate});
  rise('på samma fråga.',250,892,pop(lt,2.0,.7),{size:104,w:900,c:C.slate});
  exTag(C.steel);
}
function sQuestion(lt){
  bg(C.red);
  rise('Vilken siffra',250,520,pop(lt,.3,.7),{size:190,w:900,c:C.white});
  rise('styr ni på?',250,730,pop(lt,.5,.7),{size:190,w:900,c:C.white});
}

/* ---------- Scen: titel ---------- */
function sTitle(lt){
  bg(C.slate);
  polyPartial([[330,400],[960,250],[1590,400]],out3(pop(lt,.35,1.0)),C.white,14);
  rise('All data',960,610,pop(lt,.9,.7),{size:190,w:900,c:C.white,al:'center'});
  rise('under samma tak',960,810,pop(lt,1.1,.7),{size:190,w:900,c:C.white,al:'center'});
  var p=pop(lt,1.9,.6);
  if(p>0){g.fillStyle=C.red;g.fillRect(960-70*out5(p),880,140*out5(p),10);T('DATAPLATTFORMEN 2027',960,960,{fam:FM,w:500,size:28,c:C.mist,al:'center',ls:8,alpha:p});}
}

/* ---------- Scen: så är den byggd ---------- */
var SRC=[{y:310,n:'Försäljning'},{y:450,n:'Verkstad'},{y:590,n:'Ekonomi'},{y:730,n:'CRM'}];
var AXIS=520,X0=410,XEND=4150,PATH=XEND-X0,NITEM=26,SPACING=PATH/NITEM,BEAT=.6,SPEED=SPACING/BEAT;
var X={adf:820,raw:1400,stg:1880,int:2360,gate:2700,marts:3040,sem:4150};
/* fasen gör att ett kort passerar testporten på varje taktslag */
var PHASE=(X.gate-X0)%SPACING;
var FRONT=[[0,410],[.8,410],[2.2,820],[3.6,1130],[5.4,1400],[6.6,1400],[7.8,1880],[10.2,1880],[11.4,2360],[13.6,2360],[14.6,2700],[16.4,2700],[17.4,3040],[20.0,3040],[21.8,4150],[99,4150]];
var LZ=Math.log;
var CAM=[[0,600,520,LZ(1.05)],[3.9,600,520,LZ(1.05)],[5.6,1640,520,LZ(.95)],[9.6,1640,520,LZ(.95)],[11.2,2360,520,LZ(1)],[13.4,2360,520,LZ(1)],[14.8,2840,545,LZ(1.12)],[19.8,2880,545,LZ(1.12)],[21.4,4230,520,LZ(.95)],[25.2,4230,520,LZ(.95)],[27.0,1976.7,-120,LZ(.3)],[99,1976.7,-120,LZ(.3)]];
function laneY(lane,x){return lerp(SRC[lane].y,AXIS,smooth(seg(x,470,760)));}
function machine(cx,w,h,fill,p,lt,ph){
  if(p<=0)return false;g.save();g.translate(cx,AXIS);var s=lerp(.72,1,back(clamp(p)));g.scale(s,s);g.globalAlpha*=clamp(p*2.2);
  rr(-w/2,-h/2,w,h,28);g.fillStyle=fill;g.fill();return true;
}
function blink(lt,ph,col){var base=g.globalAlpha;for(var k=0;k<3;k++){var on=Math.floor(lt*3+ph)%3===k;g.globalAlpha=base*(on?1:.3);g.fillStyle=col;rr(-34+k*28,54,16,16,4);g.fill();}g.globalAlpha=base;}
function item(x,y,rot,stage,a,i,bad,badge,hot){
  g.save();g.globalAlpha*=a;g.translate(x,y);g.rotate(rot);
  var w=96,h=64,tidy=stage>=2,fill=tidy?C.white:C.mist,st=hot?C.red:tidy?C.slate:C.steel;
  rr(-w/2,-h/2,w,h,10);g.fillStyle=fill;g.fill();g.strokeStyle=st;g.lineWidth=hot?5:3;g.stroke();
  if(bad&&stage>=3){T('?',0,16,{w:900,size:46,c:C.red,al:'center'});}
  else{car(-37,-25,.62,stage>=3?C.slate:C.steel,i%3,fill);if(stage>=3){g.fillStyle=C.slate;g.fillRect(-36,15,46,5);g.fillStyle=C.mist;g.fillRect(16,15,20,5);}}
  if(badge>0){g.save();g.translate(w/2-4,-h/2+4);var s=back(clamp(badge));g.scale(s,s);disc(0,0,17,C.mint);tick(0,0,15,C.slate,4);g.restore();}
  g.restore();
}
function world(lt,sub){
  var fr=kf(FRONT,lt,function(x){return x;})[0],i,p;
  /* hallen: Databricks under ett tak */
  polyPartial([[1130,800],[1130,270],[2240,130],[3350,270],[3350,800]],out3(pop(lt,3.6,1.8)),C.slate,12);
  p=pop(lt,5.0,.6);if(p>0){T('DATABRICKS · UNITY CATALOG',2240,216,{fam:FM,w:500,size:30,c:C.slate,al:'center',ls:5,alpha:p});}
  if(pop(lt,3.6,1.8)>.95){g.strokeStyle=C.steel;g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(1090,800);g.lineTo(3390,800);g.stroke();}
  p=pop(lt,7.4,.7);if(p>0){var e=out3(p);g.strokeStyle=C.red;g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(1710,318);g.lineTo(1710,302);g.lineTo(lerp(1710,3210,e),302);if(e>=1)g.lineTo(3210,318);g.stroke();
    T('dbt bygger och testar',1712,282,{w:800,size:30,c:C.red,alpha:p});}
  /* Fabric */
  polyPartial([[3930,800],[3930,300],[4790,300],[4790,800]],out3(pop(lt,20.4,1.1)),C.slate,12);
  p=pop(lt,21.0,.6);if(p>0){T('FABRIC',4360,268,{fam:FM,w:500,size:30,c:C.slate,al:'center',ls:5,alpha:p});g.strokeStyle=C.steel;g.lineWidth=6;g.beginPath();g.moveTo(3890,800);g.lineTo(4830,800);g.stroke();}
  /* bandet */
  function belt(col,lw){
    g.strokeStyle=col;g.lineWidth=lw;g.lineCap='round';g.lineJoin='round';
    SRC.forEach(function(s,k){if(pop(lt,.2+k*.12,.5)<=0)return;var xe=Math.min(fr,820);if(xe<=X0)return;g.beginPath();g.moveTo(X0,s.y);for(var x=X0+15;x<xe;x+=15)g.lineTo(x,laneY(k,x));g.lineTo(xe,laneY(k,xe));g.stroke();});
    if(fr>820){g.beginPath();g.moveTo(820,AXIS);g.lineTo(Math.min(fr,XEND),AXIS);g.stroke();}
  }
  belt(C.paper,46);belt(C.line,14);
  /* det som färdas på bandet */
  for(i=0;i<NITEM;i++){
    var s=(lt*SPEED+i*SPACING+PHASE)%PATH,x=X0+s,a=clamp((fr-x)/90);if(a<=0)continue;
    var lane=i%4,y=x<820?laneY(lane,x):AXIS,stage=x<X.raw?0:x<X.stg?1:x<X.int?2:x<X.gate?3:4,bad=i%6===3;
    var rot=stage<2?(hash(i)-.5)*.5:0;if(stage<2)y+=(hash(i+9)-.5)*22*smooth(seg(x,430,520));
    var badge=0,hot=false;
    if(stage===4){
      if(bad){var d=x-X.gate;if(d>330)continue;x=X.gate+d*.2;y=AXIS+d*.74;rot=d*.004;a*=1-seg(d,200,330);hot=true;}
      else badge=seg(x,X.gate,X.gate+70);
    }
    item(x,y,rot,stage,a,i,bad,badge,hot);
  }
  /* källor */
  SRC.forEach(function(sr,k){p=pop(lt,.2+k*.12,.5);if(p<=0)return;var e=out5(p);g.save();g.globalAlpha*=clamp(p*2);g.translate((1-e)*-90,0);
    rr(110,sr.y-46,300,92,18);g.fillStyle=C.white;g.fill();g.strokeStyle=C.slate;g.lineWidth=4;g.stroke();T(sr.n,260,sr.y+12,{w:800,size:34,c:C.slate,al:'center'});g.restore();});
  /* ADF */
  p=pop(lt,1.3,.55);
  if(p>0){g.save();g.translate(X.adf,AXIS);var sc=lerp(.6,1,back(p));g.scale(sc,sc);g.globalAlpha*=clamp(p*2.2);disc(0,0,96,C.red);T('ADF',0,17,{w:900,size:50,c:C.white,al:'center'});g.restore();
    T('AZURE DATA FACTORY',X.adf,388,{fam:FM,w:500,size:24,c:C.slate,al:'center',ls:3,alpha:p*sub});T('läser in varje dygn',X.adf,668,{w:500,size:30,c:C.slate,al:'center',alpha:p*sub});}
  /* stationerna i hallen */
  function bay(cx,label,desc,fill,tc,t0,ph){
    var q=pop(lt,t0,.55);if(!machine(cx,340,300,fill,q,lt,ph))return;
    T(label,0,10,{fam:FM,w:500,size:label.length>8?42:52,c:tc,al:'center'});blink(lt,ph,tc);g.restore();
    T(desc,cx,734,{w:500,size:31,c:C.slate,al:'center',alpha:clamp(q*2-1)*sub});
  }
  bay(X.raw,'raw','rådata, orörd',C.steel,C.white,4.9,0);
  bay(X.stg,'staging','typer och namn',C.slate,C.white,7.0,1);
  bay(X.int,'integration','en rad per fordon',C.slate,C.white,10.6,2);
  bay(X.marts,'marts','klart för rapporter',C.mint,C.slate,16.7,1);
  /* testporten */
  p=pop(lt,13.9,.55);
  if(p>0){g.save();var e2=out5(p);g.globalAlpha*=clamp(p*2);g.translate(0,(1-e2)*-120);g.fillStyle=C.red;
    g.fillRect(2606,416,18,196);g.fillRect(2776,416,18,196);g.fillRect(2606,410,188,26);
    rr(2610,326,180,70,14);g.fill();T('TEST',2700,375,{fam:FM,w:500,size:36,c:C.white,al:'center',ls:6});
    var near=false;for(i=0;i<NITEM;i++){var sx=X0+(lt*SPEED+i*SPACING+PHASE)%PATH;if(Math.abs(sx-X.gate)<45&&sx<fr)near=true;}
    disc(2700,423,8,near?C.mint:C.white);g.restore();
    g.save();g.globalAlpha*=clamp(p*2-1);g.strokeStyle=C.steel;g.lineWidth=6;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(2690,700);g.lineTo(2690,786);g.lineTo(2850,786);g.lineTo(2850,700);g.stroke();
    T('STOPPAD',2770,676,{fam:FM,w:500,size:20,c:C.red,al:'center',ls:3,alpha:sub});g.restore();}
  /* bron till Fabric */
  p=pop(lt,20.2,.6);if(p>0){T('spegling',3640,452,{fam:FM,w:500,size:32,c:C.slate,al:'center',alpha:p*sub});T('ingen kopia',3640,606,{w:500,size:30,c:C.steel,al:'center',alpha:p*sub});}
  /* semantisk modell och rapport */
  p=pop(lt,21.3,.55);
  if(machine(X.sem,300,260,C.slate,p,lt,0)){T('Semantisk',0,-8,{w:800,size:40,c:C.white,al:'center'});T('modell',0,38,{w:800,size:40,c:C.white,al:'center'});g.restore();
    T('en definition per nyckeltal',X.sem,734,{w:500,size:27,c:C.slate,al:'center',alpha:clamp(p*2-1)*sub});}
  p=pop(lt,22.3,.6);
  if(p>0){g.strokeStyle=C.line;g.lineWidth=14;g.lineCap='round';g.beginPath();g.moveTo(4300,AXIS);g.lineTo(lerp(4300,4352,p),AXIS);g.stroke();
    var e3=out5(p);g.save();g.globalAlpha*=clamp(p*2);g.translate(0,(1-e3)*80);rr(4350,330,390,380,22);g.fillStyle=C.white;g.fill();g.strokeStyle=C.slate;g.lineWidth=4;g.stroke();
    T('POWER BI',4382,386,{fam:FM,w:500,size:24,c:C.steel,ls:4});T('Ståtid, snitt',4382,438,{w:500,size:32,c:C.slate});
    var n=Math.round(47*out3(seg(lt,23.0,24.0))),ns=String(n);T(ns,4380,566,{w:900,size:128,c:C.slate});T('dagar',4380+measure(ns,900,128)+14,566,{w:800,size:46,c:C.slate});
    var bv=[.5,.58,.52,.66,.6,.72,.64,.7,.62,.78];for(i=0;i<bv.length;i++){var bh=84*bv[i]*out3(seg(lt,22.8+i*.05,23.6+i*.05));g.fillStyle=C.mist;g.fillRect(4382+i*33,690-bh,24,bh);}
    g.restore();stamp(4724,346,46,pop(lt,24.2,.5));}
}
function applyCam(cx,cy,z){g.translate(W/2,H/2);g.scale(z,z);g.translate(-cx,-cy);}
var TECH=[[0,4.2,'AZURE DATA FACTORY'],[4.2,20.3,'DATABRICKS · DBT'],[20.3,26.3,'FABRIC · POWER BI'],[26.3,99,'TERRAFORM · ALLT BYGGS FRÅN KOD']];
function sBuild(lt){
  bg(C.paper);
  var c=kf(CAM,lt),z=Math.exp(c[2]),sub=1-seg(lt,25.3,26.2);
  /* de två andra miljöerna glider in bakom produktion */
  var rows=[{cy:1546.7,t0:27.1,name:'UTVECKLING',y:232},{cy:713.3,t0:27.5,name:'TEST',y:482}];
  rows.forEach(function(r){var p=pop(lt,r.t0,.7);if(p<=0)return;var e=out5(p);g.save();g.globalAlpha=clamp(p*1.6);g.translate(0,(1-e)*70);applyCam(1976.7,r.cy,.3);world(lt,0);g.restore();});
  g.save();applyCam(c[0],c[1],z);world(lt,sub);g.restore();
  /* ramar för de två Azure-prenumerationerna */
  var pf=pop(lt,28.4,.7);
  if(pf>0){g.save();g.globalAlpha=pf;g.strokeStyle=C.steel;g.lineWidth=3;g.setLineDash([14,12]);rr(36,92,1848,500,22);g.stroke();g.setLineDash([]);
    T('AZURE-PRENUMERATION · ICKE-PRODUKTION',1856,128,{fam:FM,w:500,size:20,c:C.steel,al:'right',ls:3});g.restore();}
  var pp=pop(lt,30.0,.6);
  if(pp>0){g.save();g.globalAlpha=clamp(pp*2);g.strokeStyle=C.red;g.lineWidth=6;rr(36,604,1848,236,22);g.stroke();
    T('AZURE-PRENUMERATION · PRODUKTION',1856,640,{fam:FM,w:500,size:20,c:C.red,al:'right',ls:3});g.restore();
    g.save();g.translate(60,604);var s=back(pp);g.scale(s,s);disc(0,0,34,C.red);lock(0,4,44,C.white);g.restore();}
  [['UTVECKLING',232,27.1],['TEST',482,27.5],['PRODUKTION',732,26.9]].forEach(function(r){var p=pop(lt,r[2],.6);if(p>0)rise(r[0],84,r[1]+12,p,{size:36,w:900,c:C.slate});});
  /* texter */
  kicker('SÅ ÄR DEN BYGGD');
  TECH.forEach(function(t){if(lt<t[0]||lt>t[1]+.25)return;var a=pop(lt,t[0],.3)*(1-pop(lt,t[1],.25));g.save();g.globalAlpha=a;var w=measure(t[2],500,22,FM,3)+48;rr(1810-w,28,w,48,24);g.fillStyle=C.slate;g.fill();T(t[2],1810-w/2,60,{fam:FM,w:500,size:22,c:C.white,al:'center',ls:3});g.restore();});
  cap('Varje dygn hämtas data från alla system.',lt,.6,3.7);
  cap('Rådatan sparas orörd och byggs sedan i lager.',lt,4.6,9.4);
  cap('Ett fordon blir en rad, oavsett källsystem.',lt,10.3,13.4);
  cap('Bara kvalitetstestad data går vidare.',lt,14.6,19.7);
  cap('Rapporterna läser samma data. Ingen kopia.',lt,20.8,25.0);
  cap('Samma kod körs i utveckling, test och produktion.',lt,27.4,29.7);
  cap('Produktionen har en egen gräns i Azure.',lt,30.1,33.2);
}

/* ---------- Scen: vad den ger ---------- */
function sGives(lt){bg(C.red);rise('Vad ger det?',250,640,pop(lt,.25,.7),{size:240,w:900,c:C.white});}

function sOne(lt){
  bg(C.slate);
  if(lt<1.75){var m=io3(seg(lt,.9,1.7));rep(lerp(180,640,m),170,640,'RAPPORT A','47',pop(lt,.1,.5),false,false);rep(lerp(1100,640,m),170,640,'RAPPORT B','52',pop(lt,.25,.5),false,false);}
  else{var pp=pop(lt,1.75,.5),s=lerp(1.14,1,out5(pp));g.save();g.translate(960,370);g.scale(s,s);g.translate(-960,-370);rep(640,170,640,'ALLA RAPPORTER','47',1,false,false);g.restore();stamp(1268,182,62,pop(lt,2.0,.5));
    var fl=1-seg(lt,1.75,2.0);if(fl>0){g.fillStyle='rgba(255,255,255,'+(fl*.85)+')';g.fillRect(0,0,W,H);}}
  rise('En siffra per nyckeltal.',960,800,pop(lt,2.3,.7),{size:124,w:900,c:C.white,al:'center'});
  T('Samma definition i alla bolag och i alla verktyg.',960,892,{w:500,size:46,c:C.mist,al:'center',alpha:pop(lt,2.9,.6)});
  exTag(C.mist);
}

var CARS=[['Kombi 2021','6'+NB+'200','214.900',12],['Halvkombi 2022','3'+NB+'100','179.900',34],['Kombi 2020','9'+NB+'400','189.900',94],['Halvkombi 2019','11'+NB+'800','129.900',21],['SUV 2023','2'+NB+'400','389.900',58],['Kombi 2022','4'+NB+'700','249.900',7],
  ['SUV 2021','7'+NB+'300','299.900',45],['Halvkombi 2023','1'+NB+'900','259.900',67],['SUV 2020','10'+NB+'200','269.900',18],['SUV 2022','5'+NB+'600','342.900',101],['Halvkombi 2021','6'+NB+'900','164.900',29],['SUV 2019','13'+NB+'500','219.900',73],
  ['Kombi 2023','1'+NB+'200','329.900',9],['Halvkombi 2020','8'+NB+'800','149.900',38],['SUV 2024','600','449.900',52],['Halvkombi 2023','2'+NB+'800','314.900',112],['Kombi 2019','14'+NB+'100','139.900',26],['SUV 2022','4'+NB+'300','359.900',61]];
var PICK=[2,9,15];
var ADVICE=[['Sänk till 179.900 kr','12'+NB+'% chans att den säljs inom 30 dagar på dagens pris'],['Flytta till Anläggning Syd','Modellen säljs på 21 dagar i snitt där'],['Sänk till 304.900 kr','Marknadspriset har sjunkit 4'+NB+'% sedan inköpet']];
function carCard(x,y,d,a,days){
  if(a<=0)return;var w=280,h=220,type=d[0].indexOf('Kombi')===0?0:d[0].indexOf('Halv')===0?1:2,hot=days>90;
  g.save();g.globalAlpha*=a;rr(x,y,w,h,18);g.fillStyle=C.white;g.fill();g.strokeStyle=hot?C.red:C.line;g.lineWidth=hot?5:3;g.stroke();
  car(x+20,y+22,1.0,C.slate,type,C.white);
  var bt=days+NB+'dagar',bw=measure(bt,800,20)+26;rr(x+w-bw-14,y+16,bw,38,19);g.fillStyle=hot?C.red:C.paper;g.fill();T(bt,x+w-14-bw/2,y+42,{w:800,size:20,c:hot?C.white:C.slate,al:'center'});
  T(d[0],x+22,y+124,{w:800,size:27,c:C.slate});T('Miltal '+d[1]+' mil',x+22,y+158,{w:500,size:20,c:C.steel});T('Kontantpris '+d[2]+' kr',x+22,y+188,{w:500,size:20,c:C.steel});
  g.restore();
}
function sCars(lt){
  bg(C.paper);kicker('LAGERBILAR');
  rise('Varje bil i lager, dag för dag.',80,186,pop(lt,.2,.7),{size:84,w:900,c:C.slate,out:pop(lt,4.7,.3)});
  rise('Platschefen får en lista varje morgon.',80,186,pop(lt,5.1,.7),{size:84,w:900,c:C.slate});
  var cnt=out3(seg(lt,1.3,3.7)),fade=1-seg(lt,4.3,4.9),mv=io3(seg(lt,5.0,6.0));
  CARS.forEach(function(d,i){
    var col=i%6,row=Math.floor(i/6),x=80+col*296,y=262+row*236,p=pop(lt,.5+i*.05,.45),e=out5(p),days=Math.round(d[3]*cnt),k=PICK.indexOf(i),a=clamp(p*2);
    if(k<0)a*=fade;else{x=lerp(x,80,mv);y=lerp(y,262+k*236,mv);}
    carCard(x,y+(1-e)*60,d,a,days);
  });
  ADVICE.forEach(function(a,k){
    var p=pop(lt,6.1+k*.35,.6),y=262+k*236;if(p<=0)return;
    T('FÖRSLAG',410,y+46,{fam:FM,w:500,size:22,c:C.steel,ls:4,alpha:p});
    rise(a[0],408,y+118,p,{size:68,w:900,c:C.red});
    T(a[1],410,y+176,{w:500,size:34,c:C.slate,alpha:pop(lt,6.4+k*.35,.5)});
    if(k<2){g.save();g.globalAlpha=p;g.fillStyle=C.line;g.fillRect(410,y+226,1430*out3(p),3);g.restore();}
  });
  exTag(C.steel);
}

var ASK='Vilka bilar har stått längre än 90 dagar?';
function sAsk(lt){
  bg(C.slate);kicker('SJÄLVBETJÄNING',C.mist);
  var p=pop(lt,.15,.5),e=out5(p);
  if(p>0){g.save();g.globalAlpha=clamp(p*2);g.translate(0,(1-e)*60);rr(260,130,1400,120,60);g.fillStyle=C.white;g.fill();
    var n=Math.floor(ASK.length*seg(lt,.6,2.5)),str=ASK.slice(0,n);T(str,326,207,{w:500,size:48,c:C.slate});
    if(lt<3.0&&Math.floor(lt*3.2)%2===0){g.fillStyle=C.red;g.fillRect(332+measure(str,500,48),164,5,56);}
    disc(1596,190,38,C.red);g.strokeStyle=C.white;g.lineWidth=7;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(1584,190);g.lineTo(1608,190);g.moveTo(1598,178);g.lineTo(1610,190);g.lineTo(1598,202);g.stroke();
    g.restore();}
  p=pop(lt,2.9,.6);
  if(p>0){e=out5(p);g.save();g.globalAlpha=clamp(p*2);g.translate(0,(1-e)*90);rr(260,300,1400,450,30);g.fillStyle=C.white;g.fill();
    T('14 bilar',326,480,{w:900,size:150,c:C.slate});T('har stått längre än 90 dagar,',330,548,{w:500,size:38,c:C.slate});T('på tre anläggningar.',330,598,{w:500,size:38,c:C.slate});
    [['Nord',6],['Syd',5],['Väst',3]].forEach(function(b,k){var y=404+k*86,q=out3(seg(lt,3.4+k*.15,4.2+k*.15));T(b[0],1010,y+34,{w:800,size:34,c:C.slate});g.fillStyle=C.red;rr(1120,y,Math.max(8,b[1]*72*q),46,8);g.fill();T(String(Math.round(b[1]*q)),1120+b[1]*72*q+18,y+35,{w:900,size:34,c:C.slate});});
    disc(342,694,16,C.mint);tick(342,694,14,C.slate,4);T('KÄLLA: MARTS · TESTAD DATA',372,702,{fam:FM,w:500,size:22,c:C.steel,ls:3});
    g.restore();}
  ['Copilot i Power BI','Databricks Genie','Claude'].reduce(function(x,s,k){var q=pop(lt,4.5+k*.15,.45),w=measure(s,800,30)+56;if(q>0){g.save();g.globalAlpha=clamp(q*2);g.translate(0,(1-out5(q))*40);rr(x,790,w,62,31);g.strokeStyle=C.mist;g.lineWidth=3;g.stroke();T(s,x+w/2,831,{w:800,size:30,c:C.white,al:'center'});g.restore();}return x+w+18;},260);
  rise('Ställ frågan på vanlig svenska.',260,990,pop(lt,5.0,.7),{size:84,w:900,c:C.white});
  exTag(C.mist);
}

var STEPS=[
  {bg:C.paper,fg:C.slate,sub:C.steel,l:['Vad hände?'],tag:'BESKRIVANDE · KVARTAL 1'},
  {bg:C.slate,fg:C.white,sub:C.mist,l:['Varför','hände det?'],tag:'FÖRKLARANDE · KVARTAL 2'},
  {bg:C.mint,fg:C.slate,sub:C.slate,l:['Vad kommer','att hända?'],tag:'FÖRUTSÄGANDE · KVARTAL 3'},
  {bg:C.red,fg:C.white,sub:C.white,l:['Vad bör','göras?'],tag:'FÖRESLÅENDE · KVARTAL 4'}];
var BARS=[.42,.5,.46,.58,.86,.62];
function sAI(lt){
  var b=Math.min(3,Math.floor(lt/2.4)),l=lt-b*2.4,s=STEPS[b],i;
  bg(s.bg);kicker('AI I FYRA STEG',s.fg,b===3?C.white:C.red);
  for(i=0;i<4;i++){g.fillStyle=s.fg;g.globalAlpha=i<=b?1:.25;g.fillRect(1530+i*72,40,58,10);}g.globalAlpha=1;
  var y0=s.l.length===1?600:500;
  s.l.forEach(function(str,k){rise(str,110,y0+k*166,pop(l,.08+k*.1,.55),{size:164,w:900,c:s.fg});});
  T(s.tag,112,930,{fam:FM,w:500,size:26,c:s.sub,ls:5,alpha:pop(l,.5,.4)});
  /* bild till höger */
  var x0=1240,yb=780;
  if(b<2){BARS.forEach(function(v,k){var h=420*v*out3(seg(l,.2+k*.05,.8+k*.05)),hot=b===1&&k===4;g.globalAlpha=b===1&&!hot?.3:1;g.fillStyle=hot?C.red:s.fg;g.fillRect(x0+k*96,yb-h,70,h);});g.globalAlpha=1;
    if(b===1){var q=pop(l,.9,.4);if(q>0){T('ANLÄGGNING NORD',x0+4*96+35,yb-420*.86-34,{fam:FM,w:500,size:24,c:C.white,al:'center',ls:3,alpha:q});}}
    g.fillStyle=s.fg;g.fillRect(x0-10,yb+8,570,5);}
  else if(b===2){var pts=[[0,300],[100,270],[200,286],[300,214],[400,190]],fut=[[400,190],[500,130],[620,48]];
    g.save();g.translate(x0,380);g.scale(.9,.9);polyPartial(pts,out3(seg(l,.2,.9)),C.slate,12);
    var qf=out3(seg(l,.9,1.5));if(qf>0){g.setLineDash([4,26]);polyPartial(fut,qf,C.slate,12);g.setLineDash([]);if(qf>.98){disc(620,48,20,C.red);}}
    disc(400,190,16,C.slate);g.fillStyle=C.slate;g.fillRect(-10,428,654,5);g.restore();
    T('30 DAGAR FRAM',x0+460,812,{fam:FM,w:500,size:24,c:C.slate,al:'center',ls:3,alpha:pop(l,1.2,.4)});}
  else{var q2=pop(l,.25,.55),e=out5(q2);if(q2>0){g.save();g.globalAlpha=clamp(q2*2);g.translate(0,(1-e)*90);rr(1110,330,700,420,30);g.fillStyle=C.white;g.fill();
      T('KOMBI 2020 · 94 DAGAR I LAGER',1160,404,{fam:FM,w:500,size:24,c:C.steel,ls:3});
      T('189.900 kr',1160,490,{w:500,size:58,c:C.steel});var sw=measure('189.900 kr',500,58)*out3(seg(l,.8,1.2));g.fillStyle=C.red;g.fillRect(1156,468,sw+8,6);
      rise('179.900 kr',1158,624,pop(l,1.0,.55),{size:106,w:900,c:C.slate});
      T('Sänk priset i dag',1160,700,{w:800,size:38,c:C.red,alpha:pop(l,1.4,.4)});g.restore();}}
  exTag(s.sub);
}

/* ---------- Scen: avslut ---------- */
var TECHROW=[[430,'Azure Data Factory'],[800,'Databricks'],[1090,'dbt'],[1420,'Fabric']];
function sEnd(lt){
  bg(C.slate);
  polyPartial([[300,330],[960,170],[1620,330]],out3(pop(lt,.3,1.1)),C.white,14);
  var p=pop(lt,1.0,.8);
  if(p>0){var e=out3(p);g.strokeStyle=C.steel;g.lineWidth=8;g.lineCap='round';g.beginPath();g.moveTo(330,470);g.lineTo(lerp(330,1590,e),470);g.stroke();
    for(var i=0;i<9;i++){var u=((lt*.16+i/9)%1),x=330+u*1260;if(x<330+1260*e){disc(x,470,9,u>.62?C.mint:C.white);}}
    TECHROW.forEach(function(t,k){var q=pop(lt,1.2+k*.15,.5);if(q<=0)return;disc(t[0],470,16,k===3?C.mint:C.white);T(t[1],t[0],420,{w:800,size:34,c:C.white,al:'center',alpha:q});});}
  rise('All data',960,700,pop(lt,2.0,.7),{size:150,w:900,c:C.white,al:'center'});
  rise('under samma tak.',960,860,pop(lt,2.2,.7),{size:150,w:900,c:C.white,al:'center'});
  var q3=pop(lt,3.2,.6);if(q3>0){g.fillStyle=C.red;g.fillRect(960-70*out5(q3),920,140*out5(q3),10);T('DATAPLATTFORMEN 2027 · FRÅN KÄLLA TILL BESLUT',960,996,{fam:FM,w:500,size:26,c:C.mist,al:'center',ls:6,alpha:q3});}
}

/* ---------- tidslinje ---------- */
var S=[
  {f:sOpen,dur:6.0},
  {f:sQuestion,dur:3.6,wipe:.5,bar:C.slate},
  {f:sTitle,dur:4.8,wipe:.5,bar:C.white},
  {f:sBuild,dur:33.6,wipe:.5,bar:C.red},
  {f:sGives,dur:2.4,wipe:.5,bar:C.slate},
  {f:sOne,dur:7.2,wipe:.5,bar:C.white},
  {f:sCars,dur:12.0,wipe:.5,bar:C.red},
  {f:sAsk,dur:9.6,wipe:.5,bar:C.red},
  {f:sAI,dur:9.6},
  {f:sEnd,dur:9.6,wipe:.5,bar:C.white}
];
var acc=0;S.forEach(function(s){s.t0=acc;acc+=s.dur;});
var DUR=acc;
function render(t){
  t=clamp(t,0,DUR-.001);var i=S.length-1;while(i>0&&t<S[i].t0)i--;
  var s=S[i],lt=t-s.t0;
  g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;
  if(i>0&&s.wipe&&lt<s.wipe){
    var p=io3(lt/s.wipe),edge=p*(W+140)-70;
    g.save();S[i-1].f(S[i-1].dur+lt);g.restore();
    g.save();g.beginPath();g.rect(0,0,Math.max(0,edge),H);g.clip();s.f(lt);g.restore();
    g.fillStyle=s.bar||C.red;g.fillRect(edge,0,70,H);
  }else{g.save();s.f(lt);g.restore();}
  g.restore();
}
window.Film={duration:DUR,scenes:S,render:render,attach:function(ctx){g=ctx;},
  chapters:[['Öppning',0],['Titel',S[2].t0],['Så är den byggd',S[3].t0],['Vad den ger',S[4].t0],['AI i fyra steg',S[8].t0],['Avslut',S[9].t0]]};
})();
