
const year = document.getElementById('year');
if(year) year.textContent = new Date().getFullYear();

const toggle = document.querySelector('.menu-toggle');
const body = document.body;
if(toggle){
  toggle.addEventListener('click', () => {
    const open = body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}
document.querySelectorAll('.nav-links a').forEach(a=>{
  a.addEventListener('click',()=>body.classList.remove('menu-open'));
});

const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

window.addEventListener('scroll',()=>{
  const y = window.scrollY;
  const heroImg = document.querySelector('.hero-image');
  if(heroImg && y < window.innerHeight){
    heroImg.style.transform = `scale(1.02) translateY(${y * 0.045}px)`;
  }
},{passive:true});
