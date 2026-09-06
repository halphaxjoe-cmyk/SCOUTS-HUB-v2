const Games=(()=>{
  const gameDefs=[
    {id:'quiz-scout',title:'Quiz Scout',icon:'🧩',desc:{ht:'Puzzle/Quiz Scout ekstèn.',fr:'Puzzle/Quiz Scout externe.',es:'Puzzle/Quiz Scout externo.',en:'External Scout puzzle/quiz.'},url:'https://play.google.com/store/apps/details?id=com.letiarts.puzzlescoutpremium'},
    {id:'knots',title:'Maîtrise des nœuds',icon:'🪢',desc:{ht:'Aprann ak pratike nœuds Scout.',fr:'Apprenez et pratiquez les nœuds Scout.',es:'Aprende y practica nudos Scout.',en:'Learn and practice Scout knots.'},url:'https://play.google.com/store/apps/details?id=knots3D.knots.tying.guide'},
    {id:'orientation',title:'Orientation',icon:'🧭',desc:{ht:'Jwèt kat ak oryantasyon.',fr:'Jeu de cartes et orientation.',es:'Juego de mapas y orientación.',en:'Map and orientation game.'},url:'https://play.google.com/store/apps/details?id=com.retryapps.game.maps.irl'}
  ];
  const text=k=>{const l=window.I18n?.lang?.()||'ht';return {installer:{ht:'📲 Enstale',fr:'📲 Installer',es:'📲 Instalar',en:'📲 Install'},play:{ht:'▶️ Jwe',fr:'▶️ Jouer',es:'▶️ Jugar',en:'▶️ Play'}}[k]?.[l]||{installer:'📲 Enstale',play:'▶️ Jwe'}[k]};
  function card(g){
    const card=document.createElement('article');card.className='game-card';
    const l=window.I18n?.lang?.()||'ht';const desc=g.desc[l]||g.desc.ht;
    card.innerHTML=`<div class="game-icon">${g.icon}</div><h3>${g.title}</h3><p class="muted">${desc}</p><div class="game-actions"><a class="primary-btn" href="${g.url}" target="_blank" rel="noopener">${text('installer')}</a><a class="secondary-btn" href="${g.url}" target="_blank" rel="noopener">${text('play')}</a></div>`;
    return card;
  }
  function renderInto(l){if(!l)return; l.replaceChildren(...gameDefs.map(card));}
  function render(){renderInto(document.getElementById('gamesList'));}
  function init(){try{render();}catch(e){console.warn('[SCOUT HUB] games render:',e);const l=document.getElementById('gamesList');if(l)l.innerHTML='<div class="empty-state">Jwèt yo pa t ka chaje. Eseye rafrechi app la.</div>';}}
  return{init,render,renderInto};
})();
if (typeof window !== 'undefined') window.Games = Games;
