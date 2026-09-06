const fs=require('fs'),vm=require('vm');
const dir='/mnt/data/diag/js';
const files=['supabase-config.js','supabase.js','utils.js','sound.js','session.js','notifications.js','realtime.js','music.js','storage.js','translations.js','navigation.js','auth.js','members.js','activities.js','games.js','chat.js','media.js','voice.js','features.js','settings.js','app.js','calendar-real.js','learning.js','lessons-ui.js'];
const document={addEventListener(){},getElementById(){return null},querySelectorAll(){return[]},createElement(){return {style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},querySelector(){return null},querySelectorAll(){return[]}}}};
const window={addEventListener(){},dispatchEvent(){},clearTimeout(){},setTimeout(){return 1},location:{hash:''},SupabaseService:null};
const ctx={console,document,window,location:window.location,localStorage:{getItem(){},setItem(){}},navigator:{},crypto:{randomUUID(){return 'x'}},URL,Blob,CustomEvent:function(){},confirm(){return true},prompt(){return ''},fetch:async()=>({ok:true,json:async()=>({})}),setTimeout,clearTimeout,requestAnimationFrame:()=>{},setInterval,clearInterval,Date,Math,JSON,Error,Map,Set,Object,Array,String,Number,Boolean,RegExp};
vm.createContext(ctx);
for(const f of files){try{vm.runInContext(fs.readFileSync(dir+'/'+f,'utf8'),ctx,{filename:f}); console.log('OK',f)}catch(e){console.log('FAIL',f,e.name,e.message,e.stack?.split('\n')[1])}}
