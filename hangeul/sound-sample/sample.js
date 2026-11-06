const slider = document.querySelector('#slider');
const compare = document.querySelector('#compare');
const show = value => {
  slider.value = value;
  document.querySelector('.label-a').style.opacity = value < 12 ? '0' : '1';
  document.querySelector('.label-b').style.opacity = value > 88 ? '0' : '1';
  compare.style.setProperty('--split', `${value}%`);
  slider.setAttribute('aria-valuetext', `보글보글 ${value}%, 부글부글 ${100 - Number(value)}%`);
};
slider.addEventListener('input', () => show(slider.value));
document.querySelectorAll('[data-value]').forEach(button => {
  button.addEventListener('click', () => show(button.dataset.value));
});
show(slider.value);


