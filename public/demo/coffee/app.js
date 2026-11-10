(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var M={
    coffee:[['Эспрессо','Двойной, насыщенный',900],['Американо','Мягкий, на 250 мл',1000],['Капучино','Шёлковая молочная пенка',1400],['Флэт уайт','Двойной эспрессо и молоко',1600],['Фильтр-кофе','Ароматный, из чемекса',1100],['Раф','Сливки, ваниль',1700]],
    dessert:[['Круассан','Сливочный, свежий',900],['Чизкейк','Нью-йоркский',1800],['Эклер','С заварным кремом',1200],['Брауни','Шоколадный, тёплый',1300],['Медовик','По домашнему рецепту',1500]],
    other:[['Чай, чайник','Чёрный, зелёный, травяной',1500],['Какао','На молоке, с зефиром',1400],['Лимонад','Домашний, цитрус',1600],['Матча-латте','Японская матча',1800]]};
  var cart={},cur='coffee',when='',menu=$('#menu'),box=$('#lines');
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
  function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' ₸'}
  function items(){return M[cur]}
  function draw(){
    menu.textContent='';
    M[cur].forEach(function(it){
      var c=el('div','it');c.appendChild(el('h3','',it[0]));c.appendChild(el('p','',it[1]));
      var f=el('div','it__f');f.appendChild(el('b','',fmt(it[2])));
      var a=el('button','add','+');a.type='button';a.setAttribute('aria-label','Добавить: '+it[0]);
      a.addEventListener('click',function(){cart[it[0]]=cart[it[0]]||{p:it[2],q:0};cart[it[0]].q++;upd()});
      f.appendChild(a);c.appendChild(f);menu.appendChild(c)});
  }
  function upd(){
    box.textContent='';var t=0,n=0;
    Object.keys(cart).forEach(function(k){var x=cart[k];if(x.q<=0){delete cart[k];return}
      t+=x.p*x.q;n+=x.q;
      var r=el('div','ln');r.appendChild(el('span','',k));
      var q=el('div','q');var m=el('button','','−'),p=el('button','','+');m.type=p.type='button';m.setAttribute('aria-label','Меньше: '+k);p.setAttribute('aria-label','Больше: '+k);
      m.addEventListener('click',function(){x.q--;upd()});p.addEventListener('click',function(){x.q++;upd()});
      q.appendChild(m);q.appendChild(el('span','',String(x.q)));q.appendChild(p);r.appendChild(q);r.appendChild(el('b','',fmt(x.p*x.q)));box.appendChild(r)});
    $('#empty').hidden=n>0;$('#total').textContent=fmt(t);
  }
  $$('.tab').forEach(function(b){b.addEventListener('click',function(){cur=b.dataset.k;$$('.tab').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});draw()})});
  $$('#when .chip').forEach(function(c){c.addEventListener('click',function(){when=c.textContent;$$('#when .chip').forEach(function(x){x.setAttribute('aria-pressed',String(x===c))})})});
  var msg=$('#msg');
  $('#order').addEventListener('submit',function(e){e.preventDefault();msg.className='msg';
    if(!Object.keys(cart).length)return void(msg.textContent='Добавьте что-нибудь из меню');
    if(!when)return void(msg.textContent='Выберите, когда заберёте');
    var nm=$('#nm').value.trim(),ph=$('#ph').value.replace(/\D/g,'');
    if(!nm)return void(msg.textContent='Укажите имя');
    if(ph.length<10)return void(msg.textContent='Укажите телефон');
    msg.className='msg ok';msg.textContent='Заказ принят (демо: данные никуда не отправляются). Заберёте: '+when.toLowerCase()+'. В настоящем сайте мы пришлём подтверждение в WhatsApp.';
    cart={};upd();e.target.reset();when='';$$('#when .chip').forEach(function(x){x.setAttribute('aria-pressed','false')})});
  draw();upd();
})();
