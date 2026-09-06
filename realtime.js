const Realtime=(()=>{
  let channels=[];
  function clear(){channels.forEach(c=>{try{c.unsubscribe()}catch{}});channels=[]}
  function notify(payload){
    const n=payload?.new||{}; const table=payload?.table; if(!n)return;
    if(table==='notifications' && payload.eventType==='INSERT' && String(n.user_id)===String(Auth.get()?.id)){
      const icon=n.kind==='announcement'?'📢':n.kind==='message'?'💬':n.kind==='badge'?'🏅':n.kind==='task'?'📋':n.kind==='activity'?'📅':n.kind==='skill'?'🎯':'🔔';
      NotificationCenter.inApp(n.title||'🔔 Nouvo alèt',n.body||'Gen yon nouvo alèt.',icon,n.kind||'default');
      if(n.kind==='badge') window.dispatchEvent(new CustomEvent('scout:badge-earned',{detail:{icon:n.data?.icon||'🏅',title:n.body||n.title||'Nouvo badge!'}}));
      if(n.kind==='announcement') window.dispatchEvent(new CustomEvent('scout:announcement',{detail:{title:n.title,content:n.body}}));
      window.dispatchEvent(new CustomEvent('scout:notification',{detail:n}));
      return;
    }
  }
  function start(){
    if(!SupabaseService?.configured()||!Auth.get()) return;
    clear(); const c=SupabaseService.getClient();
    const tables=['messages','announcements','tasks','activities','badges','skills','notifications'];
    tables.forEach(table=>{const ch=c.channel(`scout-live-${table}`).on('postgres_changes',{event:'*',schema:'public',table},payload=>{
      window.dispatchEvent(new CustomEvent('scout:realtime',{detail:{table,payload}})); notify({...payload,table});
      if((table==='skills'||table==='tasks'||table==='badges'||table==='announcements'||table==='activities')&&window.App?.refresh){clearTimeout(window.__scoutRealtimeRefresh);window.__scoutRealtimeRefresh=setTimeout(()=>App.refresh(),180)}
    }).subscribe();channels.push(ch)})
  }
  return {start,clear};
})();