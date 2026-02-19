# 🎯 Complete Felicity Role System Explained

## How the 3-Role System Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         FELICITY SYSTEM                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    ADMIN     │       │  ORGANIZER   │       │ PARTICIPANT  │
│  (1 person)  │       │ (Club Heads) │       │  (Students)  │
└──────────────┘       └──────────────┘       └──────────────┘
       │                      │                       │
       │                      │                       │
       ▼                      ▼                       ▼

┌──────────────────────────────────────────────────────────────────┐
│                          ADMIN POWERS                             │
├──────────────────────────────────────────────────────────────────┤
│  ✅ Create Organizer accounts (club heads)                       │
│  ✅ View system statistics                                       │
│  ✅ Auto-generate passwords for organizers                       │
│  ❌ Cannot create events                                         │
│  ❌ Cannot register for events                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       ORGANIZER POWERS                            │
├──────────────────────────────────────────────────────────────────┤
│  ✅ Create Events (Normal & Merchandise)                         │
│  ✅ Edit/Delete their own events                                 │
│  ✅ View event registrations                                     │
│  ✅ Approve/Reject payments                                      │
│  ✅ Add custom registration forms                                │
│  ✅ Track QR code scans                                          │
│  ✅ View event analytics                                         │
│  ❌ Cannot browse events (they create, not participate)          │
│  ❌ Cannot register for events                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      PARTICIPANT POWERS                           │
├──────────────────────────────────────────────────────────────────┤
│  ✅ Browse all published events                                  │
│  ✅ Register for events                                          │
│  ✅ Fill custom registration forms                               │
│  ✅ Buy merchandise                                              │
│  ✅ View their tickets with QR codes                             │
│  ✅ Download tickets                                             │
│  ✅ Cancel registrations                                         │
│  ✅ Follow organizers                                            │
│  ❌ Cannot create events                                         │
│  ❌ Cannot see admin/organizer features                          │
└──────────────────────────────────────────────────────────────────┘


## 🔄 How to Get Each Role

### 1️⃣ ADMIN (Already exists)
```
✅ Pre-created via script
📧 Email: admin@felicity.iiit.ac.in
🔑 Password: Admin@Felicity2026
```

**How to access:**
1. Go to http://localhost:3000/login
2. Enter admin credentials
3. You'll be redirected to `/admin/dashboard`

---

### 2️⃣ ORGANIZER (Created by Admin)
```
❌ CANNOT self-register
✅ Must be created by Admin
```

**How to create an organizer:**

**Step 1:** Login as Admin

**Step 2:** Go to Admin Dashboard → Click "➕ Create New Organizer"

**Step 3:** Fill the form:
- First Name: John
- Last Name: Doe
- Email: techclub@felicity.iiit.ac.in
- Organizer/Club Name: TechClub
- Category: TECHNICAL
- Description: Technical events club

**Step 4:** Admin clicks "Create Organizer"

**Step 5:** System shows auto-generated password like: `Tech#2026$Secure`

**Step 6:** Give these credentials to the club head

**Step 7:** Club head logs in and gets `/organizer/dashboard`

---

### 3️⃣ PARTICIPANT (Self-register)
```
✅ Anyone can register
❌ NO role selection during registration
🎯 Automatically assigned "participant" role
```

**How to register:**
1. Go to http://localhost:3000/register
2. Fill the form (NO role dropdown)
3. System automatically creates you as a participant
4. After registration, redirected to `/dashboard`

---

## 🎨 What Each Dashboard Looks Like

### Admin Dashboard (`/admin/dashboard`)
```
┌───────────────────────────────────────────────────┐
│  📊 System Statistics                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │ 15   │ │ 250  │ │ 5    │ │ 320  │            │
│  │Events│ │ Parts│ │ Orgs │ │ Regs │            │
│  └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                   │
│  ➕ Create New Organizer (Club Head)              │
│                                                   │
│  📋 Existing Organizers:                          │
│  ┌─────────────────────────────────────────────┐ │
│  │ TechTeam (TECHNICAL)                        │ │
│  │ techteam@felicity.iiit.ac.in    ✅ Active  │ │
│  └─────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │ E-Cell (OTHER)                              │ │
│  │ ecell@felicity.iiit.ac.in       ✅ Active  │ │
│  └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### Organizer Dashboard (`/organizer/dashboard`)
```
┌───────────────────────────────────────────────────┐
│  📊 My Event Statistics                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │ 8    │ │ 6    │ │ 125  │ │ 3    │            │
│  │Total │ │Publis│ │ Regs │ │Pends │            │
│  └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                   │
│  ➕ Create New Event  📋 Manage My Events         │
│                                                   │
│  📅 Recent Events:                                │
│  ┌─────────────────────────────────────────────┐ │
│  │ [PUBLISHED] Hackathon 2026                  │ │
│  │ 📅 Feb 15, 2026  👥 45/100  💰 Free  [Edit]│ │
│  └─────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │ [DRAFT] Web Dev Workshop                    │ │
│  │ 📅 Feb 20, 2026  👥 0/50  💰 ₹200  [Edit]  │ │
│  └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### Participant Dashboard (`/dashboard`)
```
┌───────────────────────────────────────────────────┐
│  Welcome back, Anish! 👋                          │
│                                                   │
│  📊 Your Event Statistics                         │
│  ┌──────┐ ┌──────┐ ┌──────┐                      │
│  │ 3    │ │ 1    │ │ 4    │                      │
│  │Upcmng│ │Complt│ │Total │                      │
│  └──────┘ └──────┘ └──────┘                      │
│                                                   │
│  📅 Your Upcoming Events:                         │
│  ┌─────────────────────────────────────────────┐ │
│  │ Hackathon 2026                              │ │
│  │ 📅 Feb 15, 2pm  🎟️ FELC-5A3B  [Details]   │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  🔍 Browse Events  🎟️ My Tickets                 │
└───────────────────────────────────────────────────┘
```

