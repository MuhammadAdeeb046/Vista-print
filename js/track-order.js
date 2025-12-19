// Track Order JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const trackOrderForm = document.getElementById('trackOrderForm');
    const orderDetails = document.getElementById('orderDetails');
    const noOrderFound = document.getElementById('noOrderFound');
    const recentOrders = document.getElementById('recentOrders');
    const recentOrdersList = document.getElementById('recentOrdersList');

    // Check URL parameters for order ID
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (orderId) {
        document.getElementById('orderId').value = orderId;
        trackOrder(orderId);
    }

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

        // Load recent orders for logged-in user
        loadRecentOrders(currentUser.email);
    }

    // Load cart count
    const cartCount = localStorage.getItem('cartCount') || '0';
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }

    // Track order form submission
    trackOrderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const orderId = document.getElementById('orderId').value.trim().toUpperCase();
        trackOrder(orderId);
    });

    function trackOrder(orderId) {
        // Get orders from localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');

        // Find the order
        const order = orders.find(o => o.id === orderId);

        if (order) {
            // Show order details
            displayOrderDetails(order);
            orderDetails.classList.remove('d-none');
            noOrderFound.classList.add('d-none');
        } else {
            // Show no order found
            orderDetails.classList.add('d-none');
            noOrderFound.classList.remove('d-none');
        }
    }

    function displayOrderDetails(order) {
        // Fill in order information
        document.getElementById('displayOrderId').textContent = order.id;
        document.getElementById('orderDate').textContent = new Date(order.orderDate).toLocaleDateString();
        document.getElementById('orderTotal').textContent = order.total;

        // Set order status
        const statusElement = document.getElementById('orderStatus');
        const progressBar = document.getElementById('progressBar');

        let statusText = 'Confirmed';
        let statusClass = 'bg-success';
        let progressWidth = '25%';

        if (order.status === 'printing') {
            statusText = 'Printing';
            progressWidth = '50%';
        } else if (order.status === 'packed') {
            statusText = 'Packed';
            progressWidth = '75%';
        } else if (order.status === 'shipped') {
            statusText = 'Shipped';
            progressWidth = '100%';
        }

        statusElement.textContent = statusText;
        statusElement.className = `badge ${statusClass}`;
        progressBar.style.width = progressWidth;

        // Set delivery date
        document.getElementById('estimatedDelivery').textContent = new Date(order.estimatedDelivery).toLocaleDateString();

        // Set shipping address
        const shipping = order.shipping;
        document.getElementById('shippingAddress').innerHTML = `
            ${shipping.firstName} ${shipping.lastName}<br>
            ${shipping.address}<br>
            ${shipping.city}, ${shipping.state} ${shipping.zipCode}
        `;

        // Display order items
        const orderItemsElement = document.getElementById('orderItems');
        orderItemsElement.innerHTML = '';

        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                if (item.elements && item.elements.length > 0) {
                    // Custom design
                    orderItemsElement.innerHTML += `
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Custom Design</strong>
                                    <br><small class="text-muted">Quantity: ${item.quantity}, Paper: ${item.paperType}</small>
                                </div>
                                <span>$${item.totalPrice}</span>
                            </div>
                        </div>
                    `;
                } else {
                    // Generic item
                    orderItemsElement.innerHTML += `
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Business Cards</strong>
                                    <br><small class="text-muted">Quantity: ${item.quantity}, Paper: ${item.paperType}</small>
                                </div>
                                <span>$${item.totalPrice || '50.00'}</span>
                            </div>
                        </div>
                    `;
                }
            });
        }
    }

    function loadRecentOrders(userEmail) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const userOrders = orders.filter(o => o.customer && o.customer.email === userEmail);

        if (userOrders.length > 0) {
            recentOrders.classList.remove('d-none');

            // Sort by date (newest first) and take last 5
            const recentOrdersSorted = userOrders
                .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                .slice(0, 5);

            recentOrdersList.innerHTML = '';

            recentOrdersSorted.forEach(order => {
                const orderDate = new Date(order.orderDate).toLocaleDateString();
                const statusClass = order.status === 'confirmed' ? 'bg-success' :
                                  order.status === 'printing' ? 'bg-info' :
                                  order.status === 'packed' ? 'bg-warning' : 'bg-primary';

                recentOrdersList.innerHTML += `
                    <div class="d-flex justify-content-between align-items-center border-bottom py-3">
                        <div>
                            <strong>${order.id}</strong>
                            <br><small class="text-muted">${orderDate}</small>
                        </div>
                        <div class="text-end">
                            <span class="badge ${statusClass} mb-1">${order.status}</span>
                            <br><small class="text-muted">${order.total}</small>
                        </div>
                        <div>
                            <button class="btn btn-outline-primary btn-sm" onclick="trackOrder('${order.id}')">
                                Track
                            </button>
                        </div>
                    </div>
                `;
            });
        }
    }

    // Make trackOrder function global so it can be called from HTML
    window.trackOrder = trackOrder;
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.setItem('cartCount', '0');
    location.reload();
}

