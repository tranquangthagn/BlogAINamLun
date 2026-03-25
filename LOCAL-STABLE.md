# BlogAINamLun Local Stable

## Muc tieu

Day la luong chay local on dinh de kiem tra project sau moi dot sua.

## Dieu kien can

- Python 3.12+ hoac `backend/.venv`
- Node.js cho `frontend`
- MySQL Server 8.0 local neu muon dung `scripts/mysql-sandbox.ps1`
- Gemini key la tuy chon, chi can khi muon smoke 1 preview that

## Lenh nhanh nhat

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-stable.ps1
```

Lenh nay se:

- start MySQL sandbox neu can
- chay `scripts/backend-dev.ps1 doctor`
- chay test backend
- chay migrate backend
- chay `scripts/backend-dev.ps1 smoke`
- chay `frontend` test va build

## Neu muon smoke 1 preview Gemini that

Dam bao `GEMINI_API_KEY` da co trong environment roi chay:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-stable.ps1 -WithGeminiPreview
```

Luot nay se ton 1 call preview co kiem soat.

## Cac lenh backend rieng

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backend-dev.ps1 doctor
powershell -ExecutionPolicy Bypass -File scripts/backend-dev.ps1 migrate
powershell -ExecutionPolicy Bypass -File scripts/backend-dev.ps1 smoke
powershell -ExecutionPolicy Bypass -File scripts/backend-dev.ps1 smoke -RunPreview
```

## Thanh cong trong local nghia la

- `/health` tra `ok`
- `/health/ready` tra `database=ok`
- `PUT /api/automation/settings` chay duoc
- `GET /api/automation/history` chay duoc
- frontend `npm test` pass
- frontend `npm run build` pass

## Ghi chu

- `scripts/backend-dev.ps1` mac dinh dung DB URL sandbox `127.0.0.1:3307` neu ban chua set `DATABASE_URL`
- neu khong muon start sandbox, dung:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-stable.ps1 -SkipSandbox
```
