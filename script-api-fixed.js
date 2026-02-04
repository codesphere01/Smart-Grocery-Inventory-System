/* ========================================
   SMART GROCERY - FIXED JavaScript
   With Error Handling & Fallback
   ======================================== */

// API Configuration
const API_BASE = 'http://localhost:8080/api';
let API_AVAILABLE = false;

// Global State
let inventory = [];
let cart = [];
let deleteTargetId = null;

// ========================================
// UTILITIES
// ========================================

function formatCurrency(amount) {
    return '₹' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getStockStatus(quantity) {
    if (quantity > 10) return { class: 'status-good', text: 'Good' };
    if (quantity > 5) return { class: 'status-medium', text: 'Medium' };
    return { class: 'status-low', text: 'Low' };
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        if (toast) toast.classList.remove('show');
    }, 3000);
}

const categoryColors = {
    'Fruits': '#fbbf24', 'Vegetables': '#10b981', 'Dairy': '#8b5cf6', 'Meat': '#ef4444',
    'Grains': '#d97706', 'Beverages': '#06b6d4', 'Canned Goods': '#6366f1', 'Bakery': '#ec4899',
    'Condiments': '#f97316', 'Oils': '#84cc16', 'Pulses': '#a855f7', 'Spices': '#f59e0b'
};

// ========================================
// SAMPLE DATA FOR FALLBACK
// ========================================

const sampleData = [
    { id: 1, name: 'Alphonso Mangoes (Maharashtra)', category: 'Fruits', price: 180, quantity: 15, perishable: true, expiry: '2025-11-15' },
    { id: 2, name: 'Amul Whole Milk', category: 'Dairy', price: 55, quantity: 25, perishable: true, expiry: '2025-11-12' },
    { id: 3, name: 'Basmati Rice (Dehra Dun)', category: 'Grains', price: 180, quantity: 30, perishable: false, expiry: '' },
    { id: 4, name: 'Fresh Chicken Breast', category: 'Meat', price: 280, quantity: 8, perishable: true, expiry: '2025-11-11' },
    { id: 5, name: 'Canned Beans (Indian)', category: 'Canned Goods', price: 45, quantity: 45, perishable: false, expiry: '' },
    { id: 6, name: 'Amul Greek Yogurt', category: 'Dairy', price: 120, quantity: 3, perishable: true, expiry: '2025-11-14' },
    { id: 7, name: 'Wheat Flour (Aata)', category: 'Grains', price: 50, quantity: 50, perishable: false, expiry: '' },
    { id: 8, name: 'Fresh Spinach (Himalayan)', category: 'Vegetables', price: 50, quantity: 4, perishable: true, expiry: '2025-11-11' },
    { id: 9, name: 'Sunflower Oil (Refined)', category: 'Oils', price: 200, quantity: 20, perishable: false, expiry: '' },
    { id: 10, name: 'Frooti Orange Juice', category: 'Beverages', price: 40, quantity: 2, perishable: true, expiry: '2025-11-13' },
    { id: 11, name: 'Multigrain Bread', category: 'Bakery', price: 60, quantity: 15, perishable: true, expiry: '2025-11-12' },
    { id: 12, name: 'Assam Tea', category: 'Beverages', price: 400, quantity: 5, perishable: false, expiry: '' },
    { id: 13, name: 'Strawberries (Kashmir)', category: 'Fruits', price: 250, quantity: 6, perishable: true, expiry: '2025-11-11' },
    { id: 14, name: 'Peanut Butter (Creamy)', category: 'Condiments', price: 250, quantity: 15, perishable: false, expiry: '' },
    { id: 15, name: 'Fresh Tomatoes (Nashik)', category: 'Vegetables', price: 45, quantity: 20, perishable: true, expiry: '2025-11-15' },
    { id: 16, name: 'Paneer (Amul)', category: 'Dairy', price: 380, quantity: 12, perishable: true, expiry: '2025-11-13' },
    { id: 17, name: 'Arhar Dal', category: 'Pulses', price: 140, quantity: 25, perishable: false, expiry: '' },
    { id: 18, name: 'Garam Masala', category: 'Spices', price: 180, quantity: 10, perishable: false, expiry: '' },
    { id: 19, name: 'Hilsa Fish', category: 'Meat', price: 500, quantity: 5, perishable: true, expiry: '2025-11-11' },
    { id: 20, name: 'Coconut Oil (Virgin/Kerala)', category: 'Oils', price: 280, quantity: 18, perishable: false, expiry: '' }
];

