import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css'; // Assuming you have App.css for basic styling

// --- Reusable Modal Component ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

// --- Reusable Toast Notification Component ---
const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const textColor = 'text-white';

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Toast disappears after 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${bgColor} ${textColor} z-50 transition-opacity duration-300`}>
      {message}
      <button onClick={onClose} className="ml-4 font-bold">&times;</button>
    </div>
  );
};


function App() {
  // State for active tab
  const [activeTab, setActiveTab] = useState('bookings');

  // State for data lists
  const [rooms, setRooms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);

  // States for Rooms search and filter
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [roomFilterStatus, setRoomFilterStatus] = useState(''); // 'Available', 'Occupied', 'Maintenance', '' (all)

  // NEW: States for Inventory search and filter
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventoryFilterCategory, setInventoryFilterCategory] = useState(''); // Category ID or '' (all)

  // Loading state for initial data fetch
  const [isLoading, setIsLoading] = useState(true);

  // State for Add/Edit forms visibility
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // State for item being edited (null for add, object for edit)
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);

  // State for new item data (used by Add forms)
  const [newRoom, setNewRoom] = useState({ room_number: '', type: '', price_per_night: '', status: 'Available' });
  const [newInventory, setNewInventory] = useState({ name: '', category_id: '', quantity: '', unit: '', cost_price: '', selling_price: '', reorder_level: '' });
  const [newBooking, setNewBooking] = useState({ room_id: '', client_id: '', check_in_date: '', check_out_date: '', total_price: '', status: 'Confirmed' });

  // State for Toast Notifications
  const [toast, setToast] = useState(null); // { message: '...', type: 'success' | 'error' }

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);


  // Helper function to parse numeric inputs safely
  const parseNumericInput = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num; // Return null for empty/invalid numbers
  };

  // --- Fetch Data Functions (READ) ---
  const fetchRooms = useCallback(async (search = roomSearchTerm, status = roomFilterStatus) => {
    try {
      let url = '/api/rooms';
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      if (status) {
        params.append('status', status);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      showToast('Failed to load rooms. Please try again.', 'error');
    }
  }, [roomSearchTerm, roomFilterStatus, showToast]);

  // Modified fetchInventory to accept search and filter parameters
  const fetchInventory = useCallback(async (search = inventorySearchTerm, category = inventoryFilterCategory) => {
    try {
      let url = '/api/inventory';
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      if (category) {
        params.append('category_id', category);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      showToast('Failed to load inventory items. Please try again.', 'error');
    }
  }, [inventorySearchTerm, inventoryFilterCategory, showToast]); // Dependencies for useCallback

  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch('/api/bookings/rooms');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      showToast('Failed to load bookings. Please try again.', 'error');
    }
  }, [showToast]);

  const fetchCategories = useCallback(async () => {
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
      showToast('Failed to load categories. Please try again.', 'error');
    }
  }, [showToast]);

  const fetchClients = useCallback(async () => {
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
      showToast('Failed to load clients. Please try again.', 'error');
    }
  }, [showToast]);

  // Initial data load on component mount - SEQUENTIAL
  useEffect(() => {
    const loadAllDataSequentially = async () => {
      setIsLoading(true); // Start loading
      // Fetch core data first
      await fetchRooms();
      await fetchInventory();
      await fetchBookings();
      // Then fetch supplementary data
      await fetchCategories();
      await fetchClients();
      setIsLoading(false); // End loading
    };
    loadAllDataSequentially();
  }, [fetchRooms, fetchInventory, fetchBookings, fetchCategories, fetchClients]);


  // Debounce logic for room search term
  const roomDebounceTimeoutRef = useRef(null); // Use useRef to hold the timeout ID for rooms

  const handleRoomSearchChange = (e) => {
    const value = e.target.value;
    setRoomSearchTerm(value); // Update the state immediately for input display

    // Clear previous timeout
    if (roomDebounceTimeoutRef.current) {
      clearTimeout(roomDebounceTimeoutRef.current);
    }

    // Set a new timeout to call fetchRooms after a delay
    roomDebounceTimeoutRef.current = setTimeout(() => {
      fetchRooms(value, roomFilterStatus); // Pass the current value and status
    }, 500); // 500ms debounce delay
  };

  // Effect to re-fetch rooms when filter status changes (no debounce needed for dropdown)
  useEffect(() => {
    if (!isLoading) { // Only refetch if initial load is complete
      fetchRooms(roomSearchTerm, roomFilterStatus);
    }
  }, [roomFilterStatus, fetchRooms, isLoading, roomSearchTerm]);


  // NEW: Debounce logic for inventory search term
  const inventoryDebounceTimeoutRef = useRef(null); // Separate useRef for inventory

  const handleInventorySearchChange = (e) => {
    const value = e.target.value;
    setInventorySearchTerm(value); // Update the state immediately for input display

    // Clear previous timeout
    if (inventoryDebounceTimeoutRef.current) {
      clearTimeout(inventoryDebounceTimeoutRef.current);
    }

    // Set a new timeout to call fetchInventory after a delay
    inventoryDebounceTimeoutRef.current = setTimeout(() => {
      fetchInventory(value, inventoryFilterCategory); // Pass the current value and category
    }, 500); // 500ms debounce delay
  };

  // NEW: Effect to re-fetch inventory when filter category changes (no debounce needed for dropdown)
  useEffect(() => {
    if (!isLoading) { // Only refetch if initial load is complete
      fetchInventory(inventorySearchTerm, inventoryFilterCategory);
    }
  }, [inventoryFilterCategory, fetchInventory, isLoading, inventorySearchTerm]);


  // --- Form Change Handlers ---
  const handleNewRoomChange = (e) => {
    const { name, value, type } = e.target;
    setNewRoom(prev => ({ ...prev, [name]: type === 'number' ? parseNumericInput(value) : value }));
  };

  const handleEditRoomChange = (e) => {
    const { name, value, type } = e.target;
    setEditingRoom(prev => ({ ...prev, [name]: type === 'number' ? parseNumericInput(value) : value }));
  };

  const handleNewInventoryChange = (e) => {
    const { name, value, type } = e.target;
    setNewInventory(prev => ({ ...prev, [name]: type === 'number' ? parseNumericInput(value) : value }));
  };

  const handleEditInventoryChange = (e) => {
    const { name, value, type } = e.target;
    setEditingInventory(prev => ({ ...prev, [name]: type === 'number' ? parseNumericInput(value) : value }));
  };

  const handleNewBookingChange = (e) => {
    const { name, value, type } = e.target;
    setNewBooking(prev => ({ ...prev, [name]: type === 'number' ? parseNumericInput(value) : value }));
  };

  const handleEditBookingChange = (e) => {
    const { name, value, type } = e.target;
    setEditingBooking(prev => ({ ...prev, [name]: type === 'number' ? parseNumericInput(value) : value }));
  };


  // --- Add Data Functions (CREATE) ---
  const addRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      showToast('Room added successfully!', 'success');
      setNewRoom({ room_number: '', type: '', price_per_night: '', status: 'Available' });
      setShowRoomForm(false);
      fetchRooms();
    } catch (error) {
      console.error('Failed to add room:', error);
      showToast('Failed to add room. Please try again.', 'error');
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
      showToast('Inventory item added successfully!', 'success');
      setNewInventory({ name: '', category_id: '', quantity: '', unit: '', cost_price: '', selling_price: '', reorder_level: '' });
      setShowInventoryForm(false);
      fetchInventory();
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      showToast('Failed to add inventory item. Please try again.', 'error');
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
      showToast('Booking added successfully!', 'success');
      setNewBooking({ room_id: '', client_id: '', check_in_date: '', check_out_date: '', total_price: '', status: 'Confirmed' });
      setShowBookingForm(false);
      fetchBookings();
    } catch (error) {
      console.error('Failed to add booking:', error);
      showToast('Failed to add booking. Please try again.', 'error');
    }
  };


  // --- Update Data Functions (UPDATE) ---
  const updateRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      const response = await fetch(`/api/rooms?id=${editingRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRoom),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      showToast('Room updated successfully!', 'success');
      setEditingRoom(null);
      setShowRoomForm(false);
      fetchRooms();
    } catch (error) {
      console.error('Failed to update room:', error);
      showToast('Failed to update room. Please try again.', 'error');
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
      showToast('Inventory item updated successfully!', 'success');
      setEditingInventory(null);
      setShowInventoryForm(false);
      fetchInventory();
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      showToast('Failed to update inventory item. Please try again.', 'error');
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
      showToast('Booking updated successfully!', 'success');
      setEditingBooking(null);
      setShowBookingForm(false);
      fetchBookings();
    } catch (error) {
      console.error('Failed to update booking:', error);
      showToast('Failed to update booking. Please try again.', 'error');
    }
  };


  // --- Delete Data Functions (DELETE) ---
  const deleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      const response = await fetch(`/api/rooms?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Room with ID ${id} not found on server for deletion.`);
          showToast(`Room with ID ${id} not found or already deleted.`, 'error');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        showToast('Room deleted successfully!', 'success');
        fetchRooms();
      }
    } catch (error) {
      console.error('Failed to delete room:', error);
      showToast('Failed to delete room. Please try again.', 'error');
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
          showToast(`Inventory item with ID ${id} not found or already deleted.`, 'error');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        showToast('Inventory item deleted successfully!', 'success');
        fetchInventory();
      }
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      showToast('Failed to delete inventory item. Please try again.', 'error');
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
          showToast(`Booking with ID ${id} not found or already deleted.`, 'error');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        showToast('Booking deleted successfully!', 'success');
        fetchBookings();
      }
    } catch (error) {
      console.error('Failed to delete booking:', error);
      showToast('Failed to delete booking. Please try again.', 'error');
    }
  };


  // --- Render UI ---
  // Show a loading indicator if data is still being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-blue-600 text-xl font-semibold">Loading application data...</div>
      </div>
    );
  }

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
              onClick={() => { setShowBookingForm(true); setEditingBooking(null); setNewBooking({ room_id: '', client_id: '', check_in_date: '', check_out_date: '', total_price: '', status: 'Confirmed' }); }}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md mb-4 transition-colors"
            >
              + Add New Booking
            </button>

            {/* Add/Edit Booking Modal */}
            <Modal
              isOpen={showBookingForm}
              onClose={() => { setShowBookingForm(false); setEditingBooking(null); }}
              title={editingBooking ? `Edit Booking ID: ${editingBooking.id}` : 'Add New Booking'}
            >
              <form onSubmit={editingBooking ? updateBooking : addBooking} className="p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="booking_room_id" className="block text-sm font-medium text-gray-700">Room</label>
                    <select
                      id="booking_room_id"
                      name="room_id"
                      value={editingBooking ? editingBooking.room_id : newBooking.room_id}
                      onChange={editingBooking ? handleEditBookingChange : handleNewBookingChange}
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
                      value={editingBooking ? editingBooking.client_id : newBooking.client_id}
                      onChange={editingBooking ? handleEditBookingChange : handleNewBookingChange}
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
                      value={editingBooking ? (editingBooking.check_in_date ? new Date(editingBooking.check_in_date).toISOString().split('T')[0] : '') : newBooking.check_in_date}
                      onChange={editingBooking ? handleEditBookingChange : handleNewBookingChange}
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
                      value={editingBooking ? (editingBooking.check_out_date ? new Date(editingBooking.check_out_date).toISOString().split('T')[0] : '') : newBooking.check_out_date}
                      onChange={editingBooking ? handleEditBookingChange : handleNewBookingChange}
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
                      value={editingBooking ? (editingBooking.total_price === null ? '' : editingBooking.total_price) : (newBooking.total_price === null ? '' : newBooking.total_price)}
                      onChange={editingBooking ? handleEditBookingChange : handleNewBookingChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="booking_status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="booking_status"
                      name="status"
                      value={editingBooking ? editingBooking.status : newBooking.status}
                      onChange={editingBooking ? handleEditBookingChange : handleNewBookingChange}
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
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => { setShowBookingForm(false); setEditingBooking(null); }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    {editingBooking ? 'Update Booking' : 'Add Booking'}
                  </button>
                </div>
              </form>
            </Modal>

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
                          <button onClick={() => { setEditingBooking(booking); setShowBookingForm(true); }} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
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

            {/* Search and Filter Controls for Rooms */}
            <div className="flex flex-wrap gap-4 mb-4 items-center">
              <button
                onClick={() => { setShowRoomForm(true); setEditingRoom(null); setNewRoom({ room_number: '', type: '', price_per_night: '', status: 'Available' }); }}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md transition-colors"
              >
                + Add New Room
              </button>
              <input
                type="text"
                placeholder="Search by Room Number..."
                value={roomSearchTerm}
                onChange={handleRoomSearchChange}
                className="flex-grow max-w-xs p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={roomFilterStatus}
                onChange={(e) => setRoomFilterStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            {/* Add/Edit Room Modal */}
            <Modal
              isOpen={showRoomForm}
              onClose={() => { setShowRoomForm(false); setEditingRoom(null); }}
              title={editingRoom ? `Edit Room ID: ${editingRoom.id}` : 'Add New Room'}
            >
              <form onSubmit={editingRoom ? updateRoom : addRoom} className="p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="room_number" className="block text-sm font-medium text-gray-700">Room Number</label>
                    <input
                      type="text"
                      id="room_number"
                      name="room_number"
                      value={editingRoom ? editingRoom.room_number : newRoom.room_number}
                      onChange={editingRoom ? handleEditRoomChange : handleNewRoomChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={editingRoom ? editingRoom.type : newRoom.type}
                      onChange={editingRoom ? handleEditRoomChange : handleNewRoomChange}
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
                      value={editingRoom ? (editingRoom.price_per_night === null ? '' : editingRoom.price_per_night) : (newRoom.price_per_night === null ? '' : newRoom.price_per_night)}
                      onChange={editingRoom ? handleEditRoomChange : handleNewRoomChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={editingRoom ? editingRoom.status : newRoom.status}
                      onChange={editingRoom ? handleEditRoomChange : handleNewRoomChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    >
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => { setShowRoomForm(false); setEditingRoom(null); }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    {editingRoom ? 'Update Room' : 'Add Room'}
                  </button>
                </div>
              </form>
            </Modal>

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
                          <button onClick={() => { setEditingRoom(room); setShowRoomForm(true); }} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
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

            {/* NEW: Search and Filter Controls for Inventory */}
            <div className="flex flex-wrap gap-4 mb-4 items-center">
              <button
                onClick={() => { setShowInventoryForm(true); setEditingInventory(null); setNewInventory({ name: '', category_id: '', quantity: '', unit: '', cost_price: '', selling_price: '', reorder_level: '' }); }}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md transition-colors"
              >
                + Add New Inventory
              </button>
              <input
                type="text"
                placeholder="Search by Name..."
                value={inventorySearchTerm}
                onChange={handleInventorySearchChange}
                className="flex-grow max-w-xs p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={inventoryFilterCategory}
                onChange={(e) => setInventoryFilterCategory(e.target.value)}
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Add/Edit Inventory Modal */}
            <Modal
              isOpen={showInventoryForm}
              onClose={() => { setShowInventoryForm(false); setEditingInventory(null); }}
              title={editingInventory ? `Edit Inventory Item ID: ${editingInventory.id}` : 'Add New Inventory Item'}
            >
              <form onSubmit={editingInventory ? updateInventory : addInventory} className="p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="inventory_name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="inventory_name"
                      name="name"
                      value={editingInventory ? editingInventory.name : newInventory.name}
                      onChange={editingInventory ? handleEditInventoryChange : handleNewInventoryChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={editingInventory ? editingInventory.category_id : newInventory.category_id}
                      onChange={editingInventory ? handleEditInventoryChange : handleNewInventoryChange}
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
                      value={editingInventory ? (editingInventory.quantity === null ? '' : editingInventory.quantity) : (newInventory.quantity === null ? '' : newInventory.quantity)}
                      onChange={editingInventory ? handleEditInventoryChange : handleNewInventoryChange}
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
                      value={editingInventory ? editingInventory.unit : newInventory.unit}
                      onChange={editingInventory ? handleEditInventoryChange : handleNewInventoryChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700">Cost Price</label>
                    <input
                      type="number"
                      id="cost_price"
                      name="cost_price"
                      value={editingInventory ? (editingInventory.cost_price === null ? '' : editingInventory.cost_price) : (newInventory.cost_price === null ? '' : newInventory.cost_price)}
                      onChange={editingInventory ? handleEditInventoryChange : handleNewInventoryChange}
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
                      value={editingInventory ? (editingInventory.selling_price === null ? '' : editingInventory.selling_price) : (newInventory.selling_price === null ? '' : newInventory.selling_price)}
                      onChange={editingInventory ? handleEditInventoryChange : handleNewInventoryChange}
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
                      value={editingInventory ? (editingInventory.reorder_level === null ? '' : editingInventory.reorder_level) : (newInventory.reorder_level === null ? '' : newInventory.reorder_level)}
                      onChange={editingInventory ? handleEditInventoryChange : handleNewInventoryChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => { setShowInventoryForm(false); setEditingInventory(null); }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
                  >
                    {editingInventory ? 'Update Inventory Item' : 'Add Inventory Item'}
                  </button>
                </div>
              </form>
            </Modal>

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
                          <button onClick={() => { setEditingInventory(item); setShowInventoryForm(true); }} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
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

      {/* Toast Notification Display */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </div>
  );
}

export default App;
