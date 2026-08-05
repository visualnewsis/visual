export function selectArticle(articles) {
  return articles[Math.floor(Math.random() * articles.length)];
}

export function renderArticle(article) {
  return `<a class="editorial-story" href="${article.url}">
    <span class="editorial-story__image" style="background-image:linear-gradient(90deg,transparent,rgba(0,0,0,.12)),url('${article.image}')" aria-hidden="true"></span>
    <span class="editorial-story__copy"><span class="article-category">${article.issue} · ${article.label}</span><strong>${article.title}</strong><p>${article.description}</p><span class="article-link">인터랙티브 기사 읽기 <i aria-hidden="true">↗</i></span></span>
  </a>`;
}
