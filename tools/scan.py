import glob,os,hashlib,zipfile,json
from PIL import Image, ImageDraw, ImageOps
os.chdir(r"C:\Users\DELL\Downloads\Play School")
files=sorted(glob.glob("*.jpeg")+glob.glob("iLoveZIP_Create (1)/*.jpeg"))
# docx image
z=zipfile.ZipFile("Dear Parents by Prinicipal.docx")
for n in z.namelist():
    if n.startswith("word/media/"):
        open("smart-start/_scratch/docx_"+os.path.basename(n),"wb").write(z.read(n)); print("docx media",n)
files+=sorted(glob.glob("smart-start/_scratch/docx_*"))
info=[]
for i,f in enumerate(files):
    im=Image.open(f); im=ImageOps.exif_transpose(im)
    h=hashlib.md5(open(f,'rb').read()).hexdigest()
    info.append(dict(i=i,f=f,w=im.width,h=im.height,mode=im.mode,fmt=im.format,size=os.path.getsize(f),md5=h))
    print(i,os.path.basename(f),im.width,im.height,im.mode)
json.dump(info,open("smart-start/_scratch/info.json","w"),indent=1)
# contact sheets 12 per sheet (4x3), 400px cells
per=12
for s in range(0,len(files),per):
    sheet=Image.new("RGB",(4*400,3*400),"white");d=ImageDraw.Draw(sheet)
    for k,f in enumerate(files[s:s+per]):
        im=ImageOps.exif_transpose(Image.open(f)).convert("RGB");im.thumbnail((396,376))
        x,y=(k%4)*400,(k//4)*400
        sheet.paste(im,(x+2,y+22));d.text((x+4,y+4),str(s+k),fill="red")
    sheet.save(f"smart-start/_scratch/sheet{s//per}.jpg",quality=80)
print(len(files))
