(() => {
  'use strict';

  const style = document.createElement('style');
  style.id = 'plannerSkinFixes';
  style.textContent = `
    body[data-skin='lgbt']{
      --bg:#faf8ff;
      --panel:#ffffff;
      --panel-2:#f7f2ff;
      --text:#281f35;
      --muted:#786b88;
      --border:#dfd4e8;
      --accent:#7b2dbf;
      --accent-soft:#f0e3ff;
      --danger:#d93b61;
    }
    body[data-skin='lgbt'] .btn.primary,
    body[data-skin='lgbt'] .view-tab.active{
      background:linear-gradient(100deg,
        rgba(228,3,3,.13),
        rgba(255,140,0,.12),
        rgba(255,237,0,.12),
        rgba(0,128,38,.12),
        rgba(36,64,142,.12),
        rgba(115,41,130,.13));
    }
  `;
  document.head.appendChild(style);

  function repairDynamicCopy() {
    const canary = document.body.dataset.skin === 'canarias';
    const editor = document.querySelector('#editorHeading');
    if (editor && !canary && /marca[od]s?$/i.test(editor.textContent.trim())) {
      const match = editor.textContent.match(/^(\d+)/);
      editor.textContent = match ? `${match[1]} bloques seleccionados` : 'Bloque seleccionado';
    }
  }

  document.addEventListener('planner:skinchange',repairDynamicCopy);
  setTimeout(repairDynamicCopy,0);
})();