import sys,glob,os
from PIL import Image, ImageDraw
d,out,cols,stride,W=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4]),int(sys.argv[5])
fs=sorted(glob.glob(d+"/*.png"))[::stride]
ims=[]
for f in fs:
    im=Image.open(f).convert("RGB"); h=int(im.height*W/im.width); im=im.resize((W,h))
    ImageDraw.Draw(im).text((4,h-12),os.path.basename(f)[:-4],fill=(200,0,0)); ims.append(im)
rows=(len(ims)+cols-1)//cols; H=ims[0].height
sheet=Image.new("RGB",(cols*W+(cols-1)*3,rows*H+(rows-1)*3),(60,60,60))
for i,im in enumerate(ims): sheet.paste(im,((i%cols)*(W+3),(i//cols)*(H+3)))
sheet.save(out)
