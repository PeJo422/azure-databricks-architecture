/* Kärna för filmerna: färger, typsnitt, ritprimitiver och tidslinje. Allt ritas som en ren funktion av tiden, så att varje bildruta går att söka fram och rendera till video. Filen sätts ihop med en scenfil av build.py. */
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

/* ---------- tidslinje: scener i följd, med svep mellan dem ---------- */
function timeline(S){
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
  return {duration:DUR,render:render};
}
function publish(S,chapters,poster){var tl=timeline(S);window.Film={duration:tl.duration,scenes:S,render:tl.render,attach:function(ctx){g=ctx;},chapters:chapters(S),poster:poster};}
