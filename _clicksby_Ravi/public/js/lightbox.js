// lightbox.js
(() => {
  function $(s,el=document) {return el.querySelector(s)}
  let currentList = [];
  let currentIndex = 0;
  const lightbox = document.createElement('div');
  lightbox.id = 'appLightbox';
  lightbox.className = 'app-lightbox';
  lightbox.innerHTML = `
    <div class="lb-viewport">
      <button class="lb-btn lb-prev">‹</button>
      <img class="lb-img" src="" alt="">
      <button class="lb-btn lb-next">›</button>
      <div class="lb-caption"></div>
    </div>
    <button class="lb-close">✕</button>
  `;
  document.body.appendChild(lightbox);
  const lbImg = $('.lb-img', lightbox);
  const lbCaption = $('.lb-caption', lightbox);
  const lbPrev = $('.lb-prev', lightbox);
  const lbNext = $('.lb-next', lightbox);
  const lbClose = $('.lb-close', lightbox);

  function open(list, index) {
    currentList = list;
    currentIndex = index;
    setImage(currentList[currentIndex]);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    preloadNeighbors();
    // prevent right-click and drag while open
    lbImg.addEventListener('contextmenu', preventDefault);
    lbImg.addEventListener('dragstart', preventDefault);
  }

  function close() { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
  function setImage(item) {
    lbImg.src = item.src;
    lbCaption.textContent = item.caption || '';
  }
  function showIndex(i){
    if (i<0) i = currentList.length-1;
    if (i>=currentList.length) i = 0;
    currentIndex = i;
    setImage(currentList[currentIndex]);
    preloadNeighbors();
  }

  function preload(src){ const im=new Image(); im.src=src; }
  function preloadNeighbors(){ if(!currentList.length) return; preload(currentList[(currentIndex+1)%currentList.length].src); preload(currentList[(currentIndex-1+currentList.length)%currentList.length].src); }

  // swipe support
  let startX=0, startY=0;
  lbImg.addEventListener('touchstart', (e)=>{const t=e.touches[0]; startX=t.clientX; startY=t.clientY;});
  lbImg.addEventListener('touchend', (e)=>{const t=e.changedTouches[0]; const dx=t.clientX-startX; const dy=t.clientY-startY; if(Math.abs(dx)>50 && Math.abs(dy)<100){ if(dx>0) showIndex(currentIndex-1); else showIndex(currentIndex+1); }});

  // events
  lbPrev.addEventListener('click', ()=> showIndex(currentIndex-1));
  lbNext.addEventListener('click', ()=> showIndex(currentIndex+1));
  lbClose.addEventListener('click', close);
  lightbox.addEventListener('click',(e)=>{ if(e.target===lightbox) close(); });
  document.addEventListener('keydown',(e)=>{ if(!lightbox.classList.contains('open')) return; if(e.key==='ArrowLeft') showIndex(currentIndex-1); if(e.key==='ArrowRight') showIndex(currentIndex+1); if(e.key==='Escape') close(); });

  // delegate clicks on images
  document.addEventListener('click', (e)=>{
    const img = e.target.closest && e.target.closest('img.lightbox-enabled');
    if(!img) return;
    const gallery = img.closest('.masonry') || document;
    const imgs = Array.from(gallery.querySelectorAll('img.lightbox-enabled'))
      .map(i=>({src:i.src, caption:i.dataset.caption||i.alt||''}));
    const index = imgs.findIndex(i=>i.src===img.src);
    if(index>=0) open(imgs, index);
  });
  function preventDefault(e){ e.preventDefault(); return false; }
})();

