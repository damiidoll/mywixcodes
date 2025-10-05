# Complete Wix Bookings Dual-Payment System - IDE Setup Guide

## 🎯 Overview
This system allows customers to choose between **Pay Deposit** or **Pay Full Amount** for bookings, with seamless integration between Wix Bookings and Wix Stores.

---

## 📁 File Structure for Wix IDE

### Backend Files (Place in Backend folder)
```
Backend/
└── bookingBridge.jsw
```

### Page Code Files (Copy to respective pages)
```
Pages/
├── serviceSelectionPage.js      # Original service selection
├── enhancedServicePage.js       # Enhanced with dual-payment
├── serviceItemPage.js           # CMS-based service items  
├── dynamicServicePage.js        # Wix Bookings dynamic pages
└── bookingPage.js              # Booking calendar page
```

### HTML Iframe Files (Upload to Media Manager or host externally)
```
Media/HTML-Files/
├── calendar.html               # VX Glass calendar iframe
└── bookingAddon.html          # VX Glass add-ons iframe
```

### Configuration Files
```
Site Files/
├── permissions.json           # Backend permissions
└── wix-stores-products.json   # Product configuration template
```

---

## 🚀 Step-by-Step Wix IDE Setup

### STEP 1: Backend Setup

1. **Open Wix IDE → Backend Folder**
2. **Create/Edit `bookingBridge.jsw`**
3. **Copy the complete backend code:**

```javascript
// Copy from: /backend/bookingBridge.jsw
import { webMethod, Permissions } from 'wix-web-module';
import { availabilityCalendar } from 'wix-bookings.v2';
import wixBookingsBackend from 'wix-bookings-backend';
import { contacts } from 'wix-crm-backend';

// [PASTE COMPLETE BACKEND CODE HERE]
```

4. **Set Permissions in IDE:**
   - Go to **Backend Permissions**
   - Add: `getAvailability: { role: "anyone" }`

### STEP 2: Wix Stores Product Setup

1. **Go to Wix Stores Dashboard**
2. **Create Products for Each Service:**

**Example for Haircut Service ($150):**
```javascript
// Deposit Product
{
  "name": "Haircut & Style - Deposit",
  "price": 45,                    // 30% of $150
  "sku": "deposit-haircut-001",
  "type": "Service",
  "description": "Deposit for Haircut & Style appointment. Remaining $105 due at appointment."
}

// Full Payment Product  
{
  "name": "Haircut & Style - Full Payment", 
  "price": 150,
  "sku": "full-haircut-001",
  "type": "Service",
  "description": "Complete payment for Haircut & Style appointment."
}
```

3. **Repeat for All Services:**
   - Color Service: `deposit-color-001`, `full-color-001`
   - Extensions: `deposit-extensions-001`, `full-extensions-001`
   - etc.

### STEP 3: Content Management Setup

1. **Go to Content Manager → Services Collection**
2. **Add New Fields:**

```javascript
// Add these fields to your Services collection:
{
  "_id": "service-001",
  "title": "Haircut & Style",
  "price": 150,                           // Full service price
  "deposit": 45,                          // Deposit amount (30%)
  "duration": 90,                         // Duration in minutes
  "depositProductId": "deposit-haircut-001",     // Wix Stores deposit product ID
  "fullPaymentProductId": "full-haircut-001"     // Wix Stores full payment product ID
}
```

### STEP 4: Service Page Setup

1. **Choose Your Service Page Type:**
   - **Custom Service Page**: Use `serviceSelectionPage.js`
   - **Enhanced Dual-Payment**: Use `enhancedServicePage.js` ⭐ **RECOMMENDED**
   - **CMS Service Items**: Use `serviceItemPage.js`
   - **Wix Bookings Dynamic**: Use `dynamicServicePage.js`

2. **Add Page Elements (for Enhanced Service Page):**

```html
<!-- Add these elements to your service page in Wix IDE -->

<!-- Service Information Display -->
<wix-text id="serviceName">Service Name</wix-text>
<wix-text id="fullPrice">$150</wix-text>
<wix-text id="depositAmount">$45</wix-text>
<wix-text id="serviceDuration">90 minutes</wix-text>
<wix-text id="savingsAmount">Save $105 now, pay $105 later</wix-text>

<!-- Main Action Buttons -->
<wix-button id="bookNowBtn">Book Now</wix-button>
<wix-button id="addToCartBtn">Add to Cart</wix-button>

<!-- Payment Options Modal/Section -->
<wix-section id="paymentOptionsSection" hidden>
  <wix-text>Choose Your Payment Option</wix-text>
  <wix-button id="depositOption">Pay Deposit ($45)</wix-button>
  <wix-button id="fullPaymentOption">Pay Full Amount ($150)</wix-button>
  <wix-button id="closePaymentModal">Cancel</wix-button>
</wix-section>

<!-- Alternative: Direct Payment Buttons -->
<wix-button id="bookDepositBtn">Book with Deposit</wix-button>
<wix-button id="bookFullBtn">Book & Pay Full</wix-button>
<wix-button id="addDepositCartBtn">Add Deposit to Cart</wix-button>
<wix-button id="addFullCartBtn">Add Full Payment to Cart</wix-button>

<!-- Status Messages -->
<wix-text id="loadingMessage" hidden>Processing...</wix-text>
<wix-text id="successMessage" hidden>Success!</wix-text>
<wix-text id="errorMessage" hidden>Error occurred</wix-text>
```

