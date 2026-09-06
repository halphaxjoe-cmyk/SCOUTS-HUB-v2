(function(){
'use strict';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function render(){
 const box=document.getElementById('lessonList'); if(!box||!window.ScoutLearning)return;
 const p=ScoutLearning.progress();
 box.innerHTML=ScoutLearning.lessons().map(l=>{
  const x=p[l.id];
  return `<article class="stat-card lesson-card"><span>📘</span><strong>${esc(l.title)}</strong><small>${esc(l.text.slice(0,180))}${l.text.length>180?'…':''}</small><button class="primary-btn lesson-start" data-id="${esc(l.id)}" style="margin-top:12px">${x?.completed?'🔁 Refaire leçon':'▶️ Commencer la leçon'}</button>${x?.completed?`<small>Score: ${x.score}/${x.total} • Complétée ✅</small><button class="secondary-btn lesson-reset" data-id="${esc(l.id)}">↺ Réinitialiser la progression</button>`:''}</article>`;
 }).join('');
 box.querySelectorAll('.lesson-start').forEach(b=>b.onclick=()=>openLesson(b.dataset.id));
 box.querySelectorAll('.lesson-reset').forEach(b=>b.onclick=()=>{ScoutLearning.reset(b.dataset.id);render()});
}
function openLesson(id){
 const l=ScoutLearning.lessons().find(x=>x.id===id); if(!l)return;
 const modal=document.getElementById('modal'), body=document.getElementById('modalBody');
 if(!modal||!body||!window.ScoutLessonPages){quiz(id);return;}
 const pages=ScoutLessonPages.paginate(l.text,3000);
 body.innerHTML=`<div class="lesson-reading"><h2>📖 ${esc(l.title)}</h2><div id="lessonPagerMount"></div></div>`;
 modal.classList.remove('hidden');
 ScoutLessonPages.mount(document.getElementById('lessonPagerMount'),pages,{title:l.title,onComplete:()=>quiz(id)});
}
function closeModal(){document.getElementById('modal')?.classList.add('hidden');}
function quiz(id){
 const l=ScoutLearning.lessons().find(x=>x.id===id);if(!l)return;
 let score=0;
 l.quiz.forEach(q=>{const n=prompt(q.q+'\n'+q.a.map((x,j)=>`${j+1}. ${x}`).join('\n'));if(Number(n)-1===q.c)score++});
 ScoutLearning.complete(id,score,l.quiz.length); alert(`Quiz fini: ${score}/${l.quiz.length}`); closeModal(); render();
}
document.addEventListener('DOMContentLoaded',()=>{
 render(); document.getElementById('modalClose')?.addEventListener('click',closeModal);
 const input=document.getElementById('morseText'),out=document.getElementById('morseOutput'),btn=document.getElementById('morsePlay'),codeInput=document.getElementById('morseCode'),decodeOut=document.getElementById('morseDecodeOutput');
 if(input)input.addEventListener('input',()=>out.textContent=ScoutLearning.morseEncode(input.value));
 if(codeInput)codeInput.addEventListener('input',()=>decodeOut.textContent=ScoutLearning.decodeMorse(codeInput.value));
 if(btn)btn.onclick=async()=>{out.textContent=ScoutLearning.morseEncode(input.value);await ScoutLearning.playMorse(input.value)};
});
})();