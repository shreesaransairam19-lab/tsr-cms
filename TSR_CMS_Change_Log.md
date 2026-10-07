# TSR CMS - Complete Change Log

---

## Commit 1: `a90564b` - 2026-08-22
**Light mode: black/gray/teal, profile blue banner removed, dark mode unchanged**
Stats: 2 files changed, 25 insertions(+), 26 deletions(-)

**Modified (2 files):**
- ~ `src/app/(dashboard)/profile/page.tsx`
- ~ `src/app/globals.css`

---

## Commit 2: `94482c3` - 2026-08-22
**Fix: dropdown menu, profile page, navy light mode, dark mode reverted, layout spacing**
Stats: 11 files changed, 190 insertions(+), 55 deletions(-)

**Created (3 files):**
- + `public/favicon.png`
- + `public/logo.png`
- + `src/app/(dashboard)/profile/page.tsx`

**Modified (8 files):**
- ~ `src/app/(auth)/layout.tsx`
- ~ `src/app/(dashboard)/layout.tsx`
- ~ `src/app/api/auth/register/route.ts`
- ~ `src/app/globals.css`
- ~ `src/app/layout.tsx`
- ~ `src/components/layout/header.tsx`
- ~ `src/components/layout/sidebar.tsx`
- ~ `src/components/ui/dropdown-menu.tsx`

---

## Commit 3: `ce81ba3` - 2026-08-22
**Fix logout: plain link nav, GET+POST handlers, Supabase signOut, 302 redirect**
Stats: 3 files changed, 30 insertions(+), 35 deletions(-)

**Modified (3 files):**
- ~ `src/app/api/auth/logout/route.ts`
- ~ `src/components/layout/header.tsx`
- ~ `src/components/layout/sidebar.tsx`

---

## Commit 4: `abca2f0` - 2026-08-22
**Fix: Sidebar logout onClick, favicon, better error handling**
Stats: 2 files changed, 12 insertions(+), 1 deletion(-)

**Modified (2 files):**
- ~ `src/app/layout.tsx`
- ~ `src/components/layout/sidebar.tsx`

---

## Commit 5: `27c3c03` - 2026-08-22
**Add subjects management page + API route + sidebar link**
Stats: 3 files changed, 374 insertions(+)

**Created (2 files):**
- + `src/app/(dashboard)/subjects/page.tsx`
- + `src/app/api/subjects/route.ts`

**Modified (1 files):**
- ~ `src/components/layout/sidebar.tsx`

---

## Commit 6: `0717e02` - 2026-08-22
**Fix: Robust auth (try-catch), handle missing tables gracefully, add favicon**
Stats: 3 files changed, 54 insertions(+), 30 deletions(-)

**Created (1 files):**
- + `public/favicon.svg`

**Modified (2 files):**
- ~ `src/app/api/payroll/route.ts`
- ~ `src/lib/auth-helpers.ts`

---

## Commit 7: `a32a118` - 2026-08-22
**Fix: Logout clears Supabase cookies via Set-Cookie headers directly**
Stats: 2 files changed, 29 insertions(+), 50 deletions(-)

**Modified (2 files):**
- ~ `src/app/api/auth/logout/route.ts`
- ~ `src/components/layout/header.tsx`

---

## Commit 8: `20740f5` - 2026-08-21
**Fix: Bulletproof logout - clear all cookies client+server + force redirect**
Stats: 2 files changed, 26 insertions(+), 8 deletions(-)

**Modified (2 files):**
- ~ `src/app/api/auth/logout/route.ts`
- ~ `src/components/layout/header.tsx`

---

## Commit 9: `1109ca4` - 2026-08-21
**Fix: Logout now properly clears cookies and redirects to login**
Stats: 4 files changed, 42 insertions(+), 26 deletions(-)

**Modified (4 files):**
- ~ `capacitor-web/index.html`
- ~ `capacitor.config.json`
- ~ `src/app/api/auth/logout/route.ts`
- ~ `src/components/layout/header.tsx`

---

## Commit 10: `57a1d8b` - 2026-08-21
**Fix: Quick Actions now navigate to correct pages**
Stats: 3 files changed, 35 insertions(+), 11 deletions(-)

**Created (1 files):**
- + `capacitor-web/index.html`

**Modified (2 files):**
- ~ `capacitor.config.json`
- ~ `src/app/(dashboard)/dashboard-content.tsx`

---

## Commit 11: `a823b89` - 2026-08-21
**Security + dark theme + Capacitor + chart fix**
Stats: 1 file changed, 1 insertion(+), 1 deletion(-)

**Modified (1 files):**
- ~ `src/app/(dashboard)/exams/results/page.tsx`

---

## Commit 12: `13dbbab` - 2026-08-21
**Security: Add auth to all 31 API routes + dark theme + Capacitor config**
Stats: 32 files changed, 406 insertions(+), 173 deletions(-)

**Created (1 files):**
- + `src/lib/auth-helpers.ts`

**Modified (31 files):**
- ~ `src/app/api/attendance/report/route.ts`
- ~ `src/app/api/attendance/route.ts`
- ~ `src/app/api/documents/route.ts`
- ~ `src/app/api/documents/upload/route.ts`
- ~ `src/app/api/exams/results/route.ts`
- ~ `src/app/api/exams/route.ts`
- ~ `src/app/api/export/google-sheets/route.ts`
- ~ `src/app/api/faculty/[id]/route.ts`
- ~ `src/app/api/faculty/route.ts`
- ~ `src/app/api/fees/collect/route.ts`
- ~ `src/app/api/fees/receipt/[id]/route.ts`
- ~ `src/app/api/fees/route.ts`
- ~ `src/app/api/fees/structure/route.ts`
- ~ `src/app/api/hostel/allocate/route.ts`
- ~ `src/app/api/hostel/route.ts`
- ~ `src/app/api/import/google-sheets/route.ts`
- ~ `src/app/api/library/books/route.ts`
- ~ `src/app/api/library/issue/route.ts`
- ~ `src/app/api/notifications/route.ts`
- ~ `src/app/api/notifications/send/route.ts`
- ~ `src/app/api/payroll/route.ts`
- ~ `src/app/api/reports/route.ts`
- ~ `src/app/api/settings/departments/route.ts`
- ~ `src/app/api/settings/email/route.ts`
- ~ `src/app/api/settings/email/test/route.ts`
- ~ `src/app/api/settings/programs/route.ts`
- ~ `src/app/api/settings/route.ts`
- ~ `src/app/api/students/[id]/route.ts`
- ~ `src/app/api/students/route.ts`
- ~ `src/app/api/transport/allocate/route.ts`
- ~ `src/app/api/transport/route.ts`

---

## Commit 13: `94971d6` - 2026-08-21
**TSR CMS: College Management System with dark theme + Capacitor config**
Stats: 148 files changed, 37612 insertions(+)

---

## Totals
- Commits: 13
- Files created: 8
- Files modified: 46
- Unique files touched: 51