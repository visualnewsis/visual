/* A fixed remembrance moment, not a live clock. No location permission or storage. */
(() => {
  'use strict';
  const cities = {
    seoul: {name: '서울', lat: 37.5665, lon: 126.9780, zone: 'Asia/Seoul'},
    gwangju: {name: '광주', lat: 35.1595, lon: 126.8526, zone: 'Asia/Seoul'},
    jeju: {name: '제주', lat: 33.4996, lon: 126.5312, zone: 'Asia/Seoul'},
    london: {name: '런던', lat: 51.5074, lon: -0.1278, zone: 'Europe/London'},
    ottawa: {name: '오타와', lat: 45.4215, lon: -75.6972, zone: 'America/Toronto'},
    canberra: {name: '캔버라', lat: -35.2809, lon: 149.1300, zone: 'Australia/Sydney'}
  };
  const moment = new Date('2026-11-11T02:00:00Z');
  const target = {lat: 35.128, lon: 129.097}; // UNMCK, rounded for a directional illustration.
  const radians = degrees => degrees * Math.PI / 180;
  function updateCity() {
    const city = cities[document.getElementById('from-city').value];
    const a = radians(city.lat), b = radians(target.lat), delta = radians(target.lon - city.lon);
    const bearing = (Math.atan2(Math.sin(delta) * Math.cos(b), Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(delta)) * 180 / Math.PI + 360) % 360;
    const directions = ['북쪽', '북북동쪽', '북동쪽', '동북동쪽', '동쪽', '동남동쪽', '남동쪽', '남남동쪽', '남쪽', '남남서쪽', '남서쪽', '서남서쪽', '서쪽', '서북서쪽', '북서쪽', '북북서쪽'];
    document.getElementById('selected-city').textContent = city.name;
    document.getElementById('origin-label').textContent = city.name;
    document.getElementById('bearing-label').textContent = directions[Math.round(bearing / 22.5) % 16];
    document.getElementById('direction-arrow').setAttribute('transform', `rotate(${bearing.toFixed(2)} 180 160)`);
    const parts = new Intl.DateTimeFormat('ko-KR', {timeZone: city.zone, month: 'numeric', day: 'numeric', hour: 'numeric', hour12: true}).formatToParts(moment);
    const part = type => parts.find(item => item.type === type).value;
    const local = `${part('month')}월 ${part('day')}일 ${part('dayPeriod')} ${part('hour')}시`;
    document.getElementById('local-moment').textContent = `부산의 2026년 11월 11일 오전 11시, ${city.name}에서는 ${local}입니다.`;
    const finding = city.zone === 'Asia/Seoul'
      ? '한국에서는 날짜와 시각이 같습니다.'
      : city.name === '오타와'
        ? '부산의 묵념 시각은 오타와의 전날 밤 9시와 같은 순간입니다.'
        : `${city.name}의 현지 시각으로 환산한 값입니다.`;
    document.getElementById('moment-discovery').textContent = finding;
  }
  // Reveal controls only after all required browser time-zone calculations have succeeded.
  try {
    updateCity();
    document.querySelector('.city-controls').hidden = false;
    document.getElementById('from-city').addEventListener('change', updateCity);
  } catch (_) {
    document.getElementById('moment-discovery').textContent = '부산의 오전 11시는 런던의 11일 오전 2시, 오타와의 10일 오후 9시, 캔버라의 11일 오후 1시와 같은 순간입니다.';
  }
  const panels = [...document.querySelectorAll('.record-panel')];
  const buttons = [...document.querySelectorAll('[data-record]')];
  function selectRecord(value) {
    panels.forEach(panel => { panel.hidden = value !== 'all' && panel.id !== value; });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.record === value)));
  }
  if (panels.length === 3 && buttons.length === 4) {
    selectRecord('all');
    document.querySelector('.record-controls').hidden = false;
    buttons.forEach(button => button.addEventListener('click', () => selectRecord(button.dataset.record)));
  }
})();
