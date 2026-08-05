const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function typeSequence(element, lines, { speed = 46, pause = 800 } = {}) {
  element.textContent = '';
  element.classList.add('is-typing');
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (reduceMotion) {
      element.textContent += `${line}${lineIndex < lines.length - 1 ? '\n' : ''}`;
    } else {
      for (const character of line) {
        element.textContent += character;
        await wait(speed);
      }
      if (lineIndex < lines.length - 1) {
        element.textContent += '\n';
        await wait(pause);
      }
    }
  }
  element.classList.remove('is-typing');
}

export const delay = ms => reduceMotion ? Promise.resolve() : wait(ms);
