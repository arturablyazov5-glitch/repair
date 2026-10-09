# склейка скриншотов в один лист: python3 sheet.py out.png a.png b.png ...
import sys
from PIL import Image
ims=[Image.open(p) for p in sys.argv[2:]]
W=sum(i.width for i in ims)+10*(len(ims)-1); H=max(i.height for i in ims)
s=Image.new('RGB',(W,H),(255,0,255)); x=0
for i in ims: s.paste(i,(x,0)); x+=i.width+10
s.save(sys.argv[1])
