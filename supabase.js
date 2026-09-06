const SupabaseService = (() => {
  let client = null;
  function configured(){return !!(window.SUPABASE_CONFIG?.url&&window.SUPABASE_CONFIG?.publishableKey)}
  function init(){
    if(!configured())return null;
    if(!client){
      if(!window.supabase?.createClient)throw new Error('SUPABASE_SDK_MISSING');
      client=window.supabase.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    }
    return client;
  }
  function getClient(){return init()}
  async function session(){const c=init();if(!c)return null;const {data,error}=await c.auth.getSession();if(error)throw error;return data.session}
  async function user(){const c=init();if(!c)return null;const {data,error}=await c.auth.getUser();if(error){if(/not authenticated|auth session missing/i.test(error.message||''))return null;throw error}return data.user}
  async function health(){
    const c=init();if(!c)throw new Error('SUPABASE_NOT_CONFIGURED');
    const {data,error}=await c.auth.getSession();if(error)throw error;
    if(data?.session){const q=await c.from('members').select('id',{count:'exact',head:true});if(q.error)throw q.error}
    return true;
  }
  async function signedUrl(path,expires=3600){if(!path)return null;const c=init();const {data,error}=await c.storage.from('scout-media').createSignedUrl(path,expires);if(error)throw error;return data.signedUrl}
  return{configured,init,getClient,session,user,health,signedUrl};
})();
