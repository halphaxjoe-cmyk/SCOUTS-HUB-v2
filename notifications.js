const NotificationCenter=(()=>{
  let enabled=false;
  function settings(){return StorageService?.settings?.()||{}}
  function ensureBox(){let box=document.getElementById('notificationBanner');if(!box){box=document.createElement('div');box.id='notificationBanner';box.className='notification-banner';document.body.appendChild(box)}return box}
  function banner(title,body,icon='🔔',kind='default'){
    const box=ensureBox(); box.dataset.kind=kind;
    box.innerHTML=`<div class="notif-icon">${Utils.esc(icon)}</div><div class="notif-copy"><strong>${Utils.esc(title)}</strong><p>${Utils.esc(body)}</p></div><button aria-label="${I18n.t('cancel')||'Fèmen'}">×</button>`;
    box.classList.remove('show'); void box.offsetWidth; box.classList.add('show');
    box.querySelector('button').onclick=()=>box.classList.remove('show'); clearTimeout(box._t); box._t=setTimeout(()=>box.classList.remove('show'),6500);
  }
  function inApp(title,body,icon='🔔',kind='default'){
    banner(title,body,icon,kind); Sound?.receive?.();
    if(enabled && 'Notification' in window && Notification.permission==='granted'){
      try{new Notification(title,{body,tag:`scout-hub-${kind}`,renotify:true})}catch{}
    }
  }
  async function request(){
    if(!('Notification' in window)){banner('Notifications','Navigatè sa a pa sipòte notifications.','⚠️','warning');return 'unsupported'}
    const p=await Notification.requestPermission(); enabled=p==='granted'; StorageService.setSettings({notifications:enabled});
    banner(enabled?'Notifications aktive':'Notifications pa aktive',enabled?'SCOUT HUB ap avèti w pou mesaj, anons, tâches, aktivite ak badges.':'Ou ka aktive yo pita nan paramèt yo.',enabled?'🔔':'🔕'); return p;
  }
  async function inbox(){
    if(!SupabaseService?.configured()||!Auth.get()){banner('Notifications','Konekte pou wè notifikasyon ou yo.','🔐','warning');return}
    try{
      const c=SupabaseService.getClient(); const {data,error}=await c.from('notifications').select('*').order('created_at',{ascending:false}).limit(40); if(error)throw error;
      const rows=data||[]; const body=rows.length?rows.map(n=>`<button class="notification-row ${n.read_at?'read':''}" data-notif-id="${Utils.esc(n.id)}"><span class="notif-row-icon">${n.kind==='announcement'?'📢':n.kind==='message'?'💬':n.kind==='badge'?'🏅':n.kind==='task'?'📋':n.kind==='activity'?'📅':n.kind==='skill'?'🎯':'🔔'}</span><span><strong>${Utils.esc(n.title)}</strong><small>${Utils.esc(n.body)}</small><em>${new Date(n.created_at).toLocaleString()}</em></span></button>`).join(''):'<p class="muted">Pa gen notifications ankò.</p>';
      App.modal(`<div class="notification-inbox"><div class="feature-card"><strong>🔔 Notifications</strong><p>Mesaj, anons, tâches, aktivite, badges ak compétences yo ap antre an tan reyèl.</p><button id="notificationPermission" class="secondary-btn">🔔 Aktive sou aparèy la</button></div><div class="notification-list">${body}</div></div>`);
      document.getElementById('notificationPermission')?.addEventListener('click',request);
      document.querySelectorAll('[data-notif-id]').forEach(b=>b.onclick=async()=>{try{await c.from('notifications').update({read_at:new Date().toISOString()}).eq('id',b.dataset.notifId);b.classList.add('read');refreshCount()}catch{}});
    }catch(e){banner('Notifications',e.message||'Pa kapab chaje notifications.','⚠️','warning')}
  }
  async function refreshCount(){if(!SupabaseService?.configured()||!Auth.get())return;try{const c=SupabaseService.getClient();const {count}=await c.from('notifications').select('id',{count:'exact',head:true}).is('read_at',null);const b=document.getElementById('notifyCount');if(b){b.textContent=count||0;b.hidden=!(count>0)}}catch{}}
  function init(){enabled=settings().notifications===true;refreshCount();window.addEventListener('scout:notification',refreshCount);}
  return {init,request,inApp,banner,inbox,refreshCount};
})();