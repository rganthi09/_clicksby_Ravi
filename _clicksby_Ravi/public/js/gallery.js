// gallery.js
// Handles category switching, deep-linking and rendering gallery items
document.addEventListener('DOMContentLoaded', () => {
  const dataEl = document.getElementById('galleriesData');
  if (!dataEl) return;
  const galleries = JSON.parse(dataEl.textContent || '{}');
  const defaultCategory = dataEl.dataset.default || 'life-events';
  const buttons = document.querySelectorAll('.portfolio-btn');
  const masonry = document.getElementById('portfolioMasonry');

  function setActiveButton(cat) {
    buttons.forEach(b => {
      if (b.dataset.cat === cat) {
        b.classList.remove('btn-outline-primary'); b.classList.add('btn-primary');
      } else {
        b.classList.remove('btn-primary'); b.classList.add('btn-outline-primary');
      }
    });
  }

  function renderCategory(cat) {
    // fade out current, then render new
    masonry.style.opacity = 0;
    setTimeout(() => { masonry.innerHTML = '';
    const imgs = galleries[cat] || [];
    if (imgs.length === 0) {
      masonry.innerHTML = '<div>No images</div>';
      masonry.style.opacity = 1;
      return;
    }
    imgs.forEach(item => {
      const div = document.createElement('div');
      div.className = 'masonry-item';
      const img = document.createElement('img');
      img.src = item.src;
      img.loading = 'lazy';
      img.className = 'lightbox-enabled';
  img.alt = item.caption || '';
  img.dataset.caption = item.caption || '';
      img.onerror = function(){ this.src = '/images/placeholder.svg'; };
      div.appendChild(img);
      masonry.appendChild(div);
    });
    masonry.style.opacity = 1; }, 180);
    // ensure transition style
    masonry.style.transition = 'opacity 180ms';
  }

  function onHashChange() {
    const hash = location.hash.replace('#', '') || defaultCategory;
    if (!galleries[hash]) return;
    renderCategory(hash);
    setActiveButton(hash);
  }

  // attach button handlers
  buttons.forEach(b => b.addEventListener('click', () => {
    const cat = b.dataset.cat;
    history.pushState(null, '', '#'+cat);
    onHashChange();
  }));

  // init
  window.addEventListener('hashchange', onHashChange);
  // set data default
  onHashChange();
});
