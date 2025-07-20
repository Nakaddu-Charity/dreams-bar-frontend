// src/App.jsx - React Frontend for Inventory, Room, and Bookings Management
// This component provides a UI to manage inventory, rooms, and room bookings.
// It connects to the Node.js Express.js backend running on http://localhost:5000.
// This version uses Bootstrap for styling and react-icons for icons.

import React, { useState, useEffect } from 'react';
// Import icons from react-icons/bs (Bootstrap Icons subset)
import { BsPlusLg, BsPencilFill, BsTrashFill, BsXCircleFill, BsSaveFill, BsHouseDoorFill, BsDoorOpenFill, BsCalendarCheckFill, BsPersonFill } from 'react-icons/bs';

// BASE_URL for your backend API
const API_BASE_URL = 'http://localhost:5000/api';

// Main App Component
function App() {
  // State to manage the current view (e.g., 'inventory', 'rooms', 'bookings')
  const [currentView, setCurrentView] = useState('inventory');

  // Render the appropriate component based on the current view
  return (
    // Overall container with Bootstrap background and padding
    <div className="bg-light min-vh-100 d-flex flex-column">
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-lg py-3">
        <div className="container-fluid">
          <a className="navbar-brand fs-2 fw-bold text-white" href="#">Dreams Bar & Guesthouse</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <button
                  onClick={() => setCurrentView('inventory')}
                  className={`btn btn-lg mx-2 ${currentView === 'inventory' ? 'btn-light text-primary shadow' : 'btn-outline-light'}`}
                >
                  <BsHouseDoorFill className="me-2" />
                  Inventory
                </button>
              </li>
              <li className="nav-item">
                <button
                  onClick={() => setCurrentView('rooms')}
                  className={`btn btn-lg mx-2 ${currentView === 'rooms' ? 'btn-light text-primary shadow' : 'btn-outline-light'}`}
                >
                  <BsDoorOpenFill className="me-2" />
                  Rooms
                </button>
              </li>
              <li className="nav-item">
                <button
                  onClick={() => setCurrentView('bookings')}
                  className={`btn btn-lg mx-2 ${currentView === 'bookings' ? 'btn-light text-primary shadow' : 'btn-outline-light'}`}
                >
                  <BsCalendarCheckFill className="me-2" />
                  Bookings
                </button>
              </li>
              {/* Add more navigation buttons as modules are developed */}
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container flex-grow-1 py-4 my-4">
        {/* Render the selected view component */}
        {currentView === 'inventory' && <InventoryManagement />}
        {currentView === 'rooms' && <RoomsManagement />}
        {currentView === 'bookings' && <BookingsManagement />}
        {/* Placeholder for other modules */}
        {currentView !== 'inventory' && currentView !== 'rooms' && currentView !== 'bookings' && (
          <div className="card shadow-lg p-5 text-center mt-5 border-top border-primary border-4">
            <p className="fs-4 fw-bold mb-3 text-secondary">Module for "{currentView}" is under development.</p>
            <p className="text-muted">Please select another option from the navigation above.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white-50 p-3 text-center mt-auto">
        <p className="mb-0 small">&copy; {new Date().getFullYear()} Dreams Bar, Gardens & Guesthouse. All rights reserved.</p>
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
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-secondary">Loading Inventory...</p>
      </div>
    );
  }

  return (
    <div className="card shadow-lg p-4 border-top border-primary border-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <h2 className="mb-3 mb-md-0 text-secondary">Inventory Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-lg d-flex align-items-center"
        >
          <BsPlusLg className="me-2" />
          Add New Item
        </button>
      </div>

      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {inventory.length === 0 ? (
        <p className="text-center text-muted fs-5 mt-4 p-4 border rounded bg-light">No inventory items found. Add some new items!</p>
      ) : (
        <div className="table-responsive rounded shadow-sm border">
          <table className="table table-hover table-striped mb-0">
            <thead className="bg-primary text-white">
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Name</th>
                <th scope="col">Category ID</th>
                <th scope="col">Quantity</th>
                <th scope="col">Unit</th>
                <th scope="col">Cost Price</th>
                <th scope="col">Selling Price</th>
                <th scope="col">Reorder Level</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, index) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.category_id}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td>UGX {item.cost_price.toFixed(2)}</td>
                  <td>UGX {item.selling_price.toFixed(2)}</td>
                  <td>{item.reorder_level}</td>
                  <td>
                    <div className="d-flex">
                      <button
                        onClick={() => openEditModal(item)}
                        className="btn btn-outline-primary btn-sm me-2"
                        title="Edit Item"
                      >
                        <BsPencilFill size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="btn btn-outline-danger btn-sm"
                        title="Delete Item"
                      >
                        <BsTrashFill size={16} />
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
        <BootstrapModal title="Add New Inventory Item" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddItem} className="row g-3">
            <div className="col-md-6">
              <label htmlFor="name" className="form-label">Name</label>
              <input type="text" className="form-control" id="name" name="name" value={newItem.name} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="category_id" className="form-label">Category</label>
              <select className="form-select" id="category_id" name="category_id" value={newItem.category_id} onChange={handleInputChange} required>
                <option value="">Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <div className="form-text text-danger">No categories found. Please add them manually in your database.</div>
              )}
            </div>
            <div className="col-md-6">
              <label htmlFor="quantity" className="form-label">Quantity</label>
              <input type="number" className="form-control" id="quantity" name="quantity" value={newItem.quantity} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="unit" className="form-label">Unit (e.g., bottles, kg, pcs)</label>
              <input type="text" className="form-control" id="unit" name="unit" value={newItem.unit} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="cost_price" className="form-label">Cost Price (UGX)</label>
              <input type="number" className="form-control" id="cost_price" name="cost_price" value={newItem.cost_price} onChange={handleInputChange} step="0.01" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="selling_price" className="form-label">Selling Price (UGX)</label>
              <input type="number" className="form-control" id="selling_price" name="selling_price" value={newItem.selling_price} onChange={handleInputChange} step="0.01" required />
            </div>
            <div className="col-12">
              <label htmlFor="reorder_level" className="form-label">Reorder Level</label>
              <input type="number" className="form-control" id="reorder_level" name="reorder_level" value={newItem.reorder_level} onChange={handleInputChange} required />
            </div>
            <div className="col-12 d-flex justify-content-end mt-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary me-2 d-flex align-items-center">
                <BsXCircleFill className="me-2" />
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-flex align-items-center">
                <BsPlusLg className="me-2" />
                Add Item
              </button>
            </div>
          </form>
        </BootstrapModal>
      )}

      {/* Edit Item Modal */}
      {showEditModal && currentItem && (
        <BootstrapModal title="Edit Inventory Item" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleUpdateItem} className="row g-3">
            <div className="col-md-6">
              <label htmlFor="edit_name" className="form-label">Name</label>
              <input type="text" className="form-control" id="edit_name" name="name" value={newItem.name} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_category_id" className="form-label">Category</label>
              <select className="form-select" id="edit_category_id" name="category_id" value={newItem.category_id} onChange={handleInputChange} required>
                <option value="">Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_quantity" className="form-label">Quantity</label>
              <input type="number" className="form-control" id="edit_quantity" name="quantity" value={newItem.quantity} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_unit" className="form-label">Unit</label>
              <input type="text" className="form-control" id="edit_unit" name="unit" value={newItem.unit} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_cost_price" className="form-label">Cost Price (UGX)</label>
              <input type="number" className="form-control" id="edit_cost_price" name="cost_price" value={newItem.cost_price} onChange={handleInputChange} step="0.01" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_selling_price" className="form-label">Selling Price (UGX)</label>
              <input type="number" className="form-control" id="edit_selling_price" name="selling_price" value={newItem.selling_price} onChange={handleInputChange} step="0.01" required />
            </div>
            <div className="col-12">
              <label htmlFor="edit_reorder_level" className="form-label">Reorder Level</label>
              <input type="number" className="form-control" id="edit_reorder_level" name="reorder_level" value={newItem.reorder_level} onChange={handleInputChange} required />
            </div>
            <div className="col-12 d-flex justify-content-end mt-4">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary me-2 d-flex align-items-center">
                <BsXCircleFill className="me-2" />
                Cancel
              </button>
              <button type="submit" className="btn btn-success d-flex align-items-center">
                <BsSaveFill className="me-2" />
                Save Changes
              </button>
            </div>
          </form>
        </BootstrapModal>
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
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-secondary">Loading Rooms...</p>
      </div>
    );
  }

  return (
    <div className="card shadow-lg p-4 border-top border-primary border-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <h2 className="mb-3 mb-md-0 text-secondary">Rooms Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-lg d-flex align-items-center"
        >
          <BsPlusLg className="me-2" />
          Add New Room
        </button>
      </div>

      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {rooms.length === 0 ? (
        <p className="text-center text-muted fs-5 mt-4 p-4 border rounded bg-light">No rooms found. Add some new rooms!</p>
      ) : (
        <div className="table-responsive rounded shadow-sm border">
          <table className="table table-hover table-striped mb-0">
            <thead className="bg-primary text-white">
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Room Number</th>
                <th scope="col">Type</th>
                <th scope="col">Price/Night (UGX)</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, index) => (
                <tr key={room.id}>
                  <td>{room.id}</td>
                  <td>{room.room_number}</td>
                  <td>{room.type}</td>
                  <td>UGX {room.price_per_night.toFixed(2)}</td>
                  <td>{room.status}</td>
                  <td>
                    <div className="d-flex">
                      <button
                        onClick={() => openEditModal(room)}
                        className="btn btn-outline-primary btn-sm me-2"
                        title="Edit Room"
                      >
                        <BsPencilFill size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="btn btn-outline-danger btn-sm"
                        title="Delete Room"
                      >
                        <BsTrashFill size={16} />
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
        <BootstrapModal title="Add New Room" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddRoom} className="row g-3">
            <div className="col-md-6">
              <label htmlFor="room_number" className="form-label">Room Number</label>
              <input type="text" className="form-control" id="room_number" name="room_number" value={newRoom.room_number} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="type" className="form-label">Type</label>
              <select className="form-select" id="type" name="type" value={newRoom.type} onChange={handleInputChange} required>
                <option value="">Select Type</option>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="price_per_night" className="form-label">Price Per Night (UGX)</label>
              <input type="number" className="form-control" id="price_per_night" name="price_per_night" value={newRoom.price_per_night} onChange={handleInputChange} step="0.01" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="status" className="form-label">Status</label>
              <select className="form-select" id="status" name="status" value={newRoom.status} onChange={handleInputChange} required>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="col-12 d-flex justify-content-end mt-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary me-2 d-flex align-items-center">
                <BsXCircleFill className="me-2" />
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-flex align-items-center">
                <BsPlusLg className="me-2" />
                Add Room
              </button>
            </div>
          </form>
        </BootstrapModal>
      )}

      {/* Edit Room Modal */}
      {showEditModal && currentRoom && (
        <BootstrapModal title="Edit Room" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleUpdateRoom} className="row g-3">
            <div className="col-md-6">
              <label htmlFor="edit_room_number" className="form-label">Room Number</label>
              <input type="text" className="form-control" id="edit_room_number" name="room_number" value={newRoom.room_number} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_type" className="form-label">Type</label>
              <select className="form-select" id="edit_type" name="type" value={newRoom.type} onChange={handleInputChange} required>
                <option value="">Select Type</option>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_price_per_night" className="form-label">Price Per Night (UGX)</label>
              <input type="number" className="form-control" id="edit_price_per_night" name="price_per_night" value={newRoom.price_per_night} onChange={handleInputChange} step="0.01" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_status" className="form-label">Status</label>
              <select className="form-select" id="edit_status" name="status" value={newRoom.status} onChange={handleInputChange} required>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="col-12 d-flex justify-content-end mt-4">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary me-2 d-flex align-items-center">
                <BsXCircleFill className="me-2" />
                Cancel
              </button>
              <button type="submit" className="btn btn-success d-flex align-items-center">
                <BsSaveFill className="me-2" />
                Save Changes
              </button>
            </div>
          </form>
        </BootstrapModal>
      )}
    </div>
  );
}

