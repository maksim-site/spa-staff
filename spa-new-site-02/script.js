'use strict';
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
if(menu && nav){
  document.documentElement.classList.add('js'); menu.hidden=false;
  const closeMenu=(focus=false)=>{menu.setAttribute('aria-expanded','false');menu.querySelector('.menu-label').textContent='Меню';nav.classList.remove('is-open');if(focus)menu.focus();};
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.querySelector('.menu-label').textContent=open?'Закрыть':'Меню';nav.classList.toggle('is-open',open);});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true')closeMenu(true);});
  document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu();});
  document.addEventListener('focusin',e=>{if(!e.target.closest('.header'))closeMenu();});
  matchMedia('(min-width: 981px)').addEventListener('change',()=>closeMenu());
}
// Anchors remain native. #top targets the body, before the header.
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
