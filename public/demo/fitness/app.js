(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var b=$('#burger'),nv=$('#nv');
  b.addEventListener('click',function(){b.setAttribute('aria-expanded',nv.classList.toggle('open'))});
  $$('#nv a').forEach(function(a){a.addEventListener('click',function(){nv.classList.remove('open')})});
  // счётчики
  function count(el){var to=Number(el.dataset.to),suf=el.dataset.s||'',t0=null;
    function f(t){if(!t0)t0=t;var p=Math.min((t-t0)/1200,1);el.textContent=Math.round(to*(1-Math.pow(1-p,3)))+suf;if(p<1)requestAnimationFrame(f)}
    requestAnimationFrame(f)}
  var cs=$$('[data-to]'),rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if('IntersectionObserver' in window&&!rm){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){count(e.target);io.unobserve(e.target)}})});cs.forEach(function(c){io.observe(c)})}
  else cs.forEach(function(c){c.textContent=c.dataset.to+(c.dataset.s||'')});
  // расписание
  var POOL=[['07:00','Йога','yoga','Алина','Для всех'],['08:30','Пилатес','pilates','Мадина','Начинающим'],['10:00','Силовая','power','Тимур','Средний'],['12:00','Кроссфит','cross','Данияр','Средний'],['13:30','Йога','yoga','Алина','Начинающим'],
    ['17:30','Бокс','box','Арман','Для всех'],['18:30','Кроссфит','cross','Данияр','Продвинутый'],['19:00','Йога','yoga','Алина','Для всех'],['20:00','Силовая','power','Тимур','Продвинутый'],['20:30','Бокс','box','Арман','Средний']];
  var DN=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],MN=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  var days=[],today=new Date();
  for(var i=0;i<7;i++){var d=new Date(today);d.setDate(today.getDate()+i);days.push(d)}
  function dayList(i){var r=[],x;for(var k=0;k<5;k++){x=POOL[(i*3+k*2)%POOL.length];if(!r.some(function(y){return y[0]===x[0]}))r.push(x)}
    r.sort(function(a,b){return a[0]<b[0]?-1:1});return r}
  var cur=0,type='all',dt=$('#days'),list=$('#sch');
  days.forEach(function(d,i){var bt=document.createElement('button');bt.type='button';bt.className='day';bt.setAttribute('aria-pressed',String(i===0));
    var s=document.createElement('small');s.textContent=i===0?'Сегодня':DN[d.getDay()];var bb=document.createElement('b');bb.textContent=d.getDate()+' '+MN[d.getMonth()];
    bt.appendChild(s);bt.appendChild(bb);bt.addEventListener('click',function(){cur=i;$$('.day',dt).forEach(function(x,j){x.setAttribute('aria-pressed',String(j===i))});render()});dt.appendChild(bt)});
  $$('#types .chip').forEach(function(c){c.addEventListener('click',function(){type=c.dataset.k;$$('#types .chip').forEach(function(x){x.setAttribute('aria-pressed',String(x===c))});render()})});
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
  function render(){
    list.textContent='';
    var rows=dayList(cur).filter(function(r){return type==='all'||r[2]===type});
    if(!rows.length){list.appendChild(el('p','none','В этот день таких занятий нет. Выберите другой день или тип.'));return}
    rows.forEach(function(r,k){
      var left=2+((cur*7+k*5+r[0].charCodeAt(1))%11),low=left<=4;
      var row=el('div','cls');row.appendChild(el('div','cls__t',r[0]));
      var mid=el('div');mid.appendChild(el('h3','',r[1]));mid.appendChild(el('p','','Тренер: '+r[3]+' · '+r[4]+' · 60 мин'));row.appendChild(mid);
      var rt=el('div','cls__r');rt.appendChild(el('span','left'+(low?' low':''),low?'Осталось '+left+' мест':'Свободно '+left+' мест'));
      var bt=el('button','btn btn--sm','Записаться');bt.type='button';
      bt.addEventListener('click',function(){open(r[1]+' · '+(cur===0?'сегодня':DN[days[cur].getDay()]+', '+days[cur].getDate()+' '+MN[days[cur].getMonth()])+' · '+r[0])});
      rt.appendChild(bt);row.appendChild(rt);list.appendChild(row)});
  }
  render();
  // абонементы
  var P={1:[14000,18000,30000],3:[36000,45000,78000],12:[120000,150000,264000]},M={1:'месяц',3:'3 месяца',12:'год'};
  function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
  function plans(m){
    $$('.plan').forEach(function(p,i){var v=P[m][i];$('.price',p).firstChild.textContent=fmt(v)+' ₸ ';$('.price small',p).textContent='/ '+M[m];
      $('.per',p).textContent=m===1?'Без обязательств':'≈ '+fmt(Math.round(v/m))+' ₸ в месяц'});
  }
  $$('.sw button').forEach(function(bt){bt.addEventListener('click',function(){$$('.sw button').forEach(function(x){x.setAttribute('aria-pressed',String(x===bt))});plans(Number(bt.dataset.m))})});
  plans(1);
  // окно записи
  var dlg=$('#dlg'),pick=$('#pick'),msg=$('#msg'),fm=$('#fm');
  function open(txt){pick.textContent=txt;msg.className='msg';msg.textContent='';if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','')}
  $$('[data-open]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();open(a.dataset.open)})});
  $('#x').addEventListener('click',function(){dlg.close()});
  dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
  fm.addEventListener('submit',function(e){e.preventDefault();msg.className='msg';
    var nm=$('#nm').value.trim(),ph=$('#ph').value.replace(/\D/g,'');
    if(!nm)return void(msg.textContent='Укажите имя');
    if(ph.length<10)return void(msg.textContent='Укажите телефон');
    if(!$('#cn').checked)return void(msg.textContent='Нужно согласие на обработку данных');
    msg.className='msg ok';msg.textContent='Заявка принята (демо: данные никуда не отправляются). В настоящем сайте тренер напишет вам в WhatsApp.';fm.reset()});
})();
