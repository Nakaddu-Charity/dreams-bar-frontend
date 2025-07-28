import { useState, useEffect } from 'react';
import './App.css'; // Assuming you have App.css for basic styling

function App() {
  // State for active tab
  const [activeTab, setActiveTab] = useState('bookings'); // Default tab

  // State for data lists
  const [rooms, setRooms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);

  // State for Add forms
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
  const [showAddInventoryForm, setShowAddInventoryForm] = useState(false);
  const [showAddBookingForm, setShowAddBookingForm] = useState(false);

  // State for Edit forms
  const [showEditRoomForm, setShowEditRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null); // Holds the room data being edited

  const [showEditInventoryForm, setShowEditInventoryForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null); // Holds the inventory data being edited

  const [showEditBookingForm, setShowEditBookingForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null); // Holds the booking data being edited

  // State for new item data (used by Add forms)
  const [newRoom, setNewRoom] = useState({ room_number: '', type: '', price_per_night: '', status: 'Available' });
  const [newInventory, setNewInventory] = useState({ name: '', category_id: '', quantity: '', unit: '', cost_price: '', selling_price: '', reorder_level: '' });
  const [newBooking, setNewBooking] = useState({ room_id: '', client_id: '', check_in_date: '', check_out_date: '', total_price: '', status: 'Confirmed' });


  // --- Fetch Data Functions (READ) ---
  // These functions are called to refresh the data displayed in the tables.

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      // alert('Failed to load rooms. Please try again.'); // Keep alert for critical errors
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      // alert('Failed to load inventory items. Please try again.');
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings/rooms');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      // alert('Failed to load bookings. Please try again.');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        console.warn('Categories endpoint not found or failed to fetch. This is expected if not implemented yet.');
        return [];
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // alert('Failed to load categories. Please try again.');
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        console.warn('Clients endpoint not found or failed to fetch for dropdown.');
        return [];
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      // alert('Failed to load clients. Please try again.');
    }
  };

  // Initial data load on component mount
  useEffect(() => {
    fetchRooms();
    fetchInventory();
    fetchBookings();
    fetchCategories();
    fetchClients();
  }, []);


  // --- Form Change Handlers ---
  // These update the state variables as users type in the forms.

  const handleNewRoomChange = (e) => {
    const { name, value } = e.target;
    setNewRoom(prev => ({ ...prev, [name]: value }));
  };

  const handleEditRoomChange = (e) => {
    const { name, value } = e.target;
    setEditingRoom(prev => ({ ...prev, [name]: value }));
  };

  const handleNewInventoryChange = (e) => {
    const { name, value } = e.target;
    setNewInventory(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInventoryChange = (e) => {
    const { name, value } = e.target;
    setEditingInventory(prev => ({ ...prev, [name]: value }));
  };

  const handleNewBookingChange = (e) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({ ...prev, [name]: value }));
  };

  const handleEditBookingChange = (e) => {
    const { name, value } = e.target;
    setEditingBooking(prev => ({ ...prev, [name]: value }));
  };


  // --- Add Data Functions (CREATE) ---
  // These send POST requests to the backend.

  const addRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      console.log('Room added successfully!');
      setNewRoom({ room_number: '', type: '', price_per_night: '', status: 'Available' });
      setShowAddRoomForm(false);
      fetchRooms(); // Refresh data
    } catch (error) {
      console.error('Failed to add room:', error);
      alert('Failed to add room. Please try again.');
    }
  };

  const addInventory = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInventory),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      console.log('Inventory item added successfully!');
      setNewInventory({ name: '', category_id: '', quantity: '', unit: '', cost_price: '', selling_price: '', reorder_level: '' });
      setShowAddInventoryForm(false);
      fetchInventory(); // Refresh data
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      alert('Failed to add inventory item. Please try again.');
    }
  };

  const addBooking = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bookings/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      console.log('Booking added successfully!');
      setNewBooking({ room_id: '', client_id: '', check_in_date: '', check_out_date: '', total_price: '', status: 'Confirmed' });
      setShowAddBookingForm(false);
      fetchBookings(); // Refresh data
    } catch (error) {
      console.error('Failed to add booking:', error);
      alert('Failed to add booking. Please try again.');
    }
  };


  // --- Update Data Functions (UPDATE) ---
  // These send PUT requests to the backend.

  const updateRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      // For Vercel serverless functions, ID in query parameter is often more reliable for PUT
      const response = await fetch(`/api/rooms?id=${editingRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRoom),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      console.log('Room updated successfully!');
      setEditingRoom(null); // Clear editing state
      setShowEditRoomForm(false); // Hide form
      fetchRooms(); // Refresh data
    } catch (error) {
      console.error('Failed to update room:', error);
      alert('Failed to update room. Please try again.');
    }
  };

  const updateInventory = async (e) => {
    e.preventDefault();
    if (!editingInventory) return;
    try {
      const response = await fetch(`/api/inventory?id=${editingInventory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingInventory),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      console.log('Inventory item updated successfully!');
      setEditingInventory(null);
      setShowEditInventoryForm(false);
      fetchInventory();
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      alert('Failed to update inventory item. Please try again.');
    }
  };

  const updateBooking = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      const response = await fetch(`/api/bookings/rooms?id=${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBooking),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      console.log('Booking updated successfully!');
      setEditingBooking(null);
      setShowEditBookingForm(false);
      fetchBookings();
    } catch (error) {
      console.error('Failed to update booking:', error);
      alert('Failed to update booking. Please try again.');
    }
  };


  // --- Delete Data Functions (DELETE) ---
  // These send DELETE requests to the backend.

  const deleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      // For Vercel serverless functions, ID in query parameter is often more reliable for DELETE
      const response = await fetch(`/api/rooms?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        // Check for 404 specifically, as the frontend might call it before backend is ready for delete
        if (response.status === 404) {
          console.warn(`Room with ID ${id} not found on server for deletion. It might already be deleted or URL is incorrect.`);
          alert(`Room with ID ${id} not found or already deleted.`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      console.log('Room deleted successfully!');
      fetchRooms(); // Refresh data
    } catch (error) {
      console.error('Failed to delete room:', error);
      alert('Failed to delete room. Please try again.');
    }
  };

  const deleteInventory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      const response = await fetch(`/api/inventory?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Inventory item with ID ${id} not found on server for deletion.`);
          alert(`Inventory item with ID ${id} not found or already deleted.`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      console.log('Inventory item deleted successfully!');
      fetchInventory();
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      alert('Failed to delete inventory item. Please try again.');
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      const response = await fetch(`/api/bookings/rooms?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Booking with ID ${id} not found on server for deletion.`);
          alert(`Booking with ID ${id} not found or already deleted.`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      console.log('Booking deleted successfully!');
      fetchBookings();
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
              onClick={() => { setShowAddBookingForm(true); setNewBooking({ room_id: '', client_id: '', check_in_date: '', check_out_date: '', total_price: '', status: 'Confirmed' }); }}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md mb-4 transition-colors"
            >
              + Add New Booking
            </button>

            {/* Add/Edit Booking Form */}
            {(showAddBookingForm || showEditBookingForm) && (
              <form onSubmit={showAddBookingForm ? addBooking : updateBooking} className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">{showAddBookingForm ? 'Add New Booking' : `Edit Booking ID: ${editingBooking?.id}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="booking_room_id" className="block text-sm font-medium text-gray-700">Room</label>
                    <select
                      id="booking_room_id"
                      name="room_id"
                      value={showAddBookingForm ? newBooking.room_id : editingBooking?.room_id || ''}
                      onChange={showAddBookingForm ? handleNewBookingChange : handleEditBookingChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    >
                      <option value="">Select Room</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.room_number} ({room.type})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="booking_client_id" className="block text-sm font-medium text-gray-700">Client</label>
                    <select
                      id="booking_client_id"
                      name="client_id"
                      value={showAddBookingForm ? newBooking.client_id : editingBooking?.client_id || ''}
                      onChange={showAddBookingForm ? handleNewBookingChange : handleEditBookingChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="check_in_date" className="block text-sm font-medium text-gray-700">Check-in Date</label>
                    <input
                      type="date"
                      id="check_in_date"
                      name="check_in_date"
                      value={showAddBookingForm ? newBooking.check_in_date : (editingBooking?.check_in_date ? new Date(editingBooking.check_in_date).toISOString().split('T')[0] : '')}
                      onChange={showAddBookingForm ? handleNewBookingChange : handleEditBookingChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="check_out_date" className="block text-sm font-medium text-gray-700">Check-out Date</label>
                    <input
                      type="date"
                      id="check_out_date"
                      name="check_out_date"
                      value={showAddBookingForm ? newBooking.check_out_date : (editingBooking?.check_out_date ? new Date(editingBooking.check_out_date).toISOString().split('T')[0] : '')}
                      onChange={showAddBookingForm ? handleNewBookingChange : handleEditBookingChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="total_price" className="block text-sm font-medium text-gray-700">Total Price</label>
                    <input
                      type="number"
                      id="total_price"
                      name="total_price"
                      value={showAddBookingForm ? newBooking.total_price : editingBooking?.total_price || ''}
                      onChange={handleNewBookingChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="booking_status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="booking_status"
                      name="status"
                      value={showAddBookingForm ? newBooking.status : editingBooking?.status || ''}
                      onChange={showAddBookingForm ? handleNewBookingChange : handleEditBookingChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => { setShowAddBookingForm(false); setShowEditBookingForm(false); setEditingBooking(null); }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    {showAddBookingForm ? 'Add Booking' : 'Update Booking'}
                  </button>
                </div>
              </form>
            )}

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
                          <button onClick={() => { setEditingBooking(booking); setShowEditBookingForm(true); setShowAddBookingForm(false); }} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
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
              onClick={() => { setShowAddRoomForm(true); setNewRoom({ room_number: '', type: '', price_per_night: '', status: 'Available' }); }}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md mb-4 transition-colors"
            >
              + Add New Room
            </button>

            {/* Add/Edit Room Form */}
            {(showAddRoomForm || showEditRoomForm) && (
              <form onSubmit={showAddRoomForm ? addRoom : updateRoom} className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">{showAddRoomForm ? 'Add New Room' : `Edit Room ID: ${editingRoom?.id}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="room_number" className="block text-sm font-medium text-gray-700">Room Number</label>
                    <input
                      type="text"
                      id="room_number"
                      name="room_number"
                      value={showAddRoomForm ? newRoom.room_number : editingRoom?.room_number || ''}
                      onChange={showAddRoomForm ? handleNewRoomChange : handleEditRoomChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={showAddRoomForm ? newRoom.type : editingRoom?.type || ''}
                      onChange={showAddRoomForm ? handleNewRoomChange : handleEditRoomChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    >
                      <option value="">Select Type</option>
                      <option value="Standard">Standard</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suite">Suite</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="price_per_night" className="block text-sm font-medium text-gray-700">Price Per Night</label>
                    <input
                      type="number"
                      id="price_per_night"
                      name="price_per_night"
                      value={showAddRoomForm ? newRoom.price_per_night : editingRoom?.price_per_night || ''}
                      onChange={showAddRoomForm ? handleNewRoomChange : handleEditRoomChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={showAddRoomForm ? newRoom.status : editingRoom?.status || ''}
                      onChange={showAddRoomForm ? handleNewRoomChange : handleEditRoomChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    >
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => { setShowAddRoomForm(false); setShowEditRoomForm(false); setEditingRoom(null); }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    {showAddRoomForm ? 'Add Room' : 'Update Room'}
                  </button>
                </div>
              </form>
            )}

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
                          <button onClick={() => { setEditingRoom(room); setShowEditRoomForm(true); setShowAddRoomForm(false); }} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
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
              onClick={() => { setShowAddInventoryForm(true); setNewInventory({ name: '', category_id: '', quantity: '', unit: '', cost_price: '', selling_price: '', reorder_level: '' }); }}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md mb-4 transition-colors"
            >
              + Add New Inventory
            </button>

            {/* Add/Edit Inventory Form */}
            {(showAddInventoryForm || showEditInventoryForm) && (
              <form onSubmit={showAddInventoryForm ? addInventory : updateInventory} className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">{showAddInventoryForm ? 'Add New Inventory Item' : `Edit Inventory Item ID: ${editingInventory?.id}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="inventory_name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="inventory_name"
                      name="name"
                      value={showAddInventoryForm ? newInventory.name : editingInventory?.name || ''}
                      onChange={showAddInventoryForm ? handleNewInventoryChange : handleEditInventoryChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={showAddInventoryForm ? newInventory.category_id : editingInventory?.category_id || ''}
                      onChange={showAddInventoryForm ? handleNewInventoryChange : handleEditInventoryChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={showAddInventoryForm ? newInventory.quantity : editingInventory?.quantity || ''}
                      onChange={handleNewInventoryChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
                    <input
                      type="text"
                      id="unit"
                      name="unit"
                      value={showAddInventoryForm ? newInventory.unit : editingInventory?.unit || ''}
                      onChange={handleNewInventoryChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700">Cost Price</label>
                    <input
                      type="number"
                      id="cost_price"
                      name="cost_price"
                      value={showAddInventoryForm ? newInventory.cost_price : editingInventory?.cost_price || ''}
                      onChange={handleNewInventoryChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700">Selling Price</label>
                    <input
                      type="number"
                      id="selling_price"
                      name="selling_price"
                      value={showAddInventoryForm ? newInventory.selling_price : editingInventory?.selling_price || ''}
                      onChange={handleNewInventoryChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="reorder_level" className="block text-sm font-medium text-gray-700">Reorder Level</label>
                    <input
                      type="number"
                      id="reorder_level"
                      name="reorder_level"
                      value={showAddInventoryForm ? newInventory.reorder_level : editingInventory?.reorder_level || ''}
                      onChange={handleNewInventoryChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => { setShowAddInventoryForm(false); setShowEditInventoryForm(false); setEditingInventory(null); }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    {showAddInventoryForm ? 'Add Inventory Item' : 'Update Inventory Item'}
                  </button>
                </div>
              </form>
            )}

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
                          <button onClick={() => { setEditingInventory(item); setShowEditInventoryForm(true); setShowAddInventoryForm(false); }} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
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
