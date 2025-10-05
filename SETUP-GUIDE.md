# Wix Bookings Dual-Payment System Setup Guide

## Overview
This guide helps you set up a dual-payment system for Wix Bookings where customers can choose between:
- **Pay Deposit** (e.g., 30% now, rest later)
- **Pay Full Amount** (complete payment upfront)

## Step 1: Wix Stores Product Setup

### Create Payment Products
You need to create products in Wix Stores for each payment option:

1. **Go to Wix Stores Dashboard**
2. **Create Deposit Products:**
   - Product Name: "[Service Name] - Deposit"
   - Price: Your deposit amount (e.g., $50 for a $150 service)
   - SKU: `deposit-[service-id]` (e.g., `deposit-haircut-001`)
   - Type: "Service" or "Digital"

3. **Create Full Payment Products:**
   - Product Name: "[Service Name] - Full Payment"
   - Price: Your full service price
   - SKU: `full-[service-id]` (e.g., `full-haircut-001`)
   - Type: "Service" or "Digital"

### Example Products:
```
Haircut Service ($150):
├── Haircut Deposit Product ($45) - SKU: deposit-haircut-001
└── Haircut Full Payment Product ($150) - SKU: full-haircut-001

Color Service ($200):
├── Color Deposit Product ($60) - SKU: deposit-color-001
└── Color Full Payment Product ($200) - SKU: full-color-001
```

## Step 2: Service Dataset Configuration

### Add Fields to Your Service Collection
In your Wix Content Manager, add these fields to your services collection:

```javascript
// Required fields for dual-payment system:
{
  "_id": "service-001",
  "title": "Haircut & Style",
  "price": 150,              // Full service price
  "deposit": 45,             // Deposit amount (30% of full price)
  "duration": 90,            // Service duration in minutes
  "depositProductId": "deposit-haircut-001",    // Wix Stores deposit product ID
  "fullPaymentProductId": "full-haircut-001"    // Wix Stores full payment product ID
}
```

## Step 3: Page Elements Setup

### Add These Elements to Your Service Page:

```html
<!-- Main action buttons -->
<wix-button id="bookNowBtn">Book Now</wix-button>
<wix-button id="addToCartBtn">Add to Cart</wix-button>

<!-- Direct payment buttons (alternative layout) -->
<wix-button id="bookDepositBtn">Book with Deposit ($45)</wix-button>
<wix-button id="bookFullBtn">Book & Pay Full ($150)</wix-button>
<wix-button id="addDepositCartBtn">Add Deposit to Cart</wix-button>
<wix-button id="addFullCartBtn">Add Full Payment to Cart</wix-button>

<!-- Service information display -->
<wix-text id="serviceName">Service Name</wix-text>
<wix-text id="fullPrice">$150</wix-text>
<wix-text id="depositAmount">$45</wix-text>
<wix-text id="serviceDuration">90 minutes</wix-text>
<wix-text id="savingsAmount">Save $105 now, pay $105 later</wix-text>

<!-- Payment options modal/section -->
<wix-section id="paymentOptionsSection" hidden>
  <wix-text>Choose Payment Option</wix-text>
  <wix-button id="depositOption">Pay Deposit Only</wix-button>
  <wix-button id="fullPaymentOption">Pay Full Amount</wix-button>
  <wix-button id="closePaymentModal">Cancel</wix-button>
</wix-section>

<!-- Status messages -->
<wix-text id="loadingMessage" hidden>Processing...</wix-text>
<wix-text id="successMessage" hidden>Success!</wix-text>
<wix-text id="errorMessage" hidden>Error occurred</wix-text>
```

## Step 4: Wix Settings Configuration

### Enable Cart Persistence
1. **Go to Wix Stores Settings**
2. **Enable "Persistent Cart"**
3. **Set "Cart Expiration" to desired time (e.g., 24 hours)**

### Configure Bookings + Stores Integration
1. **Go to Wix Bookings Settings**
2. **Enable "Allow customers to purchase services through Wix Stores"**
3. **Set up your booking policies for deposits vs. full payments**

## Step 5: Payment Processing Setup

### Deposit Payment Flow:
```javascript
Customer pays deposit ($45) → Books appointment → Pays remaining ($105) at appointment
```

### Full Payment Flow:
```javascript
Customer pays full amount ($150) → Books appointment → No additional payment needed
```

## Step 6: Backend Integration

### Update your bookingBridge.jsw:

```javascript
// Add to your existing bookingBridge.jsw
export const processBookingPayment = webMethod(Permissions.Anyone, async (bookingData) => {
  try {
    const { paymentType, serviceId, customerId } = bookingData;
    
    if (paymentType === 'deposit') {
      // Create booking with deposit status
      const booking = await createBookingWithDeposit(serviceId, customerId);
      return { success: true, booking, remainingAmount: booking.remainingBalance };
    } else {
      // Create booking as fully paid
      const booking = await createFullyPaidBooking(serviceId, customerId);
      return { success: true, booking, remainingAmount: 0 };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

async function createBookingWithDeposit(serviceId, customerId) {
  // Your logic for deposit bookings
  return await wixBookingsBackend.createBooking({
    serviceId,
    contactId: customerId,
    paymentStatus: 'PARTIALLY_PAID',
    // ... other booking details
  });
}

async function createFullyPaidBooking(serviceId, customerId) {
  // Your logic for full payment bookings
  return await wixBookingsBackend.createBooking({
    serviceId,
    contactId: customerId,
    paymentStatus: 'PAID',
    // ... other booking details
  });
}
```

## Step 7: Testing Your Setup

### Test Scenarios:
1. **Book Now + Deposit:** Should add deposit product to cart and proceed to booking
2. **Book Now + Full:** Should add full payment product to cart and proceed to booking
3. **Add to Cart + Deposit:** Should add deposit product to cart only
4. **Add to Cart + Full:** Should add full payment product to cart only

### Verification Checklist:
- [ ] Products created in Wix Stores
- [ ] Service dataset has deposit and product ID fields
- [ ] Page elements are properly connected
- [ ] Cart persistence is enabled
- [ ] Payment processing works for both options
- [ ] Booking creation handles payment status correctly

## Implementation Tips

### 1. **Pricing Strategy:**
```javascript
// Common deposit percentages:
const depositPercentages = {
  'haircut': 0.30,      // 30%
  'color': 0.50,        // 50%
  'extensions': 0.40    // 40%
};
```

### 2. **UI/UX Best Practices:**
- Clearly show savings with deposit option
- Display remaining balance due
- Provide payment timeline information
- Show refund/cancellation policies

### 3. **Error Handling:**
- Fallback to booking page if cart fails
- Clear error messages for users
- Retry mechanisms for failed payments

This setup gives you a complete dual-payment system that integrates Wix Bookings with Wix Stores seamlessly!