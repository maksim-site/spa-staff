'use strict';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const root=document.documentElement;
document.addEventListener('keydown',()=>root.classList.add('using-keyboard'),true);
document.addEventListener('pointerdown',()=>root.classList.remove('using-keyboard'),true);
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navigation');
if(menu && nav){
  root.classList.add('js');menu.hidden=false;
  const mobile=matchMedia('(max-width: 980px)');
  const setMenu=open=>{
    const expanded=mobile.matches&&open;
    menu.setAttribute('aria-expanded',String(expanded));
    menu.querySelector('.menu-label').textContent=expanded?'Закрыть':'Меню';
    nav.classList.toggle('is-open',expanded);
    nav.inert=mobile.matches&&!expanded;
    if(nav.inert)nav.setAttribute('aria-hidden','true');else nav.removeAttribute('aria-hidden');
  };
  const closeMenu=(focus=false)=>{setMenu(false);if(focus)menu.focus();};
  menu.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
  nav.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const target=document.getElementById(link.hash.slice(1));
    if(!target)return;
    event.preventDefault();closeMenu();
    if(location.hash!==link.hash)history.pushState(null,'',link.hash);
    const temporaryFocus=!target.hasAttribute('tabindex');
    if(temporaryFocus){target.setAttribute('tabindex','-1');target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});}
    target.focus({preventScroll:true});
    target.scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth',block:'start'});
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true')closeMenu(true);});
  document.addEventListener('click',event=>{if(!event.target.closest('.header'))closeMenu();});
  document.addEventListener('focusin',event=>{if(!event.target.closest('.header'))closeMenu();});
  mobile.addEventListener('change',()=>closeMenu());
  window.addEventListener('pageshow',()=>closeMenu());
  setMenu(false);
}
// Keep native details as the no-JS fallback; animate the whole row in both directions.
const activeAccordions=new Set();
document.querySelectorAll('.faq-list details').forEach(details=>{
  const summary=details.querySelector('summary');
  let animation=null,expanded=details.open;
  const settle=()=>{
    if(animation){animation.onfinish=null;animation.cancel();animation=null;}
    details.open=expanded;
    details.classList.remove('is-animating','is-closing');
    summary.removeAttribute('aria-expanded');
    activeAccordions.delete(settle);
  };
  summary.addEventListener('click',event=>{
    event.preventDefault();
    const start=details.getBoundingClientRect().height;
    expanded=!(animation?expanded:details.open);
    if(animation){animation.onfinish=null;animation.cancel();animation=null;}
    if(reducedMotion.matches||root.classList.contains('using-keyboard')||!details.animate){settle();return;}
    // Keep the answer rendered while closing, and reverse from its current height.
    details.open=true;
    const fullHeight=details.getBoundingClientRect().height;
    const closedHeight=summary.getBoundingClientRect().height+details.offsetHeight-details.clientHeight;
    const end=expanded?fullHeight:closedHeight;
    summary.setAttribute('aria-expanded',String(expanded));
    details.classList.add('is-animating');
    details.classList.toggle('is-closing',!expanded);
    activeAccordions.add(settle);
    animation=details.animate([{height:start+'px'},{height:end+'px'}],{
      duration:240,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'
    });
    animation.onfinish=settle;
  });
});
const settleAccordions=()=>activeAccordions.forEach(settle=>settle());
window.addEventListener('resize',settleAccordions);
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)settleAccordions();});
// Other anchors stay native; the logo returns immediately to the true body top.
const form=document.querySelector('#request-form');
if(form){
 const submit=document.querySelector('#submit');submit.disabled=false;
 const name=document.querySelector('#name'),contact=document.querySelector('#contact'),consent=document.querySelector('#consent'),count=document.querySelector('#count'),status=document.querySelector('#form-status');
 const error=(field,message)=>{field.setAttribute('aria-invalid',String(Boolean(message)));document.querySelector('#'+field.id+'-error').textContent=message;};
 const validPhone=value=>{
  const v=value.trim();
  if(!/^\+?[\d\s()\-]+$/.test(v))return false;
  const digits=v.replace(/\D/g,'');
  if(/^(\d)\1+$/.test(digits)||digits.length<10||digits.length>15)return false;
  if(v.startsWith('+'))return digits.startsWith('7')?digits.length===11:true;
  return digits.length===10||(/^[78]/.test(digits)&&digits.length===11);
 };
 // Format complete Russian numbers on blur, without moving the caret during input.
 contact.addEventListener('blur',()=>{
  if(!validPhone(contact.value))return;
  let digits=contact.value.replace(/\D/g,'');
  if(digits.length===10&&!contact.value.trim().startsWith('+'))digits='7'+digits;
  if(digits.length===11&&(digits.startsWith('7')||(digits.startsWith('8')&&!contact.value.trim().startsWith('+'))))contact.value='+7 ('+digits.slice(1,4)+') '+digits.slice(4,7)+'-'+digits.slice(7,9)+'-'+digits.slice(9,11);
 });
 form.addEventListener('submit',e=>{
  e.preventDefault();const invalid=[];
  const person=/\p{L}/u.test(name.value.trim())?'':'Укажите ваше имя.';error(name,person);if(person)invalid.push(name);
  const c=validPhone(contact.value)?'':'Укажите полный номер телефона.';error(contact,c);if(c)invalid.push(contact);
  const n=count.value?'':'Выберите количество мастеров.';error(count,n);if(n)invalid.push(count);
  const s=consent.checked?'':'Отметьте согласие, чтобы проверить заявку.';error(consent,s);if(s)invalid.push(consent);
  status.textContent=invalid.length?'Проверьте выделенные поля.':'Онлайн-отправка пока недоступна. Заявка не отправлена. Данные не сохранены.';
  status.classList.toggle('has-errors',Boolean(invalid.length));
  if(invalid.length)invalid[0].focus();else status.focus({preventScroll:true});
 });
 for(const field of [name,contact,count,consent])field.addEventListener('input',()=>{error(field,'');status.textContent='';status.classList.remove('has-errors');});
 window.addEventListener('pageshow',()=>{form.reset();status.textContent='';status.classList.remove('has-errors');for(const field of [name,contact,count,consent])error(field,'');});
}