---

## 🚦 Authentication Flow

```
                    START
                      │
                      ▼
            ┌─────────────────┐
            │  Visit Website  │
            └─────────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │ Already Logged  │
            │      In?        │
            └─────────────────┘
                 /          \
               NO            YES
              /                \
             ▼                  ▼
    ┌──────────────┐    ┌──────────────┐
    │ Go to Login  │    │ Check Role   │
    │ or Register  │    └──────────────┘
    └──────────────┘           │
             │          ┌───────┼───────┐
             │          ▼       ▼       ▼
             │      Admin  Organizer  Part.
             │          │       │       │
             ▼          ▼       ▼       ▼
    ┌──────────────┐  /admin  /org   /dash
    │  Enter Email │  /dash   /dash  board
    │  & Password  │  board   board
    └──────────────┘
             │
             ▼
    ┌──────────────┐
    │ Backend      │
    │ Validates    │
    └──────────────┘
             │
       ┌─────┴─────┐
      Valid      Invalid
       │             │
       ▼             ▼
    Store         Show
    Token         Error
    & User
       │
       ▼
    Redirect
    based on
    role
```

---

## ✅ **SUMMARY OF CHANGES I MADE:**

1. ✅ **Created Admin Dashboard** (`/admin/dashboard`)
   - Create organizers (club heads)
   - View system stats
   - Auto-generate passwords

2. ✅ **Created Organizer Dashboard** (`/organizer/dashboard`)
   - View their events
   - See statistics
   - Quick access to create/manage events

3. ✅ **Created Create Event Page** (`/organizer/create-event`)
   - Add event details
   - Build custom registration forms
   - Add merchandise options
   - Full featured event creator

4. ✅ **Added All Routes to App.jsx**
   - `/admin/dashboard` - Admin only
   - `/organizer/dashboard` - Organizers only
   - `/organizer/create-event` - Organizers only
   - Existing participant routes

5. ✅ **Role-based Authentication**
   - Automatic redirect based on role after login
   - Protected routes check user role
   - Clear error messages if wrong role

---

## 🎯 HOW TO TEST:

### Test as Admin:
```bash
1. Login: admin@felicity.iiit.ac.in / Admin@Felicity2026
2. You'll see Admin Dashboard
3. Click "Create New Organizer"
4. Fill form and create a club head
5. Copy the auto-generated password
```

### Test as Organizer:
```bash
1. Logout from admin
2. Login with organizer credentials (from step above)
3. You'll see Organizer Dashboard
4. Click "Create New Event"
5. Fill event details, add custom form fields
6. Create event
7. Participants can now browse and register for this event
```

### Test as Participant:
```bash
1. Go to /register
2. Create new account (automatic participant role)
3. Browse events created by organizers
4. Register for events
5. View your tickets
```

---

## 🔐 Security Features:

✅ **Cannot choose your own role** - Prevents fake organizers
✅ **Admin creates organizers** - Verification required
✅ **Auto-generated passwords** - Secure by default
✅ **Role-based routing** - Wrong role = blocked
✅ **Token authentication** - All API calls secured

---

## ❓ YOUR QUESTIONS ANSWERED:

**Q: "Where do I select my role during registration?"**
A: You don't! For security, only participants can self-register. Organizers must be created by admin.

**Q: "How do club heads get access?"**
A: Admin creates their account → Admin gives them credentials → They login → Get organizer powers

**Q: "Where can I add/delete/update events?"**
A: Login as organizer → Organizer Dashboard → "Create Event" or "Manage My Events"

**Q: "How does authentication work?"**
A: Admin approves club heads by creating their accounts. Club heads then have full event management powers.

---

**🚀 You now have a complete role-based event management system!**
