const Features=(()=> {
  const esc=Utils.esc;
  const localDateKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const members=()=>StorageService.collection('members');
  const activeMember=()=>StorageService.settings().activeMemberId || members()[0]?.id || null;
  const memberName=id=>{const m=members().find(x=>String(x.id)===String(id));return m?`${m.first_name} ${m.last_name}`:'San manm'};
  const titleMap={badges:'badges',skills:'skills',tasks:'tasks',calendar:'calendar',games:'games',lessons:'lessons',announcements:'announcements',profile:'profile',backup:'backup',restore:'restore',language:'language',account:'account',about:'about',settings:'settings',attendance:'attendance',notes:'notes',patrols:'patrols'};

  function open(key){
    let body='';
    if(key==='backup') body=`<p>Ekspòte tout done lokal Scout Hub yo nan yon fichye JSON.</p><button id="doExport" class="primary-btn">💾 Ekspòte JSON</button>`;
    else if(key==='restore') body=`<p>Chwazi yon backup JSON ou te ekspòte deja.</p><input id="restoreFile" type="file" accept="application/json">`;
    else if(key==='language') body=`<label>${I18n.t('appLanguage')}<select id="langSelect">${I18n.languageOptions().map(x=>`<option value="${x.id}">${x.label}</option>`).join('')}</select></label>`;
    else if(key==='settings') body=`<div class="settings-panel">
      <div class="settings-hero"><div class="settings-icon">⚙️</div><div><h3>SCOUT HUB</h3><p>Kontwole aparans ak fason app la fonksyone.</p></div></div>
      <label class="setting-row"><span>🌐 ${I18n.t('language')}</span><select id="settingsLanguage">${I18n.languageOptions().map(x=>`<option value="${x.id}">${x.label}</option>`).join('')}</select></label>
      <label class="setting-row"><span>🎨 Thème</span><select id="settingsTheme"><option value="dark">🌙 Dark</option><option value="light">☀️ Light</option></select></label>
      <label class="setting-row"><span>🔊 Son</span><input id="settingsSound" type="checkbox"></label>
      <label class="setting-row"><span>📳 Vibration</span><input id="settingsVibration" type="checkbox"></label>
      <label class="setting-row"><span>🔔 Notifications</span><input id="settingsNotifications" type="checkbox"></label>
      <button id="requestNotifications" class="secondary-btn">🔔 Aktive notifications</button>
      <button id="openMusicSettings" class="secondary-btn">🎵 Louvri Scout Music</button>
      <div class="setting-row"><span>📴 Mode offline</span><b>Aktif</b></div>
      <div class="setting-row"><span>💾 Done lokal</span><b id="settingsDataCount">0</b></div>
      <div class="setting-hint">🔔 Lè notifications yo aktive, SCOUT HUB ap montre yon bannière epi itilize Notification API navigatè a lè li otorize.</div>
      <button id="settingsSave" class="primary-btn">💾 Sove paramèt</button>
      <button id="settingsResetTheme" class="secondary-btn">↺ Retabli Dark</button>
    </div>`;
    else if(key==='tasks') body=taskUI();
    else if(key==='skills') body=skillUI();
    else if(key==='badges') body=badgeUI();
    else if(key==='calendar') body=calendarUI();
    else if(key==='games') body=gamesUI();
    else if(key==='announcements') body=announcementUI();
    else if(key==='profile') body=profileUI();
    else if(key==='account') body=accountUI();
    else if(key==='attendance') body=attendanceUI();
    else if(key==='notes') body=notesUI();
    else if(key==='patrols') body=patrolUI();
    else if(key==='lessons') body=lessonUI();
    else body=`<p>SCOUT HUB ONLINE — òganize, aprann, sèvi. ⚜️</p><p class="muted">Tout aksyon ki anba a konsève lokalman; sa ki sipòte Supabase ap senkronize lè koneksyon ak sesyon disponib.</p>`;
    App.modal(`<h2>${titleMap[key]?I18n.t(titleMap[key]):key}</h2><div class="feature-grid">${body}</div>`);
    bind(key);
  }

  function bind(key){
    if(key==='backup') document.getElementById('doExport').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([StorageService.exportData()],{type:'application/json'}));a.download='scout-hub-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);Utils.toast('Backup ekspòte.');};
    if(key==='restore') document.getElementById('restoreFile').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const text=await f.text();if(!confirm('Restore backup sa a? Sa pral ranplase done lokal yo.'))return;StorageService.importData(text);App.closeModal();App.refresh();Utils.toast('Backup restore avèk siksè.');}catch{Utils.toast('Backup pa valid.');}};
    if(key==='language'){
      const s=StorageService.settings(); document.getElementById('langSelect').value=s.language||'ht';
      document.getElementById('langSelect').onchange=e=>{StorageService.setSettings({language:e.target.value});App.refresh();App.closeModal();Utils.toast(I18n.t('languageUpdated'));};
    }
    if(key==='settings'){
      const s=StorageService.settings();
      const ls=document.getElementById('settingsLanguage'), ts=document.getElementById('settingsTheme');
      const snd=document.getElementById('settingsSound'), vib=document.getElementById('settingsVibration'), notif=document.getElementById('settingsNotifications');
      ls.value=s.language||'ht'; ts.value=s.theme||'dark'; snd.checked=s.sound!==false; vib.checked=s.vibration===true; notif.checked=s.notifications===true;
      const data=StorageService.data(); document.getElementById('settingsDataCount').textContent=
        Object.values(data).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0);
      document.getElementById('settingsSave').onclick=()=>{
        StorageService.setSettings({language:ls.value,theme:ts.value,sound:snd.checked,vibration:vib.checked,notifications:notif.checked});
        App.refresh(); App.closeModal(); Utils.toast(I18n.t('settingsSaved'));
      };
      document.getElementById('requestNotifications').onclick=()=>NotificationCenter.request();
      document.getElementById('openMusicSettings').onclick=()=>{App.closeModal();ScoutMusic.open()};
      document.getElementById('settingsResetTheme').onclick=()=>{
        StorageService.setSettings({theme:'dark'}); App.applyTheme(); ts.value='dark'; Utils.toast('Dark retabli.');
      };
    }
    if(key==='tasks')bindTasks();
    if(key==='skills')bindSkills();
    if(key==='badges')bindBadges();
    if(key==='calendar')bindCalendar();
    if(key==='games')bindGames();
    if(key==='announcements')bindAnnouncements();
    if(key==='profile')bindProfile();
    if(key==='account')bindAccount();
    if(key==='attendance')bindAttendance();
    if(key==='notes')bindNotes();
    if(key==='patrols')bindPatrols();
    if(key==='lessons')bindLessons();
  }

  function memberOptions(selected=''){selected=selected||activeMember()||members()[0]?.id||'';return members().map(m=>`<option value="${esc(String(m.id))}" ${String(selected)===String(m.id)?'selected':''}>${esc(m.first_name)} ${esc(m.last_name)} — ${esc(m.member_id||'')}</option>`).join('')||'<option value="">Pa gen manm</option>';}

  function txTask(key){
    const keys={title:'taskTitle',desc:'taskDesc',add:'addTask',none:'noTasks',delete:'delete',confirm:'confirmDelete',normal:'normal',high:'high',low:'low',done:'done',badge:'badgeAuto'};
    return I18n.t(keys[key]||key);
  }

  function taskStats(ts){
    const total=ts.length;
    const done=ts.filter(t=>t.completed===true||t.status==='done').length;
    const pending=total-done;
    const today=localDateKey();
    const overdue=ts.filter(t=>!t.completed && t.due_date && String(t.due_date)<today).length;
    const pct=total?Math.round(done/total*100):0;
    return `<div class="task-statistics" aria-label="Statistiques des tâches">
      <div class="task-stat-card"><span>📋</span><strong id="taskStatTotal">${total}</strong><small>Total</small></div>
      <div class="task-stat-card"><span>✅</span><strong id="taskStatDone">${done}</strong><small>Fini</small></div>
      <div class="task-stat-card"><span>⏳</span><strong id="taskStatPending">${pending}</strong><small>Rete</small></div>
      <div class="task-stat-card"><span>⚠️</span><strong id="taskStatOverdue">${overdue}</strong><small>Anreta</small></div>
      <div class="task-stat-progress"><div><b>Pwogrè tâches</b><strong>${pct}%</strong></div><div class="skill-progress"><span style="width:${pct}%"></span></div></div>
    </div>`;
  }
  function taskUI(){
    const ts=StorageService.collection('tasks').slice().sort((a,b)=>String(a.due_date||'9999').localeCompare(String(b.due_date||'9999')));
    return `${taskStats(ts)}<form id="taskForm">
      <input id="tTitle" placeholder="${txTask('title')}" required>
      <textarea id="tDesc" placeholder="${txTask('desc')}"></textarea>
      <label class="task-indicator-field">🏷️ Endis pou badj + konpetans (opsyonèl)
        <input id="tHint" maxlength="120" placeholder="Egzanp: morse, camping, orientation, nœuds">
      </label>
      <small class="task-hint">💡 Opsyonèl: sistèm nan ka rekonèt konpetans nan tit + deskripsyon tou. Endis la ede lè non tâche a pa ase klè.</small>
      <select id="tMember">${memberOptions(activeMember())}</select>
      <input id="tDue" type="date">
      <select id="tPriority"><option value="normal">${txTask('normal')}</option><option value="high">${txTask('high')}</option><option value="low">${txTask('low')}</option></select>
      <button class="primary-btn">${txTask('add')}</button>
    </form>
    <div id="taskList" class="list">${ts.map(t=>`<div class="feature-card">
      <label class="check-row"><input type="checkbox" data-task="${esc(String(t.id))}" ${t.completed?'checked':''}> <strong>${esc(t.title)}</strong></label>
      <small>${esc(memberName(t.assigned_member_id))} ${t.due_date?'• '+esc(t.due_date):''} • ${esc(t.priority||'normal')}${t.completed?' • '+txTask('done'):''}</small>
      ${t.description?`<p>${esc(t.description)}</p>`:''}
      ${t.badge_hint?`<div class="task-indicator">🏷️ Endis: ${esc(t.badge_hint)}</div>`:''}
      ${t.completed&&t.badge_icon?`<div class="task-badge-earned">${esc(t.badge_icon)} ${esc(t.badge_title||txTask('badge'))}${t.skill_name?` • 🎯 ${esc(t.skill_name)}`:''}</div>`:''}
      <button class="danger-btn" data-task-delete="${esc(String(t.id))}">${txTask('delete')}</button>
    </div>`).join('')||`<p class="muted">${txTask('none')}</p>`}</div>`;
  }
  function taskBadgeMeta(task){
    const text=`${task.title||''} ${task.description||''} ${task.badge_hint||''}`.toLowerCase();
    const l=I18n.lang();
    const names={
      ht:{morse:'Mèt Morse',camp:'Mèt Camping',orient:'Eksploratè Orantasyon',knot:'Mèt Nœuds',nature:'Gadyen Lanati',aid:'Scout Sekou',lead:'Lidè Scout',team:'Ekip Scout',game:'Mèt Jwèt Scout',lesson:'Apranti Scout',sport:'Scout Aktif',fire:'Mèt Feu de Camp',service:'Scout Sèvis',default:'Misyon Akonpli'},
      fr:{morse:'Maître Morse',camp:'Maître Camping',orient:'Explorateur Orientation',knot:'Maître des Nœuds',nature:'Gardien de la Nature',aid:'Scout Secours',lead:'Leader Scout',team:'Équipe Scout',game:'Maître des Jeux Scout',lesson:'Apprenti Scout',sport:'Scout Actif',fire:'Maître du Feu de Camp',service:'Scout Service',default:'Mission Accomplie'},
      es:{morse:'Maestro Morse',camp:'Maestro de Campamento',orient:'Explorador de Orientación',knot:'Maestro de Nudos',nature:'Guardián de la Naturaleza',aid:'Scout de Socorro',lead:'Líder Scout',team:'Equipo Scout',game:'Maestro de Juegos Scout',lesson:'Aprendiz Scout',sport:'Scout Activo',fire:'Maestro del Fuego de Campamento',service:'Scout de Servicio',default:'Misión Cumplida'}
    };
    const n=names[l]||names.ht;
    const rules=[
      [/morse|kòd|code|signal/, '📡', n.morse,'Morse'], [/camp|kan|camping|abri/,'⛺',n.camp,'Camping'], [/orient|boussol|kat|direksyon|map/,'🧭',n.orient,'Orientation'], [/nœud|noeud|knot|mare/,'🪢',n.knot,'Nœuds'], [/nature|plant|anviwònman|environment/,'🌿',n.nature,'Nature'], [/premye swen|first aid|swen|secours|premiers soins|primeros auxilios/,'🩹',n.aid,'Premye swen'], [/leadership|lidè|dirije/,'🦅',n.lead,'Leadership'], [/ekip|team|kolabor|équipe|equipo/,'🤝',n.team,'Travay ann ekip'], [/jeu|game|jwèt|juego/,'🎮',n.game,'Jwèt Scout'], [/lesson|leson|quiz|aprann|leçon|apprendre|lección|aprender/,'📚',n.lesson,'Aprantisaj'], [/sport|marche|kouri|exercise|ejercicio/,'🏃',n.sport,'Aktivite Fizik'], [/feu|fire|boukan|fuego/,'🔥',n.fire,'Feu de Camp'], [/service|ede|help|volont|aide|ayuda/,'❤️',n.service,'Sèvis']
    ];
    const hit=rules.find(([re])=>re.test(text));
    return hit?{icon:hit[1],title:hit[2],skill:hit[3]}:{icon:'🏅',title:n.default,skill:'Scout'};
  }
  // Badges and competences are canonical Supabase automation.
  // The client only saves task completion, then refreshes to display the DB result.
  async function ensureTaskRewards(task){
    if(!task?.completed||!task.assigned_member_id)return null;
    const meta=taskBadgeMeta(task);
    for(let attempt=0;attempt<3;attempt++){
      try{await StorageService.flush();await new Promise(resolve=>setTimeout(resolve,150+attempt*150));await StorageService.hydrate();}catch{}
      const badge=StorageService.collection('badges').find(b=>String(b.source_task_id||'')===String(task.id))||null;
      const skill=StorageService.collection('skills').find(s=>String(s.member_id||'')===String(task.assigned_member_id)&&(s.name||s.skill_name)===meta.skill)||null;
      if(badge||skill)return {badge,skill};
    }
    return {badge:null,skill:null};
  }
  function bindTasks(){
    const form=document.getElementById('taskForm');
    if(form)form.onsubmit=async e=>{e.preventDefault();const task=StorageService.add('tasks',{title:document.getElementById('tTitle').value.trim(),description:document.getElementById('tDesc').value.trim(),badge_hint:document.getElementById('tHint').value.trim(),assigned_member_id:document.getElementById('tMember').value||null,due_date:document.getElementById('tDue').value||null,priority:document.getElementById('tPriority').value,completed:false,status:'todo'});await StorageService.flush();open('tasks');App.counters();};
    document.querySelectorAll('[data-task]').forEach(c=>c.onchange=async()=>{
      const task=StorageService.collection('tasks').find(x=>String(x.id)===String(c.dataset.task)); if(!task)return;
      const updated=StorageService.update('tasks',c.dataset.task,{completed:c.checked,status:c.checked?'done':'todo',completed_at:c.checked?new Date().toISOString():null});
      if(c.checked){
        if(!updated.assigned_member_id)Utils.toast(I18n.lang()==='fr'?'Aucun membre n’est assigné à cette tâche.':I18n.lang()==='es'?'No hay ningún miembro asignado a esta tarea.':'Pa gen manm ki asiyen ak travay sa a.');
        else {
          const rewards=await ensureTaskRewards(updated);
          if(rewards?.badge||rewards?.skill){
            StorageService.update('tasks',updated.id,{badge_icon:rewards.badge?.icon||null,badge_title:rewards.badge?.title||null,skill_name:rewards.skill?.name||rewards.skill?.skill_name||null});
          }
        }
      }else{await StorageService.flush();await StorageService.hydrate();}
      open('tasks');App.counters();
    });
    document.querySelectorAll('[data-task-delete]').forEach(b=>b.onclick=()=>{if(confirm(txTask('confirm'))){StorageService.remove('tasks',b.dataset.taskDelete);open('tasks');App.counters();}});
  }
  function skillUI(){
    const mid=activeMember();
    const existing=StorageService.collection('skills').filter(s=>String(s.member_id||'')===String(mid||''));
    const names=[...new Set([
      'Morse','Camping','Orientation','Nœuds','Nature','Premye swen','Leadership',
      'Travay ann ekip','Jwèt Scout','Aprantisaj','Aktivite Fizik','Feu de Camp','Sèvis','Scout',
      ...existing.map(s=>s.name||s.skill_name).filter(Boolean)
    ])];
    return `<div class="feature-card skill-auto-banner"><strong>🎯 Konpetans otomatik</strong><p>Pa gen bouton manuel. Chak fwa yon Scout fini yon tâche, SCOUT HUB detekte endis la epi mete konpetans ki koresponn lan otomatikman.</p><small>📈 Chak tâche valide ajoute 25% jiska 100%.</small></div>
      <label>Scout<select id="skillMember">${memberOptions(mid)}</select></label>
      <div id="skillRows" class="list">${names.map(name=>{
        const x=existing.find(s=>(s.name||s.skill_name)===name);
        const p=Math.max(0,Math.min(100,Number(x?.progress||0)));
        const level=x?.level||'débutant';
        return `<div class="feature-card skill-card" data-skill-card="${esc(name)}">
          <div class="skill-card-head"><strong>🎯 ${esc(name)}</strong><b>${p}%</b></div>
          <div class="skill-progress"><span style="width:${p}%"></span></div>
          <small>${esc(level)}${p>0?' • Automatik':''}</small>
        </div>`;
      }).join('')}</div>`;
  }
  function bindSkills(){
    const member=document.getElementById('skillMember');
    if(member)member.onchange=()=>open('skills');
  }

  function badgeUI(){
    const bs=StorageService.collection('badges');
    return `<div class="feature-card"><strong>🏅 Badges otomatik</strong><p>Chak fwa yon scout fini yon tâche ki ba li, SCOUT HUB kreye yon badj pou tâche sa a otomatikman.</p></div>
    <form id="badgeForm"><input id="bName" placeholder="Non badj manyèl" required><input id="bDesc" placeholder="Deskripsyon"><select id="bMember">${memberOptions(activeMember())}</select><button class="primary-btn">🏅 Bay badj</button></form>
    <div class="list">${bs.map(b=>`<div class="feature-card"><strong>${esc(b.icon||'🏅')} ${esc(b.name||b.title||'Badj')}</strong><p>${esc(b.description||'')}</p><small>${esc(memberName(b.member_id))} • ${b.auto_awarded?'🎯 Tâche fini':'✍️ Manyèl'} • ${esc(b.awarded_at||b.created_at||'')}</small></div>`).join('')||'<p class="muted">Pa gen badj ankò.</p>'}</div>`;
  }
  function bindBadges(){document.getElementById('badgeForm').onsubmit=e=>{e.preventDefault();StorageService.add('badges',{name:bName.value.trim(),title:bName.value.trim(),description:bDesc.value.trim(),member_id:bMember.value||null,icon:'🏅',awarded_at:new Date().toISOString().slice(0,10)});open('badges');App.counters();};}

  function gamesUI(){
    return `<div id="featureGamesList" class="games-grid"></div>`;
  }

  function calendarUI(){
    const state=window.__scoutCal||{year:new Date().getFullYear(),month:new Date().getMonth()};window.__scoutCal=state;
    const first=new Date(state.year,state.month,1),days=new Date(state.year,state.month+1,0).getDate(),start=first.getDay(),a=StorageService.collection('activities');
    const names=['Dim','Lun','Mar','Mèk','Jedi','Vand','Sam'];const label=first.toLocaleString('ht-HT',{month:'long',year:'numeric'});
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><button id="calPrev" class="secondary-btn">‹</button><strong>${esc(label)}</strong><button id="calNext" class="secondary-btn">›</button></div>
    <div class="calendar-grid">${names.map(n=>`<div class="day"><b>${n}</b></div>`).join('')}${Array.from({length:start},()=>'<div class="day"></div>').join('')}${Array.from({length:days},(_,i)=>{const key=`${state.year}-${String(state.month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`,ev=a.filter(x=>x.date===key);return `<div class="day ${i+1===new Date().getDate()&&state.month===new Date().getMonth()&&state.year===new Date().getFullYear()?'today':''}"><b>${i+1}</b>${ev.map(x=>`<button type="button" class="event-dot" data-cal-edit="${esc(String(x.id))}">${esc(x.title)}</button>`).join('')}</div>`}).join('')}</div><button id="calAdd" class="primary-btn full">＋ Nouvo aktivite</button>`;
  }
  function bindGames(){
    const box=document.getElementById('featureGamesList');
    if(box&&typeof Games!=='undefined'&&Games.renderInto) Games.renderInto(box);
  }

  function bindCalendar(){
    document.getElementById('calPrev').onclick=()=>{window.__scoutCal.month--;if(window.__scoutCal.month<0){window.__scoutCal.month=11;window.__scoutCal.year--;}open('calendar');};
    document.getElementById('calNext').onclick=()=>{window.__scoutCal.month++;if(window.__scoutCal.month>11){window.__scoutCal.month=0;window.__scoutCal.year++;}open('calendar');};
    document.getElementById('calAdd').onclick=()=>Activities.open({date:`${window.__scoutCal.year}-${String(window.__scoutCal.month+1).padStart(2,'0')}-01`});
    document.querySelectorAll('[data-cal-edit]').forEach(b=>b.onclick=()=>{const a=StorageService.collection('activities').find(x=>String(x.id)===String(b.dataset.calEdit));if(a)Activities.open(a);});
  }

  function announcementUI(){
    const as=StorageService.collection('announcements').slice().sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned));
    return `<form id="annForm"><input id="annTitle" placeholder="Tit" required><textarea id="annContent" placeholder="Kontni" required></textarea><label><input id="annPinned" type="checkbox"> 📌 Mete anlè</label><button class="primary-btn">📢 Pibliye</button></form><div class="list">${as.map(a=>`<div class="feature-card"><strong>${a.pinned?'📌 ':''}${esc(a.title||'')}</strong><p>${esc(a.content||a.body||'')}</p><small>${new Date(a.date||a.created_at||Date.now()).toLocaleString()}</small></div>`).join('')||'<p class="muted">Pa gen anons.</p>'}</div>`;
  }
  function bindAnnouncements(){document.getElementById('annForm').onsubmit=e=>{e.preventDefault();StorageService.add('announcements',{title:annTitle.value.trim(),content:annContent.value.trim(),body:annContent.value.trim(),pinned:annPinned.checked,date:new Date().toISOString()});Sound?.alarm?.();open('announcements');};}

  function lessonUI(){return `<div id="featureLessonList" class="list"></div><div class="stat-card"><strong>📡 Morse Trainer</strong><small>Ekri yon mo, wè kòd Morse la epi koute son an.</small><div style="display:flex;gap:8px;margin-top:12px"><input id="featureMorseText" class="search" placeholder="SOS"><button id="featureMorsePlay" class="primary-btn">🔊</button></div><div id="featureMorseOut" style="margin-top:10px;font-size:1.2rem"></div></div>`;}
  function bindLessons(){
    const box=document.getElementById('featureLessonList');
    if(box&&window.ScoutLearning){const p=ScoutLearning.progress();box.innerHTML=ScoutLearning.lessons().map(l=>{const x=p[l.id];return `<div class="feature-card"><strong>📘 ${esc(l.title)}</strong><p>${esc(l.text)}</p><button class="primary-btn" data-lesson-id="${esc(l.id)}">${x?.completed?'Refè quiz':'Kòmanse lesson'}</button>${x?.completed?`<small> Score: ${x.score}/${x.total} ✅</small>`:''}</div>`}).join('');box.querySelectorAll('[data-lesson-id]').forEach(b=>b.onclick=()=>{const l=ScoutLearning.lessons().find(x=>x.id===b.dataset.lessonId);let score=0;l.quiz.forEach(q=>{const n=prompt(q.q+'\n'+q.a.map((x,j)=>`${j+1}. ${x}`).join('\n'));if(Number(n)-1===q.c)score++;});ScoutLearning.complete(l.id,score,l.quiz.length);Utils.toast(`Quiz: ${score}/${l.quiz.length}`);bindLessons();});}
    const inp=document.getElementById('featureMorseText'),out=document.getElementById('featureMorseOut'),btn=document.getElementById('featureMorsePlay');if(btn)btn.onclick=async()=>{out.textContent=ScoutLearning.morseEncode(inp.value);await ScoutLearning.playMorse(inp.value);};
  }

  function attendanceUI(){
    const today=localDateKey(), rows=members().map(m=>{const a=StorageService.collection('attendance').find(x=>String(x.member_id)===String(m.id)&&x.date===today);return `<div class="feature-card"><label class="check-row"><input type="checkbox" data-att-member="${esc(String(m.id))}" ${a?.present?'checked':''}> ${esc(m.first_name)} ${esc(m.last_name)}</label><small>${esc(m.member_id||'')} • ${a?.present?'Prezans':'Pa prezan'}</small></div>`}).join('');
    return `<p>Prezans pou <strong>${today}</strong>.</p><div class="list">${rows||'<p class="muted">Pa gen manm.</p>'}</div>`;
  }
  function bindAttendance(){document.querySelectorAll('[data-att-member]').forEach(c=>c.onchange=()=>{const mid=c.dataset.attMember,date=localDateKey(),old=StorageService.collection('attendance').find(x=>String(x.member_id)===String(mid)&&x.date===date);if(old)StorageService.update('attendance',old.id,{present:c.checked});else StorageService.add('attendance',{member_id:mid,date,present:c.checked});});}

  function notesUI(){
    const ns=StorageService.collection('notes').slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
    return `<form id="noteForm"><input id="noteTitle" placeholder="Tit nòt" required><textarea id="noteBody" placeholder="Ekri nòt la..." required></textarea><button class="primary-btn">🗒️ Sove nòt</button></form><div class="list">${ns.map(n=>`<div class="feature-card"><strong>${esc(n.title)}</strong><p>${esc(n.body)}</p><small>${new Date(n.created_at).toLocaleString()}</small><button class="danger-btn" data-note-delete="${esc(String(n.id))}">Efase</button></div>`).join('')||'<p class="muted">Pa gen nòt.</p>'}</div>`;
  }
  function bindNotes(){document.getElementById('noteForm').onsubmit=e=>{e.preventDefault();StorageService.add('notes',{title:noteTitle.value.trim(),body:noteBody.value.trim()});open('notes');};document.querySelectorAll('[data-note-delete]').forEach(b=>b.onclick=()=>{StorageService.remove('notes',b.dataset.noteDelete);open('notes');});}

  function patrolUI(){
    const ps=StorageService.collection('patrols');
    return `<form id="patrolForm"><input id="patrolName" placeholder="Non patwouy" required><input id="patrolLeader" placeholder="Chef patwouy"><button class="primary-btn">⚜️ Kreye patwouy</button></form><div class="list">${ps.map(p=>`<div class="feature-card"><strong>⚜️ ${esc(p.name)}</strong><p>Chef: ${esc(p.leader||'—')}</p><small>${(members().filter(m=>m.patrol===p.name).length)} manm asosye</small><button class="danger-btn" data-patrol-delete="${esc(String(p.id))}">Efase</button></div>`).join('')||'<p class="muted">Pa gen patwouy.</p>'}</div>`;
  }
  function bindPatrols(){document.getElementById('patrolForm').onsubmit=e=>{e.preventDefault();StorageService.add('patrols',{name:patrolName.value.trim(),leader:patrolLeader.value.trim()});open('patrols');};document.querySelectorAll('[data-patrol-delete]').forEach(b=>b.onclick=()=>{if(confirm('Efase patwouy sa a?')){StorageService.remove('patrols',b.dataset.patrolDelete);open('patrols');}});}

  function profileUI(){
    const s=StorageService.settings(),mid=activeMember();
    return `<p>Chwazi Scout aktif la pou zouti lokal yo.</p><select id="profileSelect">${memberOptions(mid)}</select><button id="saveProfile" class="primary-btn">💾 Sove pwofil aktif</button><div class="feature-card" style="margin-top:10px">👤 ${esc(memberName(mid))}</div>`;
  }
  function bindProfile(){document.getElementById('saveProfile').onclick=()=>{StorageService.setSettings({activeMemberId:document.getElementById('profileSelect').value||null});Utils.toast('Pwofil aktif mete.');App.closeModal();};}

  function accountUI(){const u=Auth.get(),ss=Auth.session?.();const sessionText=u?`🟢 Sesyon aktif • ${Utils.esc(u.email||'kont konekte')}`:'🟠 Pa konekte';return `<div class="feature-grid"><div class="feature-card session-card"><strong>${sessionText}</strong><small>Supabase session lan kenbe epi refresh otomatikman lè li disponib.</small></div><form id="loginForm"><h3>🔐 Login</h3><input id="loginEmail" type="email" placeholder="Email" required><input id="loginPass" type="password" minlength="8" placeholder="Password" required><button class="primary-btn">Konekte</button></form><hr><form id="registerForm"><h3>🆕 Kreye kont</h3><input id="regEmail" type="email" placeholder="Email" required><input id="regPass" type="password" minlength="8" placeholder="Password (8+ karaktè)" required><input id="regFirst" placeholder="Prénom" required><input id="regLast" placeholder="Nom" required><input id="regMat" placeholder="Matricule unique" required><button class="primary-btn">Enskri</button></form><button id="logoutBtn" class="danger-btn">Dekonekte</button></div>`;}
  function bindAccount(){document.getElementById('loginForm').onsubmit=async e=>{e.preventDefault();try{await Auth.login({email:loginEmail.value.trim(),password:loginPass.value});Utils.toast('Konekte.');App.closeModal();await App.refresh();}catch(err){Utils.toast(err.message);}};document.getElementById('registerForm').onsubmit=async e=>{e.preventDefault();try{await Auth.register({email:regEmail.value.trim(),password:regPass.value,first_name:regFirst.value.trim(),last_name:regLast.value.trim(),member_id:regMat.value.trim()});Utils.toast('Kont kreye.');App.closeModal();await App.refresh();}catch(err){Utils.toast(err.message);}};document.getElementById('logoutBtn').onclick=async()=>{try{await Auth.logout();Utils.toast('Dekonekte.');App.closeModal();}catch(err){Utils.toast(err.message);}};}

  function init(){
    // Navigation is the single delegated router for all [data-feature] controls.
    // Keeping a second listener here caused some More-menu controls to fire twice.
  }
  return {init,open};
})();
// Explicit global export: keeps the router reliable across browsers/webviews.
if (typeof window !== 'undefined') window.Features = Features;
