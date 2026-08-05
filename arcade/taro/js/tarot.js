const cardOrder = ['fool','magician','priestess','emperor','justice','hermit','fortune','tower','star','sun'];
export const normalizePair = ids => [...ids].sort((a, b) => cardOrder.indexOf(a) - cardOrder.indexOf(b)).join('-');

export function createTarotEngine(cards, results) {
  const byId = new Map(cards.map(card => [card.id, card]));
  return {
    cards,
    getCard: id => byId.get(id),
    getResult(ids) {
      if (ids.length !== 2) throw new Error('두 장의 카드가 필요합니다.');
      const result = results[normalizePair(ids)];
      if (!result) throw new Error(`해석을 찾을 수 없습니다: ${normalizePair(ids)}`);
      return result;
    }
  };
}
