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
  // --- Authentication States ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Stores { id, username, role }
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', role: 'staff' }); // Default role

  // State for active tab (only visible when logged in)
  const [activeTab, setActiveTab] = useState('dashboard');

  // State for data lists
  const [rooms, setRooms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  // REMOVED: const [clients, setClients] = useState([]); // Clients state no longer needed

  // States for Rooms search and filter
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [roomFilterStatus, setRoomFilterStatus] = useState('');

  // States for Inventory search and filter
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventoryFilterCategory, setInventoryFilterCategory] = useState('');

  // States for Bookings search and filter
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('');


  // Loading state for initial data fetch (after login)
  const [isLoading, setIsLoading] = useState(false);

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
  // UPDATED: NewBooking state now includes client_name and client_contact
  const [newBooking, setNewBooking] = useState({ room_id: '', client_name: '', client_contact: '', check_in_date: '', check_out_date: '', total_price: '', status: 'Confirmed' });

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

  // RBAC Helper Function
  const canPerformAction = useCallback((requiredRole) => {
    if (!currentUser) return false; // Not logged in
    if (currentUser.role === 'admin') return true; // Admin can do anything
    return currentUser.role === requiredRole; // Specific role can do specific action
  }, [currentUser]);


  // --- Authentication Handlers ---
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (response.ok) {
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        setShowLoginModal(false);
        showToast('Login successful!', 'success');
        loadAllDataSequentially(); // Fetch data after successful login
      } else {
        showToast(data.message || 'Login failed.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('An error occurred during login. Please try again.', 'error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Registration successful! You can now log in.', 'success');
        setShowRegisterModal(false);
        setLoginForm({ username: registerForm.username, password: '' }); // Pre-fill login form
        setShowLoginModal(true); // Open login modal
      } else {
        showToast(data.message || 'Registration failed.', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast('An error occurred during registration. Please try again.', 'error');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    showToast('Logged out successfully!', 'success');
    // Clear all data when logging out
    setRooms([]);
    setInventory([]);
    setBookings([]);
    setCategories([]);
    // Removed: setClients([]);
    setActiveTab('dashboard'); // Reset tab
  };


  // --- Fetch Data Functions (READ) ---
  const fetchRooms = useCallback(async (search = roomSearchTerm, status = roomFilterStatus) => {
    if (!isLoggedIn) return; // Only fetch if logged in
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
  }, [roomSearchTerm, roomFilterStatus, showToast, isLoggedIn]);

  const fetchInventory = useCallback(async (search = inventorySearchTerm, category = inventoryFilterCategory) => {
    if (!isLoggedIn) return; // Only fetch if logged in
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
  }, [inventorySearchTerm, inventoryFilterCategory, showToast, isLoggedIn]);

  const fetchBookings = useCallback(async (search = bookingSearchTerm, status = bookingFilterStatus) => {
    if (!isLoggedIn) return; // Only fetch if logged in
    try {
      let url = '/api/bookings/rooms';
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
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      showToast('Failed to load bookings. Please try again.', 'error');
    }
  }, [bookingSearchTerm, bookingFilterStatus, showToast, isLoggedIn]);

  const fetchCategories = useCallback(async () => {
    if (!isLoggedIn) return; // Only fetch if logged in
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
  }, [showToast, isLoggedIn]);

  // REMOVED: fetchClients function is no longer needed

  // Initial data load on component mount - SEQUENTIAL (only if logged in)
  const loadAllDataSequentially = useCallback(async () => {
    if (!isLoggedIn) return; // Ensure we are logged in before fetching data
    setIsLoading(true); // Start loading
    // Fetch core data first
    await fetchRooms();
    await fetchInventory();
    await fetchBookings();
    // Then fetch supplementary data
    await fetchCategories();
    // Removed: await fetchClients();
    setIsLoading(false); // End loading
  }, [isLoggedIn, fetchRooms, fetchInventory, fetchBookings, fetchCategories]); // Removed fetchClients from dependencies

  // Effect to trigger initial data load if isLoggedIn changes to true
  useEffect(() => {
    if (isLoggedIn) {
      loadAllDataSequentially();
    }
  }, [isLoggedIn, loadAllDataSequentially]);


  // Debounce logic for room search term
  const roomDebounceTimeoutRef = useRef(null);

  const handleRoomSearchChange = (e) => {
    const value = e.target.value;
    setRoomSearchTerm(value);

    if (roomDebounceTimeoutRef.current) {
      clearTimeout(roomDebounceTimeoutRef.current);
    }
    roomDebounceTimeoutRef.current = setTimeout(() => {
      fetchRooms(value, roomFilterStatus);
    }, 500);
  };

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      fetchRooms(roomSearchTerm, roomFilterStatus);
    }
  }, [roomFilterStatus, fetchRooms, isLoading, roomSearchTerm, isLoggedIn]);


  // Debounce logic for inventory search term
  const inventoryDebounceTimeoutRef = useRef(null);

  const handleInventorySearchChange = (e) => {
    const value = e.target.value;
    setInventorySearchTerm(value);

    if (inventoryDebounceTimeoutRef.current) {
      clearTimeout(inventoryDebounceTimeoutRef.current);
    }
    inventoryDebounceTimeoutRef.current = setTimeout(() => {
      fetchInventory(value, inventoryFilterCategory);
    }, 500);
  };

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      fetchInventory(inventorySearchTerm, inventoryFilterCategory);
    }
  }, [inventoryFilterCategory, fetchInventory, isLoading, inventorySearchTerm, isLoggedIn]);


  // Debounce logic for booking search term
  const bookingDebounceTimeoutRef = useRef(null);

  const handleBookingSearchChange = (e) => {
    const value = e.target.value;
    setBookingSearchTerm(value);

    if (bookingDebounceTimeoutRef.current) {
      clearTimeout(bookingDebounceTimeoutRef.current);
    }
    bookingDebounceTimeoutRef.current = setTimeout(() => {
      fetchBookings(value, bookingFilterStatus);
    }, 500);
  };

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      fetchBookings(bookingSearchTerm, bookingFilterStatus);
    }
  }, [bookingFilterStatus, fetchBookings, isLoading, bookingSearchTerm, isLoggedIn]);


  // --- Form Change Handlers (CRUD) ---
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

  // UPDATED: handleNewBookingChange to include client_name and client_contact
  const handleNewBookingChange = (e) => {
    const { name, value, type } = e.target;
    setNewBooking(prev => ({ ...prev, [name]: type === 'number' ? parseNumericInput(value) : value }));
  };

  // UPDATED: handleEditBookingChange to include client_name and client_contact
  const handleEditBookingChange = (e) => {
    const { name, value, type } = e.target;
    setEditingBooking(prev => ({ ...prev, [name]: type === 'number' ? parseNumericInput(value) : value }));
  };


  // --- Add Data Functions (CREATE) ---
  const addRoom = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { showToast('Please log in to perform this action.', 'error'); return; }
    // Frontend RBAC check
    if (!canPerformAction('admin')) {
      showToast('You do not have permission to add rooms.', 'error');
      return;
    }
    try {
      // Send role with the request body
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRoom, role: currentUser.role }), // Include role
      });
      const data = await response.json(); // Parse response to get potential error message
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      showToast('Room added successfully!', 'success');
      setNewRoom({ room_number: '', type: '', price_per_night: '', status: 'Available' });
      setShowRoomForm(false);
      fetchRooms();
    } catch (error) {
      console.error('Failed to add room:', error);
      showToast(`Failed to add room: ${error.message}`, 'error');
    }
  };

  const addInventory = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { showToast('Please log in to perform this action.', 'error'); return; }
    // Frontend RBAC check
    if (!canPerformAction('admin')) {
      showToast('You do not have permission to add inventory items.', 'error');
      return;
    }
    try {
      // Send role with the request body for Inventory
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newInventory, role: currentUser.role }), // Include role
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      showToast('Inventory item added successfully!', 'success');
      setNewInventory({ name: '', category_id: '', quantity: '', unit: '', cost_price: '', selling_price: '', reorder_level: '' });
      setShowInventoryForm(false);
      fetchInventory();
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      showToast(`Failed to add inventory item: ${error.message}`, 'error');
    }
  };

  const addBooking = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { showToast('Please log in to perform this action.', 'error'); return; }
    // Frontend RBAC check
    if (!canPerformAction('admin') && !canPerformAction('staff')) { // Both admin and staff can add bookings
      showToast('You do not have permission to add bookings.', 'error');
      return;
    }
    try {
      // UPDATED: Send client_name and client_contact instead of client_id
      const response = await fetch('/api/bookings/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newBooking, role: currentUser.role }), // Include role and new client fields
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      showToast('Booking added successfully!', 'success');
      // UPDATED: Reset newBooking state to include new client fields
      setNewBooking({ room_id: '', client_name: '', client_contact: '', check_in_date: '', check_out_date: '', total_price: '', status: 'Confirmed' });
      setShowBookingForm(false);
      fetchBookings();
    } catch (error) {
      console.error('Failed to add booking:', error);
      showToast(`Failed to add booking: ${error.message}`, 'error');
    }
  };


  // --- Update Data Functions (UPDATE) ---
  const updateRoom = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { showToast('Please log in to perform this action.', 'error'); return; }
    // Frontend RBAC check
    if (!canPerformAction('admin')) {
      showToast('You do not have permission to update rooms.', 'error');
      return;
    }
    if (!editingRoom) return;
    try {
      // Send role with the request body
      const response = await fetch(`/api/rooms?id=${editingRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingRoom, role: currentUser.role }), // Include role
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      showToast('Room updated successfully!', 'success');
      setEditingRoom(null);
      setShowRoomForm(false);
      fetchRooms();
    } catch (error) {
      console.error('Failed to update room:', error);
      showToast(`Failed to update room: ${error.message}`, 'error');
    }
  };

  const updateInventory = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { showToast('Please log in to perform this action.', 'error'); return; }
    // Frontend RBAC check
    if (!canPerformAction('admin')) {
      showToast('You do not have permission to update inventory items.', 'error');
      return;
    }
    if (!editingInventory) return;
    try {
      // Send role with the request body for Inventory
      const response = await fetch(`/api/inventory?id=${editingInventory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingInventory, role: currentUser.role }), // Include role
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      showToast('Inventory item updated successfully!', 'success');
      setEditingInventory(null);
      setShowInventoryForm(false);
      fetchInventory();
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      showToast(`Failed to update inventory item: ${error.message}`, 'error');
    }
  };

  const updateBooking = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { showToast('Please log in to perform this action.', 'error'); return; }
    // Frontend RBAC check
    if (!canPerformAction('admin') && !canPerformAction('staff')) {
      showToast('You do not have permission to update bookings.', 'error');
      return;
    }
    if (!editingBooking) return;
    try {
      // UPDATED: Send client_name and client_contact instead of client_id
      const response = await fetch(`/api/bookings/rooms?id=${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingBooking, role: currentUser.role }), // Include role and new client fields
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      showToast('Booking updated successfully!', 'success');
      setEditingBooking(null);
      setShowBookingForm(false);
      fetchBookings();
    } catch (error) {
      console.error('Failed to update booking:', error);
      showToast(`Failed to update booking: ${error.message}`, 'error');
    }
  };


  // --- Delete Data Functions (DELETE) ---
  const deleteRoom = async (id) => {
    if (!isLoggedIn) { showToast('Please log in to perform this action.', 'error'); return; }
    // Frontend RBAC check
    if (!canPerformAction('admin')) {
      showToast('You do not have permission to delete rooms.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      // Send role with the query parameters for DELETE
      const response = await fetch(`/api/rooms?id=${id}&role=${currentUser.role}`, { // Include role
        method: 'DELETE',
      });
      const data = await response.json(); // Parse response to get potential error message
      if (!response.ok) {
        // Check for 403 specifically to show backend message
        if (response.status === 403) {
          throw new Error(data.message || 'Forbidden: You do not have permission.');
        }
        // For other errors, check if data.message exists, otherwise use generic
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      } else {
        showToast('Room deleted successfully!', 'success');
        fetchRooms();
      }
    } catch (error) {
      console.error('Failed to delete room:', error);
      showToast(`Failed to delete room: ${error.message}`, 'error');
    }
  };

  const deleteInventory = async (id) => {
    if (!isLoggedIn) { showToast('Please log in to perform this action.', 'error'); return; }
    // Frontend RBAC check
    if (!canPerformAction('admin')) {
      showToast('You do not have permission to delete inventory items.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      // Send role with the query parameters for Inventory DELETE
      const response = await fetch(`/api/inventory?id=${id}&role=${currentUser.role}`, { // Include role
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(data.message || 'Forbidden: You do not have permission.');
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      } else {
        showToast('Inventory item deleted successfully!', 'success');
        fetchInventory();
      }
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      showToast(`Failed to delete inventory item: ${error.message}`, 'error');
    }
  };

  const deleteBooking = async (id) => {
    if (!isLoggedIn) { showToast('Please log in to perform this action.', 'error'); return; }
    // Frontend RBAC check
    if (!canPerformAction('admin')) {
      showToast('You do not have permission to delete bookings.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      // Send role with the query parameters for Booking DELETE
      const response = await fetch(`/api/bookings/rooms?id=${id}&role=${currentUser.role}`, { // Include role
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(data.message || 'Forbidden: You do not have permission.');
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      } else {
        showToast('Booking deleted successfully!', 'success');
        fetchBookings();
      }
    } catch (error) {
      console.error('Failed to delete booking:', error);
      showToast(`Failed to delete booking: ${error.message}`, 'error');
    }
  };


  // --- Dashboard Calculations (only if logged in) ---
  const totalRooms = isLoggedIn ? rooms.length : 0;
  const availableRooms = isLoggedIn ? rooms.filter(room => room.status === 'Available').length : 0;
  const occupiedRooms = isLoggedIn ? rooms.filter(room => room.status === 'Occupied').length : 0;
  const maintenanceRooms = isLoggedIn ? rooms.filter(room => room.status === 'Maintenance').length : 0;

  const totalBookings = isLoggedIn ? bookings.length : 0;
  const confirmedBookings = isLoggedIn ? bookings.filter(booking => booking.status === 'Confirmed').length : 0;
  const pendingBookings = isLoggedIn ? bookings.filter(booking => booking.status === 'Pending').length : 0;
  const cancelledBookings = isLoggedIn ? bookings.filter(booking => booking.status === 'Cancelled').length : 0;

  const lowStockItems = isLoggedIn ? inventory.filter(item => item.quantity <= item.reorder_level) : [];
  const totalInventoryItems = isLoggedIn ? inventory.length : 0;


  // --- Render UI ---
  // If not logged in, show login/register interface
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-6">Dreams Bar & Guesthouse</h1>
          <p className="text-gray-700 mb-6">Please log in or register to access the management system.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md shadow-md transition-colors text-lg"
            >
              Login
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-md shadow-md transition-colors text-lg"
            >
              Register
            </button>
          </div>
        </div>

        {/* Login Modal */}
        <Modal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Login"
        >
          <form onSubmit={handleLogin} className="p-2">
            <div className="mb-4">
              <label htmlFor="login_username" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                id="login_username"
                name="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="login_password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="login_password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
              >
                Login
              </button>
            </div>
          </form>
        </Modal>

        {/* Register Modal */}
        <Modal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          title="Register"
        >
          <form onSubmit={handleRegister} className="p-2">
            <div className="mb-4">
              <label htmlFor="register_username" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                id="register_username"
                name="username"
                value={registerForm.username}
                onChange={handleRegisterChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="register_password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="register_password"
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              />
            </div>
            {/* Role selection - can be hidden or defaulted for simpler registration */}
            <div className="mb-6">
              <label htmlFor="register_role" className="block text-sm font-medium text-gray-700">Role</label>
              <select
                id="register_role"
                name="role"
                value={registerForm.role}
                onChange={handleRegisterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
              >
                Register
              </button>
            </div>
          </form>
        </Modal>

        {/* Toast Notification Display */}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        )}
      </div>
    );
  }

  // If logged in, show the main application content
  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans antialiased">
      <header className="bg-blue-600 text-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dreams Bar & Guesthouse Management</h1>
        <div className="flex items-center space-x-4">
          {currentUser && (
            <span className="text-lg">Welcome, <span className="font-semibold">{currentUser.username}</span> (<span className="capitalize">{currentUser.role}</span>)</span>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-md transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-3 rounded-lg shadow-md transition-all duration-200 ${
            activeTab === 'dashboard' ? 'bg-blue-700 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'
          }`}
        >
          Dashboard
        </button>
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
        {isLoading ? (
          <div className="text-center py-10">
            <div className="text-blue-600 text-xl font-semibold">Loading data...</div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">Overview Dashboard</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Room Summary Card */}
                  <div className="bg-blue-50 p-6 rounded-lg shadow-md border-l-4 border-blue-600">
                    <h3 className="text-xl font-semibold text-blue-800 mb-3">Room Status</h3>
                    <p className="text-gray-700 text-lg">Total Rooms: <span className="font-bold">{totalRooms}</span></p>
                    <p className="text-green-600 text-lg">Available: <span className="font-bold">{availableRooms}</span></p>
                    <p className="text-yellow-600 text-lg">Occupied: <span className="font-bold">{occupiedRooms}</span></p>
                    <p className="text-red-600 text-lg">Maintenance: <span className="font-bold">{maintenanceRooms}</span></p>
                  </div>

                  {/* Booking Summary Card */}
                  <div className="bg-green-50 p-6 rounded-lg shadow-md border-l-4 border-green-600">
                    <h3 className="text-xl font-semibold text-green-800 mb-3">Booking Overview</h3>
                    <p className="text-gray-700 text-lg">Total Bookings: <span className="font-bold">{totalBookings}</span></p>
                    <p className="text-blue-600 text-lg">Confirmed: <span className="font-bold">{confirmedBookings}</span></p>
                    <p className="text-orange-600 text-lg">Pending: <span className="font-bold">{pendingBookings}</span></p>
                    <p className="text-red-600 text-lg">Cancelled: <span className="font-bold">{cancelledBookings}</span></p>
                  </div>

                  {/* Inventory Summary Card */}
                  <div className="bg-purple-50 p-6 rounded-lg shadow-md border-l-4 border-purple-600">
                    <h3 className="text-xl font-semibold text-purple-800 mb-3">Inventory Status</h3>
                    <p className="text-gray-700 text-lg">Total Inventory Items: <span className="font-bold">{totalInventoryItems}</span></p>
                    <p className="text-red-600 text-lg">Low Stock Items: <span className="font-bold">{lowStockItems.length}</span></p>
                    {lowStockItems.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
                        {lowStockItems.slice(0, 5).map(item => ( // Show first 5 low stock items
                          <li key={item.id}>{item.name} ({item.quantity} {item.unit})</li>
                        ))}
                        {lowStockItems.length > 5 && <li>...and {lowStockItems.length - 5} more</li>}
                      </ul>
                    )}
                    {lowStockItems.length === 0 && <p className="text-green-600 text-sm">All inventory levels are good!</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bookings Management</h2>
                <div className="flex flex-wrap gap-4 mb-4 items-center">
                  <button
                    onClick={() => { setShowBookingForm(true); setEditingBooking(null); setNewBooking({ room_id: '', client_name: '', client_contact: '', check_in_date: '', check_out_date: '', total_price: '', status: 'Confirmed' }); }}
                    className={`bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md transition-colors ${!canPerformAction('admin') && !canPerformAction('staff') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!canPerformAction('admin') && !canPerformAction('staff')}
                  >
                    + Add New Booking
                  </button>
                  <input
                    type="text"
                    placeholder="Search by Room/Client Name..."
                    value={bookingSearchTerm}
                    onChange={handleBookingSearchChange}
                    className="flex-grow max-w-xs p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={bookingFilterStatus}
                    onChange={(e) => setBookingFilterStatus(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>


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
                      {/* NEW: Client Name Input */}
                      <div>
                        <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">Client Name</label>
                        <input
                          type="text"
                          id="client_name"
                          name="client_name"
                          value={editingBooking ? editingBooking.client_name : newBooking.client_name}
                          onChange={editingBooking ? handleEditBookingChange : handleNewBookingChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                        />
                      </div>
                      {/* NEW: Client Contact Input */}
                      <div>
                        <label htmlFor="client_contact" className="block text-sm font-medium text-gray-700">Client Contact (Optional)</label>
                        <input
                          type="text"
                          id="client_contact"
                          name="client_contact"
                          value={editingBooking ? editingBooking.client_contact : newBooking.client_contact}
                          onChange={editingBooking ? handleEditBookingChange : handleNewBookingChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                        />
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
                          <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Client Name</th> {/* UPDATED */}
                          <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-600">Client Contact</th> {/* NEW */}
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
                            <td className="py-3 px-4 border-b text-sm text-gray-700">{booking.client_name}</td> {/* UPDATED */}
                            <td className="py-3 px-4 border-b text-sm text-gray-700">{booking.client_contact || 'N/A'}</td> {/* NEW */}
                            <td className="py-3 px-4 border-b text-sm text-gray-700">{new Date(booking.check_in_date).toLocaleDateString()}</td>
                            <td className="py-3 px-4 border-b text-sm text-gray-700">{new Date(booking.check_out_date).toLocaleDateString()}</td>
                            <td className="py-3 px-4 border-b text-sm text-gray-700">${booking.total_price}</td>
                            <td className="py-3 px-4 border-b text-sm text-gray-700">{booking.status}</td>
                            <td className="py-3 px-4 border-b text-sm">
                              <button
                                onClick={() => { setEditingBooking(booking); setShowBookingForm(true); }}
                                className={`text-blue-600 hover:text-blue-800 mr-2 ${!canPerformAction('admin') && !canPerformAction('staff') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!canPerformAction('admin') && !canPerformAction('staff')}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteBooking(booking.id)}
                                className={`text-red-600 hover:text-red-800 ${!canPerformAction('admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!canPerformAction('admin')}
                              >
                                Delete
                              </button>
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
                    className={`bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md transition-colors ${!canPerformAction('admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!canPerformAction('admin')}
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
                              <button
                                onClick={() => { setEditingRoom(room); setShowRoomForm(true); }}
                                className={`text-blue-600 hover:text-blue-800 mr-2 ${!canPerformAction('admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!canPerformAction('admin')}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteRoom(room.id)}
                                className={`text-red-600 hover:text-red-800 ${!canPerformAction('admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!canPerformAction('admin')}
                              >
                                Delete
                              </button>
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

                {/* Search and Filter Controls for Inventory */}
                <div className="flex flex-wrap gap-4 mb-4 items-center">
                  <button
                    onClick={() => { setShowInventoryForm(true); setEditingInventory(null); setNewInventory({ name: '', category_id: '', quantity: '', unit: '', cost_price: '', selling_price: '', reorder_level: '' }); }}
                    className={`bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md shadow-md transition-colors ${!canPerformAction('admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!canPerformAction('admin')}
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
                              <button
                                onClick={() => { setEditingInventory(item); setShowInventoryForm(true); }}
                                className={`text-blue-600 hover:text-blue-800 mr-2 ${!canPerformAction('admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!canPerformAction('admin')}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteInventory(item.id)}
                                className={`text-red-600 hover:text-red-800 ${!canPerformAction('admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!canPerformAction('admin')}
                              >
                                Delete
                              </button>
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
          </>
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