// ========================================
// CHECK API CONNECTION
// ========================================

async function checkApiConnection() {
    try {
        const response = await fetch(`${API_BASE}/health`, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            API_AVAILABLE = true;
            console.log('✅ API Connected to Flask server');
            showToast('✅ Connected to server', 'success');
            return true;
        }
    } catch (error) {
        API_AVAILABLE = false;
        console.warn('⚠️ Flask API not available. Using fallback data.');
        showToast('⚠️ Using offline mode (API unavailable)', 'warning');
        return false;
    }
}

// ========================================
// API CALLS
// ========================================

async function fetchItems() {
    if (API_AVAILABLE) {
        try {
            const response = await fetch(`${API_BASE}/items`);
            if (!response.ok) throw new Error('Failed to fetch');
            inventory = await response.json();
        } catch (error) {
            console.error('Error fetching from API:', error);
            inventory = JSON.parse(JSON.stringify(sampleData));
            API_AVAILABLE = false;
        }
    } else {
        inventory = JSON.parse(JSON.stringify(sampleData));
    }
    
    updateInventoryStats();
    populateCategories();
    renderItemsTable();
}

async function apiAddItem(item) {
    if (!API_AVAILABLE) {
        item.id = Math.max(...inventory.map(i => i.id), 0) + 1;
        inventory.push(item);
        updateInventoryStats();
        populateCategories();
        renderItemsTable();
        showToast('✓ Item added (offline)', 'success');
        return true;
    }

    try {
        const response = await fetch(`${API_BASE}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        const result = await response.json();
        if (result.success) {
            showToast('✓ Item added', 'success');
            await fetchItems();
            return true;
        } else {
            showToast(result.error || 'Error adding item', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
    return false;
}

async function apiUpdateItem(id, itemData) {
    if (!API_AVAILABLE) {
        const item = inventory.find(i => i.id === id);
        if (item) {
            Object.assign(item, itemData);
            updateInventoryStats();
            renderItemsTable();
            showToast('✓ Item updated (offline)', 'success');
            return true;
        }
    }

    try {
        const response = await fetch(`${API_BASE}/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        const result = await response.json();
        if (result.success) {
            showToast('✓ Item updated', 'success');
            await fetchItems();
            return true;
        } else {
            showToast(result.error || 'Error updating item', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
    return false;
}

async function apiDeleteItem(id) {
    if (!API_AVAILABLE) {
        inventory = inventory.filter(i => i.id !== id);
        updateInventoryStats();
        renderItemsTable();
        showToast('✓ Item deleted (offline)', 'success');
        return true;
    }

    try {
        const response = await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            showToast('✓ Item deleted', 'success');
            await fetchItems();
            return true;
        } else {
            showToast(result.error || 'Error deleting item', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
    return false;
}

async function apiSearchByName(query) {
    if (!API_AVAILABLE) {
        return inventory.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
    }
    
    try {
        const response = await fetch(`${API_BASE}/search/name/${encodeURIComponent(query)}`);
        return await response.json();
    } catch (error) {
        return inventory.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
    }
}

async function apiSearchByCategory(category) {
    if (!API_AVAILABLE) {
        return inventory.filter(item => item.category === category);
    }
    
    try {
        const response = await fetch(`${API_BASE}/search/category/${encodeURIComponent(category)}`);
        return await response.json();
    } catch (error) {
        return inventory.filter(item => item.category === category);
    }
}

// ========================================
// UI FUNCTIONS
// ========================================

function updateInventoryStats() {
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lowStockCount = inventory.filter(item => item.quantity <= 5).length;
    const expiryCount = inventory.filter(item => item.perishable && item.expiry).length;

    const els = {
        totalItems: document.getElementById('totalItems'),
        totalValue: document.getElementById('totalValue'),
        dashTotalItems: document.getElementById('dashTotalItems'),
        dashTotalValue: document.getElementById('dashTotalValue'),
        dashLowStock: document.getElementById('dashLowStock'),
        dashExpiry: document.getElementById('dashExpiry'),
        totalCategories: document.getElementById('totalCategories'),
        perishableCount: document.getElementById('perishableCount'),
        nonPerishableCount: document.getElementById('nonPerishableCount'),
        avgPrice: document.getElementById('avgPrice')
    };

    Object.keys(els).forEach(key => {
        if (!els[key]) return;
        if (key === 'totalItems' || key === 'totalValue') {
            els[key].textContent = key === 'totalValue' ? formatCurrency(totalValue) : totalItems;
        } else if (key === 'dashTotalItems') els[key].textContent = inventory.length;
        else if (key === 'dashTotalValue') els[key].textContent = formatCurrency(totalValue);
        else if (key === 'dashLowStock') els[key].textContent = lowStockCount;
        else if (key === 'dashExpiry') els[key].textContent = expiryCount;
        else if (key === 'totalCategories') els[key].textContent = new Set(inventory.map(i => i.category)).size;
        else if (key === 'perishableCount') els[key].textContent = inventory.filter(i => i.perishable).length;
        else if (key === 'nonPerishableCount') els[key].textContent = inventory.filter(i => !i.perishable).length;
        else if (key === 'avgPrice') els[key].textContent = inventory.length > 0 ? (inventory.reduce((sum, i) => sum + i.price, 0) / inventory.length).toFixed(2) : '0';
    });
}

function populateCategories() {
    const select = document.getElementById('filterCategory');
    if (!select) return;
    const categories = [...new Set(inventory.map(i => i.category))].sort();
    select.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

function renderItemsTable(items = inventory) {
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No items found</td></tr>';
        return;
    }

    items.forEach(item => {
        const status = getStockStatus(item.quantity);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td><span class="category-badge" style="background-color: ${categoryColors[item.category] || '#999'};">${item.category}</span></td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.quantity}</td>
            <td><span class="status-badge ${status.class}">${status.text}</span></td>
            <td>
                <button class="btn btn-primary" style="padding: 0.4rem 0.6rem; font-size: 0.8rem;" onclick="editItem(${item.id})">✏️</button>
                <button class="btn btn-danger" style="padding: 0.4rem 0.6rem; font-size: 0.8rem;" onclick="openDeleteModal(${item.id}, '${item.name.replace(/'/g, "\\'")}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterItems() {
    const nameFilter = document.getElementById('filterName')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('filterCategory')?.value || '';

    const filtered = inventory.filter(item => {
        const matchName = item.name.toLowerCase().includes(nameFilter);
        const matchCategory = !categoryFilter || item.category === categoryFilter;
        return matchName && matchCategory;
    });

    renderItemsTable(filtered);
}

function editItem(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const modal = document.getElementById('editModal');
    if (!modal) return;
    
    document.getElementById('editItemId').value = id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemCategory').value = item.category;
    document.getElementById('editItemPrice').value = item.price;
    document.getElementById('editItemQuantity').value = item.quantity;

    modal.classList.add('active');
}

async function saveEdit() {
    const id = parseInt(document.getElementById('editItemId').value);
    const itemData = {
        name: document.getElementById('editItemName').value,
        category: document.getElementById('editItemCategory').value,
        price: parseFloat(document.getElementById('editItemPrice').value),
        quantity: parseInt(document.getElementById('editItemQuantity').value)
    };

    const success = await apiUpdateItem(id, itemData);
    if (success) {
        document.getElementById('editModal').classList.remove('active');
    }
}

function openDeleteModal(id, name) {
    deleteTargetId = id;
    const msg = document.getElementById('deleteMessage');
    if (msg) msg.textContent = `Are you sure you want to delete "${name}"?`;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('active');
}

async function confirmDelete() {
    if (deleteTargetId === null) return;
    const success = await apiDeleteItem(deleteTargetId);
    if (success) {
        document.getElementById('deleteModal').classList.remove('active');
    }
}

// ========================================
// SEARCH
// ========================================

async function searchByName() {
    const query = document.getElementById('searchName')?.value || '';
    const results = await apiSearchByName(query);
    displaySearchResults(results);
}

async function searchByCategory() {
    const query = document.getElementById('searchCategory')?.value || '';
    const results = await apiSearchByCategory(query);
    displaySearchResults(results);
}

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No items found</div>';
        return;
    }

    let html = '<div class="items-table-wrapper"><table class="items-table"><thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Qty</th><th>Status</th></tr></thead><tbody>';
    results.forEach(item => {
        const status = getStockStatus(item.quantity);
        html += `<tr><td>${item.id}</td><td>${item.name}</td><td><span class="category-badge" style="background-color: ${categoryColors[item.category] || '#999'};">${item.category}</span></td><td>${formatCurrency(item.price)}</td><td>${item.quantity}</td><td><span class="status-badge ${status.class}">${status.text}</span></td></tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ========================================
// LOW STOCK & EXPIRY
// ========================================

function showLowStockItems() {
    const lowStockItems = inventory.filter(item => item.quantity <= 5);
    const container = document.getElementById('lowStockContent');
    if (!container) return;

    if (lowStockItems.length === 0) {
        container.innerHTML = '<div class="alert alert-success">✓ All items are well-stocked!</div>';
        return;
    }

    let html = '<div class="items-table-wrapper"><table class="items-table"><thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Qty</th></tr></thead><tbody>';
    lowStockItems.forEach(item => {
        html += `<tr><td>${item.id}</td><td>${item.name}</td><td><span class="category-badge" style="background-color: ${categoryColors[item.category] || '#999'};">${item.category}</span></td><td>${formatCurrency(item.price)}</td><td><span class="status-badge status-low">${item.quantity}</span></td></tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function checkExpiryItems() {
    const days = parseInt(document.getElementById('expiryDays')?.value || 7);
    const container = document.getElementById('expiryContent');
    if (!container) return;

    const expiryItems = inventory.filter(item => item.perishable && item.expiry);
    if (expiryItems.length === 0) {
        container.innerHTML = `<div class="alert alert-success">✓ No items expiring within ${days} days.</div>`;
        return;
    }

    let html = `<div class="alert alert-warning">⚠️ ${expiryItems.length} item(s) expiring</div><div class="items-table-wrapper"><table class="items-table"><thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Qty</th><th>Expiry</th></tr></thead><tbody>`;
    expiryItems.forEach(item => {
        html += `<tr><td>${item.id}</td><td>${item.name}</td><td><span class="category-badge" style="background-color: ${categoryColors[item.category] || '#999'};">${item.category}</span></td><td>${formatCurrency(item.price)}</td><td>${item.quantity}</td><td>${item.expiry}</td></tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ========================================
// BILLING
// ========================================

function addToCart() {
    const itemId = parseInt(document.getElementById('cartItemId')?.value || 0);
    const quantity = parseInt(document.getElementById('cartQuantity')?.value || 0);

    if (!itemId || !quantity || quantity <= 0) {
        showToast('Enter valid ID and quantity', 'error');
        return;
    }

    const item = inventory.find(i => i.id === itemId);
    if (!item) {
        showToast('Item not found', 'error');
        return;
    }

    if (item.quantity < quantity) {
        showToast('Insufficient stock', 'error');
        return;
    }

    const existing = cart.find(c => c.id === itemId);
    if (existing) {
        existing.cartQuantity += quantity;
    } else {
        cart.push({ id: item.id, name: item.name, price: item.price, cartQuantity: quantity });
    }

    document.getElementById('cartItemId').value = '';
    document.getElementById('cartQuantity').value = '';
    renderCart();
    showToast('✓ Added to cart', 'success');
}

function renderCart() {
    const tbody = document.getElementById('cartTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Empty</td></tr>';
        updateBillSummary();
        return;
    }

    cart.forEach((item, index) => {
        const amount = item.price * item.cartQuantity;
        const row = document.createElement('tr');
        row.innerHTML = `<td>${item.name}</td><td>${item.cartQuantity}</td><td>${formatCurrency(item.price)}</td><td>${formatCurrency(amount)}</td><td><button class="btn btn-danger" style="padding: 0.3rem 0.5rem; font-size: 0.75rem;" onclick="removeFromCart(${index})">Remove</button></td>`;
        tbody.appendChild(row);
    });

    updateBillSummary();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function updateBillSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent')?.value || 0);
    const gstPercent = parseFloat(document.getElementById('gstPercent')?.value || 5);

    const discountAmount = subtotal * (discountPercent / 100);
    const taxable = subtotal - discountAmount;
    const taxAmount = taxable * (gstPercent / 100);
    const total = taxable + taxAmount;

    if (document.getElementById('billSubtotal')) document.getElementById('billSubtotal').textContent = formatCurrency(subtotal);
    if (document.getElementById('discountAmount')) document.getElementById('discountAmount').textContent = formatCurrency(discountAmount);
    if (document.getElementById('gstAmount')) document.getElementById('gstAmount').textContent = formatCurrency(taxAmount);
    if (document.getElementById('billTotal')) document.getElementById('billTotal').textContent = formatCurrency(total);
}

async function completePurchase() {
    if (cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }

    cart.forEach(cartItem => {
        const item = inventory.find(i => i.id === cartItem.id);
        if (item) item.quantity -= cartItem.cartQuantity;
    });

    updateInventoryStats();
    renderItemsTable();
    cart = [];
    renderCart();
    showToast('✓ Purchase completed!', 'success');
}

function clearCart() {
    cart = [];
    renderCart();
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Page loaded - checking API...');
    await checkApiConnection();
    await fetchItems();

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.dataset.section;
            
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
            
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            if (sectionId === 'view-items') renderItemsTable();
            else if (sectionId === 'low-stock') showLowStockItems();
            else if (sectionId === 'expiry') checkExpiryItems();
        });
    });

    // Forms
    const addForm = document.getElementById('addItemForm');
    if (addForm) {
        addForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const item = {
                name: document.getElementById('itemName').value,
                category: document.getElementById('itemCategory').value,
                price: parseFloat(document.getElementById('itemPrice').value),
                quantity: parseInt(document.getElementById('itemQuantity').value),
                perishable: document.querySelector('input[name="itemType"]:checked').value === 'perishable',
                expiry: document.querySelector('input[name="itemType"]:checked').value === 'perishable' ? document.getElementById('itemExpiry').value : ''
            };
            if (await apiAddItem(item)) this.reset();
        });
    }

    document.querySelectorAll('input[name="itemType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const group = document.getElementById('expiryGroup');
            if (group) group.style.display = this.value === 'perishable' ? 'block' : 'none';
        });
    });

    // Filters
    const filterName = document.getElementById('filterName');
    const filterCat = document.getElementById('filterCategory');
    if (filterName) filterName.addEventListener('input', filterItems);
    if (filterCat) filterCat.addEventListener('change', filterItems);

    // Search
    const searchByNameBtn = document.getElementById('searchByNameBtn');
    const searchByCategoryBtn = document.getElementById('searchByCategoryBtn');
    if (searchByNameBtn) searchByNameBtn.addEventListener('click', searchByName);
    if (searchByCategoryBtn) searchByCategoryBtn.addEventListener('click', searchByCategory);

    // Expiry
    const checkExpiryBtn = document.getElementById('checkExpiryBtn');
    if (checkExpiryBtn) checkExpiryBtn.addEventListener('click', checkExpiryItems);

    // Billing
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
    const completeBtn = document.getElementById('completePurchaseBtn');
    if (completeBtn) completeBtn.addEventListener('click', completePurchase);
    const printBtn = document.getElementById('printBillBtn');
    if (printBtn) printBtn.addEventListener('click', () => window.print());

    const discountPct = document.getElementById('discountPercent');
    const gstPct = document.getElementById('gstPercent');
    if (discountPct) discountPct.addEventListener('change', updateBillSummary);
    if (gstPct) gstPct.addEventListener('change', updateBillSummary);

    // Edit form
    const editForm = document.getElementById('editItemForm');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveEdit();
        });
    }

    // Delete
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    renderCart();
    console.log('✅ All event listeners attached');
});

// Close modals on outside click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
