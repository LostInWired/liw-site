(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var bg=$('#burger'),nv=$('#nv');
  bg.addEventListener('click',function(){bg.setAttribute('aria-expanded',nv.classList.toggle('open'))});
  $$('#nv a').forEach(function(a){a.addEventListener('click',function(){nv.classList.remove('open')})});
  function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' ₸'}
  // зоны
  var Z={std:{n:'Standard',r:700,s:[['GPU','RTX 4060 8 GB'],['CPU','Intel Core i5-13400F'],['RAM','16 GB DDR5'],['Монитор','24″ 165 Гц'],['Периферия','HyperX, Razer']],p:[['FPS',72],['Графика',60],['Отклик',70]]},
    boot:{n:'Bootcamp',r:1000,s:[['GPU','RTX 4070 Super 12 GB'],['CPU','Intel Core i7-14700F'],['RAM','32 GB DDR5'],['Монитор','27″ 240 Гц'],['Периферия','Logitech Pro']],p:[['FPS',86],['Графика',80],['Отклик',88]]},
    vip:{n:'VIP',r:1200,s:[['GPU','RTX 4080 Super 16 GB'],['CPU','Intel Core i9-14900K'],['RAM','64 GB DDR5'],['Монитор','27″ OLED 360 Гц'],['Периферия','Кресло, наушники Hi‑Fi']],p:[['FPS',98],['Графика',96],['Отклик',97]]}};
  var zone='std',hours=3,when='';
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
  function price(){var p=Z[zone].r*hours;return hours>=5?Math.round(p*0.9):p}
  function render(){
    var z=Z[zone],sp=$('#spec');sp.textContent='';
    z.s.forEach(function(r){var li=el('li');li.appendChild(el('span','',r[0]));li.appendChild(el('span','',r[1]));sp.appendChild(li)});
    var pf=$('#perf');pf.textContent='';
    z.p.forEach(function(r){var d=el('div');d.appendChild(el('span','',r[0]));var i=el('i'),u=el('u');i.appendChild(u);d.appendChild(i);d.appendChild(el('span','',String(r[1])));pf.appendChild(d);
      requestAnimationFrame(function(){requestAnimationFrame(function(){u.style.width=r[1]+'%'})})});
    $('#rate').textContent=fmt(z.r)+' / час';
    $('#hours').textContent=hours+(hours===1?' час':hours<5?' часа':' часов');
    $('#cost').textContent=fmt(price());
    $('#note').textContent=hours>=5?'Скидка 10% за 5 часов и больше':(zone==='std'&&hours>=4?'Ночью выгоднее: пакет 22:00–08:00 за 2 500 ₸':'');
    $('#sum').textContent=z.n+' · '+hours+' ч · ≈ '+fmt(price())+(when?' · '+when.toLowerCase():'');
  }
  $$('.z').forEach(function(b){b.addEventListener('click',function(){zone=b.dataset.k;$$('.z').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});render()})});
  $('#rng').addEventListener('input',function(e){hours=Number(e.target.value);render()});
  $$('#when .chip').forEach(function(c){c.addEventListener('click',function(){when=c.textContent;$$('#when .chip').forEach(function(x){x.setAttribute('aria-pressed',String(x===c))});render()})});
  // игры
  $$('#gf .chip').forEach(function(c){c.addEventListener('click',function(){$$('#gf .chip').forEach(function(x){x.setAttribute('aria-pressed',String(x===c))});
    $$('.g').forEach(function(g){g.hidden=!(c.dataset.k==='all'||g.dataset.g===c.dataset.k)})})});
  // живой статус (имитация)
  var free=18;function st(){$('#free').textContent=String(free);$('#free2').textContent=free+' из 32'}
  st();setInterval(function(){free=Math.max(6,Math.min(26,free+(Math.random()<.5?-1:1)));st()},4000);
  // заявка
  var msg=$('#msg');
  $('#form').addEventListener('submit',function(e){e.preventDefault();msg.className='msg';
    var nm=$('#nm').value.trim(),ph=$('#ph').value.replace(/\D/g,'');
    if(!when)return void(msg.textContent='Выберите время');
    if(!nm)return void(msg.textContent='Укажите ник или имя');
    if(ph.length<10)return void(msg.textContent='Укажите телефон');
    if(!$('#cn').checked)return void(msg.textContent='Нужно согласие на обработку данных');
    msg.className='msg ok';msg.textContent='Заявка принята (демо: данные никуда не отправляются). В настоящем сайте администратор подготовит место и напишет в WhatsApp.';e.target.reset();when='';$$('#when .chip').forEach(function(x){x.setAttribute('aria-pressed','false')});render()});
  render();
})();
