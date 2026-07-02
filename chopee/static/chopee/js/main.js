// Global App State
let currentCoupon = null;
let currentCouponRate = 0;

// CSRF Helper
function getCSRFToken() {
    const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfInput) {
        return csrfInput.value;
    }
    // Fallback to cookie
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 10) === ('csrftoken=')) {
                cookieValue = decodeURIComponent(cookie.substring(10));
                break;
            }
        }
    }
    return cookieValue;
}

// -------------------------------------------------------------
// Initialize App Component Modules
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initCarousel();
    initFlashSaleTimer();
    initCartDrawer();
    initCheckoutModal();
    initSearchSuggestions();
    
    // Fetch initial cart contents to sync navbar
    fetchCart();
});

// -------------------------------------------------------------
// 1. CAROUSEL MODULE
// -------------------------------------------------------------
function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    let currentSlide = 0;
    let slideInterval = setInterval(nextSlide, 4000);

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    function nextSlide() {
        let index = (currentSlide + 1) % slides.length;
        showSlide(index);
    }

    // Connect dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            // Reset timer on click
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 4000);
        });
    });
}

// -------------------------------------------------------------
// 2. FLASH SALE TIMER MODULE
// -------------------------------------------------------------
function initFlashSaleTimer() {
    const timerHr = document.getElementById('timer-hour');
    const timerMin = document.getElementById('timer-min');
    const timerSec = document.getElementById('timer-sec');

    if (!timerHr) return;

    // Set countdown length: 2 hours from now
    let duration = 2 * 60 * 60; // in seconds

    function updateTimer() {
        let h = Math.floor(duration / 3600);
        let m = Math.floor((duration % 3600) / 60);
        let s = duration % 60;

        timerHr.textContent = String(h).padStart(2, '0');
        timerMin.textContent = String(m).padStart(2, '0');
        timerSec.textContent = String(s).padStart(2, '0');

        if (duration <= 0) {
            // Reset to 2 hours again
            duration = 2 * 60 * 60;
        } else {
            duration--;
        }
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// -------------------------------------------------------------
// 3. TOAST NOTIFICATIONS MODULE
// -------------------------------------------------------------
function showToast(message, iconClass = 'fa-check-circle') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
    
    container.appendChild(toast);
    
    // Auto remove after 3s
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// -------------------------------------------------------------
// 4. CART & DRAWER MODULE
// -------------------------------------------------------------
let cartData = { items: [], total: 0, original_total: 0, savings: 0, total_quantity: 0 };

function initCartDrawer() {
    const cartTrigger = document.getElementById('cart-trigger');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-drawer-overlay');
    const closeBtn = document.getElementById('close-cart-btn');
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    const couponInput = document.getElementById('coupon-input');
    const checkoutTriggerBtn = document.getElementById('checkout-trigger-btn');
    
    // Toggle cart drawer
    cartTrigger.addEventListener('click', (e) => {
        // Only open if clicking cart button directly or preview button
        if (e.target.closest('.view-cart-btn') || e.target.closest('.cart-icon-btn')) {
            openCartDrawer();
        }
    });

    closeBtn.addEventListener('click', closeCartDrawer);
    cartOverlay.addEventListener('click', closeCartDrawer);

    // Apply Coupon Code
    applyCouponBtn.addEventListener('click', () => {
        const code = couponInput.value.trim().toUpperCase();
        const statusMsg = document.getElementById('coupon-status-msg');
        
        if (code === 'SHOPEE50') {
            currentCoupon = 'SHOPEE50';
            currentCouponRate = 0.50; // 50% discount
            statusMsg.textContent = 'Coupon SHOPEE50 Applied (50% Off)!';
            statusMsg.style.color = '#10b981';
            showToast('Applied 50% Off Discount Coupon!', 'fa-ticket-alt');
        } else if (code === 'FREE30') {
            currentCoupon = 'FREE30';
            currentCouponRate = 0.30; // 30% discount
            statusMsg.textContent = 'Coupon FREE30 Applied (30% Off)!';
            statusMsg.style.color = '#10b981';
            showToast('Applied 30% Off Discount Coupon!', 'fa-ticket-alt');
        } else {
            currentCoupon = null;
            currentCouponRate = 0.00;
            statusMsg.textContent = 'Invalid Coupon Code';
            statusMsg.style.color = '#ef4444';
        }
        
        renderCartUI();
    });

    // Checkout Trigger button
    checkoutTriggerBtn.addEventListener('click', () => {
        if (cartData.items.length === 0) {
            showToast('Your cart is empty', 'fa-exclamation-triangle');
            return;
        }
        closeCartDrawer();
        openCheckoutModal();
    });
}

function openCartDrawer() {
    document.getElementById('cart-drawer').classList.add('active');
    document.getElementById('cart-drawer-overlay').classList.add('active');
    fetchCart();
}

function closeCartDrawer() {
    document.getElementById('cart-drawer').classList.remove('active');
    document.getElementById('cart-drawer-overlay').classList.remove('active');
}

// Fetch Cart list from server
function fetchCart() {
    fetch('/chopee/api/cart/')
        .then(res => res.json())
        .then(data => {
            cartData = data;
            renderCartUI();
        })
        .catch(err => console.error('Error fetching cart:', err));
}

// Render dynamic cart components (nav badge, previews, drawers)
function renderCartUI() {
    // 1. Badge count
    const badge = document.getElementById('cart-badge');
    badge.textContent = cartData.total_quantity;
    
    // Add minor zoom-pop effect to badge
    badge.classList.remove('anim-pop');
    void badge.offsetWidth; // trigger reflow
    badge.classList.add('anim-pop');

    // Drawer header count
    document.getElementById('cart-drawer-count').textContent = cartData.total_quantity;
    
    // 2. Cart preview dropdown items
    const previewItemsContainer = document.getElementById('cart-preview-items');
    const previewQty = document.getElementById('cart-preview-qty');
    previewQty.textContent = cartData.total_quantity;

    if (cartData.items.length === 0) {
        previewItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-shopping-basket"></i>
                <p>No items in cart yet</p>
            </div>
        `;
    } else {
        previewItemsContainer.innerHTML = cartData.items.slice(0, 5).map(item => `
            <div class="cart-preview-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-preview-item-info">
                    <div class="cart-preview-item-name">${item.name}</div>
                    <div class="cart-preview-item-qty">Qty: ${item.quantity}</div>
                </div>
                <div class="cart-preview-item-price">฿${(item.discount_price || item.price).toFixed(2)}</div>
            </div>
        `).join('');
    }

    // 3. Cart Drawer items list
    const drawerItemsContainer = document.getElementById('cart-drawer-items');
    if (cartData.items.length === 0) {
        drawerItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-shopping-basket" style="font-size: 64px;"></i>
                <p style="margin-top: 15px;">Your Shopping Cart is empty.</p>
                <button class="continue-shopping-btn" style="width: auto; margin-top: 15px; padding: 10px 20px;" onclick="closeCartDrawer()">Shop Now</button>
            </div>
        `;
    } else {
        drawerItemsContainer.innerHTML = cartData.items.map(item => `
            <div class="cart-drawer-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-drawer-item-details">
                    <div class="cart-drawer-item-title">${item.name}</div>
                    <div class="cart-drawer-item-price">฿${(item.discount_price || item.price).toFixed(2)}</div>
                    <div class="cart-drawer-item-actions">
                        <div class="cart-drawer-qty-control">
                            <button onclick="updateItemQuantity(${item.product_id}, ${item.quantity - 1})">-</button>
                            <input type="text" readonly value="${item.quantity}">
                            <button onclick="updateItemQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                </div>
                <button class="remove-cart-item-btn" onclick="removeCartItem(${item.product_id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');
    }

    // 4. Summaries and discounts
    document.getElementById('cart-original-total').textContent = `฿${cartData.original_total.toFixed(2)}`;
    document.getElementById('cart-savings').textContent = `-฿${cartData.savings.toFixed(2)}`;
    
    // Apply coupon discount value
    const couponRow = document.getElementById('coupon-row');
    const couponDisplayCode = document.getElementById('coupon-display-code');
    const couponDiscountVal = document.getElementById('coupon-discount-val');
    
    let grandTotal = cartData.total;
    if (currentCoupon) {
        let discount = cartData.total * currentCouponRate;
        grandTotal = cartData.total - discount;
        
        couponDisplayCode.textContent = currentCoupon;
        couponDiscountVal.textContent = `-฿${discount.toFixed(2)}`;
        couponRow.style.display = 'flex';
    } else {
        couponRow.style.display = 'none';
    }
    
    document.getElementById('cart-grand-total').textContent = `฿${grandTotal.toFixed(2)}`;
    document.getElementById('checkout-summary-total').textContent = `฿${grandTotal.toFixed(2)}`;
    document.getElementById('place-order-total-btn').textContent = grandTotal.toFixed(2);
}

// -------------------------------------------------------------
// AJAX Cart Actions
// -------------------------------------------------------------
function addToCartDirect(productId, productName) {
    const token = getCSRFToken();
    fetch(`/chopee/api/cart/add/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': token
        },
        body: JSON.stringify({ quantity: 1 })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast(`Added "${productName}" to cart!`);
            fetchCart();
        } else {
            showToast(data.error || 'Failed to add item', 'fa-exclamation-triangle');
        }
    })
    .catch(err => {
        console.error('Error adding item:', err);
        showToast('Error connecting to server', 'fa-exclamation-triangle');
    });
}

