from pathlib import Path
exec(Path(__file__).with_name('escapement-prototype.py').read_text().split("if __name__")[0])
# Published geometric construction, not the old arbitrary star mesh.
v=polar(1,204);t=-v[0]-math.sqrt(v[0]**2-(1-.8*.8));tooth[0]=np.array([1,0])+t*v
js=jewels(-32.77514594473319);O=F+polar(rO,-148.125);js[0][2]+=O-js[0][1];js[0][1]=O
for k,(ang,bank)in enumerate([(132,BANK),(48,-BANK)]):
 M,E=js[k][:2];Q=rot(polar(.14,ang),-bank);js[k]=np.array([M,E,E+Q,M+Q])
L=D;rp=L*math.sin(math.radians(4.875/2));w=L*math.sin(math.radians(5.125/2));r=L*10.25/28;d=r*math.cos(math.radians(14))+r*math.sin(math.radians(14))/math.tan(BANK)
horns=[]
outerRadius=r+rp+.001
BX=-d*math.sin(BANK);BZ=d*math.cos(BANK)
for sign in [-1,1]:
 points=[[sign*w,1.02]]
 for x in np.linspace(w,.24,65):
  z=BZ-math.sqrt(max(0,outerRadius*outerRadius-(x-BX)**2))
  points.append([sign*x,z])
 points.append([sign*.24,1.02]);horns.append(np.array(points))
circle=np.array([polar(rp,i*360/64)for i in range(64)])
def sep1(A,B):
 best=-1e9
 for poly in [A,B]:
  for edge in np.roll(poly,-1,axis=0)-poly:
   ax=np.array([-edge[1],edge[0]]);ax/=np.linalg.norm(ax);a=A@ax;b=B@ax;best=max(best,b.min()-a.max(),a.min()-b.max())
 return best
def pinpos(beta):return np.array([0.,d])+rot([0,-r],beta)
def pclear(beta,a):
 point=rot(pinpos(beta),-a);result=100.
 for h in horns:
  A=h;B=np.roll(h,-1,axis=0);edge=B-A
  u=np.clip(np.einsum('ij,ij->i',point-A,edge)/np.einsum('ij,ij->i',edge,edge),0,1)
  best=np.linalg.norm(point-A-u[:,None]*edge,axis=1).min()
  inside=False
  for av,bv in zip(A,B):
   if (av[1]>point[1])!=(bv[1]>point[1]) and point[0]<(bv[0]-av[0])*(point[1]-av[1])/(bv[1]-av[1])+av[0]:inside=not inside
  result=min(result,(-best if inside else best)-rp)
 return result
def limits(beta):
 xs=np.linspace(-BANK,BANK,721);vals=[pclear(beta,a)for a in xs]
 free=[i for i,v in enumerate(vals)if v>=-1e-8]
 if not free:return None
 return (math.degrees(xs[min(free)]),math.degrees(xs[max(free)]))
if __name__=='__main__':
 print('pin',r,rp,w,d)
 for beta in [-.85,-.7,-.6,-.5,-.4,-.3,-.25,-.2,-.1,0,.1,.2,.25,.3,.4,.5,.6,.7,.85]:print(beta,limits(beta))