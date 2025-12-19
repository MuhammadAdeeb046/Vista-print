// Design Studio JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const textInput = document.getElementById('textInput');
    const fontSelect = document.getElementById('fontSelect');
    const textColor = document.getElementById('textColor');
    const addTextBtn = document.getElementById('addTextBtn');
    const designCanvas = document.getElementById('designCanvas');
    const quantitySelect = document.getElementById('quantitySelect');
    const paperSelect = document.getElementById('paperSelect');
    const basePrice = document.getElementById('basePrice');
    const quantityDiscount = document.getElementById('quantityDiscount');
    const shippingCost = document.getElementById('shippingCost');
    const totalPrice = document.getElementById('totalPrice');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const undoBtn = document.getElementById('undoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const previewBtn = document.getElementById('previewBtn');
    const orderBtn = document.getElementById('orderBtn');

    let designElements = [];
    let selectedElement = null;

    // Initialize price calculation
    updatePrice();

    // Image Upload Handler
    imageUpload.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Create preview thumbnail
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'col-4';
                    previewDiv.innerHTML = `
                        <img src="${event.target.result}" class="img-thumbnail" style="cursor: pointer; width: 100%; height: 80px; object-fit: cover;" onclick="addImageToCanvas('${event.target.result}')">
                    `;
                    imagePreview.appendChild(previewDiv);

                    // Add to global function
                    window.addImageToCanvas = function(src) {
                        addImageToCanvas(src);
                    };
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // Add Text Button Handler
    addTextBtn.addEventListener('click', function() {
        const text = textInput.value.trim();
        if (text) {
            addTextToCanvas(text, fontSelect.value, textColor.value);
            textInput.value = '';
        }
    });

    // Add Image to Canvas
    function addImageToCanvas(src) {
        const imgElement = document.createElement('div');
        imgElement.className = 'design-element design-image';
        imgElement.style.position = 'absolute';
        imgElement.style.left = '50px';
        imgElement.style.top = '50px';
        imgElement.style.cursor = 'move';
        imgElement.innerHTML = `
            <img src="${src}" style="max-width: 200px; max-height: 200px; border: 2px solid #007bff;">
            <div class="element-controls" style="position: absolute; top: -25px; right: -25px; display: none;">
                <button class="btn btn-sm btn-danger" onclick="removeElement(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        makeElementDraggable(imgElement);
        designCanvas.appendChild(imgElement);
        designElements.push(imgElement);

        // Remove initial placeholder
        const placeholder = designCanvas.querySelector('.text-center');
        if (placeholder) {
            placeholder.remove();
        }
    }

    // Add Text to Canvas
    function addTextToCanvas(text, font, color) {
        const textElement = document.createElement('div');
        textElement.className = 'design-element design-text';
        textElement.style.position = 'absolute';
        textElement.style.left = '100px';
        textElement.style.top = '100px';
        textElement.style.cursor = 'move';
        textElement.style.fontFamily = font;
        textElement.style.color = color;
        textElement.style.fontSize = '24px';
        textElement.style.userSelect = 'none';
        textElement.innerHTML = `
            <span>${text}</span>
            <div class="element-controls" style="position: absolute; top: -25px; right: -25px; display: none;">
                <button class="btn btn-sm btn-danger" onclick="removeElement(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        makeElementDraggable(textElement);
        designCanvas.appendChild(textElement);
        designElements.push(textElement);

        // Remove initial placeholder
        const placeholder = designCanvas.querySelector('.text-center');
        if (placeholder) {
            placeholder.remove();
        }
    }

    // Make Element Draggable
    function makeElementDraggable(element) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag);

        function startDrag(e) {
            e.preventDefault();
            isDragging = true;

            if (e.type === 'mousedown') {
                startX = e.clientX;
                startY = e.clientY;
            } else {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }

            const rect = element.getBoundingClientRect();
            initialX = rect.left - designCanvas.getBoundingClientRect().left;
            initialY = rect.top - designCanvas.getBoundingClientRect().top;

            selectedElement = element;

            // Show controls
            element.querySelector('.element-controls').style.display = 'block';

            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
        }

        function drag(e) {
            if (!isDragging) return;

            e.preventDefault();
            let currentX, currentY;

            if (e.type === 'mousemove') {
                currentX = e.clientX;
                currentY = e.clientY;
            } else {
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
            }

            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            element.style.left = (initialX + deltaX) + 'px';
            element.style.top = (initialY + deltaY) + 'px';
        }

        function endDrag(e) {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);
        }
    }

    // Remove Element
    window.removeElement = function(button) {
        const element = button.closest('.design-element');
        const index = designElements.indexOf(element);
        if (index > -1) {
            designElements.splice(index, 1);
        }
        element.remove();
    };

    // Clear Canvas
    clearBtn.addEventListener('click', function() {
        designElements.forEach(element => element.remove());
        designElements = [];
        selectedElement = null;

        // Add back placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'text-center text-muted';
        placeholder.style.position = 'absolute';
        placeholder.style.top = '50%';
        placeholder.style.left = '50%';
        placeholder.style.transform = 'translate(-50%, -50%)';
        placeholder.innerHTML = `
            <i class="fas fa-image fa-3x mb-3"></i>
            <p>Start by uploading an image or adding text</p>
        `;
        designCanvas.appendChild(placeholder);
    });

    // Undo (remove last element)
    undoBtn.addEventListener('click', function() {
        if (designElements.length > 0) {
            const lastElement = designElements.pop();
            lastElement.remove();
        }
    });

    // Preview Design
    previewBtn.addEventListener('click', function() {
        alert('Preview functionality would show a print-ready version of your design.');
    });

    // Update Price Calculation
    function updatePrice() {
        const quantity = parseInt(quantitySelect.value);
        const paperType = paperSelect.value;

        let base = 0;
        let discount = 0;
        let shipping = 0;

        // Base pricing logic
        if (quantity <= 50) base = 0.50;
        else if (quantity <= 100) base = 0.45;
        else if (quantity <= 250) base = 0.40;
        else if (quantity <= 500) base = 0.35;
        else base = 0.30;

        // Paper type adjustments
        if (paperType === 'premium') base += 0.10;
        else if (paperType === 'matte') base += 0.05;
        else if (paperType === 'glossy') base += 0.08;

        // Quantity discount
        if (quantity >= 100) discount = base * 0.1 * quantity;
        else if (quantity >= 250) discount = base * 0.15 * quantity;
        else if (quantity >= 500) discount = base * 0.20 * quantity;

        // Shipping
        if (quantity <= 50) shipping = 5.99;
        else if (quantity <= 100) shipping = 8.99;
        else shipping = 12.99;

        const subtotal = (base * quantity) - discount;
        const total = subtotal + shipping;

        basePrice.textContent = (base * quantity).toFixed(2);
        quantityDiscount.textContent = discount.toFixed(2);
        shippingCost.textContent = shipping.toFixed(2);
        totalPrice.textContent = total.toFixed(2);
    }

    // Price update event listeners
    quantitySelect.addEventListener('change', updatePrice);
    paperSelect.addEventListener('change', updatePrice);

    // Add to Cart
    addToCartBtn.addEventListener('click', function() {
        if (designElements.length === 0) {
            alert('Please add some elements to your design before adding to cart.');
            return;
        }

        // Get current cart count
        let cartCount = parseInt(localStorage.getItem('cartCount') || '0');
        cartCount++;
        localStorage.setItem('cartCount', cartCount);

        // Update cart count display
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
        }

        alert('Design added to cart successfully!');

        // Save design to localStorage
        const designData = {
            elements: designElements.map(el => ({
                type: el.classList.contains('design-image') ? 'image' : 'text',
                content: el.querySelector('img') ? el.querySelector('img').src : el.querySelector('span').textContent,
                position: {
                    left: el.style.left,
                    top: el.style.top
                },
                styles: {
                    fontFamily: el.style.fontFamily,
                    color: el.style.color,
                    fontSize: el.style.fontSize
                }
            })),
            quantity: quantitySelect.value,
            paperType: paperSelect.value,
            totalPrice: totalPrice.textContent
        };

        localStorage.setItem('currentDesign', JSON.stringify(designData));
    });

    // Order Now
    orderBtn.addEventListener('click', function() {
        if (designElements.length === 0) {
            alert('Please add some elements to your design before ordering.');
            return;
        }

        // Check if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('Please sign in to place an order.');
            window.location.href = 'signin.html';
            return;
        }

        window.location.href = 'checkout.html';
    });

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
    }

    // Load cart count
    const cartCount = localStorage.getItem('cartCount') || '0';
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.setItem('cartCount', '0');
    location.reload();
}

