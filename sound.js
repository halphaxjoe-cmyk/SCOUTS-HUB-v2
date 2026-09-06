const Sound=(()=>{
  let ctx=null, master=null, ready=false;
  function ensure(){
    if(ctx)return ctx;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    ctx=new AC();
    master=ctx.createGain(); master.gain.value=.8; master.connect(ctx.destination);
    return ctx;
  }
  async function wake(){const c=ensure(); if(!c)return false; if(c.state==='suspended')try{await c.resume()}catch{} ready=c.state==='running'; return ready}
  function enabled(){return StorageService?.settings?.().sound!==false}
  function vibrate(){if(StorageService?.settings?.().vibration!==true||!navigator.vibrate)return;navigator.vibrate(8)}
  function note(freq,duration=.08,type='sine',volume=.035,when=0){if(!enabled())return;
    const c=ensure(); if(!c||!master)return;
    const t=c.currentTime+when;
    const o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(volume,.0002),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g).connect(master);o.start(t);o.stop(t+duration+.02);
  }
  async function click(){if(!await wake())return;note(560,.045,'sine',.022)}
  async function success(){if(!await wake())return;note(660,.07,'sine',.035);note(880,.09,'sine',.028,.07);note(1040,.12,'sine',.022,.14)}
  async function error(){if(!await wake())return;note(240,.09,'triangle',.025);note(180,.12,'triangle',.018,.08)}
  async function send(){if(!await wake())return;note(740,.055,'triangle',.03);note(980,.075,'triangle',.024,.055)}
  async function start(){if(!await wake())return;note(440,.07,'sine',.025);note(660,.08,'sine',.024,.07)}
  async function receive(){if(!await wake())return;note(620,.06,'sine',.026);note(820,.09,'sine',.022,.06)}
  async function alarm(){if(!await wake())return;for(let i=0;i<4;i++){note(880,.12,'square',.035,i*.22);note(520,.12,'square',.025,i*.22+.11)}}
  async function init(){
    document.addEventListener('pointerdown',()=>wake(),{passive:true,once:false});
    document.addEventListener('keydown',()=>wake(),{passive:true,once:false});
    document.addEventListener('pointerdown',e=>{if(e.target.closest('button,.media-btn,a'))click()},{passive:true});
  }
  return{init,wake,click,success,error,send,start,receive,alarm,get ready(){return ready}};
})();
