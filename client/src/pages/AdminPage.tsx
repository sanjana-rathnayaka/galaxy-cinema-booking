import React, { useEffect, useState } from 'react';
import { Edit, Film, Users, Save, X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button'; 
import { Input } from '../components/ui/Input';   

// --- TYPES (TypeScript සඳහා) ---
interface Movie {
  _id: string;
  title: string;
  image: string;
  price: number;
  showTime: string;
  description: string;
}

interface Booking {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string; // Email එක optional වෙන්න පුළුවන් (පරණ දත්ත නිසා)
  movieTitle: string;
  seats: string[];
  totalPrice: number;
  bookingDate: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'movies' | 'bookings'>('movies');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fixedTimes = ['10:30 AM', '01:30 PM', '04:30 PM', '07:30 PM'];

  // --- DATA FETCHING ---
  const fetchMovies = async () => {
    try {
      const res = await fetch('https://galaxy-cinema-booking.vercel.app/api/movies');
      const data = await res.json();
      
      if (data.length === 0) {
        await initializeSlots();
      } else {
        const sortedMovies = data.sort((a: Movie, b: Movie) => 
          fixedTimes.indexOf(a.showTime) - fixedTimes.indexOf(b.showTime)
        );
        setMovies(sortedMovies);
      }
    } catch (err) { console.error("Error fetching movies", err); }
  };

  const initializeSlots = async () => {
    setIsLoading(true);
    for (const time of fixedTimes) {
      const defaultMovie = {
        title: 'Available Slot',
        image: 'https://placehold.co/600x400?text=Select+Movie',
        price: 1500,
        showTime: time,
        description: 'Update this slot with a movie'
      };
      await fetch('https://galaxy-cinema-booking.vercel.app/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultMovie),
      });
    }
    setIsLoading(false);
    fetchMovies();
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('https://galaxy-cinema-booking.vercel.app/api/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) { console.error("Error fetching bookings", err); }
  };

  useEffect(() => {
    fetchMovies();
    fetchBookings();
  }, []);

  // --- ACTIONS ---

  const handleUpdateMovie = async () => {
    if (!editingMovie) return;
    await fetch(`https://galaxy-cinema-booking.vercel.app/api/movies/${editingMovie._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingMovie),
    });
    setEditingMovie(null);
    fetchMovies();
  };

  // --- DELETE ALL BOOKINGS ---
  const handleClearAllBookings = async () => {
    if (window.confirm("Are you sure you want to DELETE ALL bookings? This cannot be undone!")) {
      try {
        const res = await fetch('https://galaxy-cinema-booking.vercel.app/api/bookings', {
          method: 'DELETE',
        });

        if (res.ok) {
          alert("All bookings cleared successfully!");
          fetchBookings(); // Refresh table
        } else {
          alert("Failed to clear bookings.");
        }
      } catch (err) {
        console.error("Error deleting bookings:", err);
        alert("Server error occurred.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Manage your 4 movie slots & bookings</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('movies')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'movies' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}>
               <Film className="w-4 h-4 inline mr-2"/> Movies (Slots)
            </button>
            <button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'bookings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}>
               <Users className="w-4 h-4 inline mr-2"/> Bookings
            </button>
          </div>
        </div>

        {/* --- MOVIES TAB --- */}
        {activeTab === 'movies' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Today's Schedule (4 Slots)</h2>
            
            {isLoading ? <p>Setting up slots...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {movies.map((movie) => (
                  <div key={movie._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                    <div className="bg-blue-600 text-white text-center py-2 font-bold text-lg">
                      {movie.showTime}
                    </div>
                    <div className="h-48 w-full bg-gray-100 relative group">
                      <img src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                        <Button onClick={() => setEditingMovie(movie)} className="bg-white text-black hover:bg-gray-200">
                          <Edit className="w-4 h-4 mr-2"/> Change Movie
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{movie.title}</h3>
                        <p className="text-sm text-gray-500">{movie.description || 'No description'}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t flex justify-between items-center">
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">ACTIVE</span>
                        <span className="font-bold text-blue-600">Rs. {movie.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- BOOKINGS TAB --- */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Table Header with Clear Button */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Recent Bookings</h2>
              
              {bookings.length > 0 && (
                <button 
                  onClick={handleClearAllBookings}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-bold border border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Movie</th>
                    <th className="px-6 py-4">Seats</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {booking.customerName}
                        <div className="text-xs text-gray-500">{booking.customerPhone}</div>
                      </td>
                      
                      {/* Email Column */}
                      <td className="px-6 py-4 text-blue-600">
                        {booking.customerEmail || '-'}
                      </td>
                      
                      <td className="px-6 py-4 text-gray-600">{booking.movieTitle}</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-700 py-1 px-2 rounded text-xs font-bold">
                          {booking.seats.join(', ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600">Rs. {booking.totalPrice}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {bookings.length === 0 && (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                  <AlertTriangle className="w-12 h-12 text-gray-300 mb-2" />
                  <p>No bookings found.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* --- EDIT MOVIE MODAL --- */}
      {editingMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold">Update Slot: <span className="text-blue-600">{editingMovie.showTime}</span></h3>
               <button onClick={() => setEditingMovie(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Movie Title</label>
                <Input value={editingMovie.title} onChange={(e: any) => setEditingMovie({...editingMovie, title: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Poster Image URL (or Emoji)</label>
                <Input value={editingMovie.image} onChange={(e: any) => setEditingMovie({...editingMovie, image: e.target.value})} />
                <p className="text-xs text-gray-500 mt-1">Tip: Paste a link to a JPG/PNG or just type an Emoji like 🦁</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ticket Price (LKR)</label>
                <Input type="number" value={editingMovie.price} onChange={(e: any) => setEditingMovie({...editingMovie, price: Number(e.target.value)})} />
              </div>

              <div>
                 <label className="block text-sm font-medium mb-1">Description / Type</label>
                 <Input value={editingMovie.description} onChange={(e: any) => setEditingMovie({...editingMovie, description: e.target.value})} />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingMovie(null)} fullWidth>Cancel</Button>
                <Button onClick={handleUpdateMovie} className="bg-blue-600 hover:bg-blue-700" fullWidth>
                   <Save className="w-4 h-4 mr-2"/> Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}