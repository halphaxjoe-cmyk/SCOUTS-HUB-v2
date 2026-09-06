const Navigation=(()=>{
  let current='home';
  const TRANSITION_MS=380;
  function decorateTransition(pageEl){
    if(!pageEl)return;
    pageEl.querySelectorAll('.transition-fleurs').forEach(x=>x.remove());
    const layer=document.createElement('div');
    layer.className='transition-fleurs';
    [0,1,2,3,4].forEach(i=>{const f=document.createElement('span');f.className='transition-fleur';f.textContent='⚜️';f.style.setProperty('--i',i);f.style.setProperty('--x',`${12+i*19}%`);layer.appendChild(f)});
    pageEl.appendChild(layer);
  }
  function decorateQuickActions(){
    document.querySelectorAll('.quick-actions').forEach(box=>{
      if(box.querySelector('.quick-fleur-layer'))return;
      const layer=document.createElement('div');layer.className='quick-fleur-layer';
      [0,1,2,3,4,5].forEach(i=>{const f=document.createElement('span');f.className='quick-fleur';f.textContent='⚜';f.style.setProperty('--i',i);f.style.setProperty('--x',`${8+i*17}%`);layer.appendChild(f)});
      box.appendChild(layer);
    });
  }
  function show(page){
    const p=document.getElementById(page);
    if(!p)return;
    if(page===current){p.classList.add('active');return}
    const oldPage=document.getElementById(current);
    document.querySelectorAll('.page').forEach(x=>x.classList.remove('page-entering','page-leaving'));
    if(oldPage){oldPage.classList.add('page-leaving');oldPage.classList.remove('active')}
    p.classList.remove('active','page-leaving','page-entering');
    void p.offsetWidth;
    p.classList.add('page-entering','active');
    decorateTransition(p);
    decorateQuickActions();
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.action===page));
    const previous=current;current=page;
    window.dispatchEvent(new CustomEvent('scout:pagechange',{detail:{page,previous}}));
    document.getElementById('main')?.focus({preventScroll:true});
    if(page==='messages'&&typeof Chat!=='undefined')Chat.renderConversations();
    if(page==='games'&&(window.Games||typeof Games!=='undefined'))(window.Games||Games).init();
    if(page==='lessonsPage'&&(window.LessonsUI||typeof LessonsUI!=='undefined')&&(window.LessonsUI||LessonsUI).init)(window.LessonsUI||LessonsUI).init();
    window.clearTimeout(show._timer);
    show._timer=window.setTimeout(()=>{
      oldPage?.classList.remove('page-leaving');
      p.classList.remove('page-entering');
    },TRANSITION_MS);
  }
  function init(){
    decorateQuickActions();
    document.addEventListener('click',e=>{
      const b=e.target.closest('[data-action],[data-feature]');if(!b)return;
      e.preventDefault();
      // One central router: prevents the old Navigation + Features double-handler.
      const a=b.dataset.action || b.dataset.feature;
      const featureKeys=new Set(['badges','skills','tasks','calendar','games','announcements','profile','backup','restore','language','account','about','settings','attendance','notes','patrols']);
      try{
        if(a==='new-member')Members.open();
        else if(a==='new-activity')Activities.open();
        else if(a==='music'){show('music');(window.ScoutMusic||((typeof ScoutMusic!=='undefined')?ScoutMusic:null))?.open?.()}
        else if(a==='messages'){
          show('messages');
          const first=StorageService?.collection?.('members')?.[0];
          if(first && typeof Chat!=='undefined' && Chat.open) Chat.open(first);
          else window.Utils?.toast?.(I18n?.t?.('noMembers')||'Pa gen manm. Ajoute yon manm anvan ou voye mesaj.');
        }
        else if(a==='lessonsPage'){show('lessonsPage');(typeof LessonsUI!=='undefined'&&LessonsUI.init&&LessonsUI.init())}
        else if(featureKeys.has(a)){
          const F=window.Features || ((typeof Features!=='undefined')?Features:null);
          if(F?.open) F.open(a);
          else throw new Error('Features pa chaje — js/features.js pa t ekspoze Features.');
        }
        else if(a) show(a);
      }catch(err){
        console.error('[SCOUT HUB] Navigation:',err);
        window.Utils?.toast?.('Bouton sa a pa t ka louvri. Eseye rafrechi app la.');
      }
    });
    window.addEventListener('popstate',()=>show(location.hash.slice(1)||'home'));
  }
  return{init,show}
})();