function updateItemQuantity(productId, newQty) {
    const token = getCSRFToken();
    fetch(`/chopee/api/cart/update/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': token
        },
        body: JSON.stringify({ quantity: newQty })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            fetchCart();
        }
    })
    .catch(err => console.error('Error updating quantity:', err));
}

function removeCartItem(productId) {
    const token = getCSRFToken();
    fetch(`/chopee/api/cart/remove/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': token
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Item removed from cart');
            fetchCart();
        }
    })
    .catch(err => console.error('Error removing item:', err));
}

// -------------------------------------------------------------
// 5. PRODUCT DETAILS MODAL MODULE
// -------------------------------------------------------------
function openProductDetail(productId) {
    const overlay = document.getElementById('product-modal-overlay');
    const modal = document.getElementById('product-detail-modal');
    const content = document.getElementById('modal-product-content');
    
    // Display loading
    content.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-circle-notch fa-spin"></i> Loading product details...
        </div>
    `;
    
    overlay.classList.add('active');
    modal.classList.add('active');
    
    // Fetch info
    fetch(`/chopee/api/product/${productId}/`)
        .then(res => res.json())
        .then(p => {
            const finalPrice = p.discount_price || p.price;
            const originalPriceHTML = p.discount_price ? `<span class="modal-price-original">฿${p.price.toFixed(2)}</span>` : '';
            
            content.innerHTML = `
                <div class="modal-product-layout">
                    <div class="modal-image-panel">
                        <img src="${p.image}" alt="${p.name}">
                    </div>
                    <div class="modal-details-panel">
                        <span class="modal-product-category">${p.category}</span>
                        <h2 class="modal-product-title">${p.name}</h2>
                        
                        <div class="modal-product-meta">
                            <span class="stars"><i class="fas fa-star"></i> ${p.rating}</span>
                            <span class="nav-divider">|</span>
                            <span>${p.sales_count} Sold</span>
                            <span class="nav-divider">|</span>
                            <span class="text-green">${p.stock} units remaining</span>
                        </div>
                        
                        <div class="modal-price-box">
                            ${originalPriceHTML}
                            <span class="modal-price-current">฿${finalPrice.toFixed(2)}</span>
                        </div>
                        
                        <div class="modal-desc-box">
                            <p>${p.description || 'No description available for this product.'}</p>
                        </div>
                        
                        <div class="quantity-selection-row">
                            <span>Quantity</span>
                            <div class="qty-spinner-btn">
                                <button type="button" onclick="modifyModalQty(-1)">-</button>
                                <input type="text" id="modal-qty-input" readonly value="1">
                                <button type="button" onclick="modifyModalQty(1, ${p.stock})">+</button>
                            </div>
                        </div>
                        
                        <div class="modal-action-buttons">
                            <button type="button" class="modal-add-cart-btn" onclick="addModalItemToCart(${p.id}, '${p.name}')">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                            <button type="button" class="modal-buy-now-btn" onclick="buyNowModalItem(${p.id}, '${p.name}')">
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch(err => {
            console.error('Error fetching product detail:', err);
            content.innerHTML = '<p class="error-msg">Failed to load product details.</p>';
        });
}

