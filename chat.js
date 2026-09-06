const Chat=(()=>{
  let peer=null,timer=null,channel=null;
  const meMember=()=>{const u=Auth.get();return u?StorageService.collection('members').find(m=>String(m.user_id)===String(u.id)):null};
  async function mediaUrl(x){const path=x.file_path||x.media_path;if(path&&SupabaseService?.configured())try{return await SupabaseService.signedUrl(path)}catch{}return x.content||''}
  async function open(m){
    peer=m;Navigation.show('messages');renderConversations();render();
    ['chatInput','imageInput','recordBtn'].forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=false});
    document.getElementById('chatForm').querySelector('button').disabled=false;
    if(timer)clearInterval(timer);timer=setInterval(sync,6000);
    if(channel){try{await channel.unsubscribe()}catch{}}
    if(SupabaseService?.configured()){
      const c=SupabaseService.getClient();
      channel=c.channel('scout-messages-'+m.id).on('postgres_changes',{event:'*',schema:'public',table:'messages'},()=>sync()).subscribe();
    }
    await sync();
  }
  function renderConversations(){const l=document.getElementById('conversationList');const ms=StorageService.collection('members');l.innerHTML=ms.map(m=>`<button class="conversation-item pressable ${String(peer?.id)===String(m.id)?'active':''}" data-peer="${Utils.esc(String(m.id))}">👤 ${Utils.esc(m.first_name)} ${Utils.esc(m.last_name)}<small class="muted">${Utils.esc(m.member_id||m.member_code||'')}</small></button>`).join('')||'<p class="muted" style="padding:12px">Pa gen manm.</p>'}
  async function render(){
    const h=document.getElementById('chatHeader'),box=document.getElementById('chatMessages');if(!peer){h.textContent=I18n.t('chooseMember');box.innerHTML='';return}
    h.textContent=`💬 ${peer.first_name} ${peer.last_name}`;
    const msgs=StorageService.collection('messages').filter(x=>String(x.sender_member_id)===String(peer.id)||String(x.receiver_member_id)===String(peer.id)||String(x.peer_local_id)===String(peer.id)).sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
    box.innerHTML='';
    for(const x of msgs){const mine=x.sender==='me'||(Auth.get()?.id&&String(x.sender_user_id)===String(Auth.get().id));const type=x.message_type||x.type||'text';const wrap=document.createElement('div');wrap.className=`bubble ${mine?'me':''}`;if(type==='image'){const img=document.createElement('img');img.className='chat-image';img.alt='Image';img.loading='lazy';img.src=await mediaUrl(x);wrap.appendChild(img)}else if(type==='voice'||type==='audio'){const src=await mediaUrl(x);const player=document.createElement('div');player.className='voice-message';player.innerHTML=`<button class="voice-play" type="button">▶</button><div class="voice-message-main"><div class="voice-wave">${Array.from({length:28},(_,i)=>`<i style="--h:${18+((i*19)%62)}%"></i>`).join('')}</div><div class="voice-meta"><span class="voice-time">${x.duration_sec?formatVoiceTime(x.duration_sec):'00:00'}</span><span>Vwa</span></div></div><audio preload="metadata" src="${src}"></audio>`;const a=player.querySelector('audio'),pb=player.querySelector('.voice-play'),tm=player.querySelector('.voice-time');pb.onclick=()=>{if(a.paused){a.play();pb.textContent='❚❚'}else{a.pause();pb.textContent='▶'}};a.ontimeupdate=()=>{if(tm)tm.textContent=formatVoiceTime(a.currentTime)};a.onloadedmetadata=()=>{if(tm&&!x.duration_sec)tm.textContent=formatVoiceTime(a.duration)};a.onended=()=>pb.textContent='▶';wrap.appendChild(player)}else{wrap.appendChild(document.createTextNode(x.content||''))}const small=document.createElement('small');
      const when=new Date(x.created_at).toLocaleString();
      const state=x.sync_status==='pending'?' • An atant senkronizasyon':x.sync_status==='local'?' • Lokal sèlman':x.sync_status==='sent'?' • Voye': '';
      small.textContent=when+state;wrap.appendChild(small);box.appendChild(wrap)}box.scrollTop=box.scrollHeight;
  }
  async function send(content,type='text',filePath=null,durationSec=null){
    if(!peer)return;const me=Auth.get();const remoteReady=!!(SupabaseService?.configured()&&me?.id);
    const sender=remoteReady?meMember():null;
    if(remoteReady&&!sender){Utils.toast('Pwofil Scout ou pa pare.');Sound?.error?.();return}
    const local={id:crypto.randomUUID?.()||Utils.uid(),peer_local_id:peer.id,sender:'me',type,message_type:type,content:filePath?filePath:content,file_path:filePath||null,duration_sec:durationSec||null,created_at:new Date().toISOString(),sender_user_id:me?.id||null,sender_member_id:sender?.id||null,receiver_member_id:peer.id,sync_status:remoteReady?'pending':'local'};
    const d=StorageService.data();d.messages.push(local);localStorage.setItem('scoutHub.v2',JSON.stringify(d));Sound?.send?.();await render();
    if(remoteReady){try{const c=SupabaseService.getClient();const payload={id:local.id,sender_id:sender?.id||null,sender_member_id:sender?.id||null,receiver_member_id:peer.id,sender_user_id:me?.id||null,message_type:type,content:filePath?null:content,file_path:filePath,duration_sec:durationSec||null};const {data:row,error}=await c.from('messages').insert(payload).select().single();if(error)throw error;const all=StorageService.data();all.messages=all.messages.map(m=>m.id===local.id?{...row,sync_status:'sent'}:m);localStorage.setItem('scoutHub.v2',JSON.stringify(all));await render()}catch(e){
        const all=StorageService.data();all.messages=all.messages.map(m=>m.id===local.id?{...m,sync_status:'pending'}:m);StorageService.queue({kind:'upsert',name:'messages',row:{...local,sync_status:undefined}});
        Utils.toast('Mesaj la anrejistre lokalman; li poko konfime sou sèvè a.');Sound?.error?.()
      }}
  }
  async function sync(){if(!peer||!SupabaseService?.configured())return;try{const my=meMember();if(!my)return;const c=SupabaseService.getClient();const {data:rows,error}=await c.from('messages').select('*').or(`and(sender_member_id.eq.${my.id},receiver_member_id.eq.${peer.id}),and(sender_member_id.eq.${peer.id},receiver_member_id.eq.${my.id})`).order('created_at',{ascending:true});if(error)throw error;const all=StorageService.data();const localOnly=all.messages.filter(m=>!m.sender_member_id&&!m.receiver_member_id);all.messages=localOnly.concat(rows||[]);localStorage.setItem('scoutHub.v2',JSON.stringify(all));await render()}catch(e){console.warn('[SCOUT HUB] chat sync:',e.message)}}
  function formatVoiceTime(s){s=Math.max(0,Math.floor(s||0));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
  function init(){
    document.getElementById('conversationList')?.addEventListener('click',e=>{const b=e.target.closest('[data-peer]');if(!b)return;const m=StorageService.collection('members').find(x=>String(x.id)===String(b.dataset.peer));if(m)open(m)});
    const form=document.getElementById('chatForm');
    if(form){
      form.onsubmit=async e=>{
        e.preventDefault();
        e.stopPropagation();
        const i=document.getElementById('chatInput'),btn=form.querySelector('button[type="submit"]'),v=i.value.trim();
        if(!v||btn?.disabled)return false;
        i.value='';
        if(btn)btn.disabled=true;
        try{await send(v)}finally{if(btn)btn.disabled=false;i.focus()}
        return false;
      };
    }
    renderConversations();
  }
  return{init,open,renderConversations,render,sync,send};
})();