// Reusable Bootstrap Modal Component
const BootstrapModal = ({ title, children, onClose }) => {
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {children}
          </div>
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
      setMessage("Warning: Could not load clients. Add them directly in your database for now.");
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
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-secondary">Loading Bookings...</p>
      </div>
    );
  }

  return (
    <div className="card shadow-lg p-4 border-top border-primary border-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <h2 className="mb-3 mb-md-0 text-secondary">Bookings Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-lg d-flex align-items-center"
        >
          <BsPlusLg className="me-2" />
          Add New Booking
        </button>
      </div>

      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {bookings.length === 0 ? (
        <p className="text-center text-muted fs-5 mt-4 p-4 border rounded bg-light">No bookings found. Add some new bookings!</p>
      ) : (
        <div className="table-responsive rounded shadow-sm border">
          <table className="table table-hover table-striped mb-0">
            <thead className="bg-primary text-white">
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Room</th>
                <th scope="col">Client</th>
                <th scope="col">Check-in</th>
                <th scope="col">Check-out</th>
                <th scope="col">Total Price (UGX)</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.room_number} ({booking.room_type})</td>
                  <td>{booking.client_name} ({booking.client_contact_info})</td>
                  <td>{new Date(booking.check_in_date).toLocaleDateString()}</td>
                  <td>{new Date(booking.check_out_date).toLocaleDateString()}</td>
                  <td>UGX {booking.total_price.toFixed(2)}</td>
                  <td>{booking.status}</td>
                  <td>
                    <div className="d-flex">
                      <button
                        onClick={() => openEditModal(booking)}
                        className="btn btn-outline-primary btn-sm me-2"
                        title="Edit Booking"
                      >
                        <BsPencilFill size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="btn btn-outline-danger btn-sm"
                        title="Delete Booking"
                      >
                        <BsTrashFill size={16} />
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
        <BootstrapModal title="Add New Booking" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddBooking} className="row g-3">
            <div className="col-md-6">
              <label htmlFor="booking_room_id" className="form-label">Room</label>
              <select className="form-select" id="booking_room_id" name="room_id" value={newBooking.room_id} onChange={handleInputChange} required>
                <option value="">Select Room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_number} ({room.type}) - {room.status}
                  </option>
                ))}
              </select>
              {rooms.length === 0 && (
                <div className="form-text text-danger">No rooms found. Please add rooms first via Rooms Management.</div>
              )}
            </div>
            <div className="col-md-6">
              <label htmlFor="booking_client_id" className="form-label">Client</label>
              <select className="form-select" id="booking_client_id" name="client_id" value={newBooking.client_id} onChange={handleInputChange} required>
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.contact_info})
                  </option>
                ))}
              </select>
              {clients.length === 0 && (
                <div className="form-text text-danger">No clients found. Please add clients directly in your database for now.</div>
              )}
            </div>
            <div className="col-md-6">
              <label htmlFor="check_in_date" className="form-label">Check-in Date</label>
              <input type="date" className="form-control" id="check_in_date" name="check_in_date" value={newBooking.check_in_date} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="check_out_date" className="form-label">Check-out Date</label>
              <input type="date" className="form-control" id="check_out_date" name="check_out_date" value={newBooking.check_out_date} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="booking_total_price" className="form-label">Total Price (UGX)</label>
              <input type="number" className="form-control" id="booking_total_price" name="total_price" value={newBooking.total_price} onChange={handleInputChange} step="0.01" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="booking_status" className="form-label">Status</label>
              <select className="form-select" id="booking_status" name="status" value={newBooking.status} onChange={handleInputChange} required>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="col-12 d-flex justify-content-end mt-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary me-2 d-flex align-items-center">
                <BsXCircleFill className="me-2" />
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-flex align-items-center">
                <BsPlusLg className="me-2" />
                Add Booking
              </button>
            </div>
          </form>
        </BootstrapModal>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && currentBooking && (
        <BootstrapModal title="Edit Booking" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleUpdateBooking} className="row g-3">
            <div className="col-md-6">
              <label htmlFor="edit_booking_room_id" className="form-label">Room</label>
              <select className="form-select" id="edit_booking_room_id" name="room_id" value={newBooking.room_id} onChange={handleInputChange} required>
                <option value="">Select Room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_number} ({room.type}) - {room.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_booking_client_id" className="form-label">Client</label>
              <select className="form-select" id="edit_booking_client_id" name="client_id" value={newBooking.client_id} onChange={handleInputChange} required>
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.contact_info})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_check_in_date" className="form-label">Check-in Date</label>
              <input type="date" className="form-control" id="edit_check_in_date" name="check_in_date" value={newBooking.check_in_date} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_check_out_date" className="form-label">Check-out Date</label>
              <input type="date" className="form-control" id="edit_check_out_date" name="check_out_date" value={newBooking.check_out_date} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_booking_total_price" className="form-label">Total Price (UGX)</label>
              <input type="number" className="form-control" id="edit_booking_total_price" name="total_price" value={newBooking.total_price} onChange={handleInputChange} step="0.01" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit_booking_status" className="form-label">Status</label>
              <select className="form-select" id="edit_booking_status" name="status" value={newBooking.status} onChange={handleInputChange} required>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="col-12 d-flex justify-content-end mt-4">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary me-2 d-flex align-items-center">
                <BsXCircleFill className="me-2" />
                Cancel
              </button>
              <button type="submit" className="btn btn-success d-flex align-items-center">
                <BsSaveFill className="me-2" />
                Save Changes
              </button>
            </div>
          </form>
        </BootstrapModal>
      )}
    </div>
  );
}

export default App;
