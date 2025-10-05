// Custom Booking Calendar Page Code
// Receives service data from service selection page and manages iframe communication
import { getAvailability } from 'backend/bookingBridge.jsw';
import wixLocation from 'wix-location';

function detectTZ(){
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago'; }
  catch { return 'America/Chicago'; }
}

let selectedServiceData = null;
let selectedDate = null;
let selectedTime = null;
let bookingData = {};

$w.onReady(function () {
    console.log("Booking calendar page ready");
    
    // Get service data from URL parameters (from service selection page)
    loadServiceData();
    
    // Set up iframe communication
    setupIframeListeners();
    
    // Initialize booking interface
    initializeBookingInterface();
});

// Load service data from URL parameters and session
function loadServiceData() {
    const urlParams = new URLSearchParams(wixLocation.query);
    
    if (urlParams.has('serviceId')) {
        selectedServiceData = {
            serviceId: urlParams.get('serviceId'),
            name: urlParams.get('service'),
            price: parseFloat(urlParams.get('price')) || 0,
            duration: urlParams.get('duration'),
            deposit: parseFloat(urlParams.get('deposit')) || 0,
            paymentType: urlParams.get('paymentType') || 'full',
            paymentAmount: parseFloat(urlParams.get('paymentAmount')) || 0
        };
        
        console.log("Service data loaded from URL:", selectedServiceData);
        
        // Load additional payment choice data from session
        loadPaymentChoiceData();
        
        displayServiceInfo();
        sendServiceDataToIframes();
    } else {
        console.log("No service data found, redirecting to service selection");
        // Redirect back to service selection if no data
        wixLocation.to('/services');
    }
}

// Load payment choice data from session storage
function loadPaymentChoiceData() {
    const paymentChoice = session.getItem('paymentChoice');
    if (paymentChoice) {
        try {
            const paymentData = JSON.parse(paymentChoice);
            selectedServiceData.paymentChoice = paymentData;
            console.log("Payment choice loaded:", paymentData);
            
            // Update booking data with payment information
            bookingData.paymentType = paymentData.type;
            bookingData.paymentAmount = paymentData.amount;
            bookingData.productSku = paymentData.productSku;
            
        } catch (error) {
            console.error("Error parsing payment choice:", error);
        }
    }
}

// Display service information on the page
function displayServiceInfo() {
    if (!selectedServiceData) return;
    
    // Update UI elements with service information
    if ($w("#serviceNameText")) {
        $w("#serviceNameText").text = selectedServiceData.name;
    }
    if ($w("#serviceDurationText")) {
        $w("#serviceDurationText").text = `Duration: ${selectedServiceData.duration} minutes`;
    }
    if ($w("#servicePriceText")) {
        $w("#servicePriceText").text = `Price: $${selectedServiceData.price}`;
    }
    
    // Display payment information
    if (selectedServiceData.paymentChoice) {
        const paymentData = selectedServiceData.paymentChoice;
        
        if ($w("#paymentTypeText")) {
            $w("#paymentTypeText").text = paymentData.type === 'deposit' ? 'Deposit Payment' : 'Full Payment';
        }
        
        if ($w("#paymentAmountText")) {
            $w("#paymentAmountText").text = `Amount: $${paymentData.amount}`;
        }
        
        if ($w("#remainingBalanceText") && paymentData.type === 'deposit') {
            const remaining = selectedServiceData.price - paymentData.amount;
            $w("#remainingBalanceText").text = `Remaining Balance: $${remaining} (due at appointment)`;
            $w("#remainingBalanceText").show();
        }
        
        // Show payment status section
        if ($w("#paymentStatusSection")) {
            $w("#paymentStatusSection").show();
        }
    }
    
    // Store in booking data
    bookingData.service = selectedServiceData;
}

