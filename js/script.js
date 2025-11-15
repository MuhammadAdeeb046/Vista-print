document.addEventListener("DOMContentLoaded", () => {
  let currentCategory = null;
  let cropper = null;
  let currentUploadTarget = null;
  let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
  let selectedColor = "#000000";

  // Check if coming from products page
  const selectedProduct = JSON.parse(localStorage.getItem('selectedProduct') || 'null');
  if (selectedProduct && window.location.hash === '#designer') {
    // Auto-select the product and show designer
    setTimeout(() => {
      const productCard = document.querySelector(`[data-category="${selectedProduct.category}"]`);
      if (productCard) {
        productCard.click();
      }
      localStorage.removeItem('selectedProduct');
    }, 500);
  }

  // Update cart count on page load
  updateCartCount();

  // Add fade-in animation to elements
  const animateElements = document.querySelectorAll('.product-card, .review-card');
  animateElements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('fade-in');
    }, index * 100);
  });

  // Update the selected color when a radio button is clicked
  document.querySelectorAll('input[name="color"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      selectedColor = radio.value;
      const colorName = getColorName(radio.value);
      document.querySelector(".selected-color-text").textContent = `Selected Color: ${colorName}`;
    });
  });

  // Helper function to get the color name from the hex value
  function getColorName(hex) {
    const colorMap = {
      "#000000": "Black",
      "#ffffff": "White", 
      "#808080": "Grey",
      "#ffa500": "Orange",
    };
    return colorMap[hex] || hex;
  }

  // Category Selection
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      // Remove previous selection
      document.querySelectorAll(".category-card").forEach((c) => c.classList.remove("border-primary"));

      // Add selection to clicked card
      card.classList.add("border-primary");
      currentCategory = card.dataset.category;

      // Show designer container with animation
      const designerContainer = document.querySelector(".designer-container");
      designerContainer.style.display = "block";
      designerContainer.classList.add("slide-up");
      
      // Update product name
      document.getElementById("selected-product").textContent = card.querySelector("h5").textContent;

      // Show/hide color selection based on category
      const colorSelectionContainer = document.getElementById("color-selection");
      if (currentCategory === "tshirt" || currentCategory === "banners") {
        colorSelectionContainer.style.display = "block";
        // Reset to black
        document.getElementById("color-black").checked = true;
        selectedColor = "#000000";
        document.querySelector(".selected-color-text").textContent = "Selected Color: Black";
      } else {
        colorSelectionContainer.style.display = "none";
      }

      // Show/hide size selector for t-shirts
      const sizeSelectContainer = document.getElementById("size-select");
      sizeSelectContainer.style.display = currentCategory === "tshirt" ? "block" : "none";

      // Show/hide back design section
      const backDesignSection = document.getElementById("back-design-section");
      backDesignSection.style.display = 
        currentCategory === "business-card" || currentCategory === "tshirt" ? "block" : "none";

      updatePreviewSizes(currentCategory);

      // Smooth scroll to designer
      designerContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      // Reset form
      resetDesignForm();
    });
  });

  // Reset design form
  function resetDesignForm() {
    document.getElementById("front-design-upload").value = "";
    document.getElementById("back-design-upload").value = "";
    document.getElementById("front-design-preview").src = "";
    document.getElementById("back-design-preview").src = "";
    document.getElementById("quantity").value = "1";
    
    if (currentCategory === "tshirt") {
      document.getElementById("product-size").value = "";
    }
  }

  // Image Upload and Cropping
  ["front-design-upload", "back-design-upload"].forEach((uploadId) => {
    const upload = document.getElementById(uploadId);
    if (upload) {
      upload.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          currentUploadTarget = uploadId;
          const reader = new FileReader();
          reader.onload = (e) => {
            const cropperImage = document.getElementById("cropperImage");
            cropperImage.src = e.target.result;

            if (cropper) {
              cropper.destroy();
            }

            const cropperModal = new bootstrap.Modal(document.getElementById("cropperModal"));
            cropperModal.show();

            cropper = new Cropper(cropperImage, {
              aspectRatio: getAspectRatio(currentCategory),
              viewMode: 2,
              background: false,
              guides: true,
              autoCropArea: 1,
              responsive: true,
              restore: false,
              checkCrossOrigin: false,
              checkOrientation: false,
            });
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });
    }
  });

  // Crop Image
  const cropButton = document.getElementById("cropImage");
  if (cropButton) {
    cropButton.addEventListener("click", () => {
      if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas({
          width: 400,
          height: 400,
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high',
        });
        
        const previewId = currentUploadTarget.replace("upload", "preview");
        const previewImg = document.getElementById(previewId);
        previewImg.src = croppedCanvas.toDataURL('image/jpeg', 0.9);
        previewImg.style.display = 'block';

        bootstrap.Modal.getInstance(document.getElementById("cropperModal")).hide();
        showAlert("Image cropped successfully!", "success");
      }
    });
  }

  // Get aspect ratio based on category
  function getAspectRatio(category) {
    switch (category) {
      case "business-card":
        return 3.5 / 2;
      case "flyers":
        return 8.5 / 11;
      case "banners":
        return 4 / 2;
      default:
        return 1;
    }
  }

  // Update preview sizes based on category
  function updatePreviewSizes(category) {
    const sizes = {
      "business-card": { width: "350px", height: "200px" },
      "flyers": { width: "300px", height: "400px" },
      "tshirt": { width: "300px", height: "350px" },
      "banners": { width: "400px", height: "200px" },
    };
    
    const size = sizes[category] || { width: "300px", height: "300px" };
    document.querySelectorAll(".preview-area").forEach((area) => {
      area.style.maxWidth = size.width;
      area.style.height = size.height;
    });
  }

  // Add to Cart
  const addToCartBtn = document.getElementById("add-to-cart");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      if (!currentCategory) {
        showAlert("Please select a product first", "danger");
        return;
      }

      // Validation
      if (!validateDesignInputs()) {
        return;
      }

      const selectedCard = document.querySelector(`.category-card[data-category="${currentCategory}"]`);
      const price = parseFloat(selectedCard.dataset.price);
      const quantity = parseInt(document.getElementById("quantity").value);

      // Check if item already exists in cart
      const existingItemIndex = findExistingCartItem();

      if (existingItemIndex !== -1) {
        // Update existing item
        cartItems[existingItemIndex].quantity += quantity;
        cartItems[existingItemIndex].totalPrice = cartItems[existingItemIndex].price * cartItems[existingItemIndex].quantity;
      } else {
        // Add new item
        const cartItem = createCartItem(price, quantity);
        cartItems.push(cartItem);
      }

      // Save to localStorage
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      updateCartCount();
      showAlert("Added to cart successfully!", "success");
      resetDesignForm();
    });
  }

  // Validate design inputs
  function validateDesignInputs() {
    const frontDesignInput = document.getElementById("front-design-upload");
    if (!frontDesignInput.files || frontDesignInput.files.length === 0) {
      showAlert("Please upload a front design", "danger");
      return false;
    }

    const frontDesignPreview = document.getElementById("front-design-preview");
    if (!frontDesignPreview.src || frontDesignPreview.src === window.location.href) {
      showAlert("Please crop the front design", "danger");
      return false;
    }

    // Check back design for categories that require it
    if (currentCategory === "business-card" || currentCategory === "tshirt") {
      const backDesignInput = document.getElementById("back-design-upload");
      if (!backDesignInput.files || backDesignInput.files.length === 0) {
        showAlert("Please upload a back design", "danger");
        return false;
      }

      const backDesignPreview = document.getElementById("back-design-preview");
      if (!backDesignPreview.src || backDesignPreview.src === window.location.href) {
        showAlert("Please crop the back design", "danger");
        return false;
      }
    }

    // Check size selection for t-shirts
    if (currentCategory === "tshirt") {
      const selectedSize = document.getElementById("product-size").value;
      if (!selectedSize) {
        showAlert("Please select a size", "danger");
        return false;
      }
    }

    return true;
  }

  // Find existing cart item
  function findExistingCartItem() {
    return cartItems.findIndex((item) => {
      if (item.category !== currentCategory) return false;
      
      if (currentCategory === "tshirt") {
        return item.color === selectedColor && item.size === document.getElementById("product-size").value;
      } else if (currentCategory === "banners") {
        return item.color === selectedColor;
      }
      
      return true;
    });
  }

  // Create cart item
  function createCartItem(price, quantity) {
    return {
      category: currentCategory,
      frontDesign: document.getElementById("front-design-preview").src,
      backDesign: document.getElementById("back-design-preview").src,
      color: selectedColor,
      size: currentCategory === "tshirt" ? document.getElementById("product-size").value : null,
      quantity: quantity,
      price: price,
      totalPrice: price * quantity,
    };
  }

  // Cart Button Click
  const cartButton = document.getElementById("cart-button");
  if (cartButton) {
    cartButton.addEventListener("click", () => {
      updateCartModal();
      const cartModal = new bootstrap.Modal(document.getElementById("cartModal"));
      cartModal.show();
    });
  }

  // Checkout Button Click
  const checkoutButton = document.getElementById("checkout-button");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      if (cartItems.length === 0) {
        showAlert("Your cart is empty", "danger");
        return;
      }
      
      const cartModal = bootstrap.Modal.getInstance(document.getElementById("cartModal"));
      cartModal.hide();
      
      const checkoutModal = new bootstrap.Modal(document.getElementById("checkoutModal"));
      checkoutModal.show();
    });
  }

  // Checkout Form Submit
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      // Show loading state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="loading"></span> Processing...';
      submitBtn.disabled = true;

      // Simulate order processing
      setTimeout(() => {
        alert("Order placed successfully! You will receive a confirmation email shortly.");
        cartItems = [];
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartCount();
        
        const checkoutModal = bootstrap.Modal.getInstance(document.getElementById("checkoutModal"));
        checkoutModal.hide();
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Reset form
        checkoutForm.reset();
      }, 2000);
    });
  }

  // Update Cart Count
  function updateCartCount() {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cart-count").textContent = total;
  }

  // Update Cart Modal
  function updateCartModal() {
    const cartItemsContainer = document.getElementById("cart-items");
    cartItemsContainer.innerHTML = "";
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

    document.getElementById("cart-total").textContent = total.toFixed(2);
  }

  // Create cart item element
  function createCartItemElement(item, index) {
    const itemElement = document.createElement("div");
    itemElement.className = "cart-item";

    const productName = document.querySelector(`.category-card[data-category="${item.category}"]`)?.querySelector("h5")?.textContent || item.category;

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
          <h6 class="fw-bold">${productName}</h6>
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
    showAlert("Item removed from cart", "success");
  };

  // Show Bootstrap Alert
  function showAlert(message, type) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Remove existing alerts
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    toastContainer.appendChild(alertDiv);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 4000);
  }

  // Search functionality
  const searchInput = document.querySelector('.search-box input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const productCards = document.querySelectorAll('.product-card');
      
      productCards.forEach(card => {
        const productName = card.querySelector('h5').textContent.toLowerCase();
        const productDescription = card.querySelector('.text-muted').textContent.toLowerCase();
        
        if (productName.includes(searchTerm) || productDescription.includes(searchTerm)) {
          card.style.display = 'block';
          card.classList.add('fade-in');
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});