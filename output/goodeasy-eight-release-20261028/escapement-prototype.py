import numpy as np,math
D=1/math.cos(math.pi/6);F=np.array([0.,D]);BANK=math.radians(5.125);PITCH=math.pi*2/15
def rot(P,a):
 c,s=math.cos(a),math.sin(a);return np.asarray(P)@np.array([[c,s],[-s,c]])
def polar(r,a):return np.array([r*math.cos(math.radians(a)),r*math.sin(math.radians(a))])
def about(p,a):return F+rot(p-F,a)
CL=polar(1,120);CR=polar(1,60);ML=about(CL,math.radians(-3.375));NR=about(CR,math.radians(3.375))
rO=np.linalg.norm(polar(1,114)-F);rP=np.linalg.norm(polar(1,54)-F)
def jewels(pa=-33.0,lsign=1,rsign=-1):
 O=F+polar(rO,-147.875);P=F+polar(rP,pa)
 out=[]
 for M,E,bank,sign in [(ML,O,BANK,lsign),(NR,P,-BANK,rsign)]:
  locked=about(M,bank);a=math.atan2(locked[1],locked[0])+sign*math.radians(12)
  Q=rot(np.array([math.cos(a),math.sin(a)])*.14,-bank)
  out.append(np.array([M,E,E+Q,M+Q]))
 return out
R=1.0302576454766943
tooth=np.array([polar(.8,-7.1),[1,0],polar(R,4.5),polar(.8,9)])
def wheel(angles):
 a=np.asarray(angles)[:,None]+np.arange(15)[None,:]*PITCH;c=np.cos(-a);s=np.sin(-a);x=tooth[:,0];y=tooth[:,1]
 return np.stack([c[:,:,None]*x-s[:,:,None]*y,s[:,:,None]*x+c[:,:,None]*y],axis=-1)
def separation(W,S):
 edges=np.roll(W,-1,axis=2)-W;axes=np.stack([-edges[:,:,:,1],edges[:,:,:,0]],axis=-1);axes/=np.linalg.norm(axes,axis=-1)[:,:,:,None]
 seps=[]
 for j in range(4):
  ax=axes[:,:,j];aw=np.einsum('ntvd,ntd->ntv',W,ax);bw=np.einsum('vd,ntd->ntv',S,ax)
  seps.append(np.maximum(bw.min(-1)-aw.max(-1),aw.min(-1)-bw.max(-1)))
 for e in np.roll(S,-1,axis=0)-S:
  ax=np.array([-e[1],e[0]]);ax/=np.linalg.norm(ax);aw=W@ax;bw=S@ax
  seps.append(np.maximum(bw.min()-aw.max(-1),aw.min(-1)-bw.max()))
 return np.max(seps,axis=0).min(-1)
def metric(angles,a,js):
 W=wheel(angles);return np.minimum(*[separation(W,about(j,a)) for j in js])
def edges(js,a):
 angles=np.linspace(-PITCH,PITCH*2,1441);v=metric(angles,a,js);roots=[]
 for i in range(len(v)-1):
  if v[i]>=0 and v[i+1]<0:
   l,h=angles[i:i+2]
   for _ in range(30):
    mid=(l+h)/2
    if metric([mid],a,js)[0]>=0:l=mid
    else:h=mid
   roots.append((l+h)/2)
 return [round(math.degrees(x),5)for x in roots]
if __name__=='__main__':
 print('M,N',ML,NR,'rO,rP',rO,rP)
 for pa in [-39,-36,-33,-30,-27]:
  for signs in [(1,-1),(-1,1),(1,1),(-1,-1)]:
   js=jewels(pa,*signs)
   print('Pangle',pa,'sign',signs,'banks',edges(js,BANK),edges(js,0),edges(js,-BANK))