
## Deploy to Vercel (Step-by-step)
1) สร้าง repository ใหม่บน GitHub ชื่อเช่น `solink-web`
2) ในเครื่องคุณรัน:
```bash
cd solink-landing-plus-dashboard
git init
git add .
git commit -m "Initial: Landing + Mock Dashboard"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/solink-web.git
git push -u origin main
```
3) ไปที่ https://vercel.com → New Project → Import จาก GitHub → เลือก repo `solink-web`
4) กด Deploy (ไม่ต้องตั้ง ENV สำหรับเวอร์ชันนี้)
5) ไปที่ Project → Settings → Domains → ใส่โดเมนของคุณ (เช่น `solink.network` และ `www.solink.network`)
6) ตั้ง DNS ที่ Cloudflare:
```
Type: CNAME   Name: www   Target: cname.vercel-dns.com
Type: CNAME   Name: @     Target: cname.vercel-dns.com   # ใช้ CNAME flattening
```
7) รอ DNS propagate แล้ว https จะขึ้นอัตโนมัติ
