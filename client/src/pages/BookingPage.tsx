import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from "jspdf";
import { StepIndicator } from '../components/StepIndicator';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { Clock, CreditCard, X, Download, CheckCircle2, Minus, Plus, Armchair, Monitor, Film, AlertCircle } from 'lucide-react';

interface TicketData {
  id: string;
  qrUrl: string;
  seat: string;
  ticketNo: string;
}

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Data States
  const [formData, setFormData] = useState({ name: '', nic: '', phone: '', email: '' });
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [ticketCount, setTicketCount] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Movies from DB
  const [availableMovies, setAvailableMovies] = useState<any[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedTickets, setGeneratedTickets] = useState<TicketData[]>([]);

  const steps = ['ඔබේ විස්තර', 'චිත්‍රපටිය තෝරන්න', 'ආසන තෝරන්න', 'තහවුරු කරන්න', 'ටිකට් පත'];
  
  // තෝරාගත් Movie එකේ විස්තර
  const selectedMovie = availableMovies.find(m => m._id === selectedMovieId);
  
  // Price Calculation
  const ticketPrice = selectedMovie ? selectedMovie.price : 0; 
  const totalPrice = ticketPrice * ticketCount;

  // FETCH MOVIES FROM DB
  useEffect(() => {
    fetch('http://localhost:5000/api/movies')
      .then(res => res.json())
      .then(data => {
        const timeOrder = ['10:30 AM', '01:30 PM', '04:30 PM', '07:30 PM'];
        const sorted = data.sort((a: any, b: any) => timeOrder.indexOf(a.showTime) - timeOrder.indexOf(b.showTime));
        setAvailableMovies(sorted);
      })
      .catch(err => console.error("Error fetching movies:", err));
  }, []);

  // SEAT MAP CONFIG
  const rows = 13; 
  const seatsPerRow = 40; 
  const aisleAfter = 20;

  const handleSeatClick = (rowLabel: string, seatNum: number) => {
    const seatId = `${rowLabel}${seatNum}`;
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      // Limit Check
      if (selectedSeats.length < ticketCount) {
        setSelectedSeats([...selectedSeats, seatId]);
      } else {
        alert(`ඔබට තෝරාගත හැක්කේ ආසන ${ticketCount}ක් පමණි.`);
      }
    }
  };

  const handleTicketCount = (type: 'increase' | 'decrease') => {
    if (type === 'increase') {
      if (ticketCount < 10) setTicketCount(ticketCount + 1);
    } else {
      if (ticketCount > 1) {
        setTicketCount(ticketCount - 1);
        setSelectedSeats([]);
      }
    }
  };

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "නම ඇතුලත් කරන්න";
    if (!formData.nic.trim()) newErrors.nic = "NIC අංකය ඇතුලත් කරන්න";
    if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = "දුරකථන අංකය වැරදියි";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email ලිපිනය වැරදියි";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) setCurrentStep(2);
  };

  const validatePayment = () => {
    const newErrors: { [key: string]: string } = {};
    if (!/^\d{16}$/.test(cardData.number.replace(/\s/g, ''))) newErrors.cardNumber = "කාඩ්පත් අංකය වැරදියි";
    if (cardData.expiry.length < 5) newErrors.cardExpiry = "දිනය වැරදියි";
    if (!/^\d{3,4}$/.test(cardData.cvc)) newErrors.cardCvc = "CVC වැරදියි";
    if (!cardData.name.trim()) newErrors.cardName = "නම ඇතුලත් කරන්න";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) generateTickets();
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardData({ ...cardData, number: val });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length > 2) val = `${val.slice(0, 2)}/${val.slice(2)}`;
    setCardData({ ...cardData, expiry: val });
  };

  const generateTickets = async () => {
    if (!selectedMovie) return;

    setIsProcessing(true);
    const newTickets: TicketData[] = [];

    try {
      // --- FIX: Added customerEmail here ---
      const bookingData = {
        movieTitle: selectedMovie.title,
        seats: selectedSeats,
        totalPrice: totalPrice,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email // <--- මෙන්න මේ කොටස ඔයාගේ code එකේ අඩු වෙලා තිබුණා
      };

      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        // Error එක මොකක්ද කියලා බලන්න Console එකට දාමු
        const errorData = await response.json();
        console.error("Server Error Details:", errorData);
        throw new Error(errorData.error || 'Server error');
      }

      // QR Generation (Local)
      for (let i = 0; i < selectedSeats.length; i++) {
        const seat = selectedSeats[i];
        
        const ticketInfo = {
          id: `${formData.nic}-${Date.now()}-${i}`,
          movie: selectedMovie.title,
          ticketNo: `TICKET ${i + 1}/${ticketCount}`,
          seat: seat,
          cinema: "Galaxy Cinema",
          time: selectedMovie.showTime,
          user: formData.name,
          nic: formData.nic,
          date: new Date().toLocaleDateString()
        };

        const url = await QRCode.toDataURL(JSON.stringify(ticketInfo));
        
        newTickets.push({
          id: ticketInfo.id,
          qrUrl: url,
          seat: seat,
          ticketNo: ticketInfo.ticketNo
        });
      }

      setGeneratedTickets(newTickets);
      setIsProcessing(false);
      setShowPaymentModal(false);
      setCurrentStep(5);
    } catch (err) {
      console.error(err);
      alert("Booking Failed! Please check console for details.");
      setIsProcessing(false);
    }
  };

  const downloadPDF = () => {
    if (!selectedMovie) return;
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("GALAXY CINEMA - eTICKETS", 105, 20, { align: "center" });
    yPos += 40;

    generatedTickets.forEach((ticket) => {
      if (yPos > 240) { doc.addPage(); yPos = 20; }

      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.rect(15, yPos, 180, 70);

      doc.setFillColor(245, 247, 250);
      doc.rect(15, yPos, 60, 70, 'F');
      
      doc.addImage(ticket.qrUrl, "PNG", 22, yPos + 10, 45, 45);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Scan at Entry", 45, yPos + 62, { align: "center" });

      const textX = 85; 
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(selectedMovie.title.toUpperCase(), textX, yPos + 15);

      doc.setFontSize(12);
      doc.setTextColor(80);
      doc.text(`Galaxy Cinema Hall`, textX, yPos + 25);
      doc.text(`Showtime: ${selectedMovie.showTime} | Date: ${new Date().toLocaleDateString()}`, textX, yPos + 32);

      doc.setDrawColor(220);
      doc.line(textX, yPos + 38, 185, yPos + 38);
      doc.setFontSize(11);
      doc.setTextColor(60);
      doc.text(`Holder: ${formData.name}`, textX, yPos + 48);
      doc.text(`NIC: ${formData.nic}`, textX, yPos + 55);

      // Price in PDF
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.font = "bold";
      doc.text(`Price: Rs. ${selectedMovie.price}.00`, textX, yPos + 65);
      doc.font = "normal";

      doc.setFillColor(37, 99, 235);
      doc.rect(150, yPos + 10, 40, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("SEAT", 170, yPos + 18, { align: "center" });
      
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(ticket.seat, 170, yPos + 29, { align: "center" });

      doc.setTextColor(150);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(ticket.ticketNo, 185, yPos + 65, { align: "right" });

      yPos += 80;
    });

    doc.save(`Galaxy_Tickets_${formData.nic}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Galaxy Cinema Booking</h1>
          <p className="mt-2 text-lg text-gray-600">ඔබේ ටිකට් පත පහසුවෙන්ම වෙන්කරවා ගන්න</p>
        </div>

        <StepIndicator currentStep={currentStep} steps={steps} />

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 border border-gray-100">
          
          {/* STEP 1: Details */}
          {currentStep === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-semibold text-gray-900">ඔබේ විස්තර ඇතුලත් කරන්න</h2>
              <div className="grid gap-6">
                <Input label="සම්පූර්ණ නම" value={formData.name} onChange={(e) => { setFormData({...formData, name: e.target.value}); if(errors.name) setErrors({...errors, name: ''}); }} error={errors.name} placeholder="උදා: කමල් පෙරේරා" />
                <Input label="ජාතික හැඳුනුම්පත් අංකය (NIC)" value={formData.nic} onChange={(e) => { setFormData({...formData, nic: e.target.value}); if(errors.nic) setErrors({...errors, nic: ''}); }} error={errors.nic} placeholder="200012345678" />
                <Input label="දුරකථන අංකය" type="tel" value={formData.phone} maxLength={10} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setFormData({...formData, phone: val}); if(errors.phone) setErrors({...errors, phone: ''}); }} error={errors.phone} placeholder="077 123 4567" />
                <Input label="විද්‍යුත් ලිපිනය (Email)" type="email" value={formData.email} onChange={(e) => { setFormData({...formData, email: e.target.value}); if(errors.email) setErrors({...errors, email: ''}); }} error={errors.email} placeholder="kamal@example.com" />
              </div>
              <div className="pt-4"><Button fullWidth size="lg" onClick={validateStep1}>ඉදිරියට යන්න</Button></div>
            </div>
          )}

          {/* STEP 2: Movie Selection */}
          {currentStep === 2 && (
            <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-blue-900">Galaxy Cinema</h2>
                <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-blue-800">
                  <span className="font-medium">
                    {selectedMovie ? `ටිකට් පතක්: රු. ${selectedMovie.price}` : "කරුණාකර චිත්‍රපටියක් තෝරන්න"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                <h3 className="font-medium text-gray-700">ටිකට්පත් ප්‍රමාණය</h3>
                <div className="flex items-center gap-6">
                  <button onClick={() => handleTicketCount('decrease')} className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50" disabled={ticketCount <= 1}><Minus className="w-5 h-5 text-gray-600" /></button>
                  <span className="text-2xl font-bold text-gray-900 w-8 text-center">{ticketCount}</span>
                  <button onClick={() => handleTicketCount('increase')} className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50" disabled={ticketCount >= 10}><Plus className="w-5 h-5 text-gray-600" /></button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2"><Film className="w-5 h-5 text-blue-600"/> අද පෙන්වන චිත්‍රපට (Now Showing)</h3>
                
                {availableMovies.length === 0 ? (
                  <p className="text-center text-gray-500">Loading movies...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {availableMovies.map((movie) => (
                      <div 
                        key={movie._id} 
                        onClick={() => setSelectedMovieId(movie._id)} 
                        className={cn(
                          "cursor-pointer p-4 rounded-xl border-2 transition-all hover:shadow-lg flex items-center gap-4 relative overflow-hidden", 
                          selectedMovieId === movie._id ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 bg-white"
                        )}
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-2xl">
                          {movie.image.startsWith('http') ? <img src={movie.image} alt={movie.title} className="w-full h-full object-cover"/> : movie.image}
                        </div>
                        
                        <div>
                          <div className="font-bold text-lg text-gray-900 leading-tight">{movie.title}</div>
                          <div className="text-sm font-semibold text-blue-600 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" /> {movie.showTime}
                          </div>
                          <div className="text-xs text-gray-500 flex justify-between w-full mt-1">
                            <span>{movie.description || 'General'}</span>
                            <span className="font-bold text-gray-900">Rs. {movie.price}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-between pt-6 border-t">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>ආපසු</Button>
                <Button onClick={() => setCurrentStep(3)} disabled={!selectedMovieId}>ආසන තෝරන්න</Button>
              </div>
            </div>
          )}

          {/* STEP 3: Seat Map */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">ආසන තෝරන්න</h2>
                <p className="text-gray-500">{selectedMovie?.title} ({selectedMovie?.showTime})</p>
              </div>

              <div className="w-full max-w-4xl mx-auto mb-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-center sm:text-left">
                     <span className="text-sm text-gray-500 block">අවශ්‍ය ටිකට් ගණන</span>
                     <span className="text-xl font-bold text-gray-900">{ticketCount}</span>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                       <span className="text-sm text-gray-500 block">තෝරාගත්</span>
                       <span className={`text-xl font-bold ${selectedSeats.length === ticketCount ? 'text-green-600' : 'text-blue-600'}`}>
                         {selectedSeats.length}
                       </span>
                    </div>
                    <div className="text-center">
                       <span className="text-sm text-gray-500 block">ඉතිරි (Remaining)</span>
                       <span className={`text-xl font-bold ${ticketCount - selectedSeats.length === 0 ? 'text-green-600' : 'text-red-500'}`}>
                         {ticketCount - selectedSeats.length}
                       </span>
                    </div>
                  </div>

                  {selectedSeats.length === ticketCount && (
                     <div className="hidden sm:flex items-center text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 mr-1"/> සම්පූර්ණයි
                     </div>
                  )}
                </div>
              </div>

              <div className="w-full max-w-4xl mx-auto bg-gray-800 text-white text-center py-2 rounded-t-3xl shadow-lg mb-8 flex items-center justify-center gap-2">
                <Monitor className="w-5 h-5" /> තිරය (SCREEN)
              </div>
              
              <div className="overflow-x-auto pb-4">
                <div className="min-w-[800px] flex flex-col gap-3 items-center">
                  {Array.from({ length: rows }).map((_, rIndex) => {
                    const rowLabel = String.fromCharCode(65 + rIndex);
                    return (
                      <div key={rIndex} className="flex gap-2 items-center">
                        <span className="w-6 font-bold text-gray-400">{rowLabel}</span>
                        {Array.from({ length: seatsPerRow }).map((_, cIndex) => {
                          const seatNum = cIndex + 1;
                          const seatId = `${rowLabel}${seatNum}`;
                          const isSelected = selectedSeats.includes(seatId);
                          return (
                            <React.Fragment key={seatId}>
                              {seatNum === aisleAfter + 1 && <div className="w-12"></div>}
                              <button
                                onClick={() => handleSeatClick(rowLabel, seatNum)}
                                className={cn(
                                  "w-8 h-8 rounded-t-lg text-[10px] font-bold transition-all flex items-center justify-center border-b-4",
                                  isSelected 
                                    ? "bg-green-500 border-green-700 text-white scale-110" 
                                    : "bg-gray-200 border-gray-300 text-gray-600 hover:bg-blue-100 hover:border-blue-300"
                                )}
                              >
                                {seatNum}
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-4 justify-between pt-6 border-t max-w-2xl mx-auto">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>ආපසු</Button>
                <Button onClick={() => setCurrentStep(4)} disabled={selectedSeats.length !== ticketCount}>
                  {selectedSeats.length !== ticketCount ? `තව ${ticketCount - selectedSeats.length}ක් තෝරන්න` : 'තහවුරු කරන්න'}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-semibold text-center">තහවුරු කරන්න</h2>
              <div className="bg-gray-50 p-6 rounded-xl text-left space-y-4 border border-gray-200">
                <div className="flex justify-between border-b pb-2"><span className="text-gray-500">චිත්‍රපටිය</span><span className="font-medium">{selectedMovie?.title}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-gray-500">ශාලාව</span><span className="font-medium text-right">Galaxy Cinema</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-gray-500">වෙලාව</span><span className="font-medium">{selectedMovie?.showTime}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-gray-500">තෝරාගත් ආසන</span><span className="font-bold text-blue-600 text-right max-w-[150px] break-words">{selectedSeats.join(', ')}</span></div>
                <div className="flex justify-between pt-2"><span className="text-lg font-bold">මුළු මුදල</span><span className="text-lg font-bold text-blue-600">රු. {totalPrice}.00</span></div>
              </div>
              <div className="flex gap-4 justify-center pt-4"><Button variant="outline" onClick={() => setCurrentStep(3)}>ආපසු</Button><Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowPaymentModal(true)}>මුදල් ගෙවන්න (Pay Now)</Button></div>
            </div>
          )}

          {/* STEP 5: Success */}
          {currentStep === 5 && (
            <div className="text-center animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-green-600" /></div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">ගෙවීම සාර්ථකයි!</h2>
              <p className="text-gray-500 mb-8">ඔබේ ටිකට්පත් {ticketCount} ක් වෙන් කර ඇත.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
                {generatedTickets.map((ticket, index) => (
                  <div key={index} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <img src={ticket.qrUrl} alt={`Ticket ${index + 1}`} className="w-24 h-24" />
                    <div className="text-left flex-1">
                      <div className="text-xs font-bold text-gray-400 uppercase mb-1">{ticket.ticketNo}</div>
                      <div className="font-bold text-gray-900 leading-tight mb-1">{selectedMovie?.title}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md font-bold text-sm flex items-center gap-1">
                          <Armchair className="w-3 h-3" /> {ticket.seat}
                        </span>
                        <span className="text-xs text-gray-500">{selectedMovie?.showTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Button variant="outline" onClick={downloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  සියලුම ටිකට් PDF ලෙස ගන්න
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><CreditCard className="w-6 h-6 text-blue-600" />කාඩ්පත් විස්තර</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                <p className="text-sm text-blue-800 flex justify-between"><span>මුළු ගෙවීම ({ticketCount} tickets):</span><span className="font-bold">රු. {totalPrice}.00</span></p>
              </div>
              <Input label="කාඩ්පත් අංකය" placeholder="0000 0000 0000 0000" maxLength={19} value={cardData.number} onChange={handleCardNumberChange} error={errors.cardNumber} />
              <div className="flex flex-row gap-4">
                <div className="flex-1"><Input label="කල් ඉකුත් වීමේ දිනය" placeholder="MM/YY" value={cardData.expiry} onChange={handleExpiryChange} error={errors.cardExpiry} /></div>
                <div className="flex-1"><Input label="CVC" placeholder="123" maxLength={4} value={cardData.cvc} onChange={(e) => { setCardData({...cardData, cvc: e.target.value.replace(/\D/g, '')}); if(errors.cardCvc) setErrors({...errors, cardCvc: ''}); }} error={errors.cardCvc} /></div>
              </div>
              <Input label="කාඩ් හිමියාගේ නම" placeholder="NAME ON CARD" value={cardData.name} onChange={(e) => { setCardData({...cardData, name: e.target.value}); if(errors.cardName) setErrors({...errors, cardName: ''}); }} error={errors.cardName} />
              <Button fullWidth size="lg" onClick={validatePayment} isLoading={isProcessing} className="mt-4 bg-green-600 hover:bg-green-700">
                {isProcessing ? 'මුදල් ගෙවමින් පවතී...' : `රු. ${totalPrice} ගෙවන්න`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}