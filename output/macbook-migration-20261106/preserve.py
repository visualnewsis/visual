"""Explicit migration inventory/snapshots. Never changes the user's index or working branch."""
import hashlib, json, os, re, subprocess, sys, tempfile, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/macbook-migration-20261106'
GIT = r'C:\Program Files\Git\cmd\git.exe' if os.name == 'nt' else 'git'
BAD_EXT = {'.exe', '.dll', '.pdb', '.pyc', '.log', '.tmp', '.pid'}
SECRET_NAME = re.compile(r'(^|/)(\.env(?:\..*)?|id_rsa|id_ed25519|credentials(?:\.json)?|.*\.(?:pem|p12|pfx|key))$', re.I)
TOKENS = re.compile(rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{35,}|sk-(?:proj-|ant-)?[A-Za-z0-9_-]{32,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|Authorization["\s:]+Bearer\s+[A-Za-z0-9._-]{30,})')

def git(cwd, *args, env=None, data=None):
    return subprocess.check_output([GIT, '-c', 'safe.directory='+str(cwd).replace('\\','/'), '-C', str(cwd), *args], env=env, input=data)

def listing(cwd, *args):
    return [p.decode('utf-8') for p in git(cwd, *args).split(b'\0') if p]

def worktrees():
    result=[]
    for block in git(ROOT,'worktree','list','--porcelain').decode().split('\n\n'):
        lines=block.splitlines()
        if not lines: continue
        p=Path(lines[0][9:])
        if not p.exists(): continue
        result.append({'path':str(p), 'head':git(p,'rev-parse','HEAD').decode().strip(),
                       'source_branch':next((s[7:] for s in lines if s.startswith('branch ')),'DETACHED')})
    return result

def candidates(w, trees):
    cwd=Path(w['path'])
    files=sorted(set(listing(cwd,'diff','--name-only','-z','HEAD') + listing(cwd,'ls-files','--others','--exclude-standard','-z')))
    keep=[]; exclude=[]; alerts=[]
    for name in files:
        p=cwd/name; why=None
        if p.is_dir(): why='nested worktree/directory; preserved separately when registered'
        elif any(cwd in Path(t['path']).parents and (p == Path(t['path']) or Path(t['path']) in p.parents) for t in trees): why='registered worktree; preserved separately'
        elif SECRET_NAME.search(name) or '/.git/' in '/'+name or '/.openai/' in '/'+name: why='credential/local identity filename'
        elif p.suffix.lower() in BAD_EXT: why='reinstallable executable/cache/log'
        elif p.exists() and p.stat().st_size >= 100*1024*1024: why='GitHub file limit'
        if why: exclude.append({'path':name,'reason':why}); continue
        if p.is_file():
            body=p.read_bytes()
            if b'\0' not in body[:8192] and TOKENS.search(body):
                alerts.append({'path':name,'reason':'credential-like content; review without printing value'})
                continue
            if p.suffix.lower()=='.zip':
                try:
                    with zipfile.ZipFile(p) as z:
                        bad=any(SECRET_NAME.search(n.filename) for n in z.infolist())
                        for n in z.infolist():
                            if bad: break
                            if not n.is_dir() and n.file_size<5*1024*1024:
                                b=z.read(n)
                                if b'\0' not in b[:8192] and TOKENS.search(b): bad=True
                        if bad:
                            exclude.append({'path':name,'reason':'archive contains credential-like member/content'}); continue
                except zipfile.BadZipFile:
                    alerts.append({'path':name,'reason':'invalid zip'}); continue
        keep.append(name)
    return keep,exclude,alerts

def prepare():
    OUT.mkdir(parents=True,exist_ok=True)
    trees=worktrees(); items=[]
    for i,w in enumerate(trees):
        keep,exclude,alerts=candidates(w,trees)
        slug='windows' if i==0 else ('dmz-detached' if w['source_branch']=='DETACHED' else w['source_branch'].split('/')[-1])
        w.update(branch='codex/macbook-backup-20261106-'+slug,files=keep,excluded=exclude,alerts=alerts)
        items.append(w)
    (OUT/'inventory.json').write_text(json.dumps({'trees':items},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for w in items:
        print(json.dumps({'branch':w['branch'],'files':len(w['files']),'excluded':len(w['excluded']),'alerts':w['alerts']},ensure_ascii=False))
    if any(w['alerts'] for w in items): sys.exit(2)

def snapshot(cwd, base, files, branch, message):
    fd,index=tempfile.mkstemp(prefix='vn-macbook-index-'); os.close(fd); os.unlink(index)
    env=dict(os.environ,GIT_INDEX_FILE=index)
    try:
        git(cwd,'read-tree',base,env=env)
        if files:
            git(cwd,'--literal-pathspecs','add','-A','--pathspec-from-file=-','--pathspec-file-nul',env=env,data=b'\0'.join(s.encode() for s in files)+b'\0')
        tree=git(cwd,'write-tree',env=env).decode().strip()
        sha=git(cwd,'commit-tree',tree,'-p',base,env=env,data=(message+'\n').encode()).decode().strip()
        # Ref creation only: refuses to replace any existing branch.
        git(ROOT,'update-ref','refs/heads/'+branch,sha,'0'*40)
        return sha
    finally:
        Path(index).unlink(missing_ok=True)

def commit():
    plan=json.loads((OUT/'inventory.json').read_text(encoding='utf-8'))
    if any(w['alerts'] for w in plan['trees']): raise RuntimeError('Unreviewed alerts')
    records=[]
    # Save all working trees, including detached work and already committed heads.
    for w in plan['trees']:
        sha=snapshot(Path(w['path']),w['head'],w['files'],w['branch'],'Preserve Windows work for MacBook migration (not production merge)')
        records.append({'branch':w['branch'],'commit':sha,'files_saved':len(w['files']),'source_branch':w['source_branch']})
        print(w['branch']+' '+sha,flush=True)
    (OUT/'commits.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # Fresh-main work branch includes only this task, without stale shared pages.
    files=[p.relative_to(ROOT).as_posix() for folder in ['output/tongi-demo','output/macbook-migration-20261106'] for p in (ROOT/folder).rglob('*') if p.is_file()]
    base=git(ROOT,'rev-parse','origin/main').decode().strip()
    branch='codex/tongi-macbook-20261106'
    sha=snapshot(ROOT,base,files,branch,'Preserve Tongi landing sample, design reviews and MacBook handoff')
    print(branch+' '+sha,flush=True)

if __name__=='__main__':
    {'prepare':prepare,'commit':commit}[sys.argv[1]]()
