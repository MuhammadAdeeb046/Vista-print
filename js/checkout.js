// Checkout JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const cardPayment = document.getElementById('cardPayment');
    const cashPayment = document.getElementById('cashPayment');
    const cardDetails = document.getElementById('cardDetails');
    const cashNotice = document.getElementById('cashNotice');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const orderItems = document.getElementById('orderItems');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');

    // Load user info if logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement) {
            userInfoElement.innerHTML = `
                <span class="me-3">Welcome, ${currentUser.firstName}!</span>
                <a href="#" class="text-decoration-none text-dark me-3" onclick="logout()">Sign Out</a>
            `;
        }

        // Pre-fill shipping form with user data
        document.getElementById('firstName').value = currentUser.firstName || '';
        document.getElementById('lastName').value = currentUser.lastName || '';
        document.getElementById('email').value = currentUser.email || '';
    } else {
        // Redirect to sign in if not logged in
        alert('Please sign in to checkout.');
        window.location.href = 'signin.html';
        return;
    }

    // Load cart count
    const cartCount = localStorage.getItem('cartCount') || '0';
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }

    // Load current design/order details
    const currentDesign = JSON.parse(localStorage.getItem('currentDesign'));
    if (currentDesign) {
        displayOrderSummary(currentDesign);
        calculateTotals(currentDesign);
    } else {
        // If no current design, show a default item
        const defaultOrder = {
            quantity: 100,
            paperType: 'standard',
            totalPrice: '50.00'
        };
        displayOrderSummary(defaultOrder);
        calculateTotals(defaultOrder);
    }

    // Payment method toggle
    cardPayment.addEventListener('change', function() {
        if (this.checked) {
            cardDetails.style.display = 'block';
            cashNotice.style.display = 'none';
        }
    });

    cashPayment.addEventListener('change', function() {
        if (this.checked) {
            cardDetails.style.display = 'none';
            cashNotice.style.display = 'block';
        }
    });

    // Card number formatting
    document.getElementById('cardNumber').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
        e.target.value = formattedValue;
    });

    // Expiry date formatting
    document.getElementById('expiryDate').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });

    // Place Order
    placeOrderBtn.addEventListener('click', function() {
        // Validate shipping form
        const shippingForm = document.getElementById('shippingForm');
        if (!shippingForm.checkValidity()) {
            shippingForm.reportValidity();
            return;
        }

        // Validate payment
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        if (paymentMethod === 'card') {
            // Validate card details
            const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
            const expiryDate = document.getElementById('expiryDate').value;
            const cvv = document.getElementById('cvv').value;
            const cardName = document.getElementById('cardName').value;

            if (cardNumber.length < 13 || cardNumber.length > 19) {
                alert('Please enter a valid card number.');
                return;
            }

            if (!expiryDate || expiryDate.length !== 5) {
                alert('Please enter a valid expiry date (MM/YY).');
                return;
            }

            if (!cvv || cvv.length < 3) {
                alert('Please enter a valid CVV.');
                return;
            }

            if (!cardName.trim()) {
                alert('Please enter the name on the card.');
                return;
            }
        }

        // Create order
        const orderData = {
            id: 'VP' + Date.now(),
            customer: currentUser,
            shipping: {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zipCode: document.getElementById('zipCode').value
            },
            payment: {
                method: paymentMethod,
                ...(paymentMethod === 'card' && {
                    cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, '').slice(-4),
                    cardName: document.getElementById('cardName').value
                })
            },
            items: currentDesign ? [currentDesign] : [{ quantity: 100, paperType: 'standard', totalPrice: '50.00' }],
            total: totalElement.textContent,
            status: 'confirmed',
            orderDate: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };

        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));

        // Clear cart
        localStorage.removeItem('currentDesign');
        localStorage.setItem('cartCount', '0');

        // Show success message and redirect
        alert(`Order placed successfully! Your order ID is ${orderData.id}. You will receive a confirmation email shortly.`);

        // Redirect to order tracking
        window.location.href = `track-order.html?id=${orderData.id}`;
    });

    function displayOrderSummary(order) {
        orderItems.innerHTML = '';

        if (order.elements && order.elements.length > 0) {
            // Custom design order
            orderItems.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <strong>Custom Design</strong>
                        <br><small class="text-muted">Quantity: ${order.quantity}, Paper: ${order.paperType}</small>
                    </div>
                    <span>$${order.totalPrice}</span>
                </div>
            `;
        } else {
            // Default/generic order
            orderItems.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <strong>Business Cards</strong>
                        <br><small class="text-muted">Quantity: ${order.quantity}, Paper: ${order.paperType}</small>
                    </div>
                    <span>$${order.totalPrice}</span>
                </div>
            `;
        }
    }

    function calculateTotals(order) {
        const subtotal = parseFloat(order.totalPrice || '50.00');
        const shipping = subtotal > 50 ? 0 : 9.99;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + shipping + tax;

        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        shippingElement.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
        taxElement.textContent = `$${tax.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.setItem('cartCount', '0');
    location.reload();
}

