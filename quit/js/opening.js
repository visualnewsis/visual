/* 오프닝: 무음 자동재생 → 마지막 사직서 봉투 화면에서 제목 등장. 건너뛰기·다시 보기·움직임 줄이기 지원. */
(() => {
  'use strict';
  const box = document.getElementById('opening');
  const video = document.getElementById('openingVideo');
  if (!box || !video) return;
  const skipBtn = document.getElementById('openingSkip');
  const replayBtn = document.getElementById('openingReplay');
  const playBtn = document.getElementById('openingPlay');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const endPoster = box.dataset.endPoster;

  const setState = (state) => { box.dataset.state = state; updateRewind(); };
  // The baked-in reverse sequence runs from 6.55s to the envelope cut at 7.60s.
  const rewindMark = document.getElementById('openingRewind');
  let rewindFrame = null;
  function updateRewind() {
    if (rewindMark) rewindMark.hidden = !(box.dataset.state === 'playing' && video.currentTime >= 6.55 && video.currentTime < 7.60);
  }
  function trackRewind() {
    updateRewind();
    rewindFrame = video.paused || video.ended ? null : requestAnimationFrame(trackRewind);
  }
  video.addEventListener('play', () => {
    if (rewindFrame !== null) cancelAnimationFrame(rewindFrame);
    trackRewind();
  });
  video.addEventListener('pause', () => {
    if (rewindFrame !== null) cancelAnimationFrame(rewindFrame);
    rewindFrame = null;
    updateRewind();
  });
  ['timeupdate', 'seeking', 'ended', 'emptied'].forEach(type => video.addEventListener(type, updateRewind));


  function showEnd() {
    video.pause();
    if (Number.isFinite(video.duration)) video.currentTime = Math.max(0, video.duration - 0.04);
    setState('ended');
  }

  function play() {
    video.currentTime = 0;
    setState('playing');
    const p = video.play();
    if (p && p.catch) p.catch(() => { video.poster = endPoster; setState('blocked'); });
  }

  video.addEventListener('ended', () => setState('ended'));
  skipBtn.addEventListener('click', () => {
    showEnd();
    document.getElementById('openingTitle').focus({ preventScroll: true });
  });
  replayBtn.addEventListener('click', play);
  playBtn.addEventListener('click', play);

  if (reduce.matches) {
    video.removeAttribute('autoplay');
    video.poster = endPoster;
    setState('blocked');
  } else {
    play();
  }

  // 화면 밖으로 나가면 멈추고, 돌아오면 재생 중이던 경우에만 이어서 재생
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (box.dataset.state !== 'playing') return;
      if (entry.isIntersecting) video.play().catch(() => {}); else video.pause();
    }, { threshold: 0.25 }).observe(box);
  }

  // NG컷: 펼친 영상만 재생, 접으면 정지
  document.querySelectorAll('.ng video').forEach((v) => {
    v.addEventListener('play', () => {
      document.querySelectorAll('.ng video').forEach((o) => { if (o !== v) o.pause(); });
    });
  });
  const ng = document.getElementById('ngDetails');
  if (ng) ng.addEventListener('toggle', () => {
    if (!ng.open) ng.querySelectorAll('video').forEach((v) => v.pause());
  });
})();