// Modal closing helpers
document.getElementById('close-detail-btn').addEventListener('click', closeProductDetailModal);
document.getElementById('product-modal-overlay').addEventListener('click', closeProductDetailModal);

function closeProductDetailModal() {
    document.getElementById('product-detail-modal').classList.remove('active');
    document.getElementById('product-modal-overlay').classList.remove('active');
}

// Modifies quantity spinner inside details modal
function modifyModalQty(amount, maxStock = 999) {
    const input = document.getElementById('modal-qty-input');
    if (!input) return;
    
    let currentVal = parseInt(input.value) || 1;
    let newVal = currentVal + amount;
    
    if (newVal < 1) newVal = 1;
    if (newVal > maxStock) newVal = maxStock;
    
    input.value = newVal;
}

// Modal Action Add to Cart
function addModalItemToCart(productId, productName) {
    const qtyInput = document.getElementById('modal-qty-input');
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
    const token = getCSRFToken();
    
    fetch(`/chopee/api/cart/add/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': token
        },
        body: JSON.stringify({ quantity: quantity })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast(`Added ${quantity} x "${productName}" to cart!`);
            closeProductDetailModal();
            fetchCart();
        }
    })
    .catch(err => console.error(err));
}

// Modal Buy Now action
function buyNowModalItem(productId, productName) {
    const qtyInput = document.getElementById('modal-qty-input');
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
    const token = getCSRFToken();
    
    fetch(`/chopee/api/cart/add/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': token
        },
        body: JSON.stringify({ quantity: quantity })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeProductDetailModal();
            fetchCart();
            // Wait slightly and trigger checkout Drawer
            setTimeout(() => {
                openCartDrawer();
            }, 300);
        }
    })
    .catch(err => console.error(err));
}

