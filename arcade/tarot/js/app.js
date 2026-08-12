import { createTarotEngine } from './tarot.js';
import { delay } from './dialog.js';
import { selectArticle, renderArticle } from './article.js';
import { renderDeck, renderChosen, renderReading, showScene } from './ui.js';
import { playPlace } from './sound.js';

const $ = selector => document.querySelector(selector);
const elements = { intro:$('#intro'), reading:$('#reading'), result:$('#result'), enter:$('#enterButton'), candle:$('.intro-candle'), grid:$('#cardGrid'), count:$('#selectionCount'), reveal:$('#revealButton'), title:$('#resultTitle'), text:$('#resultText'), chosen:$('#chosenCards'), articleFace:$('#articleFace'), restart:$('#restartButton'), share:$('#shareButton'), toast:$('#toast'), date:$('#resultDate') };

async function loadData() {
  const [cardsResponse, resultsResponse, fallbackResponse] = await Promise.all(['cards','results','articles'].map(path => fetch(`./data/${path}.json`)));
  if (![cardsResponse, resultsResponse, fallbackResponse].every(response => response.ok)) throw new Error('데이터를 불러오지 못했습니다.');
  const [cards, results, fallback] = await Promise.all([cardsResponse.json(), resultsResponse.json(), fallbackResponse.json()]);
  try {
    const response = await fetch('../data/editshop-articles.json', { cache:'no-store' });
    const data = await response.json();
    return [cards, results, Array.isArray(data.articles) && data.articles.length ? data.articles : fallback];
  } catch { return [cards, results, fallback]; }
}

let engine, articles, selected = [], shuffledCards = [], currentArticle;

function shuffleCards(cards) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function updateDeck() {
  renderDeck(elements.grid, shuffledCards, selected, toggleCard);
  elements.count.textContent = selected.length;
  elements.reveal.disabled = selected.length !== 2;
}

function toggleCard(id) {
  selected = selected.includes(id) ? selected.filter(value => value !== id) : selected.length < 2 ? [...selected,id] : selected;
  playPlace(); updateDeck();
}

async function enterReading() {
  shuffledCards = shuffleCards(engine.cards);
  updateDeck();
  elements.candle.classList.add('is-disturbed');
  await delay(500); showScene(elements.intro, elements.reading);
  await delay(900);
  elements.grid.querySelector('button')?.focus({ preventScroll:true });
}

async function revealResult() {
  const reading = engine.getResult(selected);
  const chosenCards = selected.map(id => engine.getCard(id));
  currentArticle = selectArticle(articles);
  renderChosen(elements.chosen, chosenCards);
  elements.title.textContent = reading.title;
  renderReading(elements.text, chosenCards, reading);
  elements.articleFace.innerHTML = renderArticle(currentArticle);
  elements.date.textContent = new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric'}).format(new Date());
  showScene(elements.reading, elements.result);
}

function restart() {
  selected = [];
  shuffledCards = shuffleCards(engine.cards);
  updateDeck();
  showScene(elements.result, elements.reading);
}

async function share() {
  const payload = { title: '충무로 타로#', text: elements.title.textContent, url: location.href };
  try {
    if (navigator.share) await navigator.share(payload); else await navigator.clipboard.writeText(location.href);
    elements.toast.textContent = navigator.share ? '공유 창을 열었습니다.' : '링크를 복사했습니다.';
  } catch (error) { if (error.name !== 'AbortError') elements.toast.textContent = '주소창의 링크를 복사해 주세요.'; }
  setTimeout(() => { elements.toast.textContent = ''; }, 2500);
}

elements.enter.addEventListener('click', enterReading);
elements.reveal.addEventListener('click', revealResult);
elements.restart.addEventListener('click', restart);
elements.share.addEventListener('click', share);

try {
  const [cards, results, loadedArticles] = await loadData();
  engine = createTarotEngine(cards, results); articles = loadedArticles;
  shuffledCards = shuffleCards(engine.cards);
  updateDeck();
} catch (error) {
  console.error(error); elements.enter.disabled = true; elements.enter.querySelector('span').textContent = '잠시 후 다시 시도해 주세요';
}
