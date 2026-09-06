const SessionManager=(()=>{
  let session=null, unsub=null;
  const emit=()=>window.dispatchEvent(new CustomEvent('scout:session',{detail:{session,user:session?.user||null}}));
  async function init(){
    if(!SupabaseService?.configured()) return null;
    const c=SupabaseService.getClient();
    const {data,error}=await c.auth.getSession(); if(error) throw error;
    session=data.session||null; Auth?.setSession?.(session); emit();
    if(!unsub){ const r=c.auth.onAuthStateChange((event,s)=>{session=s||null; Auth?.setSession?.(session); emit(); document.body.dataset.auth=event;}); unsub=r.data.subscription; }
    return session;
  }
  async function refresh(){return init()}
  async function signOut(){const c=SupabaseService.getClient(); const {error}=await c.auth.signOut(); if(error)throw error; session=null; Auth?.clear?.(); emit();}
  function get(){return session}
  function destroy(){try{unsub?.unsubscribe()}catch{}unsub=null}
  return {init,refresh,signOut,get,destroy};
})();
