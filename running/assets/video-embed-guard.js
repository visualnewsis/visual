(function () {
  'use strict';
  const host = document.getElementById('newsisVideoHost');
  if (!host) return;
  // The site's CSP has no frame-src, so the YouTube player can be blocked. Say so instead of leaving an empty box.
  document.addEventListener('securitypolicyviolation', function (event) {
    if (!/youtube/i.test(event.blockedURI || '')) return;
    host.textContent = '';
    host.style.display = 'flex';
    host.style.alignItems = 'center';
    host.style.justifyContent = 'center';
    const note = document.createElement('p');
    note.className = 'newsis-video-blocked';
    note.style.cssText = 'margin:0;padding:24px;color:#e8f0f1;font-size:14px;line-height:1.7;text-align:center;word-break:keep-all';
    note.textContent = '이 화면에서는 영상을 바로 재생할 수 없습니다. 아래 \u201C유튜브에서 보기\u201D로 이어서 시청해 주세요.';
    host.append(note);
  });
}());