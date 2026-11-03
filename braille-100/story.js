(() => {
  'use strict';
  // The shared header is prepended at runtime; keep the skip link first in tab order.
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) document.body.prepend(skipLink);
  const button = document.getElementById('copy-link');
  const status = document.getElementById('action-status');
  if (!button || !status || !navigator.clipboard?.writeText) return;
  button.hidden = false;
  let reset;
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const url = new URL(location.href);
      url.hash = '';
      await navigator.clipboard.writeText(url.href);
      status.textContent = '기사 주소를 복사했습니다.';
    } catch {
      status.textContent = '주소를 복사하지 못했습니다. 브라우저 주소창의 주소를 복사해 주세요.';
    } finally {
      button.disabled = false;
      clearTimeout(reset);
      reset = setTimeout(() => { status.textContent = ''; }, 6000);
    }
  });
})();
