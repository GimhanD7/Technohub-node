# Implementation Plan: E-Book Approval, Enrolled Students View & Teacher Message Requests

This plan covers three interconnected features:
1. **E-Book Library for Teachers** — with approval/reject workflow and toggleable edit permissions
2. **Enrolled Students View** — per-course student list in teacher & admin dashboards
3. **Teacher Message Requests** — teachers send system messages/reports to admin; admin reviews and takes action

---

## Proposed Changes

### 1. Database Schema Updates

#### [MODIFY] [schema.prisma](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/backend/prisma/schema.prisma)
- Add fields to `ebook_resources`:
  - `approval_status String @default("approved") @db.VarChar(20)`
  - `rejection_reason String? @db.Text`
  - `teacher_editable Boolean @default(false)`
- Add new model `teacher_messages`:
```prisma
model teacher_messages {
  id          Int      @id @default(autoincrement())
  teacher_id  Int
  subject     String   @db.VarChar(255)
  message     String   @db.Text
  category    String   @default("general") @db.VarChar(80)
  status      String   @default("unread") @db.VarChar(20)
  admin_reply String?  @db.Text
  created_at  DateTime @default(now()) @db.Timestamp(0)
  replied_at  DateTime? @db.Timestamp(0)
  users       users    @relation(fields: [teacher_id], references: [id], onDelete: Cascade)
}
```
- Run `npx prisma db push`.

---

### 2. Backend: E-Book Workflow

#### [MODIFY] [ebookController.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/backend/src/controllers/ebookController.js)
- `listEbooks`: filter by `role` (admin=all, teacher=own, public=approved+published). Map `approvalStatus`, `rejectionReason`, `teacherEditable`.
- `createEbook`: teacher → `approval_status='pending'`, `is_published=false`, `teacher_editable=false`. Admin → `approval_status='approved'`, `is_published=true`.
- `updateEbook`: teacher must have `teacher_editable=true` & own resource → revert to pending on save. Admin = unrestricted.
- `deleteEbook`: teacher = own only, admin = unrestricted.
- **New** `approveEbook`: set `approval_status='approved'`, `is_published=true`, clear reason.
- **New** `rejectEbook`: set `approval_status='rejected'`, `is_published=false`, save `rejection_reason`.
- **New** `toggleEditable`: flip `teacher_editable` for a resource.

#### [MODIFY] [ebookRoutes.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/backend/src/routes/ebookRoutes.js)
- `router.post('/approve', ebookController.approveEbook)`
- `router.post('/reject', ebookController.rejectEbook)`
- `router.post('/toggle_editable', ebookController.toggleEditable)`

---

### 3. Backend: Enrolled Students

#### [MODIFY] [courseController.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/backend/src/controllers/courseController.js)
- `getCourses`: include `_count: { select: { course_enrollments: true } }` → add `enrollmentCount` field in formatted response.
- **New** `getEnrolledStudents`: accept `course_id` and `teacher_id`. Return full list of enrolled students with name, email, phone, index number, education category, enrolled date.

#### [MODIFY] [courseRoutes.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/backend/src/routes/courseRoutes.js)
- `router.get('/enrolled_students', courseController.getEnrolledStudents)`

---

### 4. Backend: Teacher Message Requests

#### [NEW] [teacherMessageController.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/backend/src/controllers/teacherMessageController.js)
- `sendMessage`: create a new `teacher_messages` row from teacher.
- `getMyMessages`: list messages by `teacher_id`, ordered newest first.
- `listAllMessages`: (admin) return all messages with teacher name, ordered by `status=unread` first then newest.
- `replyToMessage`: admin adds reply text and sets `status='replied'`.
- `markResolved`: admin sets `status='resolved'`.
- `deleteMessage`: teacher deletes their own message, or admin deletes any.

#### [NEW] [teacherMessageRoutes.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/backend/src/routes/teacherMessageRoutes.js)
- Register all message CRUD and admin action routes.

#### [MODIFY] [server.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/backend/server.js)
- Mount `/api/teacher-messages` router.

---

### 5. Teacher Sidebar

#### [MODIFY] [layout.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/src/app/dashboard/teacher/layout.js)
- Add link to `/dashboard/teacher/e-books` (BookOpen icon, "E-Book Library").
- Add link to `/dashboard/teacher/messages` (MessageSquare icon, "Message Admin").

---

### 6. Teacher E-Books Page

#### [NEW] [/dashboard/teacher/e-books/page.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/src/app/dashboard/teacher/e-books/page.js)
- Teacher's own resources listed with Pending/Approved/Rejected badges.
- Add/upload new resource → submitted as pending, won't appear publicly.
- Edit allowed only if `teacherEditable=true` (otherwise lock icon tooltip).
- Rejection reason shown if status=rejected.
- Delete own resources via CustomDialog.

---

### 7. Admin E-Books Page

#### [MODIFY] [/dashboard/admin/e-books/page.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/src/app/dashboard/admin/e-books/page.js)
- Show `approvalStatus` badge on each row.
- For `pending` entries: **Approve** & **Reject** action buttons.
- Reject opens inline dialog for rejection reason.
- **Allow Edit / Lock Edit** toggle button per resource.

---

### 8. Enrolled Students View

#### [MODIFY] [teacher/courses/page.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/src/app/dashboard/teacher/courses/page.js) & [admin/courses/page.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/src/app/dashboard/admin/courses/page.js)
- On each course card: clickable `👥 N Students` enrollment badge.
- Clicking badge opens an **Enrolled Students Modal** with a searchable table: Name, Email, Phone, Index No., Education, Enrolled Date.

---

### 9. Teacher Message Requests Pages

#### [NEW] [/dashboard/teacher/messages/page.js](file:///c:/Users/gimha/Downloads/New%20folder/Technohub-node/src/app/dashboard/teacher/messages/page.js)
- "Compose Message" form: Subject, Category (Report / Request / Feedback / Other), Message text.
- List of past sent messages with status badges (Unread, Replied, Resolved).
- Expand each message to view admin reply.
- Delete own messages.

#### [NEW or MODIFY] Admin Messages Page
- Add an "Teacher Messages" section in admin (sidebar entry or sub-page).
- List all messages, sortable by status (Unread first).
- Admin can read message, type reply, and mark as Resolved.

---

## Verification Plan

1. **E-Book Approval**: Submit as teacher → verify pending → admin approve → verify live on public page.
2. **E-Book Rejection**: Reject with reason → verify teacher sees it → toggle edit → verify teacher can edit → save reverts to pending.
3. **Enrolled Students**: In teacher dashboard course list, click enrollment badge → verify modal shows correct students.
4. **Teacher Messages**: Teacher composes message → admin sees it unread → admin replies → teacher sees reply → admin marks resolved.
5. **Build check**: `npm run build` passes cleanly.
