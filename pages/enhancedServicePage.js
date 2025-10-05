// Enhanced Service Selection Page with Book Now + Add to Cart + Payment Options
import wixLocation from 'wix-location';
import wixStores from 'wix-stores';
import { session } from 'wix-storage';

$w.onReady(async () => {
  const ds = await getServiceDataset();
  if (!ds) { console.warn('No dataset found on this page.'); return; }
  await ds.onReady();

  const item = safeItem(ds.getCurrentItem());
  
  // Enhanced service data mapping with payment options
  const serviceId    = item._id || item.serviceId || item.slug || '';
  const serviceName  = item.title || item.name || item.serviceName || '';
  const fullPrice    = num(item.price || item.basePrice || item.pricing?.price || 0);
  const depositAmt   = num(item.deposit || item.depositAmount || fullPrice * 0.3); // 30% default deposit
  const duration     = item.duration || item.durationInMinutes || '';
  const depositSku   = item.depositProductId || item.depositSku || ''; // Wix Stores product for deposit
  const fullPaySku   = item.fullPaymentProductId || item.fullPaymentSku || ''; // Wix Stores product for full payment

  // Store service data in session for booking page
  const serviceData = {
    serviceId, serviceName, fullPrice, depositAmt, duration, depositSku, fullPaySku
  };
  session.setItem('currentService', JSON.stringify(serviceData));

  // Update UI with service information
  updateServiceDisplay(serviceData);

  // 1) BOOK NOW → Direct booking flow with payment choice
  hookup('#bookNowBtn', ($btn) => {
    $btn.link = undefined;
    $btn.onClick(() => {
      showPaymentOptionsModal(serviceData, 'booking');
    });
  });

  // 2) ADD TO CART → Add deposit/full payment to cart
  hookup('#addToCartBtn', ($btn) => {
    $btn.link = undefined;
    $btn.onClick(() => {
      showPaymentOptionsModal(serviceData, 'cart');
    });
  });

  // Set up payment option buttons (if they exist on page)
  setupPaymentButtons(serviceData);
});

// Update service display with pricing options
function updateServiceDisplay(serviceData) {
  // Update service name
  hookup('#serviceName', ($el) => {
    $el.text = serviceData.serviceName;
  });

  // Update full price display
  hookup('#fullPrice', ($el) => {
    $el.text = `$${serviceData.fullPrice}`;
  });

  // Update deposit amount display
  hookup('#depositAmount', ($el) => {
    $el.text = `$${serviceData.depositAmt}`;
  });

  // Update duration display
  hookup('#serviceDuration', ($el) => {
    $el.text = `${serviceData.duration} minutes`;
  });

  // Show savings calculation
  hookup('#savingsAmount', ($el) => {
    const savings = serviceData.fullPrice - serviceData.depositAmt;
    $el.text = `Save $${savings} now, pay $${serviceData.fullPrice - serviceData.depositAmt} later`;
  });
}

// Show payment options modal/section
function showPaymentOptionsModal(serviceData, action) {
  // Show payment options section
  hookup('#paymentOptionsSection', ($section) => {
    $section.show();
  });

  // Set up deposit option
  hookup('#depositOption', ($btn) => {
    $btn.onClick(async () => {
      await handlePaymentChoice(serviceData, 'deposit', action);
    });
  });

  // Set up full payment option
  hookup('#fullPaymentOption', ($btn) => {
    $btn.onClick(async () => {
      await handlePaymentChoice(serviceData, 'full', action);
    });
  });

  // Close modal functionality
  hookup('#closePaymentModal', ($btn) => {
    $btn.onClick(() => {
      hookup('#paymentOptionsSection', ($section) => {
        $section.hide();
      });
    });
  });
}

// Handle payment choice and action
async function handlePaymentChoice(serviceData, paymentType, action) {
  const paymentData = {
    type: paymentType,
    amount: paymentType === 'deposit' ? serviceData.depositAmt : serviceData.fullPrice,
    productSku: paymentType === 'deposit' ? serviceData.depositSku : serviceData.fullPaySku,
    serviceData: serviceData
  };

  // Store payment choice
  session.setItem('paymentChoice', JSON.stringify(paymentData));

  if (action === 'cart') {
    await addToCart(paymentData);
  } else if (action === 'booking') {
    goToBookingPage(paymentData);
  }
}

