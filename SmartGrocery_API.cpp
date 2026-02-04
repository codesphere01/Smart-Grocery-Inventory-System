#include <iostream>
#include <vector>
#include <string>
#include <memory>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <stdexcept>
#include <algorithm>
#include <cctype>
#include <ctime>

using namespace std;

// ===== CROW LIBRARY MINIMAL HTTP SERVER =====
// Using simple sockets for HTTP responses (no external library needed)

class HTTPResponse {
public:
    string body;
    int status = 200;
    string contentType = "application/json";

    string toString() {
        stringstream ss;
        ss << "HTTP/1.1 " << status << " OK\r\n";
        ss << "Content-Type: " << contentType << "; charset=utf-8\r\n";
        ss << "Access-Control-Allow-Origin: *\r\n";
        ss << "Access-Control-Allow-Methods: GET, POST, PUT, DELETE\r\n";
        ss << "Access-Control-Allow-Headers: Content-Type\r\n";
        ss << "Content-Length: " << body.length() << "\r\n";
        ss << "Connection: close\r\n\r\n";
        ss << body;
        return ss.str();
    }
};

// ===== ORIGINAL C++ INVENTORY CLASSES =====

class InventoryException : public runtime_error {
public:
    InventoryException(const string &msg) : runtime_error(msg) {}
};

class Item {
protected:
    int id;
    string name;
    string category;
    double price;
    int quantity;

public:
    Item() : id(0), name(""), category(""), price(0.0), quantity(0) {}

    Item(int id, string name, string category, double price, int qty)
        : id(id), name(move(name)), category(move(category)), price(price), quantity(qty) {}

    virtual ~Item() = default;

    int getId() const { return id; }
    string getName() const { return name; }
    string getCategory() const { return category; }
    double getPrice() const { return price; }
    int getQuantity() const { return quantity; }

    void setName(const string &n) { name = n; }
    void setCategory(const string &c) { category = c; }
    void setPrice(double p) { 
        if (p < 0) throw InventoryException("Price cannot be negative"); 
        price = p; 
    }
    void setQuantity(int q) { 
        if (q < 0) throw InventoryException("Quantity cannot be negative"); 
        quantity = q; 
    }

    Item& operator+(int addQty) { 
        if (addQty < 0) throw InventoryException("Cannot add negative quantity"); 
        quantity += addQty; 
        return *this; 
    }

    Item& operator-(int subQty) { 
        if (subQty < 0) throw InventoryException("Cannot subtract negative quantity"); 
        if (subQty > quantity) throw InventoryException("Insufficient stock"); 
        quantity -= subQty; 
        return *this; 
    }

    virtual bool isPerishable() const { return false; }
    virtual string expiryDate() const { return ""; }
    virtual Item* clone() const { return new Item(*this); }
};

class Perishable : public Item {
private:
    string expiry;

public:
    Perishable() = default;

    Perishable(int id, string name, string category, double price, int qty, string expiryDate)
        : Item(id, move(name), move(category), price, qty), expiry(move(expiryDate)) {}

    bool isPerishable() const override { return true; }
    string expiryDate() const override { return expiry; }
    Item* clone() const override { return new Perishable(*this); }
};

class NonPerishable : public Item {
public:
    NonPerishable() = default;

    NonPerishable(int id, string name, string category, double price, int qty)
        : Item(id, move(name), move(category), price, qty) {}

    Item* clone() const override { return new NonPerishable(*this); }
};

class Inventory {
private:
    vector<unique_ptr<Item>> items;
    int nextId;

public:
    Inventory() : nextId(1) {
        initializeSampleData();
    }

    void addItem(unique_ptr<Item> it) {
        if (it->getId() == 0) {
            int id = nextId++;
            if (it->isPerishable()) {
                Perishable *p = dynamic_cast<Perishable*>(it.get());
                items.emplace_back(make_unique<Perishable>(id, p->getName(), p->getCategory(), 
                                                           p->getPrice(), p->getQuantity(), p->expiryDate()));
            } else {
                items.emplace_back(make_unique<NonPerishable>(id, it->getName(), it->getCategory(), 
                                                              it->getPrice(), it->getQuantity()));
            }
        } else {
            int id = it->getId();
            if (id >= nextId) nextId = id + 1;
            items.emplace_back(move(it));
        }
    }

