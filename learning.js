
(function(){
'use strict';
const KEY='scouthub_learning_v11';
const lessons=[
 {id:'morse-1',title:'Morse — Debaz',text:`Kòd Morse reprezante lèt ak chif ak pwen (.) ak tirè (-). Yon espas separe lèt; yon / ka separe mo. Pratike ti gwoup tankou E (.), T (-), S (...), O (---), epi aprann rekonèt ritm son yo san prese.

Pati 1 — Baz: E se yon pwen epi T se yon tirè. S se twa pwen, O se twa tirè. Aprann siy ki senp yo an premye, epi repete yo dousman.

Pati 2 — Lekti: Chak gwoup pwen ak tirè reprezante yon karaktè. Espas yo ede separe lèt yo, pandan siy / la ka sèvi pou separe mo. Pa prese; verifye sa ou li.

Pati 3 — Ekriti: Pou ekri yon mesaj, chwazi lèt yo youn apre lòt epi ranplase chak lèt ak siy Morse li. Apre sa, relire mesaj la pou asire gwoup yo byen separe.

Pati 4 — Son: Morse ka aprann ak ritm. Yon pwen pi kout pase yon tirè. Itilize Morse Trainer ki nan paj la pou tande yon mesaj epi konekte son an ak siy ou wè yo.

Pati 5 — Revizyon: Anvan quiz la, sonje E (.), T (-), S (...) ak O (---). Eseye rekonèt yo san gade repons lan. Pratik regilye ap ede w vin pi rapid.`,quiz:[
  {q:'Ki siy pou lèt E?',a:['.','-','..'],c:0},{q:'Ki siy pou lèt T?',a:['..','-','.-'],c:1},{q:'Ki siy pou SOS?',a:['... --- ...','--- ... ---','.. .- ..'],c:0}]},
 {id:'first-aid-1',title:'Premye swen — Debaz',text:'Nan yon ijans, rete kalm, verifye si kote a an sekirite, epi chèche èd yon granmoun oswa yon moun ki resevwa fòmasyon. Bay enfòmasyon klè sou sa ki rive epi suiv enstriksyon pwofesyonèl yo. Pa pran risk ou pa fòme pou jere.',quiz:[
  {q:'Premye bagay pou fè nan yon ijans?',a:['Panik','Rete kalm epi chèche èd','Kouri san di pèsonn'],c:1}]},
 {id:'navigation-1',title:'Orantasyon',text:'Pou oryante tèt ou, aprann li yon kat, idantifye nò/sid/lès/lwès, epi sèvi ak pwen referans. Toujou verifye pozisyon ou anvan ou pran yon direksyon. Yon konpa ede w jwenn direksyon, pandan kat la ede w konprann teren an.',quiz:[
  {q:'Ki direksyon solèy leve?',a:['Lès','Lwès','Nò'],c:0}]},
 {id:'scout-code-1',title:'Kòd Scout',text:'Lavi Scout mete aksan sou respè, sèvis, disiplin, responsablite ak travay ann ekip. Yon bon Scout respekte lòt moun, pran swen anviwònman an, kenbe pwomès li epi ede ekip la san li pa mete sekirite pèsonn an danje.',quiz:[
  {q:'Ki valè ki ede ekip la fonksyone?',a:['Travay ann ekip','Ignore lòt moun','Pa pran responsablite'],c:0}]}
];
const MORSE_MAP={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----','.' : '.-.-.-',',':'--..--','?':'..--..',"'":'.----.','!':'-.-.--','/':'-..-.','(':'-.--.',')':'-.--.-','&':'.-...',':':'---...',';':'-.-.-.','=':'-...-','+':'.-.-.','-':'-....-','_':'..--.-','"':'.-..-.','$':'...-..-','@':'.--.-.'};
const api={
 lessons(){return lessons},
 progress(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}},
 complete(id,score,total){
   const p=api.progress();p[id]={score,total,completed:true,updatedAt:new Date().toISOString()};
   localStorage.setItem(KEY,JSON.stringify(p));window.dispatchEvent(new CustomEvent('scout:lesson-progress',{detail:p}));return p[id]
 },
 morseEncode(text){
   return String(text||'').toUpperCase().split('').map(ch=>ch===' '?'/':(MORSE_MAP[ch]||'')).join(' ');
 },
 decodeMorse(code){
   const rev={};Object.entries(MORSE_MAP).forEach(([k,v])=>rev[v]=k);
   return String(code||'').trim().split(/\s*\/\s*/).map(word=>word.trim().split(/\s+/).map(x=>rev[x]||'').join('')).join(' ');
 },
 reset(id){const p=api.progress();delete p[id];localStorage.setItem(KEY,JSON.stringify(p));return p},
async playMorse(text){
   const code=api.morseEncode(text); const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return code;
   const ac=new AC();await ac.resume();let t=ac.currentTime;
   const dot=.09,gap=.08;
   for(const ch of code){if(ch===' '){t+=gap*2;continue}if(ch==='/'){t+=dot*5;continue}
    const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=650;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06,t+.005);
    g.gain.exponentialRampToValueAtTime(.0001,t+(ch==='.'?dot:dot*3));o.connect(g).connect(ac.destination);o.start(t);o.stop(t+(ch==='.'?dot:dot*3)+.01);t+=(ch==='.'?dot:dot*3)+gap;
   }
   return code;
 }
};
window.ScoutLearning=api;
})();
