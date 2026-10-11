/* Klipp: Fråga datan själv. Claude Dashboards och Copilot i Power BI. Scenerna. Sätts ihop med core.js av build.py. */

function typedN(total,lt,a,b){return Math.floor(total*seg(lt,a,b));}
/* skriver flera rader i följd och ritar markören där texten slutar */
function typeLines(lines,x,y,lh,size,lt,a,b,col,caretOn){
  var tot=0,k;for(k=0;k<lines.length;k++)tot+=lines[k].length;
  var n=typedN(tot,lt,a,b),cx=x,cy=y;
  for(k=0;k<lines.length;k++){
    var take=clamp(n,0,lines[k].length),part=lines[k].slice(0,take);
    if(take>0||k===0){T(part,x,y+k*lh,{w:500,size:size,c:col});cx=x+measure(part,500,size);cy=y+k*lh;}
    n-=lines[k].length;if(n<0)break;
  }
  if(caretOn&&Math.floor(lt*3.2)%2===0){g.fillStyle=C.red;g.fillRect(cx+5,cy-size*.82,4,size);}
}
function panel(x,y,w,h,r,fill,p,dx,dy){
  if(p<=0)return false;var e=out5(clamp(p));g.save();g.globalAlpha*=clamp(p*2.2);g.translate((1-e)*(dx||0),(1-e)*(dy===undefined?50:dy));
  rr(x,y,w,h,r);g.fillStyle=fill;g.fill();return true;
}
function tileFoot(x,y,w,h,hot){
  T('uppdaterad 07:15',x+22,y+h-20,{fam:FM,w:500,size:16,c:C.steel});
  rr(x+w-78,y+h-44,58,28,8);if(hot){g.fillStyle=C.red;g.fill();}else{g.strokeStyle=C.line;g.lineWidth=2;g.stroke();}
  T('SQL',x+w-49,y+h-24,{fam:FM,w:500,size:15,c:hot?C.white:C.steel,al:'center'});
}
function hbars(rows,x,y,dy,h,labelW,unit,q,col,size){
  rows.forEach(function(r,k){var yy=y+k*dy,w=Math.max(6,r[1]*unit*q);
    T(r[0],x,yy+h*.76,{w:800,size:size,c:C.slate});g.fillStyle=col;rr(x+labelW,yy,w,h,6);g.fill();
    T(String(Math.round(r[1]*q)),x+labelW+w+12,yy+h*.76,{w:900,size:size,c:C.slate});});
}
var SITES=[['Nord',54],['Syd',46],['Väst',39]];

/* ---------- Scen: intro ---------- */
function sIntro(lt){
  bg(C.red);
  rise('Fråga datan',250,520,pop(lt,.15,.6),{size:210,w:900,c:C.white});
  rise('själv.',250,740,pop(lt,.3,.6),{size:210,w:900,c:C.white});
}

