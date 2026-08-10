# Campus Lost & Found

Kampüs için ortak Lost & Found web uygulaması (Next.js + Supabase).

- **Student 1** (`student1` branch) → Report & Manage: login, item report, my listings, received claims
- **Student 2** (`student2` branch) → Discover & Claim: browse, search/filter, item detail, claim gönderme, sent claims

## Kurulum

```bash
npm install
cp .env.example .env.local   # Supabase Project URL + anon key'i doldur
npm run dev
```

`supabase/migrations/` altındaki dosyaları sırasıyla Supabase projesinin SQL Editor'ünde bir kez çalıştırın (tablolar + RLS + storage bucket).

Open [http://localhost:3000](http://localhost:3000).

## Branch workflow

Git branch/merge akışı için Group Project Cheat Sheet'i takip edin: her öğrenci kendi branch'inde çalışır, `main`'e doğrudan push yapılmaz, proje bitince PR + review + merge yapılır.
