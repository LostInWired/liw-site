(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var b=$('#burger'),n=$('#nl');
  b.addEventListener('click',function(){b.setAttribute('aria-expanded',n.classList.toggle('open'))});
  $$('#nl a').forEach(function(a){a.addEventListener('click',function(){n.classList.remove('open')})});
  // услуги
  var tabs=$$('.tab');
  tabs.forEach(function(t){t.addEventListener('click',function(){
    tabs.forEach(function(x){x.setAttribute('aria-pressed',x===t)});
    $$('.svc li').forEach(function(li){li.hidden=li.dataset.g!==t.dataset.k});
  })});
  tabs[0]&&tabs[0].click();
  // карусель
  var ct=$('.car__t');
  $$('.car__b button').forEach(function(bt){bt.addEventListener('click',function(){ct.scrollBy({left:Number(bt.dataset.d)*290,behavior:'smooth'})})});
  // до/после
  var ba=$('.ba'),r=$('input',ba),a=$('.ba__b',ba),l=$('.ba__line',ba);
  function s(){a.style.clipPath='inset(0 '+(100-r.value)+'% 0 0)';l.style.left=r.value+'%'}
  r.addEventListener('input',s);s();
  var th=$$('.thumbs button');
  th.forEach(function(t){t.addEventListener('click',function(){
    th.forEach(function(x){x.setAttribute('aria-pressed',x===t)});
    $('.ba__a',ba).textContent='После';a.textContent='До';
    $('#cap').textContent=t.dataset.c;r.value=50;s();
    $('.ba__a',ba).dataset.k=t.dataset.k;
  })});
  // запись по шагам
  var step=0,st={},steps=$$('.step'),dots=$$('.dots i'),err=$('#err');
  function show(){steps.forEach(function(x,i){x.hidden=i!==step});dots.forEach(function(d,i){d.classList.toggle('on',i<=step)});
    $('#back').hidden=step===0||step===4;$('#next').hidden=step===4;$('#next').textContent=step===3?'Отправить заявку':'Далее';err.textContent=''}
  $$('.chips').forEach(function(g){g.addEventListener('click',function(e){
    var c=e.target.closest('.chip');if(!c)return;
    $$('.chip',g).forEach(function(x){x.setAttribute('aria-pressed',x===c)});st[g.dataset.f]=c.textContent})});
  $('#back').addEventListener('click',function(){step--;show()});
  $('#next').addEventListener('click',function(){
    if(step===0&&!st.s)return void(err.textContent='Выберите услугу');
    if(step===1&&!st.m)return void(err.textContent='Выберите мастера');
    if(step===2&&(!st.d||!st.t))return void(err.textContent='Выберите день и время');
    if(step===3){
      var nm=$('#nm').value.trim(),ph=$('#ph').value.replace(/\D/g,'');
      if(!nm)return void(err.textContent='Укажите имя');
      if(ph.length<10)return void(err.textContent='Укажите телефон');
      $('#sum').textContent=st.s+' · '+st.m+' · '+st.d+', '+st.t.toLowerCase();
    }
    step++;show()});
  show();
})();
