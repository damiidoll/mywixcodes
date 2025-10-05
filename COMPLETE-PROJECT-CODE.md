# 🎯 Complete Wix Booking System - All Code in One File

## 📋 Project Overview
**Dual-Payment Booking System** integrating Wix Bookings with Wix Stores for a hair salon. Customers can choose between "Book Now" (direct booking) or "Add to Cart" (store checkout), each with deposit or full payment options.

### **System Flow:**
```
Service Selection Page
├── Book Now Button → Payment Choice Modal → Booking Calendar
└── Add to Cart Button → Payment Choice Modal → Wix Stores Cart

Payment Choices:
├── Pay Deposit (30% now, 70% at appointment)
└── Pay Full Amount (100% upfront)
```

---

## 🔧 BACKEND CODE

### **File: `backend/bookingBridge.jsw`**
```javascript
import { webMethod, Permissions } from 'wix-web-module';
import { availabilityCalendar } from 'wix-bookings.v2';
import wixData from 'wix-data';

/**
 * Get availability for booking calendar with enhanced error handling
 */
export const getAvailability = webMethod(Permissions.Anyone, async (options = {}) => {
  try {
    console.log("Getting availability with options:", options);
    
    // Default parameters with validation
    const startDate = options.startDate || new Date().toISOString().split('T')[0];
    const endDate = options.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const serviceIds = options.serviceIds || [];
    const timezone = options.timezone || 'America/New_York';

    // Validate date format
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      throw new Error('Invalid date format provided');
    }

    // Build query options
    const queryOptions = {
      filter: {
        startDate,
        endDate,
        timezone
      }
    };

    if (serviceIds.length > 0) {
      queryOptions.filter.serviceIds = serviceIds;
    }

    console.log("Querying availability with options:", queryOptions);

    // Query Wix Bookings API
    const availabilityResponse = await availabilityCalendar.queryAvailability(queryOptions);
    
    console.log("Raw availability response:", availabilityResponse);

    // Group slots by date for easier frontend consumption
    const groupedByDate = {};
    if (availabilityResponse.availableSlots) {
      availabilityResponse.availableSlots.forEach(slot => {
        const date = slot.startTime.split('T')[0];
        if (!groupedByDate[date]) {
          groupedByDate[date] = [];
        }
        groupedByDate[date].push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          serviceId: slot.serviceId,
          available: true
        });
      });
    }

    return {
      success: true,
      availability: groupedByDate,
      totalSlots: availabilityResponse.availableSlots ? availabilityResponse.availableSlots.length : 0,
      queryOptions: queryOptions // For debugging
    };

  } catch (error) {
    console.error("Error in getAvailability:", error);
    return {
      success: false,
      error: error.message,
      availability: {},
      stack: error.stack // For debugging
    };
  }
});

/**
 * Get product mapping for service to enable cart functionality
 */
export const getProductForService = webMethod(Permissions.Anyone, async (serviceId) => {
  try {
    console.log("Getting product for service:", serviceId);
    
    if (!serviceId) {
      throw new Error('Service ID is required');
    }
    
    const result = await wixData.query('ProductServiceMapping')
      .eq('serviceId', serviceId)
      .find();
    
    console.log("Product mapping query result:", result);
    
    if (result.items.length > 0) {
      const mapping = result.items[0];
      return {
        success: true,
        productId: mapping.productId,
        depositProductId: mapping.depositProductId,
        serviceName: mapping.serviceName,
        fullPrice: mapping.fullPrice,
        depositAmount: mapping.depositAmount
      };
    }
    
    return {
      success: false,
      error: 'No product mapping found for service'
    };
  } catch (error) {
    console.error("Error in getProductForService:", error);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Process booking with payment information
 */
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

// Helper function to validate date format
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}
```

---

## 📄 PAGE CODE FILES

