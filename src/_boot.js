// JL2 启动器：由集成方编写。所有模块加载完毕后，在 init() 里调用 jl2_boot()。
// 注：jl2_relSync 由 social2.js 提供，供旧 gainAff 同步权威值。
function jl2_boot(){
  var steps=[
    ['content',    function(){ if(typeof jl2_contentInstall==='function') jl2_contentInstall(); }],
    ['text',       function(){ if(typeof jl2_textInstall==='function') jl2_textInstall(); }],
    ['quest',      function(){ if(typeof jl2_questInit==='function') jl2_questInit(); }],
    ['progression',function(){ if(typeof jl2_progressionInit==='function') jl2_progressionInit(); }],
    ['combat',     function(){ if(typeof jl2_combatInit==='function') jl2_combatInit(); }],
    ['materials',  function(){ if(typeof jl2_materialsInit==='function') jl2_materialsInit(); }],
    ['dialogue',   function(){ if(typeof jl2_dialogueInit==='function') jl2_dialogueInit(); }],
    ['social',     function(){ if(typeof jl2_socialInit==='function') jl2_socialInit(); }],
    ['guide',      function(){ if(typeof jl2_guideInit==='function') jl2_guideInit(); }]
  ];
  steps.forEach(function(step){
    try{ step[1](); }
    catch(e){
      console.log('JL2-FAIL:' + step[0] + ':' + (e&&e.message));
      try{ window.__bootErrs && window.__bootErrs.push('jl2_boot['+step[0]+']: '+(e&&e.message)); }catch(e2){}
    }
  });
  try{ if(typeof jl2_emit==='function') jl2_emit('boot',{}); }catch(e){}
  window.__JL2_OK=true;
}
