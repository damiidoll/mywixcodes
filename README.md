# Wix Booking Integration Project

This project contains the code files for integrating custom booking functionality with Wix Bookings.

## File Structure

```
/backend/
  └── bookingBridge.jsw         # Backend Wix code for booking integration & availability
/pages/
  ├── serviceSelectionPage.js   # Custom service page with dataset integration
  ├── serviceItemPage.js        # Service item page with CMS dataset
  ├── dynamicServicePage.js     # Bookings app dynamic service page
  └── bookingPage.js           # Custom booking calendar page
/iframes/
  ├── calendar.html            # Calendar iframe component
  └── bookingAddon.html        # Booking form/add-on iframe component
```

## How to Use These Files in Wix

### 1. Backend Code (bookingBridge.jsw)
- Go to your Wix Editor → Code Panel (Dev Mode)
- Navigate to Backend → Add a new .jsw file named "bookingBridge"
- Copy the content from `/backend/bookingBridge.jsw`
- Add the `getAvailability` function for your service availability

### 2. Service Pages (Choose the appropriate one)
- **Custom Service Page**: Use `/pages/serviceSelectionPage.js` for service selection with datasets
- **Service Item Page**: Use `/pages/serviceItemPage.js` for CMS-based service items
- **Dynamic Service Page**: Use `/pages/dynamicServicePage.js` for Wix Bookings app pages

### 3. Booking Calendar Page
- Create a new page in Wix Editor (e.g., `/booking-calendar`)
- Add two HTML iframe elements with IDs: `#htmlCalendar` and `#htmlAddons`
- Copy the content from `/pages/bookingPage.js` to the page code

### 4. Iframe Components
- Upload the HTML files (`calendar.html`, `bookingAddon.html`) to your Wix site or host externally
- Set the iframe sources to point to your hosted HTML files
- Ensure the iframe IDs match: `#htmlCalendar` and `#htmlAddons`

## Integration Steps

1. **Replace placeholder code** with your actual implementation in each file
2. **Set up iframe communication** using postMessage API
3. **Configure Wix Bookings** integration in the backend code
4. **Test the communication** between all components

## Complete Booking Flow with Dual-Payment System

```
1. Enhanced Service Selection Page
   ├── User views service with pricing options
   ├── Chooses payment method:
   │   ├── Pay Deposit (30% now, rest later)
   │   └── Pay Full Amount (100% upfront)
   ├── Selects action:
   │   ├── Book Now (→ booking calendar)
   │   └── Add to Cart (→ Wix Stores cart)
   └── Payment data stored in session
   
2. Wix Stores Integration (if Add to Cart)
   ├── Adds deposit/full payment product to cart
   ├── Customer can continue shopping
   ├── Cart persists across sessions
   └── Checkout processes payment
   
3. Booking Calendar Page
   ├── Loads service + payment data from URL/session
   ├── Displays payment choice (deposit/full)
   ├── Shows remaining balance (if deposit)
   ├── Sends enhanced data to both iframes
   └── Handles booking with payment status
   
4. Calendar Iframe (VX Glass Design)
   ├── Beautiful glass morphism UI
   ├── Shows availability with dots
   ├── Month navigation with animations
   └── Time slot selection with "Load More"
   
5. Add-ons Iframe (VX Glass Design)
   ├── Hair salon specific add-ons
   ├── Real-time price calculations
   ├── Elegant selection interface
   └── Sends addon data to parent
   
6. Backend (bookingBridge.jsw)
   ├── Processes payment-aware bookings
   ├── Handles deposit vs. full payment status
   ├── Integrates with Wix Bookings + Stores
   └── Creates booking with correct payment state
```

## Data Flow

```
Service Selection → Session Storage → Booking Page → Both Iframes
                                         ↓
Calendar Iframe → Date Selection → Booking Page → Add-on Iframe
                                         ↓
Add-on Iframe → Complete Booking Data → Booking Page → Backend
                                                          ↓
Backend → Wix Bookings API → Booking Confirmation → Frontend
```

## Next Steps

1. Paste your actual code into the appropriate template files
2. Update the communication logic between components
3. Test the integration step by step
4. Deploy to your Wix site

## Support Links

- [Wix Bookings API Documentation](https://dev.wix.com/api/rest/wix-bookings)
- [Wix Code Documentation](https://dev.wix.com/docs)
- [postMessage API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)