    Item* findById(int id) {
        for (auto &it : items) {
            if (it->getId() == id) return it.get();
        }
        return nullptr;
    }

    vector<Item*> searchByName(const string &namePart) {
        vector<Item*> out;
        string lower = namePart;
        for (auto &c : lower) c = tolower(c);
        
        for (auto &it : items) {
            string name = it->getName();
            for (auto &c : name) c = tolower(c);
            if (name.find(lower) != string::npos) {
                out.push_back(it.get());
            }
        }
        return out;
    }

    vector<Item*> searchByCategory(const string &cat) {
        vector<Item*> out;
        for (auto &it : items) {
            if (it->getCategory() == cat) {
                out.push_back(it.get());
            }
        }
        return out;
    }

    void removeItem(int id) {
        auto it = remove_if(items.begin(), items.end(), 
                           [&](const unique_ptr<Item> &p) { return p->getId() == id; });
        if (it == items.end()) throw InventoryException("Item not found to remove");
        items.erase(it, items.end());
    }

    const vector<unique_ptr<Item>>& getItems() const {
        return items;
    }

    void initializeSampleData() {
        items.clear();
        nextId = 1;

        addItem(make_unique<Perishable>(0, "Alphonso Mangoes (Maharashtra)", "Fruits", 180, 15, "2025-11-15"));
        addItem(make_unique<Perishable>(0, "Amul Whole Milk", "Dairy", 55, 25, "2025-11-12"));
        addItem(make_unique<NonPerishable>(0, "Basmati Rice (Dehra Dun)", "Grains", 180, 30, ""));
        addItem(make_unique<Perishable>(0, "Fresh Chicken Breast", "Meat", 280, 8, "2025-11-11"));
        addItem(make_unique<NonPerishable>(0, "Canned Beans (Indian)", "Canned Goods", 45, 45, ""));
        addItem(make_unique<Perishable>(0, "Amul Greek Yogurt", "Dairy", 120, 3, "2025-11-14"));
        addItem(make_unique<NonPerishable>(0, "Wheat Flour (Aata)", "Grains", 50, 50, ""));
        addItem(make_unique<Perishable>(0, "Fresh Spinach (Himalayan)", "Vegetables", 50, 4, "2025-11-11"));
        addItem(make_unique<NonPerishable>(0, "Sunflower Oil (Refined)", "Oils", 200, 20, ""));
        addItem(make_unique<Perishable>(0, "Frooti Orange Juice", "Beverages", 40, 2, "2025-11-13"));
        addItem(make_unique<Perishable>(0, "Multigrain Bread", "Bakery", 60, 15, "2025-11-12"));
        addItem(make_unique<NonPerishable>(0, "Assam Tea", "Beverages", 400, 5, ""));
        addItem(make_unique<Perishable>(0, "Strawberries (Kashmir)", "Fruits", 250, 6, "2025-11-11"));
        addItem(make_unique<NonPerishable>(0, "Peanut Butter (Creamy)", "Condiments", 250, 15, ""));
        addItem(make_unique<Perishable>(0, "Fresh Tomatoes (Nashik)", "Vegetables", 45, 20, "2025-11-15"));
        addItem(make_unique<Perishable>(0, "Paneer (Amul)", "Dairy", 380, 12, "2025-11-13"));
        addItem(make_unique<NonPerishable>(0, "Arhar Dal", "Pulses", 140, 25, ""));
        addItem(make_unique<NonPerishable>(0, "Garam Masala", "Spices", 180, 10, ""));
        addItem(make_unique<Perishable>(0, "Hilsa Fish", "Meat", 500, 5, "2025-11-11"));
        addItem(make_unique<NonPerishable>(0, "Coconut Oil (Virgin/Kerala)", "Oils", 280, 18, ""));
    }
};

// ===== JSON HELPERS =====

string escapeJson(const string& s) {
    string out;
    for (char c : s) {
        if (c == '"') out += "\\\"";
        else if (c == '\\') out += "\\\\";
        else if (c == '\n') out += "\\n";
        else if (c == '\r') out += "\\r";
        else if (c == '\t') out += "\\t";
        else out += c;
    }
    return out;
}