// Set up communication with iframes
function setupIframeListeners() {
    const timeZone = detectTZ();
    const cal = $w('#htmlCalendar');
    const add = $w('#htmlAddons');

    // Prepare service payload in the format your iframes expect
    const servicePayload = {
        type: 'SERVICE_DATA',
        data: {
            serviceId: selectedServiceData?.serviceId,
            name: selectedServiceData?.name || '',
            price: Number(selectedServiceData?.price || 0),
            durationMinutes: Number(selectedServiceData?.duration || 0),
            deposit: Number(selectedServiceData?.deposit || 0),
            timeZone
        }
    };

    // ---- Calendar iframe messaging ----
    cal?.onMessage(async (e) => {
        const d = e.data || {};
        console.log('Calendar iframe message:', d);
        
        if (d.type === 'READY') {
            cal.postMessage(servicePayload);
            await refreshMonth(new Date(), selectedServiceData.serviceId, timeZone);
        }
        
        if (d.type === 'MONTH_CHANGE') {
            const y = Number(d.payload?.year);
            const m = Number(d.payload?.month);
            if (Number.isFinite(y) && Number.isFinite(m)) {
                await refreshMonth(new Date(y, m, 1), selectedServiceData.serviceId, timeZone);
            }
        }
        
        if (d.type === 'TIME_SELECTED') {
            selectedDate = d.dateLabel;
            selectedTime = d.timeLabel;
            
            console.log("Date and time selected:", { date: selectedDate, time: selectedTime });
            
            // Forward to add-ons iframe
            add?.postMessage({
                type: 'vx:context',
                payload: {
                    serviceName: selectedServiceData.name,
                    dateLabel: d.dateLabel || '',
                    timeLabel: d.timeLabel || ''
                }
            });
            
            // Update booking data
            bookingData.date = selectedDate;
            bookingData.time = selectedTime;
            
            // Update UI
            if ($w("#selectedDateText")) {
                $w("#selectedDateText").text = `Selected: ${selectedDate} at ${selectedTime}`;
            }
        }
    });

    // ---- Add-ons iframe messaging ----
    add?.onMessage((e) => {
        const d = e.data || {};
        console.log('Add-ons iframe message:', d);
        
        if (d.type === 'READY') {
            add.postMessage(servicePayload);
        }

        if (d.type === 'vx:addons' || d.type === 'ADDONS_UPDATE') {
            const total = d.type === 'vx:addons' ? (d.payload?.total || 0) : (d.payload?.addonsTotal || 0);
            const minutes = d.type === 'vx:addons' ? (d.payload?.minutes || 0) : (d.payload?.addonsMinutes || 0);

            // Update total price display
            if ($w('#txtTotalPrice')) {
                const base = Number(selectedServiceData.price || 0);
                $w('#txtTotalPrice').text = `$${(base + Number(total)).toFixed(0)}`;
            }

            // Forward to calendar
            cal?.postMessage({
                type: 'ADDONS_UPDATE',
                payload: {
                    addonsItems: d.payload?.items || d.payload?.addonsItems || [],
                    addonsTotal: total,
                    addonsMinutes: minutes
                }
            });
            
            // Store in booking data
            bookingData.addons = {
                items: d.payload?.items || d.payload?.addonsItems || [],
                total: total,
                minutes: minutes
            };
        }
        
        // Handle booking submission from add-ons iframe
        if (d.type === 'BOOKING_SUBMIT') {
            handleBookingSubmission(d.payload);
        }
    });
}

// Refresh month availability data
async function refreshMonth(dateObj, serviceId, timeZone) {
    if (!serviceId) return;
    
    const startISO = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toISOString();
    const endISO = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 1).toISOString();
    
    try {
        // getAvailability returns array of { date, slots } directly
        const days = await getAvailability(serviceId, startISO, endISO, timeZone);
        $w('#htmlCalendar')?.postMessage({ type: 'AVAILABILITY', data: days, timeZone });
    } catch (err) {
        console.error('Availability error', err);
        $w('#htmlCalendar')?.postMessage({ 
            type: 'AVAILABILITY_ERROR', 
            message: String(err?.message || err), 
            timeZone 
        });
    }
}

// Handle booking submission
async function handleBookingSubmission(submissionData) {
    console.log("Booking submission received:", submissionData);
    
    // Combine all booking data
    const completeBookingData = {
        ...bookingData,
        ...submissionData,
        timestamp: new Date().toISOString()
    };
    
    try {
        // Show loading state
        if ($w("#loadingMessage")) {
            $w("#loadingMessage").show();
        }
        
        // Submit booking via backend (you'll need to implement this)
        // const result = await createBooking(completeBookingData);
        
        console.log("Would submit booking:", completeBookingData);
        
        // For now, show success (replace with actual booking creation)
        handleBookingSuccess({ bookingId: 'temp-' + Date.now() });
        
    } catch (error) {
        console.error("Error submitting booking:", error);
        handleBookingError(error.message);
    }
}

// Handle successful booking
function handleBookingSuccess(result) {
    console.log("Booking successful:", result);
    
    // Show success message
    if ($w("#successMessage")) {
        $w("#successMessage").text = "Booking confirmed!";
        $w("#successMessage").show();
    }
    
    if ($w("#bookingIdText")) {
        $w("#bookingIdText").text = `Booking ID: ${result.bookingId}`;
    }
    
    // Optionally redirect to confirmation page
    setTimeout(() => {
        wixLocation.to(`/booking-confirmation?id=${result.bookingId}`);
    }, 3000);
}

// Handle booking error
function handleBookingError(error) {
    console.error("Booking error:", error);
    
    // Hide loading state
    if ($w("#loadingMessage")) {
        $w("#loadingMessage").hide();
    }
    
    // Show error message
    if ($w("#errorMessage")) {
        $w("#errorMessage").text = `Error: ${error}`;
        $w("#errorMessage").show();
    }
}

// Initialize booking interface
function initializeBookingInterface() {
    // Set up back button
    if ($w("#backButton")) {
        $w("#backButton").onClick(() => {
            wixLocation.to('/services');
        });
    }
    
    // Hide messages initially
    if ($w("#loadingMessage")) $w("#loadingMessage").hide();
    if ($w("#successMessage")) $w("#successMessage").hide();
    if ($w("#errorMessage")) $w("#errorMessage").hide();
}

// Export functions for testing or external use
export function getCurrentBookingData() {
    return bookingData;
}

export function getSelectedService() {
    return selectedServiceData;
}