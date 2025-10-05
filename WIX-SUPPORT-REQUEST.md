# 🎯 Wix IDE Support Request - Dual-Payment Booking System

## 📋 **Issue Summary**
I need help implementing a dual-payment booking system that integrates **Wix Bookings** with **Wix Stores**. Customers should be able to choose between:
- **Pay Deposit** (e.g., 30% now, rest at appointment)
- **Pay Full Amount** (100% upfront)

Each service should have **Book Now** and **Add to Cart** buttons with payment options.

## 🔧 **What I'm Trying to Achieve**

### **Service Page Flow:**
```
Service Page → [Book Now] or [Add to Cart]
     ↓               ↓
Choose Payment   Choose Payment
[Deposit/Full]   [Deposit/Full]
     ↓               ↓
Booking Calendar   Wix Stores Cart
```

### **Integration Points:**
- ✅ Wix Bookings for appointment scheduling
- ✅ Wix Stores for cart/payment processing
- ✅ Custom calendar with VX Glass design
- ✅ Add-ons system for hair salon services

## 📁 **Repository Structure**

### **Backend Code:**
- `backend/bookingBridge.jsw` - Main booking logic with `getAvailability()` function

### **Page Code Files:**
- `pages/enhancedServicePage.js` - Service selection with dual-payment options
- `pages/bookingPage.js` - Booking calendar page with iframe communication
- `pages/serviceItemPage.js` - CMS-based service items
- `pages/dynamicServicePage.js` - Wix Bookings dynamic pages

### **HTML Iframe Components:**
- `iframes/calendar.html` - VX Glass calendar with availability
- `iframes/bookingAddon.html` - VX Glass add-ons selection

### **Configuration:**
- `permissions.json` - Backend function permissions
- `WIX-IDE-SETUP-GUIDE.md` - Complete implementation guide

## 🆘 **Specific Help Needed**

### **1. Wix Bookings + Stores Integration**
- How to properly link booking services with store products
- Cart persistence for booking items
- Payment status handling (deposit vs. full payment)

### **2. Dataset Configuration**
- Best practices for service data structure
- Product ID linking between Bookings and Stores
- Pricing calculations for deposits

### **3. Iframe Communication**
- Ensuring `postMessage` works correctly between parent and iframes
- Availability data flow from backend to calendar
- Add-ons data synchronization

### **4. Backend Function Setup**
- Proper permissions for `getAvailability()` function
- Integration with `wix-bookings.v2` API
- Error handling and fallbacks

## 🎯 **Current Status**

### **✅ What's Working:**
- Code structure is complete
- VX Glass UI design is implemented
- Backend availability function is coded
- Payment choice logic is built

### **❓ What Needs Help:**
- Wix IDE implementation guidance
- Product/service linking configuration  
- Testing the complete booking flow
- Troubleshooting any integration issues

## 📖 **Implementation Guide**
Please see `WIX-IDE-SETUP-GUIDE.md` for detailed step-by-step instructions.

## 🔗 **Repository Link**
**GitHub:** `https://github.com/damiidoll/mywixcodes`

---

**Thank you for your help! Please let me know what additional information you need to assist with this implementation.** 🙏