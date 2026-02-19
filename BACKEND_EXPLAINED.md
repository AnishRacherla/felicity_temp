# 📘 Complete Backend Explanation - What Happened

**Date**: February 4, 2026  
**Status**: Backend foundation complete, ready for API implementation

---

## 🎯 **What We Built - Simple Overview**

Think of your backend as a **restaurant kitchen**:
- **Models** (User, Event, Registration) = **Recipe blueprints** (what data looks like)
- **Controllers** = **Chefs** (do the actual work: create events, register users, etc.)
- **Routes** = **Menus** (tell customers what they can order)
- **Middleware** = **Security guards** (check if you're allowed to order certain items)
- **Utils** = **Kitchen tools** (QR generator, email sender, validators)

---

## 📁 **Complete File Structure & Purpose**

```
backend/
├── src/
│   ├── models/              # 📋 DATABASE BLUEPRINTS (What data looks like)
│   │   ├── User.js          # Participant/Organizer/Admin structure
│   │   ├── Event.js         # Event structure (normal & merchandise)
│   │   └── Registration.js  # Ticket/registration structure
│   │
│   ├── controllers/         # 👨‍🍳 BUSINESS LOGIC (The actual work)
│   │   ├── authController.js         # Login, Register, Get current user
│   │   ├── participantController.js  # Browse events, profile, preferences
│   │   ├── eventController.js        # Create, edit, search events
│   │   ├── registrationController.js # Register for events, get tickets
│   │   ├── organizerController.js    # Manage events, view registrations
│   │   └── adminController.js        # Create organizers, manage system
│   │
│   ├── routes/              # 🗺️ API ENDPOINTS (Menu of available actions)
│   │   ├── authRoutes.js         # /api/auth/login, /api/auth/register
│   │   ├── participantRoutes.js  # /api/participant/*
│   │   ├── eventRoutes.js        # /api/events/*
│   │   ├── organizerRoutes.js    # /api/organizer/*
│   │   └── adminRoutes.js        # /api/admin/*
│   │
│   ├── middleware/          # 🛡️ SECURITY & VALIDATION
│   │   └── authMiddleware.js  # Check if user is logged in, check roles
│   │
│   ├── utils/               # 🔧 HELPER TOOLS
│   │   ├── jwt.js              # Create & verify login tokens
│   │   ├── ticketGenerator.js  # Generate ticket IDs & QR codes
│   │   ├── emailService.js     # Send emails
│   │   └── validators.js       # Validate data (dates, emails, etc.)
│   │
│   ├── config/              # ⚙️ CONFIGURATION
│   │   └── db.js            # MongoDB connection setup
│   │
│   ├── constants/           # 📌 FIXED VALUES
│   │   └── roles.js         # USER ROLES: participant, organizer, admin
│   │
│   ├── app.js               # 🏗️ EXPRESS APP SETUP (Main application)
│   └── index.js             # 🚀 SERVER START (Entry point)
│
├── scripts/                 # 🛠️ UTILITY SCRIPTS
│   └── createAdmin.js       # One-time script to create first admin
│
├── .env                     # 🔐 ENVIRONMENT VARIABLES (Secrets!)
├── package.json             # 📦 PROJECT DEPENDENCIES
└── README.md                # 📖 PROJECT DOCUMENTATION
```

---

## 🔄 **How Everything Connects - Request Flow**

### **Example: Participant Registers for an Event**

```
1. PARTICIPANT (Frontend):
   "I want to register for Hackathon event!"
   → Sends: POST /api/events/123/register
   → With: JWT token in header
   
2. ROUTES (eventRoutes.js):
   "Okay, let me check if this request is valid"
   → Checks: Is URL correct? (/api/events/:id/register)
   
3. MIDDLEWARE (authMiddleware.js):
   "Is this person logged in? What role do they have?"
   → Verifies: JWT token
   → Checks: User is PARTICIPANT
   → Sets: req.user = participant data
   
4. CONTROLLER (registrationController.js):
   "Let me process this registration..."
   → Checks: Is event registration open?
   → Checks: Is there capacity left?
   → Checks: Is participant eligible?
   → Creates: Registration in database
   → Generates: Ticket ID (using ticketGenerator)
   → Generates: QR code (using ticketGenerator)
   → Sends: Email with ticket (using emailService)
   → Returns: Success message + ticket
   
5. DATABASE (MongoDB):
   "Saving registration..."
   → Stores: New Registration document
   → Updates: Event's currentRegistrations count
   
6. RESPONSE (Back to Frontend):
   {
     "success": true,
     "message": "Registration successful!",
     "ticket": {
       "ticketId": "FEL-2026-A3F9B",
       "qrCode": "data:image/png;base64,..."
     }
   }
```

---

## 📚 **Key Files Explained**

### **1. Models (Database Structure)**

#### **User.js** - Stores all users (participants, organizers, admins)
```javascript
{
  // Common fields for all users
  firstName: "John",
  lastName: "Doe",
  email: "john@students.iiit.ac.in",
  password: "hashed_password",  // Encrypted, not plain text!
  role: "participant",           // OR "organizer" OR "admin"
  
  // Participant-specific fields
  participantType: "IIIT",
  collegeName: "IIIT Hyderabad",
  interests: ["AI", "Hackathons"],
  followedOrganizers: [organizerId1, organizerId2],
  
  // Organizer-specific fields
  organizerName: "TechClub",
  category: "Technical",
  description: "Official tech club",
  discordWebhook: "https://discord.com/..."
}
```

**Why one model for all users?**
- Easier authentication (one login system)
- Simpler queries
- Can switch roles if needed (though assignment forbids it)

---

#### **Event.js** - Stores all events
```javascript
{
  eventName: "AI Workshop",
  description: "Learn AI basics",
  eventType: "NORMAL",  // OR "MERCHANDISE"
  organizer: organizerId,
  
  // Dates & limits
  registrationDeadline: Date,
  eventStartDate: Date,
  eventEndDate: Date,
  registrationLimit: 100,
  currentRegistrations: 45,
  
  // Status workflow
  status: "PUBLISHED",  // DRAFT → PUBLISHED → ONGOING → COMPLETED
  
  // Normal event: Custom registration form
  customForm: [
    {
      fieldName: "College Year",
      fieldType: "DROPDOWN",
      options: ["1st", "2nd", "3rd", "4th"],
      required: true
    }
  ],
  
  // Merchandise event: Product details
  merchandise: {
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White"],
    stockQuantity: 50
  }
}
```

**Indexes** (Those lines you asked about):
```javascript
eventSchema.index({ organizer: 1, status: 1 });
```
- **What**: Database performance optimization
- **Why**: Makes queries faster
- **How**: Like book index - jump directly to page instead of reading whole book
- **Example**: "Show all PUBLISHED events by TechClub" → Instant instead of scanning all events

---

#### **Registration.js** - Stores tickets/registrations
```javascript
{
  participant: participantId,
  event: eventId,
  
  // Ticket info
  ticketId: "FEL-2026-A3F9B",
  qrCode: "data:image/png;base64,..base64_image..",
  
  status: "CONFIRMED",  // PENDING, CONFIRMED, CANCELLED
  
  // Payment (for merchandise)
  paymentStatus: "PAID",
  paymentProof: "image_url",
  
  // Custom form answers (for normal events)
  formResponse: {
    "College Year": "3rd",
    "Skills": "Python, React"
  },
  
  // Attendance
  attended: false,
  attendedAt: null
}
```

---

### **2. Utilities (Helper Functions)**

#### **ticketGenerator.js** - Creates tickets and QR codes

**Function 1: generateTicketId()**
```javascript
// Creates unique ID: FEL-2026-A3F9B
const ticketId = generateTicketId();
console.log(ticketId); // "FEL-2026-A3F9B"
```

**How it works:**
1. Get current year: 2026
2. Generate random code: A3F9B (from UUID)
3. Combine: FEL-2026-A3F9B

**Function 2: generateQRCode(data)**
```javascript
// Creates QR code image from data
const qrCode = await generateQRCode({
  ticketId: "FEL-2026-A3F9B",
  participantName: "John Doe",
  eventName: "AI Workshop"
});

// Result: "data:image/png;base64,iVBORw0KGgo..."
// This is an image you can display or send in email
```

**What is Base64?**
- Way to represent images as text
- Can be embedded in HTML: `<img src="data:image..." />`
- No need to save file, just use the string!

**Function 3: verifyQRCode(qrData)**
```javascript
// When organizer scans QR code
const scannedData = '{"ticketId":"FEL-2026-A3F9B"}';
const ticket = verifyQRCode(scannedData);
console.log(ticket.ticketId); // "FEL-2026-A3F9B"
```

---

#### **emailService.js** - Sends emails

**Function: sendRegistrationEmail()**
```javascript
await sendRegistrationEmail({
  to: "john@iiit.ac.in",
  participantName: "John Doe",
  eventName: "AI Workshop",
  ticketId: "FEL-2026-A3F9B",
  qrCode: "data:image/png;base64,...",
  eventDate: new Date()
});
```

**What it does:**
1. Creates HTML email template (beautiful design)
2. Includes ticket details
3. Embeds QR code image
4. Sends via SMTP server

**Development vs Production:**
- **Development**: Uses fake email server (emails don't actually send)
  - You get a preview URL to see how email looks
- **Production**: Uses real email (Gmail, SendGrid, etc.)
  - Emails actually reach participants

---

### **3. Controllers (Business Logic)**

#### **authController.js** - Handles authentication

**Function 1: registerParticipant()**
```javascript
POST /api/auth/register
Body: {
  firstName: "John",
  lastName: "Doe",
  email: "john@students.iiit.ac.in",
  password: "secure123",
  participantType: "IIIT"
}

What it does:
1. ✅ Validate all fields are present
2. ✅ Check IIIT email (if participantType is IIIT)
3. ✅ Check if email already exists
4. ✅ Hash password (encrypt it)
5. ✅ Create user in database
6. ✅ Generate JWT token
7. ✅ Return token + user data

Response: {
  success: true,
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: { id, name, email, role }
}
```

**Function 2: login()**
```javascript
POST /api/auth/login
Body: {
  email: "john@students.iiit.ac.in",
  password: "secure123"
}

What it does:
1. ✅ Find user by email
2. ✅ Check password matches (compare hashed)
3. ✅ Check account is active (not disabled)
4. ✅ Update lastLogin timestamp
5. ✅ Generate JWT token
6. ✅ Return token + user data
```

**Function 3: getMe()**
```javascript
GET /api/auth/me
Headers: {
  Authorization: "Bearer eyJhbGci..."
}

What it does:
1. ✅ Verify JWT token (done by middleware)
2. ✅ Get user from database
3. ✅ Return user data (without password)
```

---

### **4. Middleware (Security Guards)**

#### **authMiddleware.js**

**Function 1: protect** - Check if user is logged in
```javascript
// Used like this in routes:
router.get("/profile", protect, getProfile);
//                      ↑ Runs before getProfile

What it does:
1. ✅ Extract JWT token from Authorization header
2. ✅ Verify token is valid (not expired, not tampered)
3. ✅ Get user from database
4. ✅ Attach user to request: req.user = userData
5. ✅ Call next() to proceed to controller
❌ If no token or invalid → Return 401 Unauthorized
```

**Function 2: authorize(...roles)** - Check if user has correct role
```javascript
// Used like this in routes:
router.post("/events", protect, authorize(ROLES.ORGANIZER), createEvent);
//                                ↑ Only organizers can create events

What it does:
1. ✅ Check if req.user exists (protect must run first)
2. ✅ Check if req.user.role matches allowed roles
3. ✅ If match → Call next()
❌ If no match → Return 403 Forbidden
```

---

## 🔐 **Authentication Flow Explained**

### **Step-by-Step: User Logs In**

```
1. USER TYPES:
   Email: john@students.iiit.ac.in
   Password: secure123
   
2. FRONTEND SENDS:
   POST /api/auth/login
   Body: { email: "john@...", password: "secure123" }
   
3. BACKEND (authController.login):
   → Finds user in database
   → Compares password hashes:
     Input: secure123 → Hash → $2b$10$xyz...
     Stored: $2b$10$xyz...
     Match? ✅ Yes
   
4. BACKEND GENERATES JWT TOKEN:
   Token = Sign({userId: "123", role: "participant"}, SECRET_KEY)
   Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   
5. FRONTEND RECEIVES:
   {
     success: true,
     token: "eyJhbGci...",
     user: { id: "123", name: "John", role: "participant" }
   }
   
6. FRONTEND STORES TOKEN:
   localStorage.setItem("token", "eyJhbGci...")
   
7. FOR ALL FUTURE REQUESTS:
   Headers: {
     Authorization: "Bearer eyJhbGci..."
   }
   
8. BACKEND VERIFIES TOKEN:
   → Middleware extracts token
   → Verifies signature using SECRET_KEY
   → Decodes: {userId: "123", role: "participant"}
   → Fetches user from database
   → Attaches to request: req.user
```

**Why JWT?**
- **Stateless**: Server doesn't need to remember logged-in users
- **Scalable**: Works across multiple servers
- **Secure**: Can't be tampered with (signed with secret key)

---

## 📊 **Data Flow Example: Register for Event**

```
1. PARTICIPANT CLICKS "Register" button
   
2. FRONTEND:
   fetch("/api/events/123/register", {
     method: "POST",
     headers: {
       "Authorization": "Bearer eyJhbGci...",
       "Content-Type": "application/json"
     },
     body: JSON.stringify({
       formData: {
         "College Year": "3rd",
         "Skills": "Python"
       }
     })
   })
   
3. BACKEND - ROUTE (eventRoutes.js):
   router.post(
     "/events/:id/register",
     protect,              // ← Check if logged in
     authorize(PARTICIPANT), // ← Check if participant
     registerForEvent      // ← Do the actual work
   )
   
4. MIDDLEWARE - protect:
   → Verify JWT token: ✅ Valid
   → Get user from DB: ✅ Found
   → Set: req.user = {id: "user123", role: "participant"}
   → Call next() → Go to authorize
   
5. MIDDLEWARE - authorize:
   → Check: req.user.role === "participant"? ✅ Yes
   → Call next() → Go to registerForEvent controller
   
6. CONTROLLER - registerForEvent:
   a) Get event from database:
      const event = await Event.findById(req.params.id);
      
   b) Validate:
      ✅ Event exists?
      ✅ Registration deadline not passed?
      ✅ Registration limit not reached?
      ✅ Participant eligible?
      ✅ Not already registered?
      
   c) Generate ticket:
      const ticketId = generateTicketId();
      // Result: "FEL-2026-A3F9B"
      
   d) Generate QR code:
      const qrCode = await generateQRCode({
        ticketId,
        participantName: req.user.firstName,
        eventName: event.eventName
      });
      // Result: "data:image/png;base64,..."
      
   e) Save registration to database:
      await Registration.create({
        participant: req.user._id,
        event: event._id,
        ticketId,
        qrCode,
        formResponse: req.body.formData
      });
      
   f) Update event registration count:
      event.currentRegistrations += 1;
      await event.save();
      
   g) Send email:
      await sendRegistrationEmail({
        to: req.user.email,
        participantName: req.user.firstName,
        eventName: event.eventName,
        ticketId,
        qrCode,
        eventDate: event.eventStartDate
      });
      
   h) Return response:
      res.json({
        success: true,
        message: "Registration successful!",
        ticket: { ticketId, qrCode }
      });
      
7. FRONTEND RECEIVES:
   → Shows success message
   → Displays ticket with QR code
   → Updates "My Events" list
```

---

## 🗂️ **Database Collections (What's Stored)**

### **Users Collection**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  firstName: "John",
  lastName: "Doe",
  email: "john@students.iiit.ac.in",
  password: "$2b$10$xyz...",  // Hashed
  role: "participant",
  participantType: "IIIT",
  interests: ["AI", "Web"],
  createdAt: "2026-02-04T10:00:00Z",
  lastLogin: "2026-02-04T15:30:00Z"
}
```

### **Events Collection**
```javascript
{
  _id: ObjectId("507f191e810c19729de860ea"),
  eventName: "AI Workshop",
  organizer: ObjectId("507f1f77bcf86cd799439011"),
  eventType: "NORMAL",
  status: "PUBLISHED",
  registrationLimit: 100,
  currentRegistrations: 45,
  registrationDeadline: "2026-02-10T23:59:59Z",
  eventStartDate: "2026-02-15T10:00:00Z"
}
```

### **Registrations Collection**
```javascript
{
  _id: ObjectId("507f191e810c19729de860eb"),
  participant: ObjectId("507f1f77bcf86cd799439011"),
  event: ObjectId("507f191e810c19729de860ea"),
  ticketId: "FEL-2026-A3F9B",
  qrCode: "data:image/png;base64,...",
  status: "CONFIRMED",
  formResponse: {
    "College Year": "3rd"
  },
  attended: false,
  createdAt: "2026-02-04T15:30:00Z"
}
```

---

## 🔧 **Environment Variables (.env)**

```env
# Server Configuration
PORT=5000
NODE_ENV=development  # or "production" when deployed

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/felicity_db

# Authentication
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

# Email (Development - Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # NOT regular password!
EMAIL_FROM="Felicity <noreply@felicity.iiit.ac.in>"

# Admin (For createAdmin script)
ADMIN_EMAIL=admin@felicity.iiit.ac.in
ADMIN_PASSWORD=Felicity@Admin2026

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Never commit .env to GitHub!** Add it to `.gitignore`

---

## 🎯 **What's Working Now**

✅ **Database models** - Structure defined  
✅ **Authentication** - Register, login, get user  
✅ **Middleware** - Protected routes, role checking  
✅ **Utilities** - QR codes, emails, ticket generation  
✅ **Controllers** - All business logic files created  
✅ **Routes** - All API endpoints defined  

---

## ⚠️ **What's NOT Working Yet**

❌ **Testing** - Haven't tested the APIs yet  
❌ **Error handling** - Some edge cases not covered  
❌ **File uploads** - Payment proof uploads not implemented  
❌ **Frontend** - No UI built yet  
❌ **Deployment** - Running locally only  

---

## 🧪 **How to Test (Next Step)**

Use **Postman** or **Thunder Client**:

### 1. Register Participant
```
POST http://localhost:5000/api/auth/register
Body (JSON):
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@students.iiit.ac.in",
  "password": "test123",
  "participantType": "IIIT",
  "collegeName": "IIIT Hyderabad"
}

Expected: Token + user data
```

### 2. Login
```
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "email": "john@students.iiit.ac.in",
  "password": "test123"
}

Expected: Token + user data
Copy the token!
```

### 3. Get Current User (Protected Route)
```
GET http://localhost:5000/api/auth/me
Headers:
  Authorization: Bearer YOUR_TOKEN_HERE

Expected: User data
```

---

## 💡 **Key Concepts Summary**

### **1. Bcrypt (Password Hashing)**
```
Plain Password: "secure123"
↓ Hash with bcrypt
Hashed: "$2b$10$xyz123abc..." (60 characters)

Why?
- Can't reverse engineer to get original password
- Same password = different hash each time (salt)
- Even if database is stolen, passwords are safe
```

### **2. JWT (JSON Web Tokens)**
```
Structure: header.payload.signature

Example:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← Header (algorithm)
.eyJ1c2VySWQiOiIxMjMifQ                ← Payload (data)
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV    ← Signature (proof)

Decodes to:
{
  userId: "123",
  role: "participant",
  iat: 1706976000,  // Issued at timestamp
  exp: 1707580800   // Expires timestamp
}
```

### **3. Middleware Chain**
```
Request → Route → Middleware1 → Middleware2 → Controller → Response
            ↓          ↓              ↓             ↓
         Match URL   protect      authorize    Do work
```

### **4. Mongoose Populate (Join Tables)**
```javascript
// Instead of just organizer ID:
{ organizer: "507f1f77bcf86cd799439011" }

// Populate gives full organizer data:
await Event.findById(id).populate("organizer");

Result:
{
  organizer: {
    _id: "507f1f77...",
    organizerName: "TechClub",
    category: "Technical"
  }
}
```

---

## 📖 **Next Steps (In Order)**

1. ✅ **Test APIs with Postman** (Step 9 in guide)
2. **Fix any bugs found** during testing
3. **Start frontend** (React setup)
4. **Build authentication pages** (Login, Register)
5. **Build dashboards** (Participant, Organizer, Admin)
6. **Implement advanced features** (Choose 5)
7. **Deploy** to production
8. **Submit** before Feb 14, 11:59 PM

---

**You're at 25% completion!** Backend structure is solid. Next: Test everything, then build frontend.

Need clarification on any part? Ask away! 🚀
