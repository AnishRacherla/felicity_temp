# 📝 Step-by-Step Implementation Guide

## ✅ COMPLETED: Phase 1 - Database Models

You now have:
1. ✅ User Model with all role support
2. ✅ Event Model with custom forms and merchandise
3. ✅ Registration Model with tickets and QR support
4. ✅ Basic auth (register participant, login)

---

## 🔄 CURRENT: Phase 2 - Complete Backend APIs

### Step 1: Admin Account Setup [15 mins]

**What**: Create a script to provision the first admin account

**Why**: Admin is needed to create organizers

**How**:
1. Create `backend/scripts/createAdmin.js`
2. Run it once to create admin in database
3. Admin credentials: Store securely

**Files to create**:
- `backend/scripts/createAdmin.js`

---

### Step 2: Enhance Auth Controller [30 mins]

**What**: Add organizer login and admin login

**Why**: Currently only participant registration exists

**Current file**: `backend/src/routes/controllers/authController.js`

**What to add**:
- `getMe` - Get current logged-in user details
- Better error handling
- Login should update `lastLogin` field

**Changes needed**:
```javascript
// Add this function
export const getMe = async (req, res) => {
  // Return req.user (set by protect middleware)
  // Include role-specific fields
}
```

---

### Step 3: Create Participant Controller [1 hour]

**What**: APIs for participant dashboard and event browsing

**File to create**: `backend/src/controllers/participantController.js`

**Functions needed**:
```javascript
// Profile Management
- getProfile()        // GET /api/participant/profile
- updateProfile()     // PUT /api/participant/profile
- setPreferences()    // PUT /api/participant/preferences

// Event Browsing
- browseEvents()      // GET /api/events (with filters)
- getEventDetails()   // GET /api/events/:id
- searchEvents()      // GET /api/events/search?q=

// My Dashboard
- getMyRegistrations()  // GET /api/participant/registrations
- getUpcomingEvents()   // GET /api/participant/upcoming
```

---

### Step 4: Create Event Registration Controller [1.5 hours]

**What**: Handle event registrations and ticket generation

**File to create**: `backend/src/controllers/registrationController.js`

**Functions needed**:
```javascript
- registerForEvent()    // POST /api/events/:id/register
- cancelRegistration()  // DELETE /api/registrations/:id
- getMyTicket()         // GET /api/registrations/:id/ticket
- purchaseMerchandise() // POST /api/events/:id/purchase
```

**Key logic**:
1. Check eligibility (IIIT_ONLY, etc.)
2. Check registration deadline
3. Check capacity limit
4. Generate unique ticketId
5. Create QR code (use `qrcode` npm package)
6. Send email (use `nodemailer`)

---

### Step 5: Create Organizer Controller [1.5 hours]

**What**: Event management for organizers

**File to create**: `backend/src/controllers/organizerController.js`

**Functions needed**:
```javascript
// Event Management
- createEvent()         // POST /api/organizer/events
- updateEvent()         // PUT /api/organizer/events/:id
- deleteEvent()         // DELETE /api/organizer/events/:id
- publishEvent()        // POST /api/organizer/events/:id/publish
- closeEvent()          // POST /api/organizer/events/:id/close

// View Registrations
- getEventRegistrations() // GET /api/organizer/events/:id/registrations
- exportRegistrations()   // GET /api/organizer/events/:id/export

// Dashboard
- getMyEvents()         // GET /api/organizer/events
- getEventAnalytics()   // GET /api/organizer/analytics
```

**Important rules**:
- DRAFT: Can edit everything, can publish
- PUBLISHED: Can only edit description, extend deadline, increase limit
- ONGOING/COMPLETED: Cannot edit, only change status

---

### Step 6: Create Admin Controller [45 mins]

**What**: Manage organizers and system

**File to create**: `backend/src/controllers/adminController.js`

**Functions needed**:
```javascript
- createOrganizer()     // POST /api/admin/organizers
- getOrganizers()       // GET /api/admin/organizers
- removeOrganizer()     // DELETE /api/admin/organizers/:id
- toggleOrganizerStatus() // PUT /api/admin/organizers/:id/toggle
```

**Logic for createOrganizer()**:
1. Generate random password
2. Create user with role=ORGANIZER
3. Return credentials (admin will share with organizer)

