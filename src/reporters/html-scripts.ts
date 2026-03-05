export function getHtmlScripts(): string {
  return `<script>
(function(){
  if(localStorage.getItem('firmis-theme')==='dark')document.body.classList.add('dark');

  document.addEventListener('DOMContentLoaded',function(){
    var $=function(s,p){return Array.prototype.slice.call((p||document).querySelectorAll(s))};

    // Theme toggle
    var tb=document.getElementById('theme-toggle');
    if(tb){
      tb.textContent=document.body.classList.contains('dark')?'Light Mode':'Dark Mode';
      tb.onclick=function(){
        var d=document.body.classList.toggle('dark');
        localStorage.setItem('firmis-theme',d?'dark':'light');
        tb.textContent=d?'Light Mode':'Dark Mode';
      };
    }

    // Severity filters
    var filters=$('.filter-btn');
    filters.forEach(function(b){
      b.onclick=function(){
        b.classList.toggle('active');
        applyFilters();
      };
    });

    function applyFilters(){
      var active=filters.filter(function(b){return b.classList.contains('active')}).map(function(b){return b.dataset.severity});
      $('.threat').forEach(function(t){
        t.style.display=active.indexOf(t.dataset.severity)>-1?'':'none';
      });
      $('.platform-section').forEach(function(p){
        var all=$('.threat',p);
        var vis=all.filter(function(t){return t.style.display!=='none'});
        var el=p.querySelector('.platform-visible-count');
        if(el)el.textContent=vis.length===all.length?all.length+' threats':vis.length+'/'+all.length+' shown';
      });
    }

    // Collapsible platforms
    $('.platform-toggle').forEach(function(h){
      h.onclick=function(){h.closest('.platform-section').classList.toggle('collapsed')};
    });

    // Collapsible threats (collapsed by default)
    $('.threat-toggle').forEach(function(h){
      h.onclick=function(e){
        if(e.target.closest&&e.target.closest('.copy-claude-btn'))return;
        h.closest('.threat').classList.toggle('expanded');
      };
    });

    // Expand / Collapse all
    var ea=document.getElementById('expand-all');
    if(ea){
      ea.onclick=function(){
        var threats=$('.threat');
        var anyCollapsed=threats.some(function(t){return!t.classList.contains('expanded')&&t.style.display!=='none'});
        threats.forEach(function(t){
          if(anyCollapsed)t.classList.add('expanded');
          else t.classList.remove('expanded');
        });
        ea.textContent=anyCollapsed?'Collapse All':'Expand All';
      };
    }
  });
})();
<\/script>`
}
