from pathlib import Path
root=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=root/'goodeasy/piano/piano.js'
s=p.read_text(encoding='utf-8')
old="  window.dispatchEvent(new Event('piano:ready'));"
new="""  // Carry only bounded pitch/duration from the landing. Never play audio on navigation.
  const landingParams = new URLSearchParams(location.search);
  const landingPitch = Number(landingParams.get('landing-note'));
  const landingDuration = Number(landingParams.get('duration'));
  if (landingParams.has('landing-note') && Number.isInteger(landingPitch) && landingPitch>=60 && landingPitch<=76) {
    last = {midi:landingPitch, start:performance.now()-300, duration:Number.isFinite(landingDuration)?Math.max(100,Math.min(1800,landingDuration)):250};
    refreshContext();
    $('context-copy').textContent = `모음 화면에서 누른 ${noteName(landingPitch)}입니다. 재생 버튼을 누르면 안쪽 움직임을 볼 수 있습니다.`;
    $('replay-status').textContent = '모음 화면에서 연주한 음을 이어받았습니다.';
  }
  window.dispatchEvent(new Event('piano:ready'));"""
assert s.count(old)==1
p.write_text(s.replace(old,new),encoding='utf-8')
p=root/'goodeasy/piano/index.html';s=p.read_text(encoding='utf-8');s=s.replace('piano.js?v=20261024-2','piano.js?v=20261025-landing1');p.write_text(s,encoding='utf-8')
(root/'goodeasy/assets/landing-image-credit.txt').write_text('landing-piano.png: AI-generated illustrative artwork for the GOODEASY landing, 2026-10-25. Not a news photograph or a mechanically validated diagram. Portal first image remains the separately licensed real photo in piano/images/piano-photo.jpg.\n',encoding='utf-8')
print('Landing note handoff added without autoplay; existing piano interaction retained.')