---

### Step 7: Set Up Routes [30 mins]

**Files to update/create**:

1. `backend/src/routes/participantRoutes.js` - NEW
2. `backend/src/routes/registrationRoutes.js` - NEW  
3. `backend/src/routes/organizerRoutes.js` - NEW
4. `backend/src/routes/adminRoutes.js` - NEW
5. Update `backend/src/app.js` to include all routes

**Example** (`participantRoutes.js`):
```javascript
import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";
import * as participantController from "../controllers/participantController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(authorize(ROLES.PARTICIPANT));

router.get("/profile", participantController.getProfile);
router.put("/profile", participantController.updateProfile);
// ... more routes

export default router;
```

---

### Step 8: Add Utility Functions [45 mins]

**Files to create**:

1. `backend/src/utils/ticketGenerator.js`
   - Generate unique ticket IDs
   - Create QR codes

2. `backend/src/utils/emailService.js`
   - Send registration confirmation
   - Send ticket via email
   - Use `nodemailer`

3. `backend/src/utils/validators.js`
   - Validate event dates
   - Validate email domains
   - Check registration eligibility

**Install packages**:
```bash
npm install qrcode nodemailer
```

---

### Step 9: Testing Backend APIs [1 hour]

**Use Postman or Thunder Client**

Test in this order:
1. ✅ Register participant (IIIT + Non-IIIT)
2. ✅ Login
3. ✅ Get profile
4. ✅ Create admin (via script)
5. ✅ Admin creates organizer
6. ✅ Organizer login
7. ✅ Organizer creates event (draft)
8. ✅ Organizer publishes event
9. ✅ Participant browses events
10. ✅ Participant registers for event
11. ✅ Check ticket generation

---

## 📱 Phase 3 - Frontend Development [3-4 days]

### Step 10: Setup React App [30 mins]

```bash
cd frontend
npx create-react-app .
# OR
npx create vite@latest . --template react
```

**Install dependencies**:
```bash
npm install react-router-dom axios
npm install @tanstack/react-query  # For data fetching
npm install react-toastify         # For notifications
npm install tailwindcss            # For styling (optional)
```

---

### Step 11: Setup Routing [45 mins]

**Create folder structure**:
```
frontend/src/
├── components/
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   └── LoadingSpinner.jsx
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── RegisterParticipant.jsx
│   │   └── Onboarding.jsx
│   ├── participant/
│   │   ├── Dashboard.jsx
│   │   ├── BrowseEvents.jsx
│   │   ├── EventDetails.jsx
│   │   └── Profile.jsx
│   ├── organizer/
│   │   ├── Dashboard.jsx
│   │   ├── CreateEvent.jsx
│   │   └── EventManagement.jsx
│   └── admin/
│       └── Dashboard.jsx
├── services/
│   └── api.js              # Axios setup
├── context/
│   └── AuthContext.jsx     # Global auth state
└── App.jsx
```

---

### Step 12: Implement Authentication UI [2 hours]

**Files to create**:

1. **Login.jsx**
   - Email + password form
   - Role-based redirect after login
   - Store JWT in localStorage

2. **RegisterParticipant.jsx**
   - Form with all participant fields
   - IIIT email validation
   - Redirect to onboarding

3. **Onboarding.jsx** (Optional preferences)
   - Select interests
   - Follow clubs
   - Skip option

4. **AuthContext.jsx**
   - Store user + token
   - Login/logout functions
   - `useAuth()` hook

---

### Step 13: Participant Dashboard [2 hours]

**Dashboard.jsx**:
- Display upcoming events
- Show registration history
- Quick stats (events registered, attended)

**BrowseEvents.jsx**:
- List all events
- Search bar
- Filters: Type, Date, Eligibility, Followed Clubs
- Trending section

**EventDetails.jsx**:
- Full event information
- Registration button (with validations)
- Show if already registered

---

### Step 14: Organizer Dashboard [2 hours]

**Dashboard.jsx**:
- Carousel of created events
- Analytics cards (total registrations, revenue)

**CreateEvent.jsx**:
- Form with all event fields
- Dynamic form builder for custom fields
- Save as draft / Publish

**EventManagement.jsx**:
- View registrations list
- Export to CSV
- Approve merchandise payments