3. **Copy Enhanced Service Page Code to Page:**
```javascript
// Copy from: /pages/enhancedServicePage.js
// [PASTE COMPLETE PAGE CODE HERE]
```

### STEP 5: Booking Calendar Page Setup

1. **Create New Page: `/booking-calendar`**
2. **Add HTML Iframe Elements:**

```html
<!-- Add these iframes to your booking calendar page -->
<wix-html-iframe id="htmlCalendar" 
                 src="[YOUR-CALENDAR-HTML-URL]"
                 width="100%" 
                 height="600px">
</wix-html-iframe>

<wix-html-iframe id="htmlAddons" 
                 src="[YOUR-ADDONS-HTML-URL]"
                 width="100%" 
                 height="600px">
</wix-html-iframe>

<!-- Payment Information Display -->
<wix-text id="serviceNameText">Service Name</wix-text>
<wix-text id="servicePriceText">Price: $150</wix-text>
<wix-text id="serviceDurationText">Duration: 90 minutes</wix-text>
<wix-text id="paymentTypeText">Payment Type</wix-text>
<wix-text id="paymentAmountText">Amount: $45</wix-text>
<wix-text id="remainingBalanceText" hidden>Remaining: $105</wix-text>

<!-- Status Section -->
<wix-section id="paymentStatusSection" hidden>
  <!-- Payment status information -->
</wix-section>
```

3. **Copy Booking Page Code:**
```javascript
// Copy from: /pages/bookingPage.js
// [PASTE COMPLETE BOOKING PAGE CODE]
```

### STEP 6: HTML Iframe Files Setup

1. **Upload HTML Files to Media Manager:**
   - Go to **Media Manager** in Wix IDE
   - Create folder: `HTML-Files`
   - Upload `calendar.html` and `bookingAddon.html`

2. **Or Host Externally:**
   - Upload to your web server
   - Use HTTPS URLs
   - Ensure CORS is properly configured

3. **Update Iframe Sources:**
```javascript
// In your booking page, set iframe sources to:
const calendarUrl = "https://your-domain.com/calendar.html";
const addonsUrl = "https://your-domain.com/bookingAddon.html";

// Or from Wix Media:
const calendarUrl = "https://static.wixstatic.com/[your-media-url]/calendar.html";
```

### STEP 7: Wix Settings Configuration

1. **Wix Stores Settings:**
   - ✅ Enable "Persistent Cart"
   - ✅ Set "Cart Expiration" to 24 hours
   - ✅ Enable "Allow services with products"

2. **Wix Bookings Settings:**
   - ✅ Enable "Online Bookings"
   - ✅ Set up booking policies
   - ✅ Configure cancellation rules for deposits vs. full payments

3. **Site Permissions:**
```json
{
  "backend/bookingBridge.jsw": {
    "getAvailability": { "role": "anyone" },
    "createBooking": { "role": "anyone" },
    "processBookingPayment": { "role": "anyone" }
  }
}
```

---

## 🎨 UI/UX Customization

### Theme Colors (CSS Custom Properties)
```css
:root {
  --accent: #FF93FD;        /* Pink accent color */
  --lux: #E0C6A8;           /* Luxury gold color */
  --txt: rgba(255,255,255,.96);  /* Text color */
  --glass: rgba(255,255,255,.07); /* Glass background */
}
```

### Customize via URL Parameters:
```
?accent=%23FF00FF&lux=%23GOLD&txt=%23FFFFFF
```

---

## 🧪 Testing Checklist

### Test Payment Options:
- [ ] **Book Now + Deposit** → Adds deposit product + goes to booking
- [ ] **Book Now + Full** → Adds full payment product + goes to booking  
- [ ] **Add to Cart + Deposit** → Adds deposit product to cart only
- [ ] **Add to Cart + Full** → Adds full payment product to cart only

### Test Booking Flow:
- [ ] Service selection works
- [ ] Payment choice persists through booking
- [ ] Calendar shows availability
- [ ] Add-ons calculate correctly
- [ ] Booking creates with correct payment status

### Test Cart Integration:
- [ ] Products add to cart successfully
- [ ] Cart persists across pages
- [ ] Multiple services can coexist in cart
- [ ] Checkout processes correctly

---

## 🔧 Troubleshooting Common Issues

### Issue: "Function not found"
**Solution:** Check backend permissions in IDE

### Issue: "Cart not working"
**Solution:** Verify Wix Stores products exist with correct SKUs

### Issue: "Iframe not loading"
**Solution:** Check HTTPS URLs and CORS settings

### Issue: "Payment data not persisting"
**Solution:** Verify session storage and URL parameter handling

---

## 📞 Support Resources

- **Wix Bookings API**: [https://dev.wix.com/api/rest/wix-bookings](https://dev.wix.com/api/rest/wix-bookings)
- **Wix Stores API**: [https://dev.wix.com/api/rest/wix-stores](https://dev.wix.com/api/rest/wix-stores)
- **Wix Code Documentation**: [https://dev.wix.com/docs](https://dev.wix.com/docs)

---

## 🎉 You're Ready!

After completing all steps, you'll have a professional dual-payment booking system with:
- ✅ Beautiful VX Glass UI design
- ✅ Flexible payment options (deposit/full)
- ✅ Seamless Wix Bookings + Stores integration
- ✅ Mobile-responsive interface
- ✅ Professional booking flow

**Happy booking! 🚀**