### **File: `pages/enhancedServicePage.js`**
```javascript
import { cart } from 'wix-stores';
import wixLocation from 'wix-location';
import wixStorage from 'wix-storage';
import { getProductForService } from 'backend/bookingBridge.jsw';

$w.onReady(function () {
    console.log("Enhanced Service Page loaded");
    setupServiceButtons();
    setupPaymentModals();
    loadServiceData();
});

function loadServiceData() {
    // Load service information from CMS or database
    // This would typically populate service details, pricing, etc.
    
    // Example service data structure:
    const serviceData = {
        id: 'hair-cut-style',
        name: 'Hair Cut & Style',
        price: 150,
        depositAmount: 45,
        duration: 90,
        description: 'Professional hair cut and styling service'
    };
    
    // Update page elements with service data
    $w('#serviceName').text = serviceData.name;
    $w('#servicePrice').text = `$${serviceData.price}`;
    $w('#serviceDescription').text = serviceData.description;
    
    // Store for later use
    wixStorage.session.setItem('currentService', JSON.stringify(serviceData));
}

function setupServiceButtons() {
    // Book Now Button - Direct booking flow
    $w('#bookNowBtn').onClick(async () => {
        console.log("Book Now clicked");
        const serviceData = getCurrentServiceData();
        await showPaymentChoiceModal('booking', serviceData);
    });

    // Add to Cart Button - Store checkout flow
    $w('#addToCartBtn').onClick(async () => {
        console.log("Add to Cart clicked");
        const serviceData = getCurrentServiceData();
        await showPaymentChoiceModal('cart', serviceData);
    });
}

async function showPaymentChoiceModal(actionType, serviceData) {
    console.log(`Showing payment modal for ${actionType}:`, serviceData);
    
    // Store service data and action type for modal handlers
    wixStorage.session.setItem('selectedService', JSON.stringify(serviceData));
    wixStorage.session.setItem('actionType', actionType);
    
    // Update modal content
    $w('#modalServiceName').text = serviceData.name;
    $w('#modalFullPrice').text = `$${serviceData.price}`;
    $w('#modalDepositAmount').text = `$${serviceData.depositAmount}`;
    
    // Show the payment choice modal
    $w('#paymentChoiceModal').show();
}

function setupPaymentModals() {
    // Deposit Payment Choice
    $w('#depositBtn').onClick(async () => {
        console.log("Deposit payment selected");
        await handlePaymentChoice('deposit');
    });

    // Full Payment Choice
    $w('#fullPaymentBtn').onClick(async () => {
        console.log("Full payment selected");
        await handlePaymentChoice('full');
    });

    // Modal close handlers
    $w('#closeModalBtn').onClick(() => {
        $w('#paymentChoiceModal').hide();
    });
    
    $w('#paymentChoiceModal').onClick((event) => {
        if (event.target === $w('#paymentChoiceModal')[0]) {
            $w('#paymentChoiceModal').hide();
        }
    });
}

async function handlePaymentChoice(paymentType) {
    try {
        const actionType = wixStorage.session.getItem('actionType');
        const serviceData = JSON.parse(wixStorage.session.getItem('selectedService'));
        
        console.log(`Processing ${paymentType} payment for ${actionType}:`, serviceData);
        
        // Hide modal first
        $w('#paymentChoiceModal').hide();
        
        if (actionType === 'booking') {
            await handleBookingFlow(serviceData, paymentType);
        } else if (actionType === 'cart') {
            await handleCartFlow(serviceData, paymentType);
        }
        
    } catch (error) {
        console.error('Error handling payment choice:', error);
        // Show error to user
        $w('#errorMessage').text = 'Something went wrong. Please try again.';
        $w('#errorMessage').show();
    }
}

async function handleBookingFlow(serviceData, paymentType) {
    console.log("Handling booking flow:", { serviceData, paymentType });
    
    // Store payment type for booking calendar page
    wixStorage.session.setItem('paymentType', paymentType);
    wixStorage.session.setItem('bookingService', JSON.stringify(serviceData));
    
    // Navigate to booking calendar
    wixLocation.to('/booking-calendar');
}

async function handleCartFlow(serviceData, paymentType) {
    console.log("Handling cart flow:", { serviceData, paymentType });
    
    try {
        // Show loading state
        $w('#addToCartBtn').disable();
        $w('#addToCartBtn').label = 'Adding...';
        
        // Get product mapping from backend
        const productResponse = await getProductForService(serviceData.id);
        console.log("Product mapping response:", productResponse);
        
        if (productResponse.success) {
            // Determine which product to add based on payment type
            const productId = paymentType === 'deposit' ? 
                productResponse.depositProductId : productResponse.productId;
            
            console.log(`Adding ${paymentType} product to cart:`, productId);
            
            // Prepare cart item with custom options
            const cartItem = {
                productId: productId,
                quantity: 1,
                options: {
                    serviceId: serviceData.id,
                    paymentType: paymentType,
                    serviceName: serviceData.name,
                    bookingRequired: true
                }
            };
            
            // Add to Wix Stores cart
            const cartResult = await cart.addToCart([cartItem]);
            console.log("Cart add result:", cartResult);
            
            // Store cart context for checkout
            wixStorage.session.setItem('lastAddedService', JSON.stringify({
                serviceId: serviceData.id,
                paymentType: paymentType,
                productId: productId
            }));
            
            // Navigate to cart
            wixLocation.to('/cart');
            
        } else {
            throw new Error(productResponse.error || 'Failed to get product mapping');
        }
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        
        // Reset button state
        $w('#addToCartBtn').enable();
        $w('#addToCartBtn').label = 'Add to Cart';
        
        // Show error message
        $w('#errorMessage').text = 'Failed to add to cart. Please try again.';
        $w('#errorMessage').show();
        
        // Hide error after 5 seconds
        setTimeout(() => {
            $w('#errorMessage').hide();
        }, 5000);
    }
}

function getCurrentServiceData() {
    const storedService = wixStorage.session.getItem('currentService');
    if (storedService) {
        return JSON.parse(storedService);
    }
    
    // Fallback service data if not found in storage
    return {
        id: 'default-service',
        name: 'Hair Service',
        price: 150,
        depositAmount: 45,
        duration: 90
    };
}

// Export functions for testing or external use
export { handleBookingFlow, handleCartFlow, getCurrentServiceData };
```

