// Supabase frontend service wrapper — resilient and safe for offline / missing SDK
const SupabaseService = (() => {
  let client = null;

  function configured() {
    return !!(window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.publishableKey);
  }

  function init() {
    if (!configured()) return null;
    if (client) return client;

    // If the Supabase SDK isn't available yet, don't throw — return null so app can continue
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      console.warn('[SupabaseService] supabase SDK missing in page. Continuing without live client.');
      return null;
    }

    try {
      client = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.publishableKey,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
      );
    } catch (e) {
      console.warn('[SupabaseService] createClient failed', e?.message || e);
      client = null;
    }
    return client;
  }

  function getClient() { return init(); }

  async function session() {
    const c = init();
    if (!c) return null;
    try {
      const { data, error } = await c.auth.getSession();
      if (error) throw error;
      return data?.session || null;
    } catch (e) {
      // propagate to caller
      throw e;
    }
  }

  async function user() {
    const c = init();
    if (!c) return null;
    try {
      const { data, error } = await c.auth.getUser();
      if (error) {
        // treat not-authenticated as null user
        if (/not authenticated|auth session missing/i.test(error.message || '')) return null;
        throw error;
      }
      return data?.user || null;
    } catch (e) {
      throw e;
    }
  }

  // health() checks that the SDK is available and the DB is reachable for a basic read
  async function health() {
    const c = init();
    if (!c) throw new Error('SUPABASE_NOT_AVAILABLE');

    try {
      const { data, error } = await c.auth.getSession();
      if (error) throw error;
      // if we have a session, try a light head/select on members to verify DB connectivity
      if (data?.session) {
        const q = await c.from('members').select('id', { count: 'exact', head: true });
        if (q.error) throw q.error;
      }
      return true;
    } catch (e) {
      throw e;
    }
  }

  // Create a signed URL for a storage object (frontend uses signedUrl to fetch protected media)
  async function signedUrl(path, expires = 3600) {
    if (!path) return null;
    const c = init();
    if (!c) throw new Error('SUPABASE_NOT_AVAILABLE');
    try {
      const { data, error } = await c.storage.from('scout-media').createSignedUrl(path, expires);
      if (error) throw error;
      return data?.signedUrl || null;
    } catch (e) {
      throw e;
    }
  }

  return { configured, init, getClient, session, user, health, signedUrl };
})();
