"""Offline geometry QA, reading the actual production mesh (not a face image)."""
import json,math
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
root=Path(__file__).parent
data=json.loads((root/'head-geometry.json').read_text())
W,H=340,410
sheet=Image.new('RGB',(W*4,H*3),(38,44,46))
for row,meshes in enumerate(data):
 for col,angle in enumerate([0,math.pi/4,math.pi/2,math.pi]):
  buf=np.empty((H,W,3));buf[:]=np.array([.115,.135,.145]);zbuf=np.full((H,W),-1e9)
  co,si=math.cos(angle),math.sin(angle);rot=np.array([[co,0,-si],[0,1,0],[si,0,co]])
  light=np.array([-.45,.65,.75]);light/=np.linalg.norm(light)
  for mesh in meshes:
   p=np.array(mesh['positions']).reshape(-1,3)@rot.T;n=np.array(mesh['normals']).reshape(-1,3)@rot.T;color=np.array(mesh['colors']).reshape(-1,3)
   # Two-sided surface convention, identical to the production scalp/skull material.
   n=np.where(n[:,2:3]<0,-n,n);lit=.43+.57*np.clip(n@light,0,1);rgb=np.clip(color*lit[:,None],0,1)
   screen=np.column_stack([p[:,0]*1100+W/2,-p[:,1]*1100+H*.43,p[:,2]])
   for face in np.array(mesh['indices']).reshape(-1,3):
    tri=screen[face];xmin=max(0,int(np.floor(tri[:,0].min())));xmax=min(W-1,int(np.ceil(tri[:,0].max())));ymin=max(0,int(np.floor(tri[:,1].min())));ymax=min(H-1,int(np.ceil(tri[:,1].max())))
    if xmin>xmax or ymin>ymax:continue
    x0,y0,z0=tri[0];x1,y1,z1=tri[1];x2,y2,z2=tri[2];den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
    if abs(den)<1e-8:continue
    yy,xx=np.mgrid[ymin:ymax+1,xmin:xmax+1];xx=xx+.5;yy=yy+.5
    a=((y1-y2)*(xx-x2)+(x2-x1)*(yy-y2))/den;b=((y2-y0)*(xx-x2)+(x0-x2)*(yy-y2))/den;c=1-a-b;z=a*z0+b*z1+c*z2
    sub=zbuf[ymin:ymax+1,xmin:xmax+1];mask=(a>=0)&(b>=0)&(c>=0)&(z>sub)
    if not mask.any():continue
    sub[mask]=z[mask];shaded=a[...,None]*rgb[face[0]]+b[...,None]*rgb[face[1]]+c[...,None]*rgb[face[2]];view=buf[ymin:ymax+1,xmin:xmax+1];view[mask]=shaded[mask]
  # Convert linear lighting to sRGB for a legible neutral studio preview.
  buf=np.where(buf<=.0031308,buf*12.92,1.055*np.maximum(buf,0)**(1/2.4)-.055)
  img=Image.fromarray((np.clip(buf,0,1)*255).astype('uint8'));draw=ImageDraw.Draw(img);draw.text((14,14),['FRONT','3/4','PROFILE','BACK'][col],fill=(235,231,218));sheet.paste(img,(col*W,row*H))
 sheet.save(root/'mesh-turnaround.png')
 print('rendered',row+1,flush=True)