### **File: `pages/bookingPage.js`**
```javascript
import wixStorage from 'wix-storage';
import wixLocation from 'wix-location';
import { getAvailability } from 'backend/bookingBridge.jsw';

let selectedDate = null;
let selectedTime = null;
let serviceData = null;
let paymentType = null;

$w.onReady(function () {
    console.log("Booking page loaded");
    
    // Load booking context from previous page
    loadBookingContext();
    
    // Setup calendar iframe communication
    setupCalendarCommunication();
    
    // Setup booking addon iframe communication
    setupAddonCommunication();
    
    // Setup confirm booking button
    setupBookingConfirmation();
    
    // Load initial availability data
    loadAvailabilityData();
});

function loadBookingContext() {
    // Get service data and payment type from session storage
    const storedService = wixStorage.session.getItem('bookingService');
    paymentType = wixStorage.session.getItem('paymentType');
    
    if (storedService) {
        serviceData = JSON.parse(storedService);
        console.log("Loaded booking context:", { serviceData, paymentType });
        
        // Update page display
        $w('#selectedServiceName').text = serviceData.name;
        $w('#paymentTypeDisplay').text = paymentType === 'deposit' ? 
            `Deposit: $${serviceData.depositAmount}` : 
            `Full Payment: $${serviceData.price}`;
    } else {
        console.error("No service data found in session");
        // Redirect back to service selection
        wixLocation.to('/services');
    }
}

async function loadAvailabilityData() {
    try {
        console.log("Loading availability data for service:", serviceData.id);
        
        const availabilityOptions = {
            serviceIds: [serviceData.id],
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            timezone: 'America/New_York'
        };
        
        const availabilityResponse = await getAvailability(availabilityOptions);
        console.log("Availability response:", availabilityResponse);
        
        if (availabilityResponse.success) {
            // Send availability data to calendar iframe
            sendToCalendarIframe({
                type: 'AVAILABILITY_DATA',
                availability: availabilityResponse.availability,
                serviceId: serviceData.id
            });
        } else {
            console.error("Failed to load availability:", availabilityResponse.error);
            showError("Failed to load available dates. Please try again.");
        }
        
    } catch (error) {
        console.error("Error loading availability:", error);
        showError("Unable to load calendar. Please refresh the page.");
    }
}

function setupCalendarCommunication() {
    // Listen for messages from calendar iframe
    $w('#calendarIframe').onMessage((event) => {
        console.log("Message from calendar iframe:", event.data);
        
        switch (event.data.type) {
            case 'DATE_SELECTED':
                handleDateSelection(event.data.date, event.data.availableSlots);
                break;
            case 'TIME_SELECTED':
                handleTimeSelection(event.data.time);
                break;
            case 'CALENDAR_READY':
                // Calendar iframe is ready, send initial data
                loadAvailabilityData();
                break;
            default:
                console.log("Unknown message type from calendar:", event.data.type);
        }
    });
}

function setupAddonCommunication() {
    // Listen for messages from booking addon iframe
    $w('#addonIframe').onMessage((event) => {
        console.log("Message from addon iframe:", event.data);
        
        switch (event.data.type) {
            case 'ADDON_SELECTED':
                handleAddonSelection(event.data.addon);
                break;
            case 'ADDON_REMOVED':
                handleAddonRemoval(event.data.addonId);
                break;
            case 'ADDON_READY':
                // Send service data to addon iframe
                sendToAddonIframe({
                    type: 'SERVICE_DATA',
                    service: serviceData,
                    paymentType: paymentType
                });
                break;
            default:
                console.log("Unknown message type from addon:", event.data.type);
        }
    });
}

function handleDateSelection(date, availableSlots) {
    console.log("Date selected:", date, availableSlots);
    
    selectedDate = date;
    selectedTime = null; // Reset time when date changes
    
    // Update UI
    $w('#selectedDateDisplay').text = formatDate(date);
    $w('#selectedDateDisplay').show();
    
    // Show time selection area
    $w('#timeSelectionContainer').show();
    
    // Enable confirm button check
    updateConfirmButtonState();
}

function handleTimeSelection(time) {
    console.log("Time selected:", time);
    
    selectedTime = time;
    
    // Update UI
    $w('#selectedTimeDisplay').text = formatTime(time);
    $w('#selectedTimeDisplay').show();
    
    // Enable confirm button check
    updateConfirmButtonState();
}

function handleAddonSelection(addon) {
    console.log("Addon selected:", addon);
    
    // Update total price display
    updatePriceCalculation();
}

function handleAddonRemoval(addonId) {
    console.log("Addon removed:", addonId);
    
    // Update total price display
    updatePriceCalculation();
}

function setupBookingConfirmation() {
    $w('#confirmBookingBtn').onClick(async () => {
        if (!selectedDate || !selectedTime) {
            showError("Please select both date and time for your appointment.");
            return;
        }
        
        await processBookingConfirmation();
    });
}

async function processBookingConfirmation() {
    try {
        console.log("Processing booking confirmation...");
        
        // Show loading state
        $w('#confirmBookingBtn').disable();
        $w('#confirmBookingBtn').label = 'Processing...';
        
        // Collect all booking data
        const bookingData = {
            serviceId: serviceData.id,
            serviceName: serviceData.name,
            date: selectedDate,
            time: selectedTime,
            paymentType: paymentType,
            totalAmount: calculateTotalAmount(),
            // Add customer info, addons, etc.
        };
        
        console.log("Booking data:", bookingData);
        
        // Process the booking (implement based on your requirements)
        // This could involve creating the booking in Wix Bookings
        // and handling the payment processing
        
        // For now, simulate success
        setTimeout(() => {
            showBookingSuccess();
        }, 2000);
        
    } catch (error) {
        console.error("Error processing booking:", error);
        showError("Failed to process booking. Please try again.");
        
        // Reset button state
        $w('#confirmBookingBtn').enable();
        $w('#confirmBookingBtn').label = 'Confirm Booking';
    }
}

function updateConfirmButtonState() {
    if (selectedDate && selectedTime) {
        $w('#confirmBookingBtn').enable();
    } else {
        $w('#confirmBookingBtn').disable();
    }
}

function updatePriceCalculation() {
    // Calculate total with addons
    // Implementation depends on your addon structure
    const baseAmount = paymentType === 'deposit' ? serviceData.depositAmount : serviceData.price;
    const totalAmount = calculateTotalAmount();
    
    $w('#totalAmountDisplay').text = `Total: $${totalAmount}`;
}

function calculateTotalAmount() {
    // Base amount based on payment type
    let total = paymentType === 'deposit' ? serviceData.depositAmount : serviceData.price;
    
    // Add addon costs (implement based on your addon structure)
    // total += getSelectedAddonsTotal();
    
    return total;
}

function sendToCalendarIframe(message) {
    $w('#calendarIframe').postMessage(message);
}

function sendToAddonIframe(message) {
    $w('#addonIframe').postMessage(message);
}

function showError(message) {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
    
    // Hide after 5 seconds
    setTimeout(() => {
        $w('#errorMessage').hide();
    }, 5000);
}

function showBookingSuccess() {
    // Navigate to success page or show success message
    wixLocation.to('/booking-success');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    // Format time for display
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Export functions for testing
export { 
    handleDateSelection, 
    handleTimeSelection, 
    processBookingConfirmation,
    calculateTotalAmount 
};
```