// Add to cart functionality with improved error handling
async function addToCart(paymentData) {
  try {
    // Show loading state
    showLoadingState('Adding to cart...');

    if (paymentData.productSku) {
      // Use wix-stores-frontend API as recommended by Wix IDE support
      await wixStores.cart.addProducts([{ 
        productId: paymentData.productSku, 
        quantity: 1,
        options: {
          customTextFields: [
            { title: 'Service', value: paymentData.serviceData.serviceName },
            { title: 'Payment Type', value: paymentData.type === 'deposit' ? 'Deposit Payment' : 'Full Payment' },
            { title: 'Service ID', value: paymentData.serviceData.serviceId }
          ]
        }
      }]);

      console.log("Product added to cart successfully");
      
      // Show success message
      showSuccessMessage(`${paymentData.type === 'deposit' ? 'Deposit' : 'Full payment'} added to cart!`);
      
      // Ask if they want to continue shopping or go to cart
      setTimeout(() => {
        if (confirm('Go to cart now or continue shopping?')) {
          wixLocation.to('/cart');
        } else {
          hidePaymentModal();
        }
      }, 1000);

    } else {
      // Fallback: go to booking page if no product SKU
      console.warn('No product SKU configured, redirecting to booking page');
      goToBookingPage(paymentData);
    }
  } catch (error) {
    console.error("Error adding product to cart:", error);
    showErrorMessage('Failed to add to cart. Redirecting to booking page...');
    setTimeout(() => goToBookingPage(paymentData), 2000);
  }
}

// Go to booking page with payment data
function goToBookingPage(paymentData) {
  const queryParams = new URLSearchParams({
    serviceId: paymentData.serviceData.serviceId,
    service: paymentData.serviceData.serviceName,
    price: paymentData.serviceData.fullPrice,
    duration: paymentData.serviceData.duration,
    deposit: paymentData.serviceData.depositAmt,
    paymentType: paymentData.type,
    paymentAmount: paymentData.amount
  });

  wixLocation.to(`/booking-calendar?${queryParams.toString()}`);
}

// Set up direct payment buttons (alternative to modal)
function setupPaymentButtons(serviceData) {
  // Direct deposit booking button
  hookup('#bookDepositBtn', ($btn) => {
    $btn.onClick(() => {
      const paymentData = {
        type: 'deposit',
        amount: serviceData.depositAmt,
        productSku: serviceData.depositSku,
        serviceData: serviceData
      };
      session.setItem('paymentChoice', JSON.stringify(paymentData));
      goToBookingPage(paymentData);
    });
  });

  // Direct full payment booking button
  hookup('#bookFullBtn', ($btn) => {
    $btn.onClick(() => {
      const paymentData = {
        type: 'full',
        amount: serviceData.fullPrice,
        productSku: serviceData.fullPaySku,
        serviceData: serviceData
      };
      session.setItem('paymentChoice', JSON.stringify(paymentData));
      goToBookingPage(paymentData);
    });
  });

  // Add deposit to cart button
  hookup('#addDepositCartBtn', ($btn) => {
    $btn.onClick(async () => {
      const paymentData = {
        type: 'deposit',
        amount: serviceData.depositAmt,
        productSku: serviceData.depositSku,
        serviceData: serviceData
      };
      await addToCart(paymentData);
    });
  });

  // Add full payment to cart button
  hookup('#addFullCartBtn', ($btn) => {
    $btn.onClick(async () => {
      const paymentData = {
        type: 'full',
        amount: serviceData.fullPrice,
        productSku: serviceData.fullPaySku,
        serviceData: serviceData
      };
      await addToCart(paymentData);
    });
  });
}

// UI Helper Functions
function showLoadingState(message) {
  hookup('#loadingMessage', ($el) => {
    $el.text = message;
    $el.show();
  });
}

function showSuccessMessage(message) {
  hookup('#successMessage', ($el) => {
    $el.text = message;
    $el.show();
  });
  hookup('#loadingMessage', ($el) => $el.hide());
}

function showErrorMessage(message) {
  hookup('#errorMessage', ($el) => {
    $el.text = message;
    $el.show();
  });
  hookup('#loadingMessage', ($el) => $el.hide());
}

function hidePaymentModal() {
  hookup('#paymentOptionsSection', ($section) => $section.hide());
  hookup('#successMessage', ($el) => $el.hide());
  hookup('#errorMessage', ($el) => $el.hide());
}

// Utility functions (keeping your existing ones)
function safeItem(x) { return (x && typeof x === 'object') ? x : {}; }
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

async function getServiceDataset() {
  if ($w('#servicesDataset')) return $w('#servicesDataset');
  const list = $w('Dataset');
  if (Array.isArray(list) && list.length) return list[0];
  return null;
}

function hookup(id, fn) {
  if ($w(id)) try { fn($w(id)); } catch(e) { console.warn('Hookup failed for', id, e); }
}