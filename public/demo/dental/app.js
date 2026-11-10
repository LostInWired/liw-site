(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  // подбор по жалобе
  var HELP={
    pain:['Болит зуб','Скорее всего кариес или воспаление нерва. Нужен осмотр и снимок.','Лечение кариеса','15 000 ₸','caries'],
    plaque:['Налёт, запах, камень','Поможет профессиональная гигиена: ультразвук и Air Flow. Занимает около часа.','Профессиональная чистка','12 000 ₸','clean'],
    gums:['Кровоточат дёсны','Часто причина в зубном камне. Начинаем с чистки у гигиениста, затем осмотр.','Профессиональная чистка','12 000 ₸','clean'],
    white:['Хочу белее','Сначала профессиональная чистка, затем отбеливание по системе, которая подходит вам.','Отбеливание','35 000 ₸','white'],
    gap:['Нет зуба','Восстановим зуб имплантом или мостом. Решение примем после снимка.','Консультация имплантолога','0 ₸','cons'],
    kid:['Приведу ребёнка','Детский врач сначала знакомится и играет, и только потом лечит.','Детский приём','10 000 ₸','kid']};
  var res=$('#res');
  $$('#help .chip').forEach(function(c){c.addEventListener('click',function(){
    $$('#help .chip').forEach(function(x){x.setAttribute('aria-pressed',x===c)});
    var h=HELP[c.dataset.k];res.hidden=false;
    $('b',res).textContent=h[2]+' · '+h[3];$('p',res).textContent=h[1];
    res.dataset.k=h[4];
  })});
  $('#res-add').addEventListener('click',function(){
    var cb=$('input[data-id="'+res.dataset.k+'"]');
    if(cb&&!cb.checked){cb.checked=true;calc()}
    $('#price').scrollIntoView({behavior:'smooth'});
  });
  // калькулятор
  function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' ₸'}
  function calc(){
    var t=0,names=[];
    $$('.ck input').forEach(function(i){if(i.checked){t+=Number(i.dataset.p);names.push(i.dataset.n)}});
    $('#tot').textContent=fmt(t);
    $('#chosen').textContent=names.length?names.join(', '):'Ничего не выбрано';
    return names;
  }
  $$('.ck input').forEach(function(i){i.addEventListener('change',calc)});calc();
  // врачи
  $$('#dfilter .chip').forEach(function(c){c.addEventListener('click',function(){
    $$('#dfilter .chip').forEach(function(x){x.setAttribute('aria-pressed',x===c)});
    $$('.doc').forEach(function(d){d.hidden=!(c.dataset.k==='all'||d.dataset.s===c.dataset.k)});
  })});
  // дни записи
  var dn=['вс','пн','вт','ср','чт','пт','сб'],box=$('#days'),pick='';
  for(var i=0;i<8;i++){var d=new Date();d.setDate(d.getDate()+i);
    var b=document.createElement('button');b.type='button';b.className='day';b.setAttribute('aria-pressed','false');
    b.dataset.v=d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
    b.innerHTML='<small>'+(i===0?'сегодня':dn[d.getDay()])+'</small><b>'+d.getDate()+'</b>';box.appendChild(b)}
  box.addEventListener('click',function(e){var b=e.target.closest('.day');if(!b)return;
    $$('.day',box).forEach(function(x){x.setAttribute('aria-pressed',x===b)});pick=b.dataset.v});
  var msg=$('#msg');
  $('#form').addEventListener('submit',function(e){
    e.preventDefault();msg.className='msg';
    var nm=$('#nm').value.trim(),ph=$('#ph').value.replace(/\D/g,'');
    if(!pick)return void(msg.textContent='Выберите день');
    if(!nm)return void(msg.textContent='Укажите имя');
    if(ph.length<10)return void(msg.textContent='Укажите телефон');
    if(!$('#cn').checked)return void(msg.textContent='Нужно согласие на обработку данных');
    var n=calc();
    msg.className='msg ok';
    msg.textContent='Заявка принята (демо: данные никуда не отправляются). '+pick+', '+$('#tm').value.toLowerCase()+(n.length?'. Услуги: '+n.join(', '):'')+'. В настоящем сайте администратор подтвердит время по телефону.';
    $('#form').reset();pick='';$$('.day',box).forEach(function(x){x.setAttribute('aria-pressed','false')});
  });
  // подсветка раздела в меню
  var links=$$('.rail a[href^="#"]');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting)links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+en.target.id)})})},{rootMargin:'-40% 0px -55% 0px'});
    links.forEach(function(a){var t=$(a.getAttribute('href'));if(t)io.observe(t)});
  }
})();
