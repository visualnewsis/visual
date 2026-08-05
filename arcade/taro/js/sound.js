let context;
function tone(frequency, duration, volume = .025) {
  try {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + duration);
  } catch { /* Sound is enhancement only. */ }
}
export const playPlace = () => tone(170, .12, .018);
export const playFlip = () => { tone(523.25, .7); setTimeout(() => tone(783.99, .9, .014), 110); };