/* ---------- Scen: Claude Dashboards ---------- */
var CQ=['Bygg en dashboard över','ståtid per anläggning,','från marts.'];
var SQL=[['select','  anlaggning,'],['','        avg(statid_dagar) as statid_snitt'],['from','    prod_core.marts.fct_lagerbil'],['where','   i_lager'],['group by',' anlaggning']];
var MONTHS=[52,50,49,51,48,47],WEEKS=[51,52,50,49,50,48,49,47,48,46,47,47];
var LONGEST=[['Halvkombi 2023',112],['SUV 2022',101],['Kombi 2020',94],['SUV 2019',73],['Halvkombi 2023',67]];
function statusLine(str,y,lt,t0,done){
  var p=pop(lt,t0,.3);if(p<=0)return;
  if(lt>=done){disc(128,y-7,10,C.mint);tick(128,y-7,9,C.slate,3);}
  else{g.save();g.globalAlpha*=(Math.floor(lt*4)%2?1:.35);g.fillStyle=C.red;g.fillRect(120,y-15,16,16);g.restore();}
  T(str,150,y,{fam:FM,w:500,size:19,c:C.white,alpha:p});
}
function lineChart(vals,x,y,w,h,prog,alpha,labels){
  if(alpha<=0)return;g.save();g.globalAlpha*=alpha;
  var pts=vals.map(function(v,i){return[x+i*w/(vals.length-1),y+h-(v-42)*(h/12)];});
  polyPartial(pts,prog,C.slate,6);
  pts.forEach(function(p,i){if(i/(vals.length-1)<=prog+.001)disc(p[0],p[1],vals.length>8?6:8,i===pts.length-1?C.red:C.slate);});
  labels.forEach(function(l){T(l[1],x+l[0]*w,y+h+34,{fam:FM,w:500,size:16,c:C.steel,al:'center'});});
  g.restore();
}
function sClaude(lt){
  bg(C.paper);kicker('CLAUDE DASHBOARDS');
  var i,p;
  /* chatten */
  if(panel(80,130,500,770,24,C.slate,pop(lt,.1,.5),-80,0)){
    T('CHATT',112,180,{fam:FM,w:500,size:20,c:C.mist,ls:4});
    rr(112,206,436,176,18);g.fillStyle=C.white;g.fill();
    typeLines(CQ,136,262,44,29,lt,.5,3.0,C.slate,lt<3.2);
    statusLine('skriver SQL för fem diagram',436,lt,3.3,4.6);
    statusLine('kör frågorna mot Databricks',476,lt,4.0,9.2);
    statusLine('fem diagram klara',516,lt,9.4,9.4);
    p=pop(lt,16.7,.4);
    if(p>0){g.save();g.globalAlpha*=clamp(p*2);g.translate(0,(1-out5(p))*30);rr(112,574,436,84,18);g.fillStyle=C.white;g.fill();typeLines(['Visa per vecka'],136,627,44,29,lt,17.0,17.8,C.slate,lt<18.0);g.restore();}
    statusLine('ritar om ett diagram',700,lt,18.0,18.9);
    g.restore();
  }
  /* dashboarden */
  [[620,222,280,210,4.8],[920,222,280,210,5.4],[1220,222,620,210,6.0],[620,452,600,430,7.2],[1240,452,600,430,8.4]].forEach(function(r){var a=pop(lt,.4,.5)*(1-pop(lt,r[4],.25));if(a<=0)return;g.save();g.globalAlpha=a*.7;g.strokeStyle=C.steel;g.lineWidth=3;g.setLineDash([12,10]);rr(r[0],r[1],r[2],r[3],18);g.stroke();g.restore();});
  rise('Ståtid i lager',622,198,pop(lt,4.3,.6),{size:56,w:900,c:C.slate});
  var hot=lt>11.5&&lt<16.6;
  if(panel(620,222,280,210,18,C.white,pop(lt,4.8,.5))){
    g.strokeStyle=C.line;g.lineWidth=3;g.stroke();
    T('STÅTID, SNITT',642,264,{fam:FM,w:500,size:17,c:C.steel,ls:3});
    var n=String(Math.round(47*out3(seg(lt,4.9,5.9))));T(n,638,362,{w:900,size:100,c:C.slate});T('dagar',642+measure(n,900,100)+10,362,{w:800,size:34,c:C.slate});
    tileFoot(620,222,280,210,false);g.restore();
  }
  if(panel(920,222,280,210,18,C.white,pop(lt,5.4,.5))){
    g.strokeStyle=C.line;g.lineWidth=3;g.stroke();
    T('ÖVER 90 DAGAR',942,264,{fam:FM,w:500,size:17,c:C.steel,ls:3});
    var n2=String(Math.round(14*out3(seg(lt,5.5,6.5))));T(n2,938,362,{w:900,size:100,c:C.red});T('bilar',942+measure(n2,900,100)+10,362,{w:800,size:34,c:C.slate});
    tileFoot(920,222,280,210,false);g.restore();
  }
  if(panel(1220,222,620,210,18,C.white,pop(lt,6.0,.5))){
    g.strokeStyle=hot?C.red:C.line;g.lineWidth=hot?5:3;g.stroke();
    T('Ståtid per anläggning',1244,264,{w:800,size:24,c:C.slate});
    hbars(SITES,1244,284,34,24,76,7,out3(seg(lt,6.2,7.0)),C.slate,20);
    tileFoot(1220,222,620,210,hot);g.restore();
  }
  if(panel(620,452,600,430,18,C.white,pop(lt,7.2,.5))){
    g.strokeStyle=C.line;g.lineWidth=3;g.stroke();
    var mv=io3(seg(lt,18.0,18.8));
    T('Ståtid per månad',644,496,{w:800,size:24,c:C.slate,alpha:1-mv});T('Ståtid per vecka',644,496,{w:800,size:24,c:C.slate,alpha:mv});
    g.fillStyle=C.line;g.fillRect(660,800,520,3);
    lineChart(MONTHS,670,540,500,250,out3(seg(lt,7.4,8.4)),1-mv,[[0,'maj'],[.2,'jun'],[.4,'jul'],[.6,'aug'],[.8,'sep'],[1,'okt']]);
    lineChart(WEEKS,670,540,500,250,1,mv,[[0,'v 30'],[4/11,'v 34'],[8/11,'v 38'],[1,'v 41']]);
    tileFoot(620,452,600,430,false);g.restore();
  }
  if(panel(1240,452,600,430,18,C.white,pop(lt,8.4,.5))){
    g.strokeStyle=C.line;g.lineWidth=3;g.stroke();
    T('Längst i lager',1264,496,{w:800,size:24,c:C.slate});
    LONGEST.forEach(function(r,k){var q=pop(lt,8.6+k*.12,.4),y=548+k*56;if(q<=0)return;
      T(r[0],1264,y,{w:500,size:24,c:C.slate,alpha:q});T(r[1]+NB+'dagar',1816,y,{w:900,size:24,c:r[1]>90?C.red:C.slate,al:'right',alpha:q});
      g.save();g.globalAlpha*=q;g.fillStyle=C.line;g.fillRect(1264,y+18,552,2);g.restore();});
    tileFoot(1240,452,600,430,false);g.restore();
  }
  /* frågan bakom diagrammet */
  var ps=pop(lt,12.1,.5)*(1-pop(lt,16.3,.35));
  if(ps>0){
    var e=out5(clamp(pop(lt,12.1,.5))),s=lerp(.55,1,e);
    g.save();g.globalAlpha=clamp(ps*2);g.translate(1530,327);g.scale(s,s);g.translate(-1530,-327);
    rr(1040,222,800,440,22);g.fillStyle=C.slate;g.fill();
    T('SQL · STÅTID PER ANLÄGGNING',1078,274,{fam:FM,w:500,size:18,c:C.mist,ls:3});
    SQL.forEach(function(l,k){
      var full=l[0]+l[1],nn=typedN(full.length,lt,12.5+k*.45,12.95+k*.45),y=340+k*50,kw=l[0].slice(0,nn);
      if(nn<=0)return;
      T(kw,1078,y,{fam:FM,w:500,size:27,c:C.mint});
      T(full.slice(kw.length,nn),1078+measure(kw,500,27,FM),y,{fam:FM,w:500,size:27,c:C.white});
    });
    T('UPPDATERAD 07:15 · KÄLLA PROD_CORE.MARTS',1078,628,{fam:FM,w:500,size:16,c:C.mist,ls:3,alpha:pop(lt,14.9,.4)});
    g.restore();
  }
  cap('En fråga blir en dashboard.',lt,5.0,11.5);
  cap('Varje diagram visar sin fråga.',lt,12.2,16.4);
  cap('Ändra genom att be om det.',lt,17.0,19.4);
  exTag(C.steel);
}

