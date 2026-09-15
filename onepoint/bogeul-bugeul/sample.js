const slider = document.querySelector('#slider');
const compare = document.querySelector('#compare');
const hint = document.querySelector('.slide-hint');
const labelA = document.querySelector('.label-a');
const labelB = document.querySelector('.label-b');
const nameA = labelA.textContent.trim();
const nameB = labelB.textContent.trim();
const show = value => {
  slider.value = value;
  labelA.style.opacity = value < 12 ? '0' : '1';
  labelB.style.opacity = value > 88 ? '0' : '1';
  compare.style.setProperty('--split', `${value}%`);
  slider.setAttribute('aria-valuetext', `${nameA} ${value}%, ${nameB} ${100 - Number(value)}%`);
};
const hideHint = () => { if (hint) hint.classList.add('is-hidden'); };
slider.addEventListener('input', () => { show(slider.value); hideHint(); });
slider.addEventListener('pointerdown', hideHint, { once: true });
document.querySelectorAll('[data-value]').forEach(button => {
  button.addEventListener('click', () => { show(button.dataset.value); hideHint(); });
});
show(slider.value);