---

### Step 15: Admin Panel [1 hour]

**Dashboard.jsx**:
- Create organizer form
- List all organizers
- Remove/disable organizers

---

## 🎨 Phase 4 - Advanced Features [3-4 days]

### Recommended Feature Selection

**For Maximum Marks with Manageable Complexity:**

**Tier A** (Choose 2):
1. ✅ **Merchandise Payment Approval Workflow** [8 marks]
   - Already have payment model structure
   - Add upload functionality
   - Organizer approval interface
   
2. ✅ **QR Scanner & Attendance Tracking** [8 marks]
   - Use `react-qr-scanner` or device camera
   - Mark attendance
   - Export attendance report

**Tier B** (Choose 2):
1. ✅ **Organizer Password Reset Workflow** [6 marks]
   - Request form
   - Admin approval system
   - Auto-generate new password

2. ✅ **Real-Time Discussion Forum** [6 marks]
   - Use Socket.io
   - Event-specific chat rooms
   - Organizer moderation

**Tier C** (Choose 1):
1. ✅ **Bot Protection (CAPTCHA)** [2 marks]
   - Add Google reCAPTCHA
   - Simplest to implement

**Total: 8 + 8 + 6 + 6 + 2 = 30 marks**

---

### Step 16: Implement Selected Features

Each feature needs:
1. Backend API routes
2. Database models (if needed)
3. Frontend UI
4. Testing

---

## 🚀 Phase 5 - Deployment [Final Day]

### Step 17: Deploy Backend

**Option 1: Render.com** (Recommended)
1. Create account on Render
2. New Web Service
3. Connect GitHub repo
4. Set environment variables
5. Deploy

**Option 2: Railway.app**
Similar process, good free tier

---

### Step 18: Deploy Frontend

**Option 1: Vercel** (Recommended for React)
1. `npm run build`
2. Deploy to Vercel via CLI or GitHub
3. Set environment variable: `REACT_APP_API_URL`

**Option 2: Netlify**
Similar to Vercel

---

### Step 19: Create deployment.txt

```
Frontend URL: https://your-app.vercel.app
Backend API URL: https://your-api.onrender.com
```

---

## ⏰ Time Management

| Phase | Duration | Days |
|-------|----------|------|
| Phase 1: Models | ✅ Done | - |
| Phase 2: Backend APIs | 8-10 hours | 2-3 days |
| Phase 3: Frontend | 16-20 hours | 4-5 days |
| Phase 4: Advanced Features | 12-16 hours | 3-4 days |
| Phase 5: Deployment + Testing | 4-6 hours | 1 day |
| **Total** | | **11-14 days** |

**Buffer**: 4-5 days for bugs and polish

---

## 🐛 Common Issues & Solutions

### Backend Issues

**Problem**: MongoDB connection fails
**Solution**: Check IP whitelist in Atlas, verify connection string

**Problem**: JWT token not working
**Solution**: Ensure `Bearer <token>` format in Authorization header

**Problem**: Password not hashing
**Solution**: Verify bcrypt pre-save hook in User model

### Frontend Issues

**Problem**: CORS errors
**Solution**: Add CORS middleware in backend `app.js`

**Problem**: Routes not protected
**Solution**: Check ProtectedRoute component implementation

---

## 📦 Final Checklist Before Submission

- [ ] All required models created
- [ ] Authentication works for all 3 roles
- [ ] Participant can register for events
- [ ] Organizer can create and manage events
- [ ] Admin can create organizers
- [ ] Advanced features working (5 features)
- [ ] Frontend deployed
- [ ] Backend deployed
- [ ] deployment.txt created
- [ ] README.md updated with features implemented
- [ ] Code commented
- [ ] No console errors
- [ ] Tested on different browsers
- [ ] Zip file created with correct structure

---

## 🎯 Success Tips

1. **Commit after every working feature**
2. **Test APIs before building UI**
3. **Use environment variables**
4. **Keep code organized**
5. **Comment complex logic**
6. **Ask for help early if stuck**
7. **Don't aim for perfect, aim for working**

---

**Ready to proceed? Start with Step 1 (Admin Setup)!**

Let me know which phase you want to tackle next, and I'll provide detailed code for that section.
