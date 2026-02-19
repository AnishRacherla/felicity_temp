# How to Access Different Roles in Felicity

## 🎯 Three User Roles

### 1. **Participant** (Students who register for events)
- Register via `/register` page
- Can browse events, register for events, view tickets
- Access to: Dashboard, Browse Events, Event Details, My Registrations

### 2. **Organizer** (Event organizers - clubs/teams)
- Created by Admin only (cannot self-register)
- Can create/manage events, approve payments
- Access to: Organizer Dashboard, Create Event, My Events, Payment Approvals

### 3. **Admin** (System administrator)
- Only one admin account (already created)
- Can create organizers, view system stats
- Access to: Admin Dashboard, Manage Organizers, System Statistics

---

## 🔐 How to Login as Different Roles

### **As Participant:**

1. Go to `/register` page
2. Fill the registration form:
   - Choose: IIIT Student or Non-IIIT
   - If IIIT: Must use `@students.iiit.ac.in` email
   - If Non-IIIT: Any email works
3. Click "Register"
4. You'll be logged in automatically and redirected to `/dashboard`

**Example participant account:**
```
Email: anish.r@students.iiit.ac.in
Password: YourPassword123
College: IIIT Hyderabad
Type: IIIT Student
```

---

### **As Organizer:**

1. Login as **Admin** first
2. Go to Admin Dashboard → "Create Organizer"
3. Fill organizer details:
   - Organizer Name: TechTeam
   - Category: TECHNICAL, CULTURAL, SPORTS, or OTHER
   - Email: techteam@felicity.iiit.ac.in
   - Description: About the organizing team
4. Admin will get the auto-generated password
5. Logout and login with organizer credentials

**Sample organizer (created by seed script):**
```
Email: techteam@felicity.iiit.ac.in
Password: (shown when running seedEvents.js script)
Role: organizer
```

---

### **As Admin:**

Already created! Use these credentials:

```
Email: admin@felicity.iiit.ac.in
Password: Admin@Felicity2026
Role: admin
```

---

## 🚀 Quick Start Guide

### Step 1: Start Backend
```bash
cd backend
npm run dev
```

### Step 2: Seed Sample Events (Optional but Recommended)
```bash
cd backend
node scripts/seedEvents.js
```
This creates:
- 6 sample events
- 1 organizer account (TechTeam)

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 4: Test Each Role

**Test as Participant:**
1. Visit `http://localhost:3000/register`
2. Create a new account
3. Browse events at `/browse-events`
4. Register for an event
5. View your tickets at `/registrations`

**Test as Admin:**
1. Visit `http://localhost:3000/login`
2. Login with admin credentials
3. Create a new organizer
4. View system statistics

**Test as Organizer:**
1. Logout from admin
2. Login with organizer credentials (from seed script or created by admin)
3. Create a new event
4. View event registrations
5. Approve/reject payments

---

## 📊 Feature Access Matrix

| Feature | Participant | Organizer | Admin |
|---------|-------------|-----------|-------|
| Browse Events | ✅ | ❌ | ❌ |
| Register for Events | ✅ | ❌ | ❌ |
| View My Tickets | ✅ | ❌ | ❌ |
| Follow Organizers | ✅ | ❌ | ❌ |
| Create Events | ❌ | ✅ | ❌ |
| Manage Events | ❌ | ✅ | ❌ |
| Approve Payments | ❌ | ✅ | ❌ |
| View Event Analytics | ❌ | ✅ | ❌ |
| Create Organizers | ❌ | ❌ | ✅ |
| System Statistics | ❌ | ❌ | ✅ |

---

## 🐛 Troubleshooting

### "Blank page on Browse Events"
**Cause:** Not logged in as participant OR backend not running

**Fix:**
1. Make sure you're logged in as a **participant** (not organizer/admin)
2. Start backend: `cd backend && npm run dev`
3. Check browser console (F12) for errors

### "Access Denied - Wrong role"
**Cause:** Trying to access a page not meant for your role

**Fix:**
- Participants can only access: `/dashboard`, `/browse-events`, `/events/:id`, `/registrations`
- Organizers can only access: `/organizer/*` routes
- Admins can only access: `/admin/*` routes

### "No events showing"
**Cause:** Database is empty

**Fix:**
```bash
cd backend
node scripts/seedEvents.js
```

---

## 💡 Tips

1. **Use browser console (F12)** to see debug logs showing what data is being fetched
2. **Check localStorage** (F12 → Application → Local Storage) to see stored user data
3. **Each role has separate dashboards** - don't mix them up
4. **Participants cannot register as organizers** - only admins can create organizer accounts

---

## 🔄 Switching Between Roles

To test different roles:
1. Click "Logout" button in navbar
2. Login with different credentials
3. You'll be redirected to appropriate dashboard based on role

**Quick role detection:**
- If redirected to `/dashboard` → You're a Participant
- If redirected to `/organizer/dashboard` → You're an Organizer  
- If redirected to `/admin/dashboard` → You're an Admin