/* ---------- Scen: Copilot i Power BI ---------- */
var PQ=['Show average stock days','by site last month'];
var DAX=['EVALUATE','SUMMARIZECOLUMNS(',"  'Anläggning'[Anläggning],",'  "Ståtid, snitt", [Ståtid, snitt]',')'];
function modelTable(x,y,w,name,fields,hot,lt,t0){
  var p=pop(lt,t0,.45);if(p<=0)return;var h=50+fields.length*44;
  g.save();g.globalAlpha*=clamp(p*2);g.translate(0,(1-out5(p))*40);
  rr(x,y,w,h,12);g.fillStyle=C.white;g.fill();g.strokeStyle=C.slate;g.lineWidth=3;g.stroke();
  g.save();rr(x,y,w,h,12);g.clip();g.fillStyle=C.slate;g.fillRect(x,y,w,50);g.restore();
  T(name,x+18,y+33,{fam:FM,w:500,size:21,c:C.white});
  fields.forEach(function(f,k){var yy=y+50+k*44,on=hot&&hot[0]===k&&lt>=hot[1];
    if(on){var q=out5(pop(lt,hot[1],.35));g.fillStyle=C.mint;g.fillRect(x+3,yy+3,(w-6)*q,38);g.fillStyle=C.red;g.fillRect(x+3,yy+3,8,38);}
    T(f,x+24,yy+29,{fam:FM,w:500,size:19,c:C.slate});});
  g.restore();
}
function reportView(lt,a){
  if(a<=0)return;g.save();g.globalAlpha*=a;
  T('Lagerrapport',120,200,{w:900,size:44,c:C.slate});
  rr(120,236,320,200,14);g.fillStyle=C.paper;g.fill();
  T('STÅTID, SNITT',142,276,{fam:FM,w:500,size:16,c:C.steel,ls:3});T('47',140,376,{w:900,size:96,c:C.slate});T('dagar',140+measure('47',900,96)+10,376,{w:800,size:32,c:C.slate});
  rr(460,236,720,200,14);g.fillStyle=C.paper;g.fill();
  T('BILAR I LAGER PER MÅNAD',482,276,{fam:FM,w:500,size:16,c:C.steel,ls:3});
  [.5,.62,.55,.7,.64,.78,.72,.84,.76,.88,.8,.9].forEach(function(v,i){g.fillStyle=C.mist;g.fillRect(482+i*56,416-110*v,40,110*v);});
  rr(120,460,520,400,14);g.fillStyle=C.paper;g.fill();
  T('STÅTID PER MÅNAD',142,500,{fam:FM,w:500,size:16,c:C.steel,ls:3});
  polyPartial(MONTHS.map(function(v,i){return[160+i*88,820-(v-42)*22];}),1,C.steel,6);
  /* tom yta där det godkända svaret landar */
  var land=seg(lt,18.2,18.5);
  if(land<1){g.save();g.globalAlpha*=1-land;g.strokeStyle=C.steel;g.lineWidth=3;g.setLineDash([12,10]);rr(660,460,520,400,14);g.stroke();g.setLineDash([]);T('TOM YTA',920,668,{fam:FM,w:500,size:18,c:C.steel,al:'center',ls:4});g.restore();}
  if(land>0){g.save();g.globalAlpha*=land;rr(660,460,520,400,14);g.fillStyle=C.white;g.fill();g.strokeStyle=C.red;g.lineWidth=5;g.stroke();
    T('Ståtid per anläggning',690,512,{w:800,size:26,c:C.slate});hbars(SITES,690,560,84,44,96,6.2,1,C.red,28);g.restore();}
  g.restore();
}
function modelView(lt,a){
  if(a<=0)return;g.save();g.globalAlpha*=a;
  T('Semantisk modell',120,200,{w:900,size:44,c:C.slate});
  g.strokeStyle=C.steel;g.lineWidth=4;g.beginPath();g.moveTo(430,366);g.lineTo(470,472);g.moveTo(830,366);g.lineTo(790,472);g.stroke();
  modelTable(130,270,300,'dim_anlaggning',['anlaggning','bolag','region'],[0,10.6],lt,9.8);
  modelTable(470,330,320,'fct_lagerbil',['statid_dagar','pris','anlaggning_key','datum_key'],null,lt,9.95);
  modelTable(830,270,300,'dim_datum',['datum','manad','ar'],[1,11.4],lt,10.1);
  var p=pop(lt,10.2,.4),on=lt>=11.0;
  if(p>0){g.save();g.globalAlpha*=clamp(p*2);rr(470,590,320,58,29);if(on){g.fillStyle=C.red;g.fill();}else{g.strokeStyle=C.red;g.lineWidth=3;g.stroke();}
    T('[Ståtid, snitt]',630,627,{fam:FM,w:500,size:21,c:on?C.white:C.red,al:'center'});T('MÅTT',630,680,{fam:FM,w:500,size:16,c:C.steel,al:'center',ls:4});g.restore();}
  g.restore();
}
function sCopilot(lt){
  bg(C.slate);kicker('COPILOT I POWER BI',C.mist);
  var i,p,mv=seg(lt,9.6,10.0)*(1-seg(lt,14.2,14.5));
  if(panel(80,130,1140,770,24,C.white,pop(lt,.1,.5),-80,0)){reportView(lt,1-mv);modelView(lt,mv);g.restore();}
  if(!panel(1260,130,580,770,24,C.white,pop(lt,.2,.5),80,0))return;
  disc(1312,178,13,C.red);T('Copilot',1338,190,{w:900,size:34,c:C.slate});
  var second=lt>=14.4,fade=second?seg(lt,14.4,14.7):1-seg(lt,14.1,14.4);
  g.save();g.globalAlpha*=fade;
  if(!second){
    rr(1296,212,508,100,16);g.fillStyle=C.paper;g.fill();
    typeLines(PQ,1318,252,36,26,lt,.5,2.8,C.slate,lt<3.0);
    p=pop(lt,4.6,.5);
    if(p>0){
      g.save();g.globalAlpha*=clamp(p*2);g.translate(0,(1-out5(p))*40);
      rr(1296,330,508,326,16);g.strokeStyle=C.line;g.lineWidth=3;g.stroke();
      var act=lt<6.6?0:lt<8.0?1:lt<9.6?2:0,sw=act===0?(lt<6.6?4.6:9.6):act===1?6.6:8.0,q=pop(lt,sw,.25);
      ['Visual','Table','DAX'].forEach(function(s,k){rr(1316+k*118,346,106,40,20);if(k===act){g.fillStyle=C.slate;g.fill();}else{g.strokeStyle=C.line;g.lineWidth=2;g.stroke();}
        T(s,1369+k*118,373,{w:800,size:19,c:k===act?C.white:C.steel,al:'center'});});
      g.save();g.globalAlpha*=q;
      if(act===0)hbars(SITES,1320,424,66,38,84,5.6,lt<6.6?out3(seg(lt,4.9,5.7)):1,C.red,24);
      else if(act===1){T('ANLÄGGNING',1320,430,{fam:FM,w:500,size:16,c:C.steel,ls:3});T('STÅTID, SNITT',1780,430,{fam:FM,w:500,size:16,c:C.steel,ls:3,al:'right'});
        SITES.forEach(function(r,k){var y=482+k*56;T(r[0],1320,y,{w:500,size:26,c:C.slate});T(String(r[1]),1780,y,{w:900,size:26,c:C.slate,al:'right'});g.fillStyle=C.line;g.fillRect(1320,y+16,460,2);});}
      else{rr(1316,402,468,236,10);g.fillStyle=C.paper;g.fill();DAX.forEach(function(l,k){T(l,1334,442+k*40,{fam:FM,w:500,size:18,c:C.slate});});}
      g.restore();g.restore();
    }
    p=pop(lt,5.4,.4);
    if(p>0){
      var ex=out5(seg(lt,9.6,10.1)),h=lerp(52,200,ex);
      g.save();g.globalAlpha*=p;rr(1296,676,508,h,14);g.fillStyle=C.paper;g.fill();
      T('How Copilot arrived at this',1318,710,{w:800,size:22,c:C.slate});
      g.strokeStyle=C.slate;g.lineWidth=4;g.lineCap='round';g.lineJoin='round';g.beginPath();
      if(ex<.5){g.moveTo(1762,696);g.lineTo(1772,706);g.lineTo(1782,696);}else{g.moveTo(1762,706);g.lineTo(1772,696);g.lineTo(1782,706);}g.stroke();
      [['Fields','Anläggning[Anläggning]',10.6],['Measure','[Ståtid, snitt]',11.0],['Filters','Datum = last month',11.4]].forEach(function(r,k){var a=pop(lt,r[2],.3);if(a<=0)return;
        T(r[0],1318,756+k*40,{fam:FM,w:500,size:18,c:C.steel,alpha:a});T(r[1],1420,756+k*40,{fam:FM,w:500,size:18,c:C.slate,alpha:a});});
      g.restore();
    }
  }else{
    var l=lt-14.4;
    rr(1296,212,508,66,16);g.fillStyle=C.paper;g.fill();
    typeLines(['Stock days by site'],1318,254,36,26,l,.3,1.2,C.slate,l<1.4);
    p=pop(l,1.5,.5);
    if(p>0){
      g.save();g.globalAlpha*=clamp(p*2);g.translate(0,(1-out5(p))*40);
      rr(1296,296,508,300,16);g.strokeStyle=C.line;g.lineWidth=3;g.stroke();
      var pv=pop(l,1.9,.45);
      if(pv>0){g.save();g.globalAlpha*=clamp(pv*2.5);rr(1316,312,250,42,21);g.fillStyle=C.mint;g.fill();g.restore();T('Verified answer',1358,340,{w:800,size:20,c:C.slate,alpha:clamp(pv*2.5)});stamp(1338,333,13,pv);}
      hbars(SITES,1320,384,64,38,84,5.6,out3(seg(l,1.6,2.4)),C.red,24);
      g.restore();
    }
    p=pop(l,2.3,.4);
    if(p>0){var press=1-.07*Math.sin(Math.PI*seg(l,3.0,3.3));g.save();g.globalAlpha*=p;g.translate(1421,651);g.scale(press,press);rr(-125,-31,250,62,31);g.fillStyle=C.red;g.fill();T('Add to page',0,9,{w:800,size:24,c:C.white,al:'center'});g.restore();}
  }
  g.restore();
  g.restore();
  /* svaret flyger från panelen till rapportsidan */
  var fl=seg(lt,17.4,18.2);
  if(fl>0&&fl<1){var e=io3(fl),x=lerp(1296,660,e),y=lerp(296,460,e),w=lerp(508,520,e),h=lerp(300,400,e);
    g.save();g.globalAlpha=.95;rr(x,y,w,h,16);g.fillStyle=C.white;g.fill();g.strokeStyle=C.red;g.lineWidth=5;g.stroke();hbars(SITES,x+30,y+lerp(88,100,e),lerp(64,84,e),lerp(38,44,e),lerp(84,96,e),lerp(5.6,6.2,e),1,C.red,lerp(24,28,e));g.restore();}
  cap('Copilot tar frågan på engelska.',lt,.6,4.3,C.white);
  cap('Svaret kommer som diagram, tabell eller DAX.',lt,5.0,9.3,C.white);
  cap('Du ser vilka mått svaret bygger på.',lt,9.9,14.0,C.white);
  cap('Godkända svar ser likadana ut varje gång.',lt,14.9,19.4,C.white);
  exTag(C.mist);
}

