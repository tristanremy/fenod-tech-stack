(() => {
  const selector = 'img[src^="/diagrams/"]';

  function closeLightbox() {
    document.querySelector('[data-diagram-lightbox]')?.remove();
    document.body.style.overflow = '';
  }

  function openLightbox(img) {
    closeLightbox();

    let scale = 1;
    const overlay = document.createElement('div');
    overlay.dataset.diagramLightbox = 'true';
    overlay.innerHTML = `
      <div class="diagram-lightbox__toolbar" role="toolbar" aria-label="Diagram controls">
        <button type="button" data-zoom-out aria-label="Zoom out">−</button>
        <button type="button" data-zoom-reset aria-label="Reset zoom">100%</button>
        <button type="button" data-zoom-in aria-label="Zoom in">+</button>
        <a href="${img.currentSrc || img.src}" target="_blank" rel="noreferrer">Open SVG</a>
        <button type="button" data-close aria-label="Close">Close</button>
      </div>
      <div class="diagram-lightbox__stage">
        <img src="${img.currentSrc || img.src}" alt="${img.alt || 'Diagram'}" />
      </div>
    `;

    const largeImg = overlay.querySelector('img');
    const applyScale = () => {
      largeImg.style.transform = `scale(${scale})`;
      overlay.querySelector('[data-zoom-reset]').textContent = `${Math.round(scale * 100)}%`;
    };

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.dataset.close !== undefined) closeLightbox();
    });
    overlay.querySelector('[data-zoom-in]').addEventListener('click', () => {
      scale = Math.min(scale + 0.25, 3);
      applyScale();
    });
    overlay.querySelector('[data-zoom-out]').addEventListener('click', () => {
      scale = Math.max(scale - 0.25, 0.5);
      applyScale();
    });
    overlay.querySelector('[data-zoom-reset]').addEventListener('click', () => {
      scale = 1;
      applyScale();
    });

    document.body.append(overlay);
    document.body.style.overflow = 'hidden';
    applyScale();
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLightbox();
  });

  function enhance() {
    document.querySelectorAll(selector).forEach((img) => {
      if (img.dataset.diagramEnhanced) return;
      img.dataset.diagramEnhanced = 'true';
      img.tabIndex = 0;
      img.role = 'button';
      img.title = 'Open zoomable diagram';
      img.addEventListener('click', () => openLightbox(img));
      img.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(img);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance);
  } else {
    enhance();
  }
  document.addEventListener('astro:page-load', enhance);
})();
