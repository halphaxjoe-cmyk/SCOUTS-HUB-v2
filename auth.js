const Auth=(()=>{
  let me=null, currentSession=null;

  function get(){return me}
  function setSession(s){currentSession=s||null;me=s?.user||null}
  function session(){return currentSession}

  async function restore(){
    if(window.SupabaseService?.configured()){
      try{
        const user=await SupabaseService.user();
        me=user||null; currentSession=await SupabaseService.session();
        return me;
      }catch(e){console.warn(e);me=null;return null}
    }
    me=null; return null;
  }

  async function register(x){
    if(!SupabaseService?.configured()) throw new Error('SUPABASE_NOT_CONFIGURED');
    const c=SupabaseService.getClient();
    const {data,error}=await c.auth.signUp({
      email:x.email,
      password:x.password,
      options:{data:{
        first_name:x.first_name,
        last_name:x.last_name,
        member_id:x.member_id,
        scout_name:x.scout_name||'',
        unit:x.unit||'',
        patrol:x.patrol||''
      }}
    });
    if(error) throw error;
    me=data.user||null; currentSession=data.session||null;
    return {success:true,data};
  }

  async function login(x){
    if(!SupabaseService?.configured()) throw new Error('SUPABASE_NOT_CONFIGURED');
    const c=SupabaseService.getClient();
    const {data,error}=await c.auth.signInWithPassword({email:x.email,password:x.password});
    if(error) throw error;
    me=data.user||null; currentSession=data.session||null;
    return {success:true,data};
  }

  async function logout(){
    if(SupabaseService?.configured()){
      const c=SupabaseService.getClient();
      const {error}=await c.auth.signOut();
      if(error) throw error;
      me=null; currentSession=null; return {success:true};
    }
    me=null; currentSession=null; return {success:true};
  }

  return {get,restore,register,login,logout,clear:()=>{me=null;currentSession=null}};
})();
