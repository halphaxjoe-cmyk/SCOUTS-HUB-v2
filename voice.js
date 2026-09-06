const Voice=(()=>{
  let rec=null,chunks=[],started=0,tick=null,stream=null,audioCtx=null,analyser=null,raf=null;
  const $=id=>document.getElementById(id);
  const format=s=>{s=Math.max(0,Math.floor(s));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
  function waveform(active=false){return `<div class="voice-wave ${active?'live':''}" aria-hidden="true">${Array.from({length:32},(_,i)=>`<i style="--h:${18+((i*17)%58)}%"></i>`).join('')}</div>`}
  function drawWave(){
    if(!analyser)return;
    const data=new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(data);
    const bars=document.querySelectorAll('#voiceLiveWave i');
    bars.forEach((b,i)=>{const v=data[Math.floor(i*data.length/bars.length)]||0;b.style.height=`${Math.max(12,Math.min(92,12+v/2))}%`});
    raf=requestAnimationFrame(drawWave);
  }
  function stopVisualizer(){if(raf)cancelAnimationFrame(raf);raf=null;if(audioCtx){audioCtx.close().catch(()=>{});audioCtx=null}analyser=null}
  function renderRecording(){
    const p=$('mediaPreview'); if(!p)return;
    p.innerHTML=`<div class="voice-recorder-card"><button id="cancelVoice" class="voice-cancel" type="button" aria-label="Anile">✕</button><div class="voice-rec-dot"></div><strong>Ap anrejistre</strong><span id="recordTime">00:00</span><div id="voiceLiveWave" class="voice-wave live">${Array.from({length:32},()=>'<i></i>').join('')}</div><span class="voice-hint">Pale kounye a…</span></div>`;
    $('cancelVoice').onclick=()=>cancel();
  }
  async function start(){
    if(rec)return;
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
      Utils.toast('Mikwo Web la pa disponib; ouvri anrejistrè telefòn lan…'); Sound?.start?.(); nativeAudioInput(); return;
    }
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      chunks=[];
      const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(x=>MediaRecorder.isTypeSupported?.(x))||'';
      rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined); started=Date.now(); renderRecording(); Sound?.start?.();
      rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
      rec.onstop=finish;
      rec.start(250);
      tick=setInterval(()=>{const t=$('recordTime');if(t)t.textContent=format((Date.now()-started)/1000)},250);
      try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();const src=audioCtx.createMediaStreamSource(stream);analyser=audioCtx.createAnalyser();analyser.fftSize=64;src.connect(analyser);drawWave()}catch{}
    }catch(e){Utils.toast('Mikwo a pa disponib oswa pèmisyon refize.');Sound?.error?.();cleanup()}
  }
  function cleanup(){clearInterval(tick);tick=null;stopVisualizer();if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;rec=null}
  function cancel(){if(!rec)return;rec.onstop=null;try{rec.stop()}catch{}chunks=[];cleanup();$('mediaPreview')?.replaceChildren();$('recordTime')?.replaceChildren();Sound?.error?.();Utils.toast('Anrejistreman anile.')}
  async function finish(){
    const r=rec; const duration=Math.max(1,Math.round((Date.now()-started)/1000));
    const blob=new Blob(chunks,{type:r?.mimeType||'audio/webm'}); cleanup();
    if(blob.size<1000){$('mediaPreview')?.replaceChildren();Utils.toast('Vwa a twò kout.');return}
    const url=URL.createObjectURL(blob); const p=$('mediaPreview'); if(!p)return;
    p.innerHTML=`<div class="voice-preview-card"><button id="voicePlay" class="voice-play" type="button">▶</button><div class="voice-preview-main">${waveform()}<div class="voice-meta"><span id="voiceDuration">${format(duration)}</span><span>Vwa</span></div></div><button id="sendVoice" class="voice-send" type="button">➤</button><button id="discardVoice" class="voice-discard" type="button">✕</button><audio id="voicePreviewAudio" src="${url}" preload="metadata"></audio></div>`;
    const a=$('voicePreviewAudio'),play=$('voicePlay');
    play.onclick=()=>{if(a.paused){a.play();play.textContent='❚❚'}else{a.pause();play.textContent='▶'}};
    a.onended=()=>play.textContent='▶'; a.ontimeupdate=()=>{const d=$('voiceDuration');if(d)d.textContent=format(a.currentTime)};
    $('discardVoice').onclick=()=>{a.pause();URL.revokeObjectURL(url);p.replaceChildren();Sound?.error?.();};
    $('sendVoice').onclick=async()=>{
      const btn=$('sendVoice');btn.disabled=true;btn.textContent='…';
      try{
        if(SupabaseService?.configured()&&navigator.onLine!==false&&Auth.get()?.id){
          const ext=blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':'webm';
          const file=new File([blob],`voice-${Date.now()}.${ext}`,{type:blob.type});
          const path=await Media.uploadSupabase(file); await Chat.send('', 'voice', path, duration);
        }else{
          const reader=new FileReader(); await new Promise((resolve,reject)=>{reader.onload=()=>{Chat.send(reader.result,'voice',null,duration).then(resolve).catch(reject)};reader.onerror=reject;reader.readAsDataURL(blob)});
        }
        a.pause();URL.revokeObjectURL(url);p.replaceChildren();Sound?.success?.();Utils.toast('Vwa voye.');
      }catch(e){btn.disabled=false;btn.textContent='➤';Sound?.error?.();Utils.toast(e.message||'Vwa pa voye.')}
    };
  }
  function toggle(){if(rec)rec.stop();else start()}
  function nativeAudioInput(){
    let i=$('nativeAudioInput');
    if(!i){
      i=document.createElement('input'); i.type='file'; i.id='nativeAudioInput';
      i.accept='audio/*'; i.setAttribute('capture','microphone'); i.hidden=true;
      document.body.appendChild(i);
      i.addEventListener('change',async e=>{
        const f=e.target.files?.[0]; i.value=''; if(!f)return;
        const url=URL.createObjectURL(f), p=$('mediaPreview'); if(!p)return;
        p.innerHTML=`<div class="voice-preview-card"><button id="voicePlay" class="voice-play" type="button">▶</button><div class="voice-preview-main"><div class="voice-wave">${Array.from({length:28},(_,j)=>`<i style="--h:${18+((j*19)%62)}%"></i>`).join('')}</div><div class="voice-meta"><span id="voiceDuration">00:00</span><span>Vwa</span></div></div><button id="sendVoice" class="voice-send" type="button">➤</button><button id="discardVoice" class="voice-discard" type="button">✕</button><audio id="voicePreviewAudio" src="${url}" preload="metadata"></audio></div>`;
        const a=$('voicePreviewAudio'),play=$('voicePlay');
        play.onclick=()=>{if(a.paused){a.play();play.textContent='❚❚'}else{a.pause();play.textContent='▶'}};
        a.onloadedmetadata=()=>{const d=$('voiceDuration');if(d)d.textContent=format(a.duration)};
        $('discardVoice').onclick=()=>{a.pause();URL.revokeObjectURL(url);p.replaceChildren()};
        $('sendVoice').onclick=async()=>{
          const btn=$('sendVoice');btn.disabled=true;
          try{
            let path=null;
            if(SupabaseService?.configured()&&Auth.get()?.id&&navigator.onLine!==false)path=await Media.uploadSupabase(f);
            if(path) await Chat.send('', 'voice', path, Math.max(1,Math.round(a.duration||0)));
            else { const reader=new FileReader(); await new Promise((res,rej)=>{reader.onload=()=>{Chat.send(reader.result,'voice',null,Math.max(1,Math.round(a.duration||0))).then(res).catch(rej)};reader.onerror=rej;reader.readAsDataURL(f)}); }
            a.pause();URL.revokeObjectURL(url);p.replaceChildren();Sound?.success?.();Utils.toast('Vwa voye.');
          }catch(err){btn.disabled=false;Utils.toast(err.message||'Vwa pa voye.');Sound?.error?.()}
        };
      });
    }
    i.click();
}
function init(){
    const b=$('recordBtn');if(!b)return;
    b.addEventListener('click',toggle);
    b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
  }
  return{init,start,cancel,toggle};
})();