/* ---------- Scen: avslut ---------- */
function sClose(lt){
  bg(C.slate);
  polyPartial([[300,300],[960,150],[1620,300]],out3(pop(lt,.3,.9)),C.white,14);
  var p=pop(lt,.6,.5),i;
  if(p>0){g.save();g.translate(960,420);var s=lerp(.7,1,back(p));g.scale(s,s);g.globalAlpha=clamp(p*2);rr(-150,-62,300,124,24);g.fillStyle=C.mint;g.fill();T('marts',0,6,{fam:FM,w:500,size:50,c:C.slate,al:'center'});T('TESTAD DATA',0,42,{fam:FM,w:500,size:16,c:C.slate,al:'center',ls:4});g.restore();}
  var q=out3(pop(lt,.9,.7));
  [[590,-1],[1330,1]].forEach(function(c){
    if(q<=0)return;var pts=[[960+c[1]*150,420],[c[0],420],[c[0],600]];
    polyPartial(pts,q,C.steel,8);
    for(i=0;i<4;i++){var u=(lt*.35+i/4)%1,d=u*(Math.abs(c[0]-(960+c[1]*150))+180),x,y;
      if(d<Math.abs(c[0]-(960+c[1]*150))){x=960+c[1]*150+c[1]*d;y=420;}else{x=c[0];y=420+(d-Math.abs(c[0]-(960+c[1]*150)));}
      if(u<q)disc(x,y,9,C.mint);}
  });
  [[330,'Claude Dashboards','utforska och pröva',1.3],[1070,'Copilot i Power BI','officiella mått',1.5]].forEach(function(c){
    if(panel(c[0],600,520,160,22,C.white,pop(lt,c[3],.5))){T(c[1],c[0]+260,668,{w:900,size:40,c:C.slate,al:'center'});T(c[2],c[0]+260,718,{w:500,size:30,c:C.steel,al:'center'});g.restore();}
  });
  rise('Båda läser samma testade data.',960,912,pop(lt,1.9,.7),{size:92,w:900,c:C.white,al:'center'});
  var q3=pop(lt,2.7,.6);if(q3>0){g.fillStyle=C.red;g.fillRect(960-70*out5(q3),950,140*out5(q3),10);T('DATAPLATTFORMEN 2027',960,1020,{fam:FM,w:500,size:26,c:C.mist,al:'center',ls:6,alpha:q3});}
}

/* ---------- tidslinje: 19 takter i 100 slag per minut ---------- */
publish([
  {f:sIntro,dur:2.4},
  {f:sClaude,dur:19.2,wipe:.5,bar:C.slate},
  {f:sCopilot,dur:19.2,wipe:.5,bar:C.red},
  {f:sClose,dur:4.8,wipe:.5,bar:C.white}
],function(S){return [['Intro',0],['Claude Dashboards',S[1].t0],['Copilot i Power BI',S[2].t0],['Avslut',S[3].t0]];},12.6);
})();