// -------------------------------------------------------------
// 6. CHECKOUT FORM AND SUCCESS MODALS MODULE
// -------------------------------------------------------------
function initCheckoutModal() {
    const overlay = document.getElementById('checkout-modal-overlay');
    const modal = document.getElementById('checkout-modal');
    const closeBtn = document.getElementById('close-checkout-btn');
    const form = document.getElementById('checkout-form');
    
    closeBtn.addEventListener('click', closeCheckoutModal);
    overlay.addEventListener('click', closeCheckoutModal);

    // Form submit listener
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('checkout-name').value.trim();
        const phone = document.getElementById('checkout-phone').value.trim();
        const address = document.getElementById('checkout-address').value.trim();
        const method = document.querySelector('input[name="payment_method"]:checked').value;
        const token = getCSRFToken();
        
        const orderPayload = {
            name: name,
            phone: phone,
            address: address,
            payment_method: method,
            coupon_code: currentCoupon || ''
        };
        
        fetch('/chopee/api/checkout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': token
            },
            body: JSON.stringify(orderPayload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeCheckoutModal();
                
                // Show Success Screen
                document.getElementById('success-order-id').textContent = `#${data.order_id}`;
                document.getElementById('success-total-price').textContent = `฿${data.total_price.toFixed(2)}`;
                
                document.getElementById('success-modal-overlay').classList.add('active');
                document.getElementById('success-modal').classList.add('active');
                
                // Clear coupon
                currentCoupon = null;
                currentCouponRate = 0.00;
                document.getElementById('coupon-input').value = '';
                document.getElementById('coupon-status-msg').textContent = '';
                
                // Refresh cart (should be empty now)
                fetchCart();
            } else {
                showToast(data.error || 'Failed to place order', 'fa-exclamation-triangle');
            }
        })
        .catch(err => {
            console.error('Checkout error:', err);
            showToast('Connection error, try again.', 'fa-exclamation-triangle');
        });
    });

    // Close success state modal
    document.getElementById('success-close-btn').addEventListener('click', () => {
        document.getElementById('success-modal-overlay').classList.remove('active');
        document.getElementById('success-modal').classList.remove('active');
    });

    // Style payment options checks dynamically
    const options = document.querySelectorAll('.payment-option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('checked'));
            opt.classList.add('checked');
        });
    });
}

function openCheckoutModal() {
    document.getElementById('checkout-modal-overlay').classList.add('active');
    document.getElementById('checkout-modal').classList.add('active');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal-overlay').classList.remove('active');
    document.getElementById('checkout-modal').classList.remove('active');
}

// -------------------------------------------------------------
// 7. SEARCH SUGGESTIONS DROP-DOWN MODULE
// -------------------------------------------------------------
function initSearchSuggestions() {
    const input = document.getElementById('search-input');
    const suggestions = document.getElementById('search-suggestions');
    
    if (!input) return;

    input.addEventListener('focus', () => {
        suggestions.classList.add('active');
    });
    
    // Close drop-down on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-section')) {
            suggestions.classList.remove('active');
        }
    });

    // Populate search keyword on clicking suggestion items
    const items = suggestions.querySelectorAll('.suggestion-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            input.value = item.textContent;
            suggestions.classList.remove('active');
            input.closest('form').submit(); // trigger search
        });
    });
}
