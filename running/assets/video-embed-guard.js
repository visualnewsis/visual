(function () {
  'use strict';
  // VISUAL NEWSIS addition, kept outside the draft files so syncing never overwrites it.
  // The site's CSP has no frame-src, so the in-page YouTube player is blocked. Until the CSP allows it, the video link
  // opens YouTube in a new tab; once the response header allows the embed, the draft's in-page player takes over by itself.
  const host = document.getElementById('newsisVideoHost');
  const EMBED_ORIGIN = 'https://www.youtube-nocookie.com';
  let embedAllowed = false;

  function policyAllows(policy) {
    const directives = {};
    policy.split(';').forEach(function (part) {
      const tokens = part.trim().split(/\s+/);
      if (tokens[0]) directives[tokens[0].toLowerCase()] = tokens.slice(1);
    });
    const sources = directives['frame-src'] || directives['child-src'] || directives['default-src'];
    if (!sources) return true;
    return sources.some(function (source) {
      source = source.toLowerCase();
      return source === '*' || source === 'https:' || source === EMBED_ORIGIN || source === EMBED_ORIGIN + ':443' || source === 'https://*.youtube-nocookie.com';
    });
  }

  // Not allowed until the page's own response header says otherwise, so a slow or failed check never leaves a dead player.
  window.fetch(window.location.pathname + window.location.search, { method: 'HEAD', cache: 'no-store', credentials: 'same-origin' })
    .then(function (response) {
      const header = response.headers.get('content-security-policy');
      embedAllowed = !header || header.split(',').every(policyAllows);
    })
    .catch(function () { /* keep the new-tab behaviour */ });

  document.addEventListener('click', function (event) {
    const link = event.target && event.target.closest ? event.target.closest('#newsisSafetyVideo') : null;
    if (!link || embedAllowed) return;
    event.stopImmediatePropagation();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }, true);

  if (!host) return;
  document.addEventListener('securitypolicyviolation', function (event) {
    if (!/youtube/i.test(event.blockedURI || '')) return;
    host.textContent = '';
    host.style.display = 'flex';
    host.style.alignItems = 'center';
    host.style.justifyContent = 'center';
    const note = document.createElement('p');
    note.className = 'newsis-video-blocked';
    note.style.cssText = 'margin:0;padding:24px;color:#e8f0f1;font-size:14px;line-height:1.7;text-align:center;word-break:keep-all';
    note.textContent = '이 화면에서는 영상을 바로 재생할 수 없습니다. 아래 “유튜브에서 보기”로 이어서 시청해 주세요.';
    host.append(note);
  });
}());
