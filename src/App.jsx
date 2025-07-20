// src/App.jsx - React Frontend for Inventory, Room, and Bookings Management
// This component provides a UI to manage inventory, rooms, and room bookings.
// It connects to the Node.js Express.js backend running on Render.com.
// This version includes enhanced styling with shades of blue and white.

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, XCircle, Save, Home, BedDouble, CalendarCheck, User, Search } from 'lucide-react'; // Added Search icon for future use

// BASE_URL for your backend API
// This line now correctly uses the environment variable provided by Vite,
// which will be set in Netlify's environment variables.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Main App Component
function App() {
  // State to manage the current view (e.g., 'inventory', 'rooms', 'bookings')
  const [currentView, setCurrentView] = useState('inventory');

  // Render the appropriate component based on the current view
  return (
    // Overall background color and font
    <div className="min-h-screen bg-blue-50 font-sans antialiased flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 shadow-xl">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <h1 className="text-white text-4xl font-extrabold rounded-md p-2 tracking-wide">
            Dreams Bar & Guesthouse
          </h1>
          <div className="flex flex-wrap justify-center md:justify-end space-x-2 md:space-x-4">
            <button
              onClick={() => setCurrentView('inventory')}
              className={`px-5 py-2 rounded-full transition-all duration-300 ease-in-out flex items-center space-x-2 text-lg
                ${currentView === 'inventory' ? 'bg-white text-blue-800 shadow-lg transform scale-105 border-2 border-blue-400' : 'text-blue-100 hover:bg-blue-600 hover:text-white hover:shadow-md'}`}
            >
              <Home size={20} />
              <span>Inventory</span>
            </button>
            <button
              onClick={() => setCurrentView('rooms')}
              className={`px-5 py-2 rounded-full transition-all duration-300 ease-in-out flex items-center space-x-2 text-lg
                ${currentView === 'rooms' ? 'bg-white text-blue-800 shadow-lg transform scale-105 border-2 border-blue-400' : 'text-blue-100 hover:bg-blue-600 hover:text-white hover:shadow-md'}`}
            >
              <BedDouble size={20} />
              <span>Rooms</span>
            </button>
            <button
              onClick={() => setCurrentView('bookings')}
              className={`px-5 py-2 rounded-full transition-all duration-300 ease-in-out flex items-center space-x-2 text-lg
                ${currentView === 'bookings' ? 'bg-white text-blue-800 shadow-lg transform scale-105 border-2 border-blue-400' : 'text-blue-100 hover:bg-blue-600 hover:text-white hover:shadow-md'}`}
            >
              <CalendarCheck size={20} />
              <span>Bookings</span>
            </button>
            {/* Add more navigation buttons as modules are developed */}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto p-4 md:p-6 my-8">
        {/* Render the selected view component */}
        {currentView === 'inventory' && <InventoryManagement />}
        {currentView === 'rooms' && <RoomsManagement />}
        {currentView === 'bookings' && <BookingsManagement />}
        {/* Placeholder for other modules */}
        {currentView !== 'inventory' && currentView !== 'rooms' && currentView !== 'bookings' && (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-600 text-xl mt-20 border-t-4 border-blue-500">
            <p className="font-semibold text-2xl mb-4">Module for "{currentView}" is under development.</p>
            <p>Please select another option from the navigation above.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-blue-200 p-4 text-center rounded-t-xl shadow-inner mt-auto">
        <p className="text-sm">&copy; {new Date().getFullYear()} Dreams Bar, Gardens & Guesthouse. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Inventory Management Component
function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');

  const [newItem, setNewItem] = useState({
    name: '',
    category_id: '',
    quantity: 0,
    unit: '',
    cost_price: 0,
    selling_price: 0,
    reorder_level: 0,
  });

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/inventory`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setError("Failed to load inventory items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) {
        console.warn("Categories endpoint not found or failed to fetch. This is expected if not implemented yet.");
        setCategories([]);
        return;
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setMessage("Warning: Could not load categories. Add them manually in your database first (e.g., via MariaDB client) or implement categories API.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      showMessage('Item added successfully!');
      setShowAddModal(false);
      setNewItem({
        name: '', category_id: '', quantity: 0, unit: '', cost_price: 0, selling_price: 0, reorder_level: 0,
      });
      fetchInventory();
    } catch (err) {
      console.error("Failed to add item:", err);
      setError(`Failed to add item: ${err.message}`);
    }
  };

  const openEditModal = (item) => {
    setCurrentItem(item);
    setNewItem({ ...item });
    setShowEditModal(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${currentItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      showMessage('Item updated successfully!');
      setShowEditModal(false);
      setCurrentItem(null);
      fetchInventory();
    } catch (err) {
      console.error("Failed to update item:", err);
      setError(`Failed to update item: ${err.message}`);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      showMessage('Item deleted successfully!');
      fetchInventory();
    } catch (err) {
      console.error("Failed to delete item:", err);
      setError(`Failed to delete item: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading Inventory...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-3xl font-semibold text-gray-800">Inventory Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 flex items-center space-x-2 hover:scale-105"
        >
          <Plus size={20} />
          <span>Add New Item</span>
        </button>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4 shadow-sm" role="alert">
          <span className="block sm:inline">{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 shadow-sm" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {inventory.length === 0 ? (
        <p className="text-center text-gray-500 text-lg mt-10 p-4 border border-gray-200 rounded-lg bg-gray-50">No inventory items found. Add some new items!</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full bg-white border-collapse">
            <thead className="bg-blue-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider rounded-tl-lg">ID</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Category ID</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Quantity</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Unit</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Cost Price</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Selling Price</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Reorder Level</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory.map((item, index) => (
                <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition duration-150`}>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.id}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.name}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.category_id}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.quantity}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.unit}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">UGX {item.cost_price.toFixed(2)}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">UGX {item.selling_price.toFixed(2)}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.reorder_level}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-blue-600 hover:text-blue-900 transition duration-150 p-2 rounded-full hover:bg-blue-100"
                        title="Edit Item"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900 transition duration-150 p-2 rounded-full hover:bg-red-100"
                        title="Delete Item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <Modal title="Add New Inventory Item" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                id="name"
                value={newItem.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category_id"
                id="category_id"
                value={newItem.category_id}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-sm text-red-500 mt-1">No categories found. Please add categories in your database first (e.g., via MariaDB client).</p>
              )}
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                value={newItem.quantity}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit (e.g., bottles, kg, pcs)</label>
              <input
                type="text"
                name="unit"
                id="unit"
                value={newItem.unit}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700">Cost Price (UGX)</label>
              <input
                type="number"
                name="cost_price"
                id="cost_price"
                value={newItem.cost_price}
                onChange={handleInputChange}
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700">Selling Price (UGX)</label>
              <input
                type="number"
                name="selling_price"
                id="selling_price"
                value={newItem.selling_price}
                onChange={handleInputChange}
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="reorder_level" className="block text-sm font-medium text-gray-700">Reorder Level</label>
              <input
                type="number"
                name="reorder_level"
                id="reorder_level"
                value={newItem.reorder_level}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <XCircle size={20} />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <Plus size={20} />
                <span>Add Item</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Item Modal */}
      {showEditModal && currentItem && (
        <Modal title="Edit Inventory Item" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div>
              <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                id="edit_name"
                value={newItem.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit_category_id" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category_id"
                id="edit_category_id"
                value={newItem.category_id}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit_quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                name="quantity"
                id="edit_quantity"
                value={newItem.quantity}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit_unit" className="block text-sm font-medium text-gray-700">Unit</label>
              <input
                type="text"
                name="unit"
                id="edit_unit"
                value={newItem.unit}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit_cost_price" className="block text-sm font-medium text-gray-700">Cost Price (UGX)</label>
              <input
                type="number"
                name="cost_price"
                id="edit_cost_price"
                value={newItem.cost_price}
                onChange={handleInputChange}
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit_selling_price" className="block text-sm font-medium text-gray-700">Selling Price (UGX)</label>
              <input
                type="number"
                name="selling_price"
                id="edit_selling_price"
                value={newItem.selling_price}
                onChange={handleInputChange}
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit_reorder_level" className="block text-sm font-medium text-gray-700">Reorder Level</label>
              <input
                type="number"
                name="reorder_level"
                id="reorder_level"
                value={newItem.reorder_level}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <XCircle size={20} />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <Save size={20} />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Rooms Management Component
function RoomsManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [message, setMessage] = useState('');

  const [newRoom, setNewRoom] = useState({
    room_number: '',
    type: '',
    price_per_night: 0,
    status: 'Available',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/rooms`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      setError("Failed to load rooms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setNewRoom((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      showMessage('Room added successfully!');
      setShowAddModal(false);
      setNewRoom({ room_number: '', type: '', price_per_night: 0, status: 'Available' });
      fetchRooms();
    } catch (err) {
      console.error("Failed to add room:", err);
      setError(`Failed to add room: ${err.message}`);
    }
  };

  const openEditModal = (room) => {
    setCurrentRoom(room);
    setNewRoom({ ...room });
    setShowEditModal(true);
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${currentRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      showMessage('Room updated successfully!');
      setShowEditModal(false);
      setCurrentRoom(null);
      fetchRooms();
    } catch (err) {
      console.error("Failed to update room:", err);
      setError(`Failed to update room: ${err.message}`);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      showMessage('Room deleted successfully!');
      fetchRooms();
    } catch (err) {
      console.error("Failed to delete room:", err);
      setError(`Failed to delete room: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading Rooms...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-3xl font-semibold text-gray-800">Rooms Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 flex items-center space-x-2 hover:scale-105"
        >
          <Plus size={20} />
          <span>Add New Room</span>
        </button>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4 shadow-sm" role="alert">
          <span className="block sm:inline">{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 shadow-sm" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {rooms.length === 0 ? (
        <p className="text-center text-gray-500 text-lg mt-10 p-4 border border-gray-200 rounded-lg bg-gray-50">No rooms found. Add some new rooms!</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full bg-white border-collapse">
            <thead className="bg-blue-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider rounded-tl-lg">ID</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Room Number</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Price/Night (UGX)</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rooms.map((room, index) => (
                <tr key={room.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition duration-150`}>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{room.id}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{room.room_number}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{room.type}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">UGX {room.price_per_night.toFixed(2)}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{room.status}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(room)}
                        className="text-blue-600 hover:text-blue-900 transition duration-150 p-2 rounded-full hover:bg-blue-100"
                        title="Edit Room"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-red-600 hover:text-red-900 transition duration-150 p-2 rounded-full hover:bg-red-100"
                        title="Delete Room"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <Modal title="Add New Room" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddRoom} className="space-y-4">
            <div>
              <label htmlFor="room_number" className="block text-sm font-medium text-gray-700">Room Number</label>
              <input
                type="text"
                name="room_number"
                id="room_number"
                value={newRoom.room_number}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                id="type"
                value={newRoom.type}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Type</option>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
              </select>
            </div>
            <div>
              <label htmlFor="price_per_night" className="block text-sm font-medium text-gray-700">Price Per Night (UGX)</label>
              <input
                type="number"
                name="price_per_night"
                id="price_per_night"
                value={newRoom.price_per_night}
                onChange={handleInputChange}
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                id="status"
                value={newRoom.status}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <XCircle size={20} />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <Plus size={20} />
                <span>Add Room</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Room Modal */}
      {showEditModal && currentRoom && (
        <Modal title="Edit Room" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleUpdateRoom} className="space-y-4">
            <div>
              <label htmlFor="edit_room_number" className="block text-sm font-medium text-gray-700">Room Number</label>
              <input
                type="text"
                name="room_number"
                id="edit_room_number"
                value={newRoom.room_number}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit_type" className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                id="edit_type"
                value={newRoom.type}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Type</option>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit_price_per_night" className="block text-sm font-medium text-gray-700">Price Per Night (UGX)</label>
              <input
                type="number"
                name="price_per_night"
                id="edit_price_per_night"
                value={newRoom.price_per_night}
                onChange={handleInputChange}
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit_status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                id="edit_status"
                value={newRoom.status}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <XCircle size={20} />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <Save size={20} />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}


// Reusable Modal Component (Unchanged)
const Modal = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100 border-t-4 border-blue-500">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition duration-150 p-2 rounded-full hover:bg-gray-100"
            title="Close"
          >
            <XCircle size={24} />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

// Bookings Management Component
function BookingsManagement() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]); // For dropdown
  const [clients, setClients] = useState([]); // For dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [message, setMessage] = useState('');

  const [newBooking, setNewBooking] = useState({
    room_id: '',
    client_id: '',
    check_in_date: '',
    check_out_date: '',
    total_price: 0,
    status: 'Confirmed',
  });

  useEffect(() => {
    fetchBookings();
    fetchRoomsForDropdown();
    fetchClientsForDropdown();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/rooms`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsForDropdown = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms`);
      if (!response.ok) {
        console.warn("Rooms endpoint not found or failed to fetch for dropdown.");
        setRooms([]);
        return;
      }
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      console.error("Failed to fetch rooms for dropdown:", err);
    }
  };

  const fetchClientsForDropdown = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients`);
      if (!response.ok) {
        console.warn("Clients endpoint not found or failed to fetch for dropdown.");
        setClients([]);
        return;
      }
      const data = await response.json();
      setClients(data);
    } catch (err) {
      console.error("Failed to fetch clients for dropdown:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setNewBooking((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      showMessage('Booking added successfully!');
      setShowAddModal(false);
      setNewBooking({ room_id: '', client_id: '', check_in_date: '', check_out_date: '', total_price: 0, status: 'Confirmed' });
      fetchBookings();
    } catch (err) {
      console.error("Failed to add booking:", err);
      setError(`Failed to add booking: ${err.message}`);
    }
  };

  const openEditModal = (booking) => {
    setCurrentBooking(booking);
    // Format dates for input type="date"
    const formattedBooking = {
      ...booking,
      check_in_date: booking.check_in_date ? new Date(booking.check_in_date).toISOString().split('T')[0] : '',
      check_out_date: booking.check_out_date ? new Date(booking.check_out_date).toISOString().split('T')[0] : '',
    };
    setNewBooking(formattedBooking);
    setShowEditModal(true);
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/rooms/${currentBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      showMessage('Booking updated successfully!');
      setShowEditModal(false);
      setCurrentBooking(null);
      fetchBookings();
    } catch (err) {
      console.error("Failed to update booking:", err);
      setError(`Failed to update booking: ${err.message}`);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/rooms/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      showMessage('Booking deleted successfully!');
      fetchBookings();
    } catch (err) {
      console.error("Failed to delete booking:", err);
      setError(`Failed to delete booking: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading Bookings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-3xl font-semibold text-gray-800">Bookings Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 flex items-center space-x-2 hover:scale-105"
        >
          <Plus size={20} />
          <span>Add New Booking</span>
        </button>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4 shadow-sm" role="alert">
          <span className="block sm:inline">{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 shadow-sm" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {bookings.length === 0 ? (
        <p className="text-center text-gray-500 text-lg mt-10 p-4 border border-gray-200 rounded-lg bg-gray-50">No bookings found. Add some new bookings!</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full bg-white border-collapse">
            <thead className="bg-blue-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider rounded-tl-lg">ID</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Room</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Client</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Check-in</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Check-out</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Total Price (UGX)</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking, index) => (
                <tr key={booking.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition duration-150`}>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{booking.id}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{booking.room_number} ({booking.room_type})</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{booking.client_name} ({booking.client_contact_info})</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{new Date(booking.check_in_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{new Date(booking.check_out_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">UGX {booking.total_price.toFixed(2)}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{booking.status}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(booking)}
                        className="text-blue-600 hover:text-blue-900 transition duration-150 p-2 rounded-full hover:bg-blue-100"
                        title="Edit Booking"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="text-red-600 hover:text-red-900 transition duration-150 p-2 rounded-full hover:bg-red-100"
                        title="Delete Booking"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Booking Modal */}
      {showAddModal && (
        <Modal title="Add New Booking" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddBooking} className="space-y-4">
            <div>
              <label htmlFor="booking_room_id" className="block text-sm font-medium text-gray-700">Room</label>
              <select
                name="room_id"
                id="booking_room_id"
                value={newBooking.room_id}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_number} ({room.type}) - {room.status}
                  </option>
                ))}
              </select>
              {rooms.length === 0 && (
                <p className="text-sm text-red-500 mt-1">No rooms found. Please add rooms first via Rooms Management.</p>
              )}
            </div>
            <div>
              <label htmlFor="booking_client_id" className="block text-sm font-medium text-gray-700">Client</label>
              <select
                name="client_id"
                id="booking_client_id"
                value={newBooking.client_id}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.contact_info})
                  </option>
                ))}
              </select>
              {clients.length === 0 && (
                <p className="text-sm text-red-500 mt-1">No clients found. Please add clients directly in your database for now.</p>
              )}
            </div>
            <div>
              <label htmlFor="check_in_date" className="block text-sm font-medium text-gray-700">Check-in Date</label>
              <input
                type="date"
                name="check_in_date"
                id="check_in_date"
                value={newBooking.check_in_date}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="check_out_date" className="block text-sm font-medium text-gray-700">Check-out Date</label>
              <input
                type="date"
                name="check_out_date"
                id="check_out_date"
                value={newBooking.check_out_date}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="booking_total_price" className="block text-sm font-medium text-gray-700">Total Price (UGX)</label>
              <input
                type="number"
                name="total_price"
                id="booking_total_price"
                value={newBooking.total_price}
                onChange={handleInputChange}
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="booking_status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                id="booking_status"
                value={newBooking.status}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <XCircle size={20} />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <Plus size={20} />
                <span>Add Booking</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && currentBooking && (
        <Modal title="Edit Booking" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleUpdateBooking} className="space-y-4">
            <div>
              <label htmlFor="edit_booking_room_id" className="block text-sm font-medium text-gray-700">Room</label>
              <select
                name="room_id"
                id="edit_booking_room_id"
                value={newBooking.room_id}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_number} ({room.type}) - {room.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit_booking_client_id" className="block text-sm font-medium text-gray-700">Client</label>
              <select
                name="client_id"
                id="edit_booking_client_id"
                value={newBooking.client_id}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.contact_info})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit_check_in_date" className="block text-sm font-medium text-gray-700">Check-in Date</label>
              <input
                type="date"
                name="check_in_date"
                id="edit_check_in_date"
                value={newBooking.check_in_date}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit_check_out_date" className="block text-sm font-medium text-gray-700">Check-out Date</label>
              <input
                type="date"
                name="check_out_date"
                id="edit_check_out_date"
                value={newBooking.check_out_date}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit_booking_total_price" className="block text-sm font-medium text-gray-700">Total Price (UGX)</label>
              <input
                type="number"
                name="total_price"
                id="edit_booking_total_price"
                value={newBooking.total_price}
                onChange={handleInputChange}
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit_booking_status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                id="edit_booking_status"
                value={newBooking.status}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <XCircle size={20} />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <Save size={20} />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default App;
