(function(){
  var b=document.getElementById('burger'),n=document.getElementById('nav');
  if(b)b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o)});
  document.querySelectorAll('.ba').forEach(function(ba){
    var r=ba.querySelector('input'),a=ba.querySelector('.ba__b'),l=ba.querySelector('.ba__line');
    function s(){var v=r.value;a.style.clipPath='inset(0 '+(100-v)+'% 0 0)';l.style.left=v+'%'}
    r.addEventListener('input',s);s();
  });
  var tabs=document.querySelectorAll('.tab');
  tabs.forEach(function(t){t.addEventListener('click',function(){
    tabs.forEach(function(x){x.setAttribute('aria-pressed',x===t)});
    var k=t.dataset.k;
    document.querySelectorAll('[data-g]').forEach(function(r){r.hidden=!(k==='all'||r.dataset.g===k)});
  })});
  var f=document.getElementById('form');
  if(f)f.addEventListener('submit',function(e){e.preventDefault();
    document.getElementById('ok').classList.add('show');f.reset();});
  document.querySelectorAll('.slot').forEach(function(b){b.addEventListener('click',function(){
    document.querySelectorAll('.slot').forEach(function(x){x.setAttribute('aria-pressed',x===b)});
    var h=document.getElementById('when');if(h)h.value=b.dataset.t;});});
})();
