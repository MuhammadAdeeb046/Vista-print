document.addEventListener("DOMContentLoaded", () => {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Update cart count on page load
    updateCartCount();

    // Search functionality
    const searchInput = document.getElementById('product-search');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const productsContainer = document.getElementById('products-container');
    const noResults = document.getElementById('no-results');

    // Get all product items
    const allProducts = Array.from(document.querySelectorAll('.product-item'));

    // Search functionality
    searchInput.addEventListener('input', filterAndSortProducts);
    categoryFilter.addEventListener('change', filterAndSortProducts);
    sortFilter.addEventListener('change', filterAndSortProducts);

    // Product card click handlers
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            // Store selected product in localStorage
            const productData = {
                category: card.dataset.category,
                price: card.dataset.price,
                name: card.querySelector('h5').textContent
            };
            localStorage.setItem('selectedProduct', JSON.stringify(productData));
            
            // Redirect to main page with designer
            window.location.href = 'index.html#designer';
        });
    });

    // Cart button functionality
    document.getElementById('cart-button').addEventListener('click', () => {
        updateCartModal();
        const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
        cartModal.show();
    });

    // Checkout button functionality
    document.getElementById('checkout-button').addEventListener('click', () => {
        if (cartItems.length === 0) {
            alert('Your cart is empty');
            return;
        }
        
        // Redirect to checkout page or show checkout modal
        alert('Redirecting to checkout...');
    });

    function filterAndSortProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const sortBy = sortFilter.value;

        // Filter products
        let filteredProducts = allProducts.filter(product => {
            const productName = product.dataset.name.toLowerCase();
            const productCategory = product.dataset.category;
            
            const matchesSearch = productName.includes(searchTerm);
            const matchesCategory = !selectedCategory || productCategory === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });

        // Sort products
        filteredProducts.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
                case 'price-high':
                    return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
                case 'name':
                    return a.dataset.name.localeCompare(b.dataset.name);
                case 'popular':
                default:
                    // Keep original order for popular
                    return 0;
            }
        });

        // Hide all products first
        allProducts.forEach(product => {
            product.style.display = 'none';
        });

        // Show filtered and sorted products
        if (filteredProducts.length > 0) {
            filteredProducts.forEach((product, index) => {
                product.style.display = 'block';
                product.style.order = index;
                
                // Add animation
                setTimeout(() => {
                    product.classList.add('fade-in');
                }, index * 50);
            });
            noResults.style.display = 'none';
        } else {
            noResults.style.display = 'block';
        }
    }

    function updateCartCount() {
        const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cart-count').textContent = total;
    }

    function updateCartModal() {
        const cartItemsContainer = document.getElementById('cart-items');
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <h5>Your cart is empty</h5>
                    <p class="text-muted">Add some products to get started!</p>
                </div>
            `;
        } else {
            cartItems.forEach((item, index) => {
                total += item.totalPrice;
                const itemElement = createCartItemElement(item, index);
                cartItemsContainer.appendChild(itemElement);
            });
        }

        document.getElementById('cart-total').textContent = total.toFixed(2);
    }

    function createCartItemElement(item, index) {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';

        const colorDisplay = (item.category === "banners" || item.category === "tshirt") ? `
            <div class="d-flex align-items-center mb-2">
                <span class="me-2">Color:</span>
                <div style="width: 25px; height: 25px; border-radius: 50%; background-color: ${item.color}; 
                     border: 2px solid #ddd;"></div>
                <span class="ms-2">${getColorName(item.color)}</span>
            </div>
        ` : "";

        itemElement.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-4">
                    <div class="designs">
                        <img src="${item.frontDesign}" alt="Front Design" class="img-thumbnail">
                        ${(item.category === "business-card" || item.category === "tshirt") && item.backDesign ? 
                          `<img src="${item.backDesign}" alt="Back Design" class="img-thumbnail">` : ""}
                    </div>
                </div>
                <div class="col-md-8">
                    <h6 class="fw-bold">${item.name || item.category}</h6>
                    ${colorDisplay}
                    ${item.size ? `<p class="mb-2"><strong>Size:</strong> ${item.size}</p>` : ""}
                    <div class="quantity-control">
                        <button onclick="updateQuantity(${index}, -1)" class="btn-sm">-</button>
                        <input type="number" value="${item.quantity}" min="1" onchange="updateItemQuantity(${index}, this.value)">
                        <button onclick="updateQuantity(${index}, 1)" class="btn-sm">+</button>
                    </div>
                    <p class="fw-bold text-primary mb-2">$${item.totalPrice.toFixed(2)}</p>
                    <button class="btn btn-danger btn-sm" onclick="removeCartItem(${index})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `;
        
        return itemElement;
    }

    function getColorName(hex) {
        const colorMap = {
            "#000000": "Black",
            "#ffffff": "White", 
            "#808080": "Grey",
            "#ffa500": "Orange",
        };
        return colorMap[hex] || hex;
    }

    // Global functions for cart operations
    window.updateQuantity = function (index, change) {
        const newQuantity = cartItems[index].quantity + change;
        if (newQuantity >= 1) {
            cartItems[index].quantity = newQuantity;
            cartItems[index].totalPrice = cartItems[index].price * newQuantity;
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartCount();
            updateCartModal();
        }
    };

    window.updateItemQuantity = function (index, value) {
        const quantity = parseInt(value);
        if (quantity >= 1) {
            cartItems[index].quantity = quantity;
            cartItems[index].totalPrice = cartItems[index].price * quantity;
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartCount();
            updateCartModal();
        }
    };

    window.removeCartItem = function (index) {
        cartItems.splice(index, 1);
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartCount();
        updateCartModal();
    };

    // Add animation classes
    setTimeout(() => {
        document.querySelectorAll('.product-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 100);
        });
    }, 100);
});