
(function(){
 const state={date:new Date()};
 window.ScoutCalendar={
  today(){state.date=new Date();return state.date},
  next(){state.date=new Date(state.date.getFullYear(),state.date.getMonth()+1,1);return state.date},
  prev(){state.date=new Date(state.date.getFullYear(),state.date.getMonth()-1,1);return state.date},
  iso(d){const x=new Date(d);return x.toISOString().slice(0,10)}
 };
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)window.dispatchEvent(new Event('scout:calendar-refresh'))});
})();
