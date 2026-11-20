# سفراء الطيب — واجهة Angular

واجهة موقع **سفراء الطيب** (Angular 22، Standalone Components، Signals، RTL/LTR).
تعمل مع الـ API الموجود في `SafaratAlteeb` (ASP.NET Core).

## التشغيل المحلي

المتطلبات: Node.js 20.19+ (أو 22) و npm.

```bash
npm install
npm start          # = ng serve  → http://localhost:4200
```

1. شغّل الـ API أولاً بالـ profile `http` (المنفذ `http://localhost:5231`).
2. تأكد أن `appsettings.Development.json` فيه:
   ```json
   "App":  { "FrontendUrl": "http://localhost:4200" },
   "Cors": { "AllowedOrigins": [ "http://localhost:4200" ] }
   ```
   (روابط تفعيل الحساب واستعادة كلمة المرور في الإيميلات تفتح `/confirm-email?token=` و `/reset-password?token=` في هذا الموقع).
3. إذا شغّلت الـ API على منفذ آخر (مثلاً https 7044) عدّل `src/environments/environment.ts`.

## الصور
ضع صور مزارع الورد (جازان / نجران) في `public/images/` بنفس الأسماء الموجودة في `public/images/README.txt`.
إذا لم توجد الصور يعرض الموقع رسمة مزرعة الورد المرفقة (`rose-valley.svg`).

## الهيكل
```
src/app
├─ core/        api, auth (tokens + refresh), interceptor, guards, i18n (+dictionary.ts), date (توقيت السعودية + الهجري)
├─ shared/ui.ts مكونات مشتركة (modal, pagination, field, badges, toasts, confirm…)
├─ layout/      public-layout, auth-layout, app-layout (القائمة حسب الصلاحيات)
└─ features/
   ├─ public/   الرئيسية، الفعاليات، تفاصيل وحجز، حجزي (إلغاء/تقييم)، المجتمع
   ├─ auth/     دخول، تسجيل، تفعيل، نسيت/استعادة كلمة المرور، تغيير إجباري
   └─ app/      لوحة التحكم: مستخدمون وصلاحيات، برامج وجلسات، ورش، فعاليات، إعدادات،
                تصفح/تسجيلاتي، جلساتي، الحضور والمواد والتقييمات
```

* القائمة والصفحات تظهر حسب `permissions` القادمة من الـ API (نفس أكواد `PermissionCodes`).
* كل النصوص في `core/dictionary.ts` (عربي/إنجليزي) والتبديل من زر اللغة.
* التواريخ تُعرض بتوقيت السعودية (ميلادي + هجري للفعاليات) وتُرسل للـ API بصيغة UTC.
