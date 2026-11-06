import urllib.request,re,concurrent.futures,json
ids=['NISX20261103_0003852541','NISX20261103_0003852381','NISX20261102_0003850094','NISX20261103_0003852303']
def probe(identifier):
    with urllib.request.urlopen('https://www.newsis.com/view/'+identifier,timeout=15) as response:s=response.read().decode('utf-8',errors='replace')
    meta=[x for x in re.findall(r'<meta\b[^>]*>',s,re.I) if re.search(r'category|section|type|article:|parsely|dable|title',x,re.I)]
    candidates=[s[max(0,m.start()-65):m.end()+130] for m in re.finditer(r'categoryId|article_cate|news_category|cateId|sectionCode|articleSection|breadcrumb',s,re.I)][:12]
    return {'id':identifier,'meta':meta,'classificationFragments':candidates}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for result in pool.map(probe,ids):print(json.dumps(result,ensure_ascii=False))
