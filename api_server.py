"""
Smart Grocery Inventory System - Python Flask API Server
Quickest way to link C++ logic with Web UI
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# ===== INVENTORY DATA (From your C++ application) =====
inventory = [
    {"id": 1, "name": "Alphonso Mangoes (Maharashtra)", "category": "Fruits", "price": 180, "quantity": 15, "perishable": True, "expiry": "2025-11-15"},
    {"id": 2, "name": "Amul Whole Milk", "category": "Dairy", "price": 55, "quantity": 25, "perishable": True, "expiry": "2025-11-12"},
    {"id": 3, "name": "Basmati Rice (Dehra Dun)", "category": "Grains", "price": 180, "quantity": 30, "perishable": False, "expiry": ""},
    {"id": 4, "name": "Fresh Chicken Breast", "category": "Meat", "price": 280, "quantity": 8, "perishable": True, "expiry": "2025-11-11"},
    {"id": 5, "name": "Canned Beans (Indian)", "category": "Canned Goods", "price": 45, "quantity": 45, "perishable": False, "expiry": ""},
    {"id": 6, "name": "Amul Greek Yogurt", "category": "Dairy", "price": 120, "quantity": 3, "perishable": True, "expiry": "2025-11-14"},
    {"id": 7, "name": "Wheat Flour (Aata)", "category": "Grains", "price": 50, "quantity": 50, "perishable": False, "expiry": ""},
    {"id": 8, "name": "Fresh Spinach (Himalayan)", "category": "Vegetables", "price": 50, "quantity": 4, "perishable": True, "expiry": "2025-11-11"},
    {"id": 9, "name": "Sunflower Oil (Refined)", "category": "Oils", "price": 200, "quantity": 20, "perishable": False, "expiry": ""},
    {"id": 10, "name": "Frooti Orange Juice", "category": "Beverages", "price": 40, "quantity": 2, "perishable": True, "expiry": "2025-11-13"},
    {"id": 11, "name": "Multigrain Bread", "category": "Bakery", "price": 60, "quantity": 15, "perishable": True, "expiry": "2025-11-12"},
    {"id": 12, "name": "Assam Tea", "category": "Beverages", "price": 400, "quantity": 5, "perishable": False, "expiry": ""},
    {"id": 13, "name": "Strawberries (Kashmir)", "category": "Fruits", "price": 250, "quantity": 6, "perishable": True, "expiry": "2025-11-11"},
    {"id": 14, "name": "Peanut Butter (Creamy)", "category": "Condiments", "price": 250, "quantity": 15, "perishable": False, "expiry": ""},
    {"id": 15, "name": "Fresh Tomatoes (Nashik)", "category": "Vegetables", "price": 45, "quantity": 20, "perishable": True, "expiry": "2025-11-15"},
    {"id": 16, "name": "Paneer (Amul)", "category": "Dairy", "price": 380, "quantity": 12, "perishable": True, "expiry": "2025-11-13"},
    {"id": 17, "name": "Arhar Dal", "category": "Pulses", "price": 140, "quantity": 25, "perishable": False, "expiry": ""},
    {"id": 18, "name": "Garam Masala", "category": "Spices", "price": 180, "quantity": 10, "perishable": False, "expiry": ""},
    {"id": 19, "name": "Hilsa Fish", "category": "Meat", "price": 500, "quantity": 5, "perishable": True, "expiry": "2025-11-11"},
    {"id": 20, "name": "Coconut Oil (Virgin/Kerala)", "category": "Oils", "price": 280, "quantity": 18, "perishable": False, "expiry": ""},
]

# ===== API ENDPOINTS =====

# GET all items
@app.route('/api/items', methods=['GET'])
def get_items():
    """Fetch all inventory items"""
    return jsonify(inventory)


# GET single item by ID
@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """Fetch single item by ID"""
    item = next((i for i in inventory if i['id'] == item_id), None)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    return jsonify(item)


# POST add new item
@app.route('/api/items', methods=['POST'])
def add_item():
    """Add new item to inventory"""
    try:
        data = request.json
        
        # Validation
        if not data.get('name') or not data.get('category'):
            return jsonify({"success": False, "error": "Name and category required"}), 400
        
        if data.get('price', 0) < 0:
            return jsonify({"success": False, "error": "Price cannot be negative"}), 400
        
        if data.get('quantity', 0) < 0:
            return jsonify({"success": False, "error": "Quantity cannot be negative"}), 400
        
        # Create new item
        new_id = max((i['id'] for i in inventory), default=0) + 1
        new_item = {
            'id': new_id,
            'name': data['name'],
            'category': data['category'],
            'price': float(data.get('price', 0)),
            'quantity': int(data.get('quantity', 0)),
            'perishable': data.get('perishable', False),
            'expiry': data.get('expiry', '')
        }
        
        inventory.append(new_item)
        
        return jsonify({
            "success": True,
            "message": "Item added successfully",
            "item": new_item
        }), 201
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# PUT update item
@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    """Update existing item"""
    try:
        item = next((i for i in inventory if i['id'] == item_id), None)
        if not item:
            return jsonify({"success": False, "error": "Item not found"}), 404
        
        data = request.json
        
        # Validation
        if 'price' in data and data['price'] < 0:
            return jsonify({"success": False, "error": "Price cannot be negative"}), 400
        
        if 'quantity' in data and data['quantity'] < 0:
            return jsonify({"success": False, "error": "Quantity cannot be negative"}), 400
        
        # Update fields
        if 'name' in data:
            item['name'] = data['name']
        if 'category' in data:
            item['category'] = data['category']
        if 'price' in data:
            item['price'] = float(data['price'])
        if 'quantity' in data:
            item['quantity'] = int(data['quantity'])
        if 'expiry' in data:
            item['expiry'] = data['expiry']
        
        return jsonify({
            "success": True,
            "message": "Item updated successfully",
            "item": item
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# DELETE item
@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """Delete item from inventory"""
    global inventory
    
    item = next((i for i in inventory if i['id'] == item_id), None)
    if not item:
        return jsonify({"success": False, "error": "Item not found"}), 404
    
    inventory = [i for i in inventory if i['id'] != item_id]
    
    return jsonify({
        "success": True,
        "message": "Item deleted successfully"
    })


# SEARCH by name
@app.route('/api/search/name/<query>', methods=['GET'])
def search_by_name(query):
    """Search items by name (partial match, case-insensitive)"""
    query_lower = query.lower()
    results = [i for i in inventory if query_lower in i['name'].lower()]
    return jsonify(results)


# SEARCH by category
@app.route('/api/search/category/<category>', methods=['GET'])
def search_by_category(category):
    """Search items by category"""
    results = [i for i in inventory if i['category'].lower() == category.lower()]
    return jsonify(results)


# GET low stock items (quantity <= 5)
@app.route('/api/low-stock', methods=['GET'])
def get_low_stock():
    """Get items with low stock (quantity <= 5)"""
    low_stock = [i for i in inventory if i['quantity'] <= 5]
    return jsonify({
        "count": len(low_stock),
        "items": low_stock
    })


# GET near-expiry items
@app.route('/api/expiry/<int:days>', methods=['GET'])
def get_expiry_items(days):
    """Get items expiring within specified days"""
    today = datetime.now().date()
    future_date = today + timedelta(days=days)
    
    expiry_items = []
    for item in inventory:
        if item['perishable'] and item['expiry']:
            try:
                expiry = datetime.strptime(item['expiry'], '%Y-%m-%d').date()
                if today <= expiry <= future_date:
                    expiry_items.append(item)
            except:
                pass
    
    return jsonify({
        "days": days,
        "count": len(expiry_items),
        "items": expiry_items
    })


# POST generate bill
@app.route('/api/bill', methods=['POST'])
def generate_bill():
    """Generate bill and update inventory"""
    try:
        data = request.json
        cart = data.get('cart', [])
        tax_percent = float(data.get('tax', 5))
        discount_percent = float(data.get('discount', 0))
        
        if not cart:
            return jsonify({"success": False, "error": "Cart is empty"}), 400
        
        # Calculate bill
        bill_items = []
        subtotal = 0
        
        for cart_item in cart:
            item_id = cart_item['id']
            quantity = cart_item['quantity']
            
            item = next((i for i in inventory if i['id'] == item_id), None)
            if not item:
                return jsonify({"success": False, "error": f"Item {item_id} not found"}), 404
            
            if item['quantity'] < quantity:
                return jsonify({"success": False, "error": f"Insufficient stock for {item['name']}"}), 400
            
            amount = item['price'] * quantity
            subtotal += amount
            
            bill_items.append({
                'id': item_id,
                'name': item['name'],
                'quantity': quantity,
                'rate': item['price'],
                'amount': amount
            })
            
            # Update inventory
            item['quantity'] -= quantity
        
        # Calculate totals
        discount_amount = subtotal * (discount_percent / 100)
        taxable = subtotal - discount_amount
        tax_amount = taxable * (tax_percent / 100)
        total = taxable + tax_amount
        
        return jsonify({
            "success": True,
            "bill": {
                "items": bill_items,
                "subtotal": subtotal,
                "discount_percent": discount_percent,
                "discount_amount": discount_amount,
                "tax_percent": tax_percent,
                "tax_amount": tax_amount,
                "total": total,
                "timestamp": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Check if API is running"""
    return jsonify({
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "items_count": len(inventory)
    })


# ===== MAIN =====

if __name__ == '__main__':
    print("=" * 60)
    print("Smart Grocery Inventory System - Flask API Server")
    print("=" * 60)
    print("\nStarting server on: http://localhost:8080")
    print("\nAPI Endpoints Available:")
    print("  GET    /api/items              - Get all items")
    print("  GET    /api/items/<id>         - Get single item")
    print("  POST   /api/items              - Add new item")
    print("  PUT    /api/items/<id>         - Update item")
    print("  DELETE /api/items/<id>         - Delete item")
    print("  GET    /api/search/name/<q>    - Search by name")
    print("  GET    /api/search/category/<c> - Search by category")
    print("  GET    /api/low-stock          - Low stock items")
    print("  GET    /api/expiry/<days>      - Expiring items")
    print("  POST   /api/bill               - Generate bill")
    print("  GET    /api/health             - Health check")
    print("\nWeb UI will connect automatically!")
    print("Open index.html in browser.")
    print("\nPress Ctrl+C to stop the server.\n")
    
    app.run(debug=True, port=8080, host='0.0.0.0')
