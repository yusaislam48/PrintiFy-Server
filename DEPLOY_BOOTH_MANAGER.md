# Deploy Booth Manager System to Heroku

## Current Status
- ✅ server.js deployed
- ❌ Booth manager routes, controller, model NOT deployed
- ❌ Booth manager accounts NOT created

## Files That Need to be Deployed

### 1. Routes
```bash
server/routes/boothManager.js
```

### 2. Controller
```bash
server/controllers/boothManagerController.js
```

### 3. Model
```bash
server/models/BoothManager.js
```

### 4. Database Setup Script
```bash
server/add-booth-manager.js
```

## Deployment Steps

### Step 1: Deploy All Files to Heroku
You need to push these files to your Heroku repository:

```bash
# Make sure you're in the server directory
cd server

# Add all booth manager files
git add routes/boothManager.js
git add controllers/boothManagerController.js
git add models/BoothManager.js
git add add-booth-manager.js

# Commit the changes
git commit -m "Add booth manager system - routes, controller, model, and setup script"

# Push to Heroku
git push heroku main
```

### Step 2: Create Booth Manager Account
After deployment, run the setup script on Heroku:

```bash
# Run the booth manager creation script on Heroku
heroku run node add-booth-manager.js

# Or if you have access to Heroku console:
# Login to Heroku dashboard > Your App > More > Run console
# Then run: node add-booth-manager.js
```

### Step 3: Verify Deployment
Test the booth manager endpoint:

```bash
curl -X POST https://printifyapp-564e0522a8a7.herokuapp.com/api/booth-managers/login \
  -H "Content-Type: application/json" \
  -d '{"email":"booth1@printify.com","password":"Yu2521191"}'
```

Expected response:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "boothManager": {
    "_id": "...",
    "name": "Print Hub Manager",
    "email": "booth1@printify.com",
    "boothName": "Main Print Hub",
    "boothLocation": "Library - Ground Floor",
    "boothNumber": "HUB-001",
    "role": "boothManager"
  }
}
```

## Test Credentials

After successful deployment and setup:

**Booth Manager Login:**
- Email: `booth1@printify.com`
- Password: `Yu2521191`

## Update PrintHub App

Once booth manager system is working, update the PrintHub login form:

```html
<!-- In PrintHub/index.html -->
<input type="email" value="booth1@printify.com">
<input type="password" value="Yu2521191">
```

## Troubleshooting

### If booth manager endpoint still returns 404:
1. Check Heroku logs: `heroku logs --tail`
2. Verify all files are deployed: `heroku run ls -la routes/`
3. Check for import errors in server.js

### If booth manager creation fails:
1. Check MongoDB connection
2. Verify environment variables are set
3. Run script locally first to test

### If login fails:
1. Verify booth manager exists in database
2. Check password hashing
3. Verify isActive is true

## Alternative: Manual Database Creation

If the script doesn't work, you can create the booth manager manually through MongoDB:

```javascript
// Connect to your MongoDB database
// Insert this document into the 'boothmanagers' collection:
{
  "name": "Print Hub Manager",
  "email": "booth1@printify.com",
  "password": "$2a$10$hashed_password_here", // Use bcrypt to hash "Yu2521191"
  "boothName": "Main Print Hub",
  "boothLocation": "Library - Ground Floor", 
  "boothNumber": "HUB-001",
  "paperCapacity": 500,
  "loadedPaper": 250,
  "printerName": "HP LaserJet Pro",
  "printerModel": "M404dn",
  "role": "boothManager",
  "isActive": true,
  "createdAt": new Date(),
  "updatedAt": new Date()
}
```

## Success Indicators

✅ **Deployment Successful When:**
- `/api/booth-managers/login` returns 200 (not 404)
- Login with booth1@printify.com works
- PrintHub app can authenticate with booth manager credentials
- No more fallback to admin authentication needed

---

**Next Step**: Deploy the files and run the setup script! 