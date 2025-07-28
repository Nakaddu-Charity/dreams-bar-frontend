import { useState, useEffect } from 'react';
import './App.css'; // Assuming you have App.css for basic styling

function App() {
  const [activeTab, setActiveTab] = useState('bookings'); // Default tab
  const [rooms, setRooms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);

  // State for forms (simplified for brevity, you'd expand this for actual forms)
  const [newRoom, setNewRoom] = useState({ room_number: '', type: '', price_per_night: '', status: '' });
  const [newInventory, setNewInventory] = useState({ name: '', category_id: '', quantity: '', unit: '', cost_price: '', selling_price: '', reorder_level: '' });
  const [newBooking, setNewBooking] = useState({ room_id: '', client_id: '', check_in_date: '', check_out_date: '', total_price: '', status: '' });


  // --- Fetch Data Functions ---

  const fetchRooms = async () => {
    try {
      // Changed from `${import.meta.env.VITE_APP_BACKEND_URL}/api/rooms` to relative path
      const response = await fetch('/api/rooms');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      alert('Failed to load rooms. Please try again.'); // Using alert as per instructions
    }
  };

  const fetchInventory = async () => {
    try {
      // Changed from `${import.meta.env.VITE_APP_BACKEND_URL}/api/inventory` to relative path
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      alert('Failed to load inventory items. Please try again.'); // Using alert as per instructions
    }
  };

  const fetchBookings = async () => {
    try {
      // Changed from `${import.meta.env.VITE_APP_BACKEND_URL}/api/bookings/rooms` to relative path
      const response = await fetch('/api/bookings/rooms');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      alert('Failed to load bookings. Please try again.'); // Using alert as per instructions
    }
  };

  const fetchCategories = async () => {
    try {
      // Changed from `${import.meta.env.VITE_APP_BACKEND_URL}/api/categories` to relative path
      const response = await fetch('/api/categories');
      if (!response.ok) {
        // This log is expected if categories endpoint is not implemented yet
        console.warn('Categories endpoint not found or failed to fetch. This is expected if not implemented yet.');
        return []; // Return empty array if not found
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to load categories. Please try again.'); // Using alert as per instructions
    }
  };

  const fetchClients = async () => {
    try {
      // Changed from `${import.meta.env.VITE_APP_BACKEND_URL}/api/clients` to relative path
      const response = await fetch('/api/clients');
      if (!response.ok) {
        console.warn('Clients endpoint not found or failed to fetch for dropdown.');
        return [];
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      alert('Failed to load clients. Please try again.'); // Using alert as per instructions
    }
  };

  // --- Initial Data Load ---
  useEffect(() => {
    fetchRooms();
    fetchInventory();
    fetchBookings();
    fetchCategories();
    fetchClients();
  }, []); // Run once on component mount


  // --- Add Data Functions (Simplified) ---

  const addRoom = async () => {
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRoom),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert('Room added successfully!');
      setNewRoom({ room_number: '', type: '', price_per_night: '', status: '' }); // Clear form
      fetchRooms(); // Refresh data
    } catch (error) {
      console.error('Failed to add room:', error);
      alert('Failed to add room. Please try again.');
    }
  };

  const addInventory = async () => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInventory),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert('Inventory item added successfully!');
      setNewInventory({ name: '', category_id: '', quantity: '', unit: '', cost_price: '', selling_price: '', reorder_level: '' }); // Clear form
      fetchInventory(); // Refresh data
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      alert('Failed to add inventory item. Please try again.');
    }
  };

  const addBooking = async () => {
    try {
      const response = await fetch('/api/bookings/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBooking),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert('Booking added successfully!');
      setNewBooking({ room_id: '', client_id: '', check_in_date: '', check_out_date: '', total_price: '', status: '' }); // Clear form
      fetchBookings(); // Refresh data
    } catch (error) {
      console.error('Failed to add booking:', error);
      alert('Failed to add booking. Please try again.');
    }
  };


  // --- Delete Data Functions (Simplified) ---

  const deleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return; // Using window.confirm as per instructions
    try {
      const response = await fetch(`/api/rooms/${id}`, { // Note: Serverless functions often prefer ID in query for DELETE/PUT
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert('Room deleted successfully!');
      fetchRooms(); // Refresh data
    } catch (error) {
      console.error('Failed to delete room:', error);
      alert('Failed to delete room. Please try again.');
    }
  };

  const deleteInventory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      const response = await fetch(`/api/inventory/${id}`, { // Note: Serverless functions often prefer ID in query for DELETE/PUT
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert('Inventory item deleted successfully!');
      fetchInventory(); // Refresh data
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      alert('Failed to delete inventory item. Please try again.');
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      const response = await fetch(`/api/bookings/rooms/${id}`, { // Note: Serverless functions often prefer ID in query for DELETE/PUT
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert('Booking deleted successfully!');
      fetchBookings(); // Refresh data
    } catch (error) {
      console.error('Failed to delete booking:', error);
      alert('Failed to delete booking. Please try again.');
    }
  };


  // --- Render UI ---
  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans antialiased">
      <header className="bg-blue-600 text-white p-4 rounded-lg shadow-md mb-6">
        <h1 className="text-3xl font-bold text-center">Dreams Bar & Guesthouse Management</h1>
      </header>

      <nav className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-6 py-3 rounded-lg shadow-md transition-all duration-200 ${
            activeTab === 'bookings' ? 'bg-blue-700 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'
          }`}
        >
          Bookings
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-6 py-3 rounded-lg shadow-md transition-all duration-200 ${
            activeTab === 'rooms' ? 'bg-blue-700 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'
          }`}
        >
          Rooms
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 rounded-lg shadow-md transition-all duration-200 ${
            activeTab === 'inventory' ? 'bg-blue-700 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'
          }`}
        >
          Inventory
        </button>
      </nav>

      <main className="bg-white p-6 rounded-lg shadow-lg">
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bookings Management</h2>
            <button
              onClick={() => { /* Open add booking form */ alert('Add New Booking form would open here!'); }}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md mb-4 transition-colors"
            >
              + Add New Booking
            </button>
            {bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">ID</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Room</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Client</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Check-in</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Check-out</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Total Price</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{booking.id}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{booking.room_number} ({booking.room_type})</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{booking.client_name}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{new Date(booking.check_in_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{new Date(booking.check_out_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">${booking.total_price}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{booking.status}</td>
                        <td className="py-3 px-4 border-b text-sm">
                          <button onClick={() => { /* Open edit form */ alert(`Edit booking ${booking.id} form would open!`); }} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                          <button onClick={() => deleteBooking(booking.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No bookings found. Add some new bookings!</p>
            )}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Rooms Management</h2>
            <button
              onClick={() => { /* Open add room form */ alert('Add New Room form would open here!'); }}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md mb-4 transition-colors"
            >
              + Add New Room
            </button>
            {rooms.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">ID</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Room Number</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Type</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Price/Night</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{room.id}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{room.room_number}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{room.type}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">${room.price_per_night}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{room.status}</td>
                        <td className="py-3 px-4 border-b text-sm">
                          <button onClick={() => { /* Open edit form */ alert(`Edit room ${room.id} form would open!`); }} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                          <button onClick={() => deleteRoom(room.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No rooms found. Add some new rooms!</p>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Inventory Management</h2>
            <button
              onClick={() => { /* Open add inventory form */ alert('Add New Inventory form would open here!'); }}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md mb-4 transition-colors"
            >
              + Add New Inventory
            </button>
            {inventory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">ID</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Name</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Category ID</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Quantity</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Unit</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Cost Price</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Selling Price</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Reorder Level</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{item.id}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{item.name}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{item.category_id}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{item.quantity}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{item.unit}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">${item.cost_price}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">${item.selling_price}</td>
                        <td className="py-3 px-4 border-b text-sm text-gray-700">{item.reorder_level}</td>
                        <td className="py-3 px-4 border-b text-sm">
                          <button onClick={() => { /* Open edit form */ alert(`Edit item ${item.id} form would open!`); }} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                          <button onClick={() => deleteInventory(item.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No inventory items found. Add some new items!</p>
            )}
          </div>
        )}
      </main>

      <footer className="text-center text-gray-600 mt-6 text-sm">
        <p>&copy; {new Date().getFullYear()} Dreams Bar & Guesthouse. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