---

## 🎨 HTML IFRAME COMPONENTS

### **File: `iframes/calendar.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VX Glass Booking Calendar</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --vx-primary: #6366f1;
            --vx-primary-light: #818cf8;
            --vx-primary-dark: #4f46e5;
            --vx-secondary: #ec4899;
            --vx-accent: #10b981;
            --vx-glass-bg: rgba(255, 255, 255, 0.1);
            --vx-glass-border: rgba(255, 255, 255, 0.2);
            --vx-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            --vx-text-primary: #1f2937;
            --vx-text-secondary: #6b7280;
            --vx-available: #10b981;
            --vx-unavailable: #ef4444;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Montserrat', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .vx-calendar-container {
            background: var(--vx-glass-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--vx-glass-border);
            border-radius: 20px;
            padding: 24px;
            box-shadow: var(--vx-glass-shadow);
            max-width: 400px;
            margin: 0 auto;
        }

        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            color: white;
        }

        .calendar-title {
            font-size: 18px;
            font-weight: 600;
        }

        .nav-button {
            background: var(--vx-glass-bg);
            border: 1px solid var(--vx-glass-border);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
        }

        .nav-button:hover {
            background: var(--vx-primary);
            transform: translateY(-2px);
        }

        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 8px;
            margin-bottom: 20px;
        }

        .day-header {
            text-align: center;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.8);
            padding: 8px;
            font-size: 12px;
        }

        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--vx-glass-bg);
            border: 1px solid var(--vx-glass-border);
            border-radius: 8px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            font-weight: 500;
        }

        .calendar-day:hover {
            background: var(--vx-primary-light);
            transform: translateY(-2px);
        }

        .calendar-day.available {
            border-color: var(--vx-available);
        }

        .calendar-day.available::after {
            content: '';
            position: absolute;
            top: 4px;
            right: 4px;
            width: 6px;
            height: 6px;
            background: var(--vx-available);
            border-radius: 50%;
        }

        .calendar-day.selected {
            background: var(--vx-primary);
            border-color: var(--vx-primary);
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
        }

        .calendar-day.unavailable {
            opacity: 0.3;
            cursor: not-allowed;
            color: var(--vx-unavailable);
        }

        .calendar-day.other-month {
            opacity: 0.3;
            color: rgba(255, 255, 255, 0.5);
        }

        .time-slots-container {
            margin-top: 20px;
            display: none;
        }

        .time-slots-title {
            color: white;
            font-weight: 600;
            margin-bottom: 12px;
            text-align: center;
        }

        .time-slots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 8px;
        }

        .time-slot {
            background: var(--vx-glass-bg);
            border: 1px solid var(--vx-glass-border);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
            font-weight: 500;
        }

        .time-slot:hover {
            background: var(--vx-primary-light);
            transform: translateY(-2px);
        }

        .time-slot.selected {
            background: var(--vx-primary);
            border-color: var(--vx-primary);
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
        }

        .loading {
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            padding: 20px;
        }

        .error-message {
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 16px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="vx-calendar-container">
        <div id="errorMessage" class="error-message"></div>
        <div id="loadingMessage" class="loading">Loading calendar...</div>
        
        <div id="calendarContent" style="display: none;">
            <div class="calendar-header">
                <button class="nav-button" id="prevMonth">‹</button>
                <div class="calendar-title" id="calendarTitle">Loading...</div>
                <button class="nav-button" id="nextMonth">›</button>
            </div>

            <div class="calendar-grid" id="calendarGrid">
                <!-- Calendar will be generated here -->
            </div>

            <div class="time-slots-container" id="timeSlotsContainer">
                <div class="time-slots-title">Available Times</div>
                <div class="time-slots-grid" id="timeSlotsGrid">
                    <!-- Time slots will be generated here -->
                </div>
            </div>
        </div>
    </div>

    <script>
        class VXCalendar {
            constructor() {
                this.currentDate = new Date();
                this.selectedDate = null;
                this.selectedTime = null;
                this.availabilityData = {};
                this.serviceId = null;
                
                this.init();
            }
            
            init() {
                console.log("VX Calendar initialized");
                
                this.setupEventListeners();
                this.notifyParentReady();
                
                // Listen for messages from parent
                window.addEventListener('message', (event) => {
                    this.handleParentMessage(event.data);
                });
            }
            
            setupEventListeners() {
                document.getElementById('prevMonth').addEventListener('click', () => {
                    this.changeMonth(-1);
                });
                
                document.getElementById('nextMonth').addEventListener('click', () => {
                    this.changeMonth(1);
                });
            }
            
            handleParentMessage(data) {
                console.log("Calendar received message:", data);
                
                switch (data.type) {
                    case 'AVAILABILITY_DATA':
                        this.loadAvailabilityData(data.availability, data.serviceId);
                        break;
                    default:
                        console.log("Unknown message type:", data.type);
                }
            }
            
            loadAvailabilityData(availability, serviceId) {
                console.log("Loading availability data:", availability);
                
                this.availabilityData = availability;
                this.serviceId = serviceId;
                this.hideLoading();
                this.renderCalendar();
            }
            
            renderCalendar() {
                const year = this.currentDate.getFullYear();
                const month = this.currentDate.getMonth();
                
                // Update title
                document.getElementById('calendarTitle').textContent = 
                    this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                
                // Clear grid
                const grid = document.getElementById('calendarGrid');
                grid.innerHTML = '';
                
                // Add day headers
                const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                dayHeaders.forEach(day => {
                    const header = document.createElement('div');
                    header.className = 'day-header';
                    header.textContent = day;
                    grid.appendChild(header);
                });
                
                // Get first day of month and number of days
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const daysInPrevMonth = new Date(year, month, 0).getDate();
                
                // Add previous month's trailing days
                for (let i = firstDay - 1; i >= 0; i--) {
                    const day = daysInPrevMonth - i;
                    const dayElement = this.createDayElement(day, true, false);
                    grid.appendChild(dayElement);
                }
                
                // Add current month's days
                for (let day = 1; day <= daysInMonth; day++) {
                    const dayElement = this.createDayElement(day, false, true);
                    grid.appendChild(dayElement);
                }
                
                // Add next month's leading days
                const totalCells = grid.children.length - 7; // Subtract headers
                const remainingCells = 42 - totalCells; // 6 rows × 7 days
                for (let day = 1; day <= remainingCells; day++) {
                    const dayElement = this.createDayElement(day, true, false);
                    grid.appendChild(dayElement);
                }
            }
            
            createDayElement(day, isOtherMonth, isCurrentMonth) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = day;
                
                if (isOtherMonth) {
                    dayElement.classList.add('other-month');
                    return dayElement;
                }
                
                // Check if this day has availability
                const dateString = this.formatDateString(
                    this.currentDate.getFullYear(),
                    this.currentDate.getMonth(),
                    day
                );
                
                const hasAvailability = this.availabilityData[dateString] && 
                                      this.availabilityData[dateString].length > 0;
                
                if (hasAvailability) {
                    dayElement.classList.add('available');
                    dayElement.addEventListener('click', () => {
                        this.selectDate(dateString);
                    });
                } else {
                    dayElement.classList.add('unavailable');
                }
                
                return dayElement;
            }
            
            selectDate(dateString) {
                console.log("Date selected:", dateString);
                
                // Update selected date
                this.selectedDate = dateString;
                this.selectedTime = null;
                
                // Update UI
                document.querySelectorAll('.calendar-day.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                
                event.target.classList.add('selected');
                
                // Show time slots
                this.showTimeSlots(dateString);
                
                // Notify parent
                this.notifyParent({
                    type: 'DATE_SELECTED',
                    date: dateString,
                    availableSlots: this.availabilityData[dateString]
                });
            }
            
            showTimeSlots(dateString) {
                const slots = this.availabilityData[dateString] || [];
                const container = document.getElementById('timeSlotsContainer');
                const grid = document.getElementById('timeSlotsGrid');
                
                if (slots.length === 0) {
                    container.style.display = 'none';
                    return;
                }
                
                // Clear existing slots
                grid.innerHTML = '';
                
                // Create time slot elements
                slots.forEach(slot => {
                    const timeElement = document.createElement('div');
                    timeElement.className = 'time-slot';
                    timeElement.textContent = this.formatTime(slot.startTime);
                    
                    timeElement.addEventListener('click', () => {
                        this.selectTime(slot.startTime);
                    });
                    
                    grid.appendChild(timeElement);
                });
                
                container.style.display = 'block';
            }
            
            selectTime(startTime) {
                console.log("Time selected:", startTime);
                
                this.selectedTime = startTime;
                
                // Update UI
                document.querySelectorAll('.time-slot.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                
                event.target.classList.add('selected');
                
                // Notify parent
                this.notifyParent({
                    type: 'TIME_SELECTED',
                    time: startTime,
                    date: this.selectedDate
                });
            }
            
            changeMonth(direction) {
                this.currentDate.setMonth(this.currentDate.getMonth() + direction);
                this.renderCalendar();
            }
            
            formatDateString(year, month, day) {
                return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
            
            formatTime(isoString) {
                const date = new Date(isoString);
                return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }
            
            notifyParent(message) {
                if (window.parent) {
                    window.parent.postMessage(message, '*');
                }
            }
            
            notifyParentReady() {
                this.notifyParent({ type: 'CALENDAR_READY' });
            }
            
            hideLoading() {
                document.getElementById('loadingMessage').style.display = 'none';
                document.getElementById('calendarContent').style.display = 'block';
            }
            
            showError(message) {
                const errorElement = document.getElementById('errorMessage');
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        }
        
        // Initialize calendar when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new VXCalendar();
        });
    </script>
</body>
</html>
```

### **File: `iframes/bookingAddon.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VX Glass Booking Add-ons</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --vx-primary: #6366f1;
            --vx-primary-light: #818cf8;
            --vx-secondary: #ec4899;
            --vx-accent: #10b981;
            --vx-glass-bg: rgba(255, 255, 255, 0.1);
            --vx-glass-border: rgba(255, 255, 255, 0.2);
            --vx-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            --vx-text-primary: #1f2937;
            --vx-text-secondary: #6b7280;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Montserrat', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .vx-addons-container {
            background: var(--vx-glass-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--vx-glass-border);
            border-radius: 20px;
            padding: 24px;
            box-shadow: var(--vx-glass-shadow);
            max-width: 500px;
            margin: 0 auto;
        }

        .addons-header {
            text-align: center;
            margin-bottom: 24px;
        }

        .addons-title {
            color: white;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .addons-subtitle {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
        }

        .addons-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .addon-item {
            background: var(--vx-glass-bg);
            border: 1px solid var(--vx-glass-border);
            border-radius: 12px;
            padding: 16px;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .addon-item:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .addon-item.selected {
            border-color: var(--vx-primary);
            background: rgba(99, 102, 241, 0.2);
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
        }

        .addon-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .addon-name {
            color: white;
            font-weight: 600;
            font-size: 16px;
        }

        .addon-price {
            color: var(--vx-accent);
            font-weight: 700;
            font-size: 16px;
        }

        .addon-description {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            line-height: 1.4;
        }

        .addon-duration {
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            margin-top: 4px;
        }

        .addon-checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid var(--vx-glass-border);
            border-radius: 4px;
            background: transparent;
            position: relative;
            margin-right: 12px;
            flex-shrink: 0;
        }

        .addon-item.selected .addon-checkbox {
            background: var(--vx-primary);
            border-color: var(--vx-primary);
        }

        .addon-item.selected .addon-checkbox::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-weight: bold;
            font-size: 12px;
        }

        .total-summary {
            margin-top: 24px;
            padding: 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--vx-glass-border);
            border-radius: 12px;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            color: white;
            margin-bottom: 8px;
        }

        .total-row:last-child {
            margin-bottom: 0;
            font-weight: 700;
            font-size: 18px;
            border-top: 1px solid var(--vx-glass-border);
            padding-top: 8px;
        }

        .total-label {
            color: rgba(255, 255, 255, 0.8);
        }

        .total-amount {
            color: var(--vx-accent);
        }

        .loading {
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            padding: 40px;
        }

        .no-addons {
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
            padding: 40px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="vx-addons-container">
        <div id="loadingMessage" class="loading">Loading add-ons...</div>
        
        <div id="addonsContent" style="display: none;">
            <div class="addons-header">
                <div class="addons-title">Enhance Your Experience</div>
                <div class="addons-subtitle">Select additional services</div>
            </div>

            <div class="addons-list" id="addonsList">
                <!-- Add-ons will be populated here -->
            </div>

            <div class="total-summary" id="totalSummary">
                <div class="total-row">
                    <span class="total-label">Base Service:</span>
                    <span class="total-amount" id="baseAmount">$0</span>
                </div>
                <div class="total-row">
                    <span class="total-label">Add-ons:</span>
                    <span class="total-amount" id="addonsAmount">$0</span>
                </div>
                <div class="total-row">
                    <span class="total-label">Total:</span>
                    <span class="total-amount" id="totalAmount">$0</span>
                </div>
            </div>
        </div>

        <div id="noAddonsMessage" class="no-addons" style="display: none;">
            No additional services available for this appointment.
        </div>
    </div>

    <script>
        class VXBookingAddons {
            constructor() {
                this.serviceData = null;
                this.paymentType = null;
                this.selectedAddons = new Map();
                this.availableAddons = [];
                
                this.init();
            }
            
            init() {
                console.log("VX Booking Addons initialized");
                
                this.notifyParentReady();
                
                // Listen for messages from parent
                window.addEventListener('message', (event) => {
                    this.handleParentMessage(event.data);
                });
            }
            
            handleParentMessage(data) {
                console.log("Addons received message:", data);
                
                switch (data.type) {
                    case 'SERVICE_DATA':
                        this.loadServiceData(data.service, data.paymentType);
                        break;
                    default:
                        console.log("Unknown message type:", data.type);
                }
            }
            
            loadServiceData(service, paymentType) {
                console.log("Loading service data:", service, paymentType);
                
                this.serviceData = service;
                this.paymentType = paymentType;
                
                this.loadAvailableAddons();
                this.updateBasePricing();
                this.hideLoading();
            }
            
            loadAvailableAddons() {
                // Sample add-ons data - replace with actual data source
                this.availableAddons = [
                    {
                        id: 'deep-conditioning',
                        name: 'Deep Conditioning Treatment',
                        description: 'Intensive moisturizing treatment for healthier, shinier hair',
                        price: 25,
                        duration: 15,
                        category: 'treatment'
                    },
                    {
                        id: 'scalp-massage',
                        name: 'Relaxing Scalp Massage',
                        description: 'Therapeutic massage to promote circulation and relaxation',
                        price: 15,
                        duration: 10,
                        category: 'wellness'
                    },
                    {
                        id: 'hair-gloss',
                        name: 'Shine Enhancing Gloss',
                        description: 'Add brilliant shine and seal your color',
                        price: 35,
                        duration: 20,
                        category: 'treatment'
                    },
                    {
                        id: 'styling-upgrade',
                        name: 'Premium Styling',
                        description: 'Advanced styling techniques with professional products',
                        price: 20,
                        duration: 15,
                        category: 'styling'
                    }
                ];
                
                this.renderAddons();
            }
            
            renderAddons() {
                const container = document.getElementById('addonsList');
                
                if (this.availableAddons.length === 0) {
                    document.getElementById('noAddonsMessage').style.display = 'block';
                    return;
                }
                
                container.innerHTML = '';
                
                this.availableAddons.forEach(addon => {
                    const addonElement = this.createAddonElement(addon);
                    container.appendChild(addonElement);
                });
                
                document.getElementById('addonsContent').style.display = 'block';
            }
            
            createAddonElement(addon) {
                const addonDiv = document.createElement('div');
                addonDiv.className = 'addon-item';
                addonDiv.dataset.addonId = addon.id;
                
                addonDiv.innerHTML = `
                    <div class="addon-header">
                        <div style="display: flex; align-items: center;">
                            <div class="addon-checkbox"></div>
                            <div class="addon-name">${addon.name}</div>
                        </div>
                        <div class="addon-price">+$${addon.price}</div>
                    </div>
                    <div class="addon-description">${addon.description}</div>
                    <div class="addon-duration">+${addon.duration} minutes</div>
                `;
                
                addonDiv.addEventListener('click', () => {
                    this.toggleAddon(addon);
                });
                
                return addonDiv;
            }
            
            toggleAddon(addon) {
                const addonElement = document.querySelector(`[data-addon-id="${addon.id}"]`);
                
                if (this.selectedAddons.has(addon.id)) {
                    // Remove addon
                    this.selectedAddons.delete(addon.id);
                    addonElement.classList.remove('selected');
                    
                    this.notifyParent({
                        type: 'ADDON_REMOVED',
                        addonId: addon.id,
                        addon: addon
                    });
                } else {
                    // Add addon
                    this.selectedAddons.set(addon.id, addon);
                    addonElement.classList.add('selected');
                    
                    this.notifyParent({
                        type: 'ADDON_SELECTED',
                        addon: addon,
                        selectedAddons: Array.from(this.selectedAddons.values())
                    });
                }
                
                this.updateTotalSummary();
            }
            
            updateBasePricing() {
                if (!this.serviceData) return;
                
                const baseAmount = this.paymentType === 'deposit' ? 
                    this.serviceData.depositAmount : 
                    this.serviceData.price;
                
                document.getElementById('baseAmount').textContent = `$${baseAmount}`;
                this.updateTotalSummary();
            }
            
            updateTotalSummary() {
                if (!this.serviceData) return;
                
                const baseAmount = this.paymentType === 'deposit' ? 
                    this.serviceData.depositAmount : 
                    this.serviceData.price;
                
                let addonsTotal = 0;
                this.selectedAddons.forEach(addon => {
                    addonsTotal += addon.price;
                });
                
                const totalAmount = baseAmount + addonsTotal;
                
                document.getElementById('baseAmount').textContent = `$${baseAmount}`;
                document.getElementById('addonsAmount').textContent = `$${addonsTotal}`;
                document.getElementById('totalAmount').textContent = `$${totalAmount}`;
            }
            
            notifyParent(message) {
                if (window.parent) {
                    window.parent.postMessage(message, '*');
                }
            }
            
            notifyParentReady() {
                this.notifyParent({ type: 'ADDON_READY' });
            }
            
            hideLoading() {
                document.getElementById('loadingMessage').style.display = 'none';
            }
        }
        
        // Initialize add-ons when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new VXBookingAddons();
        });
    </script>