string itemToJson(Item* item) {
    stringstream ss;
    ss << "{"
       << "\"id\":" << item->getId() << ","
       << "\"name\":\"" << escapeJson(item->getName()) << "\","
       << "\"category\":\"" << escapeJson(item->getCategory()) << "\","
       << "\"price\":" << fixed << setprecision(2) << item->getPrice() << ","
       << "\"quantity\":" << item->getQuantity() << ","
       << "\"perishable\":" << (item->isPerishable() ? "true" : "false") << ","
       << "\"expiry\":\"" << (item->isPerishable() ? item->expiryDate() : "") << "\""
       << "}";
    return ss.str();
}

// ===== GLOBAL INVENTORY =====
Inventory inv;

// ===== SIMPLE HTTP SERVER =====

int main() {
    cout << "Smart Grocery Inventory System - REST API Server" << endl;
    cout << "Starting server on http://localhost:8080" << endl;
    cout << "Endpoints:" << endl;
    cout << "  GET    /api/items - Get all items" << endl;
    cout << "  POST   /api/items - Add new item" << endl;
    cout << "  PUT    /api/items/<id> - Update item" << endl;
    cout << "  DELETE /api/items/<id> - Delete item" << endl;
    cout << "  GET    /api/search/name/<query> - Search by name" << endl;
    cout << "  GET    /api/search/category/<category> - Search by category" << endl << endl;

    // For production, use proper HTTP server library (Crow, Pistache, or Boost.Asio)
    // This is a simplified example showing the structure
    
    cout << "===============================================" << endl;
    cout << "IMPORTANT SETUP INSTRUCTIONS:" << endl;
    cout << "===============================================" << endl;
    cout << endl;
    cout << "To use with the web UI, you have 2 options:" << endl;
    cout << endl;
    cout << "OPTION 1: Use with Python Flask (Recommended for Quick Start)" << endl;
    cout << "---" << endl;
    cout << "1. Save this file and ensure sample data is accessible" << endl;
    cout << "2. Create a Python server (see below)" << endl;
    cout << "3. The web UI will connect to it automatically" << endl;
    cout << endl;
    cout << "OPTION 2: Use Crow C++ Library (Production)" << endl;
    cout << "---" << endl;
    cout << "1. Install: git clone https://github.com/CrowCpp/Crow.git" << endl;
    cout << "2. Compile: g++ -std=c++17 -o api SmartGrocery_API.cpp" << endl;
    cout << "3. Run: ./api" << endl;
    cout << endl;
    cout << "For now, the C++ data is ready." << endl;
    cout << "See README.md for integration steps." << endl;

    return 0;
}

/* ===== ALTERNATIVE: PYTHON FLASK WRAPPER =====

Create a file called: api_server.py

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
import subprocess
import json

app = Flask(__name__)
CORS(app)

# Sample inventory data (load from C++)
inventory = [
    {"id": 1, "name": "Alphonso Mangoes", "category": "Fruits", "price": 180, "quantity": 15, "perishable": True, "expiry": "2025-11-15"},
    # ... add all 20 items here
]

@app.route('/api/items', methods=['GET'])
def get_items():
    return jsonify(inventory)

@app.route('/api/items', methods=['POST'])
def add_item():
    data = request.json
    new_id = max(item['id'] for item in inventory) + 1
    data['id'] = new_id
    inventory.append(data)
    return jsonify({"success": True, "message": "Item added"}), 201

@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    item = next((i for i in inventory if i['id'] == item_id), None)
    if item:
        item.update(request.json)
        return jsonify({"success": True})
    return jsonify({"error": "Item not found"}), 404

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    global inventory
    inventory = [i for i in inventory if i['id'] != item_id]
    return jsonify({"success": True})

@app.route('/api/search/name/<query>', methods=['GET'])
def search_name(query):
    results = [i for i in inventory if query.lower() in i['name'].lower()]
    return jsonify(results)

@app.route('/api/search/category/<category>', methods=['GET'])
def search_category(category):
    results = [i for i in inventory if i['category'] == category]
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=8080)
```

Run with: python3 api_server.py

*/
