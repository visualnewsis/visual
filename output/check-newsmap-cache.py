import urllib.request,re,json,time
base='https://visual.newsis.com/newsmap/'
for u in [base,base+'?verify='+str(time.time_ns()),base+'data/articles.js?v='+str(time.time_ns())]:
    with urllib.request.urlopen(urllib.request.Request(u,headers={'Cache-Control':'no-cache'}),timeout=25) as response:
        s=response.read().decode('utf-8')
        headers={k:v for k,v in response.headers.items() if k.lower() in ['cache-control','age','etag','last-modified','server','x-cache']}
    if 'articles.js' in u:
        d=json.loads(s.split('=',1)[1].strip().rstrip(';'))
        details={'policy':d.get('policyVersion'),'international':sum(a.get('newsCategory')=='국제' or 'international' in a.get('feeds',[]) for a in d['articles'])}
    else:
        details={'categories':re.findall(r'data-category="([^"]*)"',s),'scripts':re.findall(r'src="((?:app|core)\.js[^\"]*)"',s)}
    print(json.dumps({'url':u,'headers':headers,**details},ensure_ascii=False))
