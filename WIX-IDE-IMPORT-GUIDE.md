# 🔗 How to Connect Your GitHub Repository to Wix IDE

## **Method 1: Import GitHub Repository (Easiest)**

### **Step 1: Open Wix IDE**
1. Go to https://dev.wix.com/
2. Click "Create New Site" or open existing site
3. Go to your site's editor/IDE

### **Step 2: Connect GitHub**
1. In Wix IDE, look for **"Code"** or **"Developer Tools"** section
2. Find **"Import from GitHub"** or **"Connect Repository"** option
3. Authorize GitHub connection if prompted
4. Enter repository URL: `https://github.com/damiidoll/mywixcodes`
5. Select which files to import

### **Step 3: File Mapping**
- `backend/bookingBridge.jsw` → Backend folder
- `pages/*.js` → Page code sections  
- `iframes/*.html` → Upload to Media Manager, embed as HTML components
- `permissions.json` → Developer settings

---

## **Method 2: Manual File Upload**

### **Copy Files Directly:**
1. **Backend Functions:**
   - Go to Wix IDE → Backend → New .jsw file
   - Copy contents from `backend/bookingBridge.jsw`

2. **Page Code:**
   - Open page in Wix Editor
   - Go to Developer Tools → Page Code
   - Copy contents from `pages/enhancedServicePage.js`

3. **HTML Components:**
   - Upload `calendar.html` and `bookingAddon.html` to Media Manager
   - Embed as HTML iframes in your pages

---

## **Method 3: Wix CLI (For Advanced Users)**

### **Install Wix CLI:**
```bash
npm install -g @wix/cli
```

### **Deploy to Wix:**
```bash
wix login
wix init
wix sync
```

---

## **Method 4: Share with Wix Support**

### **Send Complete Code:**
1. **Repository Link:** https://github.com/damiidoll/mywixcodes
2. **Complete Code File:** Share `COMPLETE-PROJECT-CODE.md` contents
3. **Ask Wix Support to:**
   - Review the architecture
   - Help with implementation
   - Provide specific integration guidance

### **Message Template for Wix Support:**
```
Hi Wix Support Team!

I've built a dual-payment booking system and need help implementing it in Wix IDE.

🔗 **GitHub Repository:** https://github.com/damiidoll/mywixcodes

**Key Components:**
- Wix Bookings + Stores integration
- Dual-payment system (Book Now vs Add to Cart)
- Custom VX Glass calendar iframes
- Backend availability functions

**Questions:**
1. What's the best way to import this into Wix IDE?
2. How should I configure the ProductServiceMapping database?
3. Any issues with my API usage patterns?
4. Can you help with the iframe integration?

**Files to Review:**
- `backend/bookingBridge.jsw` - Main backend functions
- `pages/enhancedServicePage.js` - Service selection page
- `COMPLETE-PROJECT-CODE.md` - Everything in one file

Thanks for your help!
```

---

## **Next Steps After Import:**

### **1. Database Setup:**
- Create `ProductServiceMapping` collection in Content Manager
- Add your service/product mappings

### **2. Test Functions:**
- Test `getAvailability()` in backend
- Verify `getProductForService()` works
- Check permissions configuration

### **3. Configure Iframes:**
- Upload HTML files to Media Manager
- Add iframe elements to booking page
- Test postMessage communication

### **4. Wix Stores Integration:**
- Create products for services (full + deposit)
- Link products to services in database
- Test cart functionality

---

## **If You Need Help:**
1. **Wix Support:** Use the message template above
2. **Wix Developer Forum:** Post your repository link
3. **Wix Discord:** Share code for community help

**Your repository is public and ready for Wix IDE integration!** 🚀