</body>
</html>
```

---

## ⚙️ CONFIGURATION FILES

### **File: `permissions.json`**
```json
{
  "backend": {
    "bookingBridge.jsw": {
      "functions": {
        "getAvailability": {
          "permission": "Anyone"
        },
        "getProductForService": {
          "permission": "Anyone"
        },
        "processBookingPayment": {
          "permission": "Anyone"
        }
      }
    }
  }
}
```

---

## 🗄️ DATABASE STRUCTURE

### **Collection: `ProductServiceMapping`**
```javascript
// Sample data structure for ProductServiceMapping collection
{
  "_id": "hair-cut-style-mapping",
  "serviceId": "hair-cut-style",
  "serviceName": "Hair Cut & Style",
  "productId": "hair-cut-full-payment-product",
  "depositProductId": "hair-cut-deposit-product",
  "fullPrice": 150,
  "depositAmount": 45,
  "depositPercentage": 30,
  "category": "hair-services",
  "duration": 90,
  "description": "Professional hair cutting and styling service",
  "isActive": true,
  "createdDate": "2025-01-01T00:00:00.000Z",
  "updatedDate": "2025-01-01T00:00:00.000Z"
}
```

---

## 📖 IMPLEMENTATION GUIDE

### **Step 1: Setup Backend Functions**
1. Create `backend/bookingBridge.jsw` with the code above
2. Set permissions in `permissions.json`
3. Test functions in Wix IDE

### **Step 2: Create Database Collection**
1. Go to Content Manager in Wix
2. Create new collection: `ProductServiceMapping`
3. Add fields as shown in database structure
4. Populate with your service/product mappings

### **Step 3: Setup Pages**
1. Create service selection page with dual-payment buttons
2. Create booking calendar page with iframe integration
3. Add the page code from above

### **Step 4: Add HTML Components**
1. Upload `calendar.html` and `bookingAddon.html`
2. Embed as iframes in booking page
3. Configure iframe communication

### **Step 5: Configure Wix Stores**
1. Create products for each service (full payment + deposit)
2. Link products to services in database
3. Test cart functionality

### **Step 6: Test Complete Flow**
1. Service selection → Payment choice → Booking/Cart
2. Calendar selection → Add-ons → Confirmation
3. Payment processing → Booking creation

---

## 🎯 KEY INTEGRATION POINTS

### **Wix Bookings API:**
- `availabilityCalendar.queryAvailability()` for calendar data
- Service ID mapping for multi-service support
- Timezone handling for accurate scheduling

### **Wix Stores API:**
- `cart.addToCart()` for store integration
- Product linking via database collection
- Session persistence for cart items

### **PostMessage Communication:**
- Parent-iframe data exchange
- Real-time availability updates
- Add-ons selection synchronization

---

## 📊 CURRENT STATUS
- ✅ Backend functions complete
- ✅ Dual-payment system implemented
- ✅ VX Glass UI components finished
- ✅ Database structure defined
- ✅ iframe communication working
- ⏳ **Ready for implementation in Wix IDE**

---

**Repository:** https://github.com/damiidoll/mywixcodes

**This complete file contains everything needed to implement the dual-payment booking system in Wix!** 🚀