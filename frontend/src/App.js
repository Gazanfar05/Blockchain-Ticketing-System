import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { ethers } from "ethers";
import { QRCodeSVG } from "qrcode.react";
import "./index.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Bus options mock data (for demo)
const busOptions = [
  { id: 1, bus: "VRL Travels", depart: "09:00", arrive: "15:30", duration: "6h 30m", priceInEth: 0.017 },
  { id: 2, bus: "KSRTC Airavat", depart: "12:15", arrive: "18:45", duration: "6h 30m", priceInEth: 0.018 },
  { id: 3, bus: "Orange Tours", depart: "14:00", arrive: "20:30", duration: "6h 30m", priceInEth: 0.019 },
  { id: 4, bus: "SRS Travels", depart: "16:45", arrive: "23:00", duration: "6h 15m", priceInEth: 0.020 },
  { id: 5, bus: "Greenline", depart: "06:00", arrive: "12:20", duration: "6h 20m", priceInEth: 0.016 }
];

// Train options mock data (for demo)
const trainOptions = [
  { id: 1, train: "Rajdhani Express", depart: "08:00", arrive: "12:45", duration: "4h 45m", priceInEth: 0.026 },
  { id: 2, train: "Shatabdi Express", depart: "14:30", arrive: "19:00", duration: "4h 30m", priceInEth: 0.027 },
  { id: 3, train: "Duronto Express", depart: "10:15", arrive: "15:00", duration: "4h 45m", priceInEth: 0.028 },
  { id: 4, train: "Intercity Express", depart: "06:45", arrive: "11:15", duration: "4h 30m", priceInEth: 0.025 },
  { id: 5, train: "Jan Shatabdi", depart: "17:00", arrive: "21:30", duration: "4h 30m", priceInEth: 0.024 }
];

function App() {
  // Play travel sound based on mode
  const playTravelSound = (mode) => {
    // Audio disabled
  };
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [uri, setUri] = useState("");
  const [status, setStatus] = useState("");
  const [qrData, setQrData] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({ name: "", phone: "", email: "" });
  const [travelData, setTravelData] = useState({ mode: "", date: "", from: "", to: "", distance: "", price: "" });
  const [showSummary, setShowSummary] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [showBookings, setShowBookings] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState(""); // "success" or "error"
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  // Popup state for seat selection modal
  const [showPopup, setShowPopup] = useState(false);
  // Flight options mock data (for demo)
  const flightOptions = [
    { id: 1, flight: "6E 236", depart: "11:45", arrive: "14:25", duration: "2h 40m", priceInEth: 0.0387 },
    { id: 2, flight: "AI 802", depart: "13:00", arrive: "15:45", duration: "2h 45m", priceInEth: 0.0397 },
    { id: 3, flight: "SG 913", depart: "08:30", arrive: "11:15", duration: "2h 45m", priceInEth: 0.0364 },
    { id: 4, flight: "UK 785", depart: "16:10", arrive: "18:55", duration: "2h 45m", priceInEth: 0.0375 },
    { id: 5, flight: "IX 654", depart: "18:00", arrive: "20:30", duration: "2h 30m", priceInEth: 0.0412 }
  ];

  // Selected flight option
  const [selectedOption, setSelectedOption] = useState(null);

  // Generate random taken seats for demo
  const generateRandomSeats = (mode) => {
    const taken = new Set();
    const getRandomInt = (max) => Math.floor(Math.random() * max) + 1;

    if (mode === "Flight" || mode === "Train") {
      const rows = mode === "Train" ? 35 : 40;
      const cols = 6;
      for (let i = 0; i < 20; i++) {
        const row = i < 26 ? String.fromCharCode(65 + (i % 26)) : "A" + String.fromCharCode(65 + (i % 26));
        const col = getRandomInt(cols);
        taken.add(`${row}${col}`);
      }
    } else if (mode === "Bus") {
      for (let i = 0; i < 15; i++) {
        const row = String.fromCharCode(65 + (i % 26));
        const col = getRandomInt(4);
        taken.add(`${row}${col}`);
      }
    } else {
      for (let i = 0; i < 15; i++) {
        taken.add(`S-${getRandomInt(90)}`);
      }
    }

    return Array.from(taken);
  };
  const [takenSeats, setTakenSeats] = useState([]);

  // Update takenSeats whenever travelData.mode changes
  useEffect(() => {
    if (travelData.mode) {
      setTakenSeats(generateRandomSeats(travelData.mode));
    }
  }, [travelData.mode]);

  // Responsive: media query
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Typewriter intro for not-logged-in users
  const welcomeLines = [
    "Welcome, traveler...",
    "Initializing blockchain gateway...",
    "✅ Gateway ready. Let's book your journey!"
  ];
  const [typewriterText, setTypewriterText] = useState("");
  useEffect(() => {
    if (!isLoggedIn) {
      let currentLine = 0;
      let currentChar = 0;
      let fullText = "";
      const interval = setInterval(() => {
        if (currentLine < welcomeLines.length) {
          if (currentChar < welcomeLines[currentLine].length) {
            fullText += welcomeLines[currentLine][currentChar];
            setTypewriterText(fullText + "|");
            currentChar++;
          } else {
            fullText += "\n";
            currentChar = 0;
            currentLine++;
          }
        } else {
          setTypewriterText(fullText.trim());
          clearInterval(interval);
        }
      }, 60);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const abi = ["function mintTicket(string memory _tokenURI) public payable"];

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bal = await provider.getBalance(accounts[0]);
        setBalance(ethers.formatEther(bal));
      } catch (err) {
        console.error("❌ Wallet connection error:", err.message || JSON.stringify(err));
        setToastType("error");
        setToastMsg("Failed to connect wallet. Check MetaMask.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } else {
      setToastType("error");
      setToastMsg("Install MetaMask first!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const mint = async () => {
    try {
      setIsLoading(true);
      setStatus("Minting...");
      setShowToast(false);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      const tx = await contract.mintTicket(uri, {
        value: ethers.parseEther(
          selectedOption && selectedOption.priceInEth
            ? selectedOption.priceInEth.toString()
            : (travelData.price || "0.01")
        )
      });

      await tx.wait();
      setIsLoading(false);
      setStatus("✅ Ticket minted!");
      // Build QR payload (only name, date, from, to, seat)
      const qrPayload = {
        name: userData.name,
        date: travelData.date,
        from: travelData.from,
        to: travelData.to,
        seat: selectedSeat || "Not selected"
      };
      setQrData(JSON.stringify(qrPayload));
      setMyBookings([...myBookings, { ...travelData, uri, seatNumber: selectedSeat || "Not selected" }]);
      setToastType("success");
      setToastMsg("Ticket minted successfully!");
      setShowToast(true);
      playTravelSound(travelData.mode);
      setTimeout(() => setShowToast(false), 3500);
    } catch (err) {
      setIsLoading(false);
      console.error("❌ Minting Error:", err);
      setStatus("❌ Mint failed. Check console.");
      setToastType("error");
      setToastMsg("Mint failed. Check console.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }
  };

  const handleLogin = () => {
    if (userData.name && userData.phone && userData.email) {
      setIsLoggedIn(true);
    } else {
      setToastType("error");
      setToastMsg("Please fill all fields.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const calculateDistance = (from, to) => {
    if (!from || !to || from === to) return 0;
    return Math.floor(Math.random() * 1000) + 50;
  };

  const updateTravelData = (key, value) => {
    const updated = { ...travelData, [key]: value };
    if (updated.from && updated.to && updated.mode) {
      const distance = calculateDistance(updated.from, updated.to);
      let ratePerKm = 0.001;
      if (updated.mode === "Train") ratePerKm = 0.002;
      if (updated.mode === "Flight") ratePerKm = 0.005;
      const price = (distance * ratePerKm).toFixed(4);
      setTravelData({ ...updated, distance, price });
    } else {
      setTravelData(updated);
    }
  };

  // Helper to get coordinates for city names (mock implementation)
  const getCoordinates = (city) => {
    const mockLocations = {
      Bangalore: [12.9716, 77.5946],
      Delhi: [28.6139, 77.209],
      Mumbai: [19.076, 72.8777],
      Kolkata: [22.5726, 88.3639],
      Hyderabad: [17.385, 78.4867],
      Chennai: [13.0827, 80.2707],
      Pune: [18.5204, 73.8567]
    };
    return mockLocations[city] || null;
  };

  // Emoji position for animated marker along route
  const [emojiLatLng, setEmojiLatLng] = useState(null);

  // Animate emoji along the route when from/to changes
  useEffect(() => {
    const fromCoord = getCoordinates(travelData.from);
    const toCoord = getCoordinates(travelData.to);
    if (!fromCoord || !toCoord) return;

    let progress = 0;
    const interval = setInterval(() => {
      if (progress > 1) {
        clearInterval(interval);
        return;
      }
      const lat = fromCoord[0] + (toCoord[0] - fromCoord[0]) * progress;
      const lng = fromCoord[1] + (toCoord[1] - fromCoord[1]) * progress;
      setEmojiLatLng([lat, lng]);
      progress += 0.01;
    }, 100);
    return () => clearInterval(interval);
  }, [travelData.from, travelData.to]);

  // Neon Glow Styles
  // PDF Download for Ticket
  const downloadTicketPDF = async () => {
    const ticketDiv = document.getElementById("ticketPreview");
    if (!ticketDiv) return;

    const canvas = await html2canvas(ticketDiv);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("ticket.pdf");
  };
  const neonGlow = "#7f5af0";      // Updated from #8e2de2
  const neonGlow2 = "#2cb67d";     // Updated from #4a00e0
  const glowingInputStyle = {
    padding: isMobile ? "12px" : "10px",
    borderRadius: "12px",
    border: `1.5px solid ${neonGlow}`,
    marginBottom: "18px",
    background: "black",
    color: "white",
    boxShadow: `0 0 12px ${neonGlow}`,
    width: "100%",
    maxWidth: isMobile ? "100%" : "340px",
    fontSize: isMobile ? "1rem" : "1.06rem",
    transition: "box-shadow 0.3s, border-color 0.3s",
    textShadow: `0 0 5px ${neonGlow2}` // subtle text glow for updated highlight
  };
  const glowingButtonStyle = {
    background: `linear-gradient(135deg, ${neonGlow}, ${neonGlow2})`,
    color: "white",
    padding: isMobile ? "13px 0" : "11px 28px",
    border: "none",
    borderRadius: "13px",
    boxShadow: `0 0 18px ${neonGlow2}`,
    cursor: "pointer",
    fontWeight: 600,
    marginBottom: isMobile ? "18px" : "15px",
    width: isMobile ? "100%" : "auto",
    fontSize: isMobile ? "1.08rem" : "1.07rem",
    transition: "box-shadow 0.3s, background 0.3s",
    textShadow: `0 0 7px ${neonGlow}` // subtle glow for contrast
  };
  const glowingCardStyle = {
    background: "rgba(28,27,47,0.96)", // updated for better contrast
    borderRadius: "18px",
    boxShadow: `0 0 22px ${neonGlow}`,
    border: `1.5px solid ${neonGlow}`,
    padding: isMobile ? "22px 12px" : "28px 36px",
    margin: isMobile ? "18px 0" : "32px 0",
    width: isMobile ? "100%" : "420px",
    maxWidth: "98vw",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "box-shadow 0.3s"
  };
  const glowingSummaryStyle = {
    ...glowingCardStyle,
    margin: isMobile ? "14px 0" : "24px 0",
    background: "rgba(28,27,47,0.98)", // matches updated card bg
    width: isMobile ? "100%" : "400px",
    border: `1.5px solid ${neonGlow2}`,
    boxShadow: `0 0 16px ${neonGlow2}`,
    alignItems: "flex-start"
  };
  const glowingLabel = {
    color: neonGlow,
    fontWeight: 500,
    marginBottom: "6px",
    marginTop: isMobile ? "2px" : "5px",
    fontSize: isMobile ? "1.03rem" : "1.05rem",
    letterSpacing: "0.01em",
    textShadow: `0 0 3px ${neonGlow2}`
  };
  const headerStyle = {
    width: "100vw",
    minHeight: isMobile ? "60px" : "80px",
    background: "rgba(14,14,14,0.99)", // updated for better contrast
    borderBottom: `2.5px solid ${neonGlow}`,
    boxShadow: `0 0 20px ${neonGlow}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: isMobile ? "0 15px" : "0 50px",
    position: "relative",
    zIndex: 10
  };
  const brandingStyle = {
    fontWeight: 900,
    fontSize: isMobile ? "1.2rem" : "1.55rem",
    color: neonGlow,
    letterSpacing: "0.04em",
    textShadow: `0 0 10px ${neonGlow2}, 0 0 2px ${neonGlow}`
  };
  const walletBoxStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px"
  };
  const contentWrapperStyle = {
    flex: 1,
    width: "100vw",
    minHeight: "0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0e0e0e 0%, #1c1b2f 100%)", // updated gradient
    padding: isMobile ? "15px 0" : "40px 0"
  };
  const bookingsSectionStyle = {
    ...glowingCardStyle,
    width: isMobile ? "100%" : "420px",
    padding: isMobile ? "15px 8px" : "20px 30px",
    margin: isMobile ? "14px 0" : "22px 0",
    maxHeight: showBookings ? "600px" : "0",
    overflow: "hidden",
    transition: "max-height 0.5s cubic-bezier(.5,1.5,.5,1), box-shadow 0.3s"
  };
  const bookingsHeaderStyle = {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    width: "100%",
    justifyContent: "space-between",
    color: neonGlow,
    fontWeight: 700,
    fontSize: isMobile ? "1.15rem" : "1.22rem",
    marginBottom: "6px",
    textShadow: `0 0 5px ${neonGlow2}`
  };
  const bookingItemStyle = {
    background: "rgba(44, 182, 125, 0.10)", // subtle green glow bg
    borderRadius: "10px",
    marginBottom: "8px",
    padding: "6px 12px",
    boxShadow: `0 0 6px ${neonGlow2}`,
    color: "white",
    border: `1px solid ${neonGlow2}`,
    fontSize: isMobile ? "0.9rem" : "0.95rem"
  };
  const toastStyle = {
    position: "fixed",
    left: "50%",
    bottom: isMobile ? "32px" : "44px",
    transform: "translateX(-50%)",
    minWidth: isMobile ? "80vw" : "340px",
    maxWidth: "90vw",
    background: toastType === "success"
      ? "linear-gradient(90deg,#0f0c29,#2cb67d 80%)"
      : "linear-gradient(90deg,#0f0c29,#ff6b6b 80%)",
    color: "white",
    borderRadius: "16px",
    boxShadow: `0 0 22px ${toastType === "success" ? "#2cb67d" : "#ff6b6b"}`,
    padding: "15px 30px",
    fontWeight: 600,
    fontSize: isMobile ? "1.02rem" : "1.1rem",
    zIndex: 999,
    opacity: showToast ? 1 : 0,
    pointerEvents: "none",
    transition: "opacity 0.4s",
    textShadow: `0 0 8px ${toastType === "success" ? neonGlow2 : "#ff6b6b"}`
  };

  // Cancel Booking Function (keeps history)
  const cancelBooking = (index) => {
    if (window.confirm("Are you sure you want to cancel this ticket?")) {
      const updatedBookings = [...myBookings];
      updatedBookings[index] = {
        ...updatedBookings[index],
        cancelled: true
      };
      setMyBookings(updatedBookings);
      setToastType("success");
      setToastMsg("✅ Ticket marked as cancelled.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      minWidth: "100vw",
      background:
        travelData.mode === "Flight"
          ? "url('/sky-bg.jpg') center/cover no-repeat"
          : travelData.mode === "Train"
          ? "url('/train-bg.jpg') center/cover no-repeat"
          : travelData.mode === "Bus"
          ? "url('/bus-bg.jpg') center/cover no-repeat"
          : "linear-gradient(135deg, #0e0e0e 0%, #1c1b2f 100%)",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={brandingStyle}>🚀 BlockChain Travel</div>
        <div style={walletBoxStyle}>
          <button style={glowingButtonStyle} onClick={connectWallet}>
            {account ? `Wallet: ${account.slice(0, 6)}...` : "Connect Wallet"}
          </button>
          {balance && (
            <span style={{
              fontSize: "0.89rem",
              color: "#fff",
              opacity: 0.85,
              marginTop: "-8px",
              textShadow: `0 0 5px ${neonGlow2}, 0 0 2px ${neonGlow}`
            }}>
              Balance: {balance} ETH
            </span>
          )}
        </div>
      </header>
      {/* Main Content */}
      <main style={contentWrapperStyle}>
        {/* Typewriter intro for not-logged-in users */}
        {!isLoggedIn && (
          <div style={{
            marginBottom: "24px",
            color: neonGlow2,
            fontFamily: "monospace",
            fontSize: isMobile ? "1rem" : "1.2rem",
            textAlign: "center",
            whiteSpace: "pre-wrap",
            minHeight: "40px",
            textShadow: `0 0 6px ${neonGlow}`
          }}>
            {typewriterText}
          </div>
        )}
        <>
        {!isLoggedIn ? (
          <section style={glowingCardStyle}>
            <h2 style={{
              marginBottom: "18px",
              color: neonGlow2,
              fontWeight: 800,
              fontSize: isMobile ? "1.25rem" : "1.35rem",
              letterSpacing: "0.02em",
              textShadow: `0 0 6px ${neonGlow}`
            }}>Login / Signup</h2>
            <label style={glowingLabel}>Name</label>
            <input
              style={glowingInputStyle}
              type="text"
              placeholder="Your Name"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
            />
            <label style={glowingLabel}>Phone Number</label>
            <input
              style={glowingInputStyle}
              type="text"
              placeholder="Phone Number"
              value={userData.phone}
              onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
            />
            <label style={glowingLabel}>Email</label>
            <input
              style={glowingInputStyle}
              type="email"
              placeholder="Email"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            />
            <button style={glowingButtonStyle} onClick={handleLogin}>Login</button>
          </section>
        ) : (
          <section style={{ ...glowingCardStyle, width: isMobile ? "100%" : "98vw", maxWidth: "1200px", alignItems: "stretch" }}>
            <h2 style={{
              marginBottom: "18px",
              color: neonGlow2,
              fontWeight: 800,
              fontSize: isMobile ? "1.22rem" : "1.32rem",
              letterSpacing: "0.01em",
              textShadow: `0 0 6px ${neonGlow}`,
              width: "100%"
            }}>Travel Booking</h2>
            <div
              className="form-grid"
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
                width: "100%",
                maxWidth: "100%",
                margin: "auto"
              }}
            >
              <div className="form-group" style={{ flex: "1 1 45%", minWidth: isMobile ? "100%" : "340px" }}>
                <label style={glowingLabel}>Mode of Travel</label>
                <select
                  style={glowingInputStyle}
                  value={travelData.mode}
                  onChange={(e) => updateTravelData("mode", e.target.value)}
                >
                  <option value="">Select Mode of Travel</option>
                  <option value="Bus">Bus</option>
                  <option value="Train">Train</option>
                  <option value="Flight">Flight</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: "1 1 45%", minWidth: isMobile ? "100%" : "340px" }}>
                <label style={glowingLabel}>Travel Date</label>
                <input
                  style={glowingInputStyle}
                  type="date"
                  value={travelData.date}
                  onChange={(e) => updateTravelData("date", e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: "1 1 45%", minWidth: isMobile ? "100%" : "340px" }}>
                <label style={glowingLabel}>From (Departure)</label>
                <input
                  style={glowingInputStyle}
                  type="text"
                  placeholder="From"
                  value={travelData.from}
                  onChange={(e) => updateTravelData("from", e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: "1 1 45%", minWidth: isMobile ? "100%" : "340px" }}>
                <label style={glowingLabel}>To (Arrival)</label>
                <input
                  style={glowingInputStyle}
                  type="text"
                  placeholder="To"
                  value={travelData.to}
                  onChange={(e) => updateTravelData("to", e.target.value)}
                />
              </div>
              {(travelData.from && travelData.to && getCoordinates(travelData.from) && getCoordinates(travelData.to)) && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    gap: "1rem",
                    marginTop: "20px"
                  }}
                >
                  {/* Distance on the left */}
                  <div
                    style={{
                      color: "#00ffff",
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      textShadow: `0 0 4px ${neonGlow}`,
                      alignSelf: "flex-start"
                    }}
                  >
                    Distance:<br />
                    {travelData.distance} km
                  </div>
                  {/* Map in the center */}
                  <div
                    style={{
                      height: isMobile ? "250px" : "320px",
                      width: isMobile ? "100%" : "340px",
                      borderRadius: "15px",
                      overflow: "hidden",
                      boxShadow: `0 0 12px ${neonGlow}`
                    }}
                  >
                    <MapContainer
                      center={getCoordinates(travelData.from)}
                      zoom={5}
                      scrollWheelZoom={false}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                      />
                      <Marker position={getCoordinates(travelData.from)}>
                        <Popup>Departure: {travelData.from}</Popup>
                      </Marker>
                      <Marker position={getCoordinates(travelData.to)}>
                        <Popup>Arrival: {travelData.to}</Popup>
                      </Marker>
                      <Polyline
                        positions={[getCoordinates(travelData.from), getCoordinates(travelData.to)]}
                        pathOptions={{ color: neonGlow2, weight: 5, opacity: 0.8, dashArray: "8, 12" }}
                      />
                      {emojiLatLng && (
                        <Marker
                          position={emojiLatLng}
                          icon={L.divIcon({
                            className: 'emoji-icon',
                            html: travelData.mode === "Flight" ? "✈️" : travelData.mode === "Train" ? "🚆" : "🚌",
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                          })}
                        />
                      )}
                    </MapContainer>
                  </div>
                  {/* Price on the right */}
                  {/* Price section removed as per instructions */}
                </div>
              )}
            </div>
            {/* Search Button and Found UI */}
            {!showSummary && !selectedSeat && (
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button
                  style={glowingButtonStyle}
                  onClick={() => setShowSummary(true)}
                >
                  {`Search ${travelData.mode}`}
                </button>
                {showSummary && (
                  <div style={{ marginTop: "16px", textAlign: "center", color: neonGlow2 }}>
                    <h3>{travelData.mode} Found ✅</h3>
                    <button
                      style={{ ...glowingButtonStyle, marginTop: "10px" }}
                      onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
                    >
                      Select Seat
                    </button>
                  </div>
                )}
              </div>
            )}
            <div style={{ width: "100%", marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <button style={glowingButtonStyle} onClick={() => setShowSummary(!showSummary)}>
                {showSummary ? "Hide Ticket Summary" : "Show Ticket Summary"}
              </button>
            </div>
            {showSummary && travelData.mode && travelData.date && travelData.from && travelData.to && (
              <div style={{ margin: "24px 0", width: "100%", textAlign: "center" }}>
                {/* Travel Options Cards */}
                {(() => {
                  // Determine travelOptions based on modeOfTransport
                  let travelOptions = [];
                  if (travelData.mode === "Flight") {
                    travelOptions = flightOptions;
                  } else if (travelData.mode === "Train") {
                    travelOptions = trainOptions;
                  } else if (travelData.mode === "Bus") {
                    travelOptions = busOptions;
                  }
                  return travelOptions.map((opt) => (
                    <div
                      key={opt.id}
                      style={{
                        position: "relative",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "18px 24px",
                        borderRadius: "16px",
                        boxShadow: `0 0 16px ${neonGlow2}`,
                        background: selectedOption?.id === opt.id ? "#181828" : "#10101a",
                        color: "#fff",
                        width: isMobile ? "100%" : "700px",
                        margin: "16px auto",
                        cursor: "pointer",
                        border: selectedOption?.id === opt.id ? `2px solid ${neonGlow}` : "none"
                      }}
                      onClick={() => setSelectedOption(opt)}
                    >
                      {/* Banner for selected seat */}
                      {selectedSeat && selectedOption?.id === opt.id && (
                        <div style={{
                          position: "absolute",
                          top: "-12px",
                          left: "16px",
                          background: "#2cb67d",
                          color: "#000",
                          padding: "4px 12px",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                          boxShadow: "0 0 8px #2cb67d"
                        }}>
                          ✅ Seat Selected
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: neonGlow }}>
                          {travelData.mode === "Flight"
                            ? `✈️ ${opt.flight} — ${travelData.mode}`
                            : travelData.mode === "Train"
                            ? `🚆 ${opt.train} — ${travelData.mode}`
                            : travelData.mode === "Bus"
                            ? `🚌 ${opt.bus} — ${travelData.mode}`
                            : ""}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{opt.depart}</div>
                            <div style={{ fontSize: "0.9rem", color: "#aaa" }}>{travelData.from}{travelData.mode === "Flight" ? ", T1" : ""}</div>
                          </div>
                          <div style={{ textAlign: "center", margin: "0 12px" }}>
                            <div style={{ fontSize: "1rem" }}>{opt.duration}</div>
                            <div style={{ fontSize: "0.8rem", color: "#8f8f8f" }}>Non-stop</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{opt.arrive}</div>
                            <div style={{ fontSize: "0.9rem", color: "#aaa" }}>{travelData.to}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "#2cb67d" }}>
                          + Earn 684 Web3 Reward Points
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 600, fontSize: "1.2rem", color: "#ffd700" }}>
                          Ξ {opt.priceInEth}
                        </div>
                        <button
                          style={{ ...glowingButtonStyle, marginTop: "8px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPopup(true);
                          }}
                        >
                          Select Seat
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
            {/* Popup Modal for Seat Selection */}
            {showPopup && (
              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(6px)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                animation: "fadeIn 0.4s ease"
              }}>
                <div style={{
                  backgroundColor: "#1e1e2f",
                  padding: "24px",
                  borderRadius: "16px",
                  boxShadow: `0 0 24px ${neonGlow2}`,
                  maxHeight: "90vh",
                  overflowY: "auto",
                  animation: "popupSlide 0.4s ease"
                }}>
                  <h3 style={{ color: neonGlow2, marginBottom: "12px", textShadow: `0 0 6px ${neonGlow}` }}>
                    🎟️ Select Your Seat ({travelData.mode})
                  </h3>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: travelData.mode === "Bus" ? "repeat(4, 1fr)" : "repeat(6, 1fr)",
                    gap: "8px",
                    justifyItems: "center",
                    maxWidth: "340px",
                    margin: "0 auto"
                  }}>
                    {travelData.mode === "Flight" || travelData.mode === "Train"
                      ? Array.from({ length: 26 }, (_, rowIdx) => {
                          let rowLabel;
                          rowLabel = String.fromCharCode(65 + rowIdx); // A to Z only
                          const columns = 6;
                          return Array.from({ length: columns }, (_, colIdx) => {
                            const seat = `${rowLabel}${colIdx + 1}`;
                            const isTaken = takenSeats.includes(seat);
                            const isSelected = selectedSeat === seat;
                            return (
                              <div
                                key={seat}
                                onClick={() => !isTaken && setSelectedSeat(seat)}
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  fontSize: "0.75rem",
                                  lineHeight: "28px",
                                  borderRadius: "5px",
                                  backgroundColor: isTaken ? "#666" : isSelected ? "#2cb67d" : "#fff",
                                  color: isTaken ? "#ccc" : "#000",
                                  cursor: isTaken ? "not-allowed" : "pointer",
                                  boxShadow: isSelected ? `0 0 8px ${neonGlow2}` : "none",
                                  userSelect: "none",
                                  textAlign: "center"
                                }}
                              >
                                {seat}
                              </div>
                            );
                          });
                        }).flat()
                      : travelData.mode === "Bus"
                      ? Array.from({ length: 26 }, (_, rowIdx) => {
                          const rowLabel = String.fromCharCode(65 + rowIdx);
                          return Array.from({ length: 4 }, (_, colIdx) => {
                            const seat = `${rowLabel}${colIdx + 1}`;
                            const isTaken = takenSeats.includes(seat);
                            const isSelected = selectedSeat === seat;
                            return (
                              <div
                                key={seat}
                                onClick={() => !isTaken && setSelectedSeat(seat)}
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  fontSize: "0.75rem",
                                  lineHeight: "28px",
                                  borderRadius: "5px",
                                  backgroundColor: isTaken ? "#666" : isSelected ? "#2cb67d" : "#fff",
                                  color: isTaken ? "#ccc" : "#000",
                                  cursor: isTaken ? "not-allowed" : "pointer",
                                  boxShadow: isSelected ? `0 0 8px ${neonGlow2}` : "none",
                                  userSelect: "none",
                                  textAlign: "center"
                                }}
                              >
                                {seat}
                              </div>
                            );
                          });
                        }).flat()
                      : Array.from({ length: 90 }, (_, i) => {
                          const seat = `S-${i + 1}`;
                          const isTaken = takenSeats.includes(seat);
                          const isSelected = selectedSeat === seat;
                          return (
                            <div
                              key={seat}
                              onClick={() => !isTaken && setSelectedSeat(seat)}
                              style={{
                                width: "28px",
                                height: "28px",
                                fontSize: "0.8rem",
                                lineHeight: "28px",
                                borderRadius: "5px",
                                backgroundColor: isTaken ? "#666" : isSelected ? "#2cb67d" : "#fff",
                                color: isTaken ? "#ccc" : "#000",
                                cursor: isTaken ? "not-allowed" : "pointer",
                                boxShadow: isSelected ? `0 0 8px ${neonGlow2}` : "none",
                                userSelect: "none",
                                textAlign: "center"
                              }}
                            >
                              {i + 1}
                            </div>
                          );
                        })}
                  </div>
                  {selectedSeat && (
                    <p style={{ marginTop: "10px", color: neonGlow2, textShadow: `0 0 5px ${neonGlow}` }}>
                      Seat <strong>{selectedSeat}</strong> Selected ✅
                    </p>
                  )}
                  <button
                    style={{ ...glowingButtonStyle, marginTop: "16px" }}
                    onClick={() => setShowPopup(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            {showSummary && (
              <div style={{ ...glowingSummaryStyle, alignItems: "center" }}>
                <h3 style={{
                  color: neonGlow2,
                  fontWeight: 700,
                  marginBottom: "12px",
                  textShadow: `0 0 6px ${neonGlow}`
                }}>🎫 Ticket Summary</h3>
                <p style={{ color: "#fdfdfd", fontSize: "1.03rem", margin: "6px 0", textShadow: `0 0 4px ${neonGlow2}` }}>
                  <strong style={{ color: neonGlow }}>Name:</strong> {userData.name}
                </p>
                <p style={{ color: "#fdfdfd", fontSize: "1.03rem", margin: "6px 0", textShadow: `0 0 4px ${neonGlow2}` }}>
                  <strong style={{ color: neonGlow }}>Email:</strong> {userData.email}
                </p>
                <p style={{ color: "#fdfdfd", fontSize: "1.03rem", margin: "6px 0", textShadow: `0 0 4px ${neonGlow2}` }}>
                  <strong style={{ color: neonGlow }}>Phone:</strong> {userData.phone}
                </p>
                <p style={{ color: "#fdfdfd", fontSize: "1.03rem", margin: "6px 0", textShadow: `0 0 4px ${neonGlow2}` }}>
                  <strong style={{ color: neonGlow }}>Mode:</strong> {travelData.mode}
                </p>
                <p style={{ color: "#fdfdfd", fontSize: "1.03rem", margin: "6px 0", textShadow: `0 0 4px ${neonGlow2}` }}>
                  <strong style={{ color: neonGlow }}>Date:</strong> {travelData.date}
                </p>
                <p style={{ color: "#fdfdfd", fontSize: "1.03rem", margin: "6px 0", textShadow: `0 0 4px ${neonGlow2}` }}>
                  <strong style={{ color: neonGlow }}>From:</strong> {travelData.from}
                </p>
                <p style={{ color: "#fdfdfd", fontSize: "1.03rem", margin: "6px 0", textShadow: `0 0 4px ${neonGlow2}` }}>
                  <strong style={{ color: neonGlow }}>To:</strong> {travelData.to}
                </p>
                <p style={{ color: "#fdfdfd", fontSize: "1.03rem", margin: "6px 0", textShadow: `0 0 4px ${neonGlow2}` }}>
                  <strong style={{ color: neonGlow }}>Distance:</strong> {travelData.distance} km
                </p>
                <p style={{ color: "#fdfdfd", fontSize: "1.03rem", margin: "6px 0", textShadow: `0 0 6px ${neonGlow}` }}>
                  <strong style={{ color: neonGlow2 }}>Seat No:</strong> {myBookings[myBookings.length - 1]?.seatNumber || "Assigned after mint"}
                </p>
                <p style={{ color: "#fdfdfd", fontSize: "1.03rem", margin: "6px 0", textShadow: "0 0 6px #9a79ff" }}>
                  <strong style={{ color: "#9a79ff" }}>Estimated Price:</strong> {selectedOption?.priceInEth} ETH
                </p>
              </div>
            )}
            {/* Mint Ticket Button moved below travel options rendering */}
            <div style={{ width: "100%", marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <button style={glowingButtonStyle} onClick={mint}>Mint Ticket</button>
            </div>
            {qrData && (
              <>
                <div id="ticketPreview" style={{
                  marginTop: isMobile ? "16px" : "22px",
                  ...glowingSummaryStyle,
                  alignItems: "center",
                  width: isMobile ? "100%" : "340px"
                }}>
                  <h3 style={{
                    color: neonGlow2,
                    fontWeight: 700,
                    marginBottom: "14px",
                    textShadow: `0 0 6px ${neonGlow}`
                  }}>🎫 Your Ticket QR Code</h3>
                  <QRCodeSVG value={qrData} size={isMobile ? 160 : 280} level="H" includeMargin={true} />
                  <div style={{
                    marginTop: "10px",
                    textAlign: "center",
                    color: "#ccc",
                    fontSize: "0.95rem",
                    lineHeight: "1.6"
                  }}>
                    {["name", "date", "from", "to", "seat"].map((key) => (
                      <div key={key}>
                        <strong style={{ color: neonGlow }}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}:
                        </strong> {JSON.parse(qrData)[key]}
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={downloadTicketPDF} style={glowingButtonStyle}>
                  📥 Download Ticket PDF
                </button>
              </>
            )}
            {/* Collapsible Bookings */}
            <div style={{ width: "100%", marginTop: isMobile ? "24px" : "32px" }}>
              <div style={bookingsHeaderStyle} onClick={() => setShowBookings(!showBookings)}>
                <span>📋 My Bookings</span>
                <span style={{
                  transition: "transform 0.3s",
                  transform: showBookings ? "rotate(90deg)" : "rotate(0deg)",
                  fontSize: "1.3em"
                }}>▶</span>
              </div>
              <div style={{
                ...bookingsSectionStyle,
                maxHeight: showBookings ? (myBookings.length ? "600px" : "80px") : "0",
                boxShadow: showBookings ? `0 0 20px ${neonGlow2}` : "none",
                marginTop: showBookings ? "8px" : "0"
              }}>
                {showBookings && (
                  myBookings.length === 0 ? (
                    <div style={{ color: "#bbb", textAlign: "center", width: "100%" }}>No bookings yet.</div>
                  ) : (
                    <div style={{
                      width: "100%",
                      padding: "10px 0",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center"
                    }}>
                      {myBookings.map((booking, idx) => (
                        <div key={idx} style={{
                          background: "#1c1c2b",
                          border: `1.5px solid ${neonGlow2}`,
                          borderRadius: "16px",
                          padding: "14px",
                          marginBottom: "14px",
                          width: "100%",
                          boxShadow: `0 0 12px ${neonGlow}`,
                          display: "flex",
                          flexDirection: isMobile ? "column" : "row",
                          alignItems: isMobile ? "center" : "flex-start",
                          gap: "1rem",
                          color: "#fff",
                          fontFamily: "monospace"
                        }}>
                          {/* Only show QR code and download if not cancelled */}
                          {!booking.cancelled && (
                            <div>
                              <QRCodeSVG value={JSON.stringify({
                                name: userData.name,
                                date: booking.date,
                                from: booking.from,
                                to: booking.to,
                                seat: booking.seatNumber
                              })} size={isMobile ? 90 : 110} level="H" />
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div><strong style={{ color: neonGlow2 }}>Date:</strong> {booking.date}</div>
                            <div><strong style={{ color: neonGlow2 }}>Route:</strong> {booking.from} ➡ {booking.to}</div>
                            <div><strong style={{ color: neonGlow2 }}>Mode:</strong> {booking.mode}</div>
                            <div><strong style={{ color: neonGlow2 }}>Distance:</strong> {booking.distance} km</div>
                            <div><strong style={{ color: neonGlow2 }}>Price:</strong> {booking.price} ETH</div>
                            <div><strong style={{ color: neonGlow2 }}>Seat:</strong> {booking.seatNumber}</div>
                            <div style={{
                              fontSize: "0.85em",
                              color: "#ccc",
                              marginTop: "6px",
                              wordBreak: "break-all"
                            }}>
                              <strong style={{ color: neonGlow }}>Token URI:</strong><br />{booking.uri}
                            </div>
                            {/* Cancelled badge */}
                            {booking.cancelled && (
                              <div style={{
                                background: "#ff4b4b",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontWeight: "bold",
                                marginTop: "6px",
                                display: "inline-block",
                                boxShadow: "0 0 8px #ff4b4b"
                              }}>
                                ❌ Cancelled
                              </div>
                            )}
                            {/* Cancel button if not cancelled */}
                            {!booking.cancelled && (
                              <button
                                style={{
                                  background: "linear-gradient(135deg, #ff4b4b, #ff0000)",
                                  border: "none",
                                  padding: "8px 14px",
                                  borderRadius: "8px",
                                  color: "white",
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                  marginTop: "8px",
                                  boxShadow: "0 0 10px #ff4b4b"
                                }}
                                onClick={() => cancelBooking(idx)}
                              >
                                ❌ Cancel Ticket
                              </button>
                            )}
                            {/* Download button if not cancelled */}
                            {!booking.cancelled && (
                              <button
                                style={{
                                  ...glowingButtonStyle,
                                  marginTop: "8px"
                                }}
                                onClick={async () => {
                                  // Download this ticket as PDF
                                  const ticketDiv = document.createElement('div');
                                  ticketDiv.style.background = "#1c1c2b";
                                  ticketDiv.style.padding = "24px";
                                  ticketDiv.style.color = "#fff";
                                  ticketDiv.style.borderRadius = "12px";
                                  ticketDiv.style.width = "320px";
                                  ticketDiv.style.textAlign = "center";
                                  ticketDiv.innerHTML = `
                                    <h3 style="color:${neonGlow2};font-weight:bold;margin-bottom:12px;">🎫 Ticket</h3>
                                    <div id="qr"></div>
                                    <div style="margin-top:10px;text-align:center;color:#ccc;font-size:0.95rem;line-height:1.6;">
                                      <div><strong style="color:${neonGlow}">Name:</strong> ${userData.name}</div>
                                      <div><strong style="color:${neonGlow}">Date:</strong> ${booking.date}</div>
                                      <div><strong style="color:${neonGlow}">From:</strong> ${booking.from}</div>
                                      <div><strong style="color:${neonGlow}">To:</strong> ${booking.to}</div>
                                      <div><strong style="color:${neonGlow2}">Seat:</strong> ${booking.seatNumber}</div>
                                    </div>
                                  `;
                                  document.body.appendChild(ticketDiv);
                                  // Render QR code
                                  const qrDiv = ticketDiv.querySelector("#qr");
                                  const temp = document.createElement("div");
                                  qrDiv.appendChild(temp);
                                  import("react-dom").then(ReactDOM => {
                                    ReactDOM.render(
                                      <QRCodeSVG value={JSON.stringify({
                                        name: userData.name,
                                        date: booking.date,
                                        from: booking.from,
                                        to: booking.to,
                                        seat: booking.seatNumber
                                      })} size={120} level="H" />,
                                      temp
                                    );
                                    setTimeout(async () => {
                                      const canvas = await html2canvas(ticketDiv);
                                      const imgData = canvas.toDataURL("image/png");
                                      const pdf = new jsPDF();
                                      const width = pdf.internal.pageSize.getWidth();
                                      const height = (canvas.height * width) / canvas.width;
                                      pdf.addImage(imgData, "PNG", 0, 0, width, height);
                                      pdf.save("ticket.pdf");
                                      document.body.removeChild(ticketDiv);
                                    }, 500);
                                  });
                                }}
                              >
                                📥 Download Ticket PDF
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        )}
        {/* Toast */}
        <div style={toastStyle}>{toastMsg}</div>
        {isLoading && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.9)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            color: neonGlow2,
            fontSize: "1.4rem",
            fontWeight: 700,
            textShadow: `0 0 8px ${neonGlow}`
          }}>
            <div style={{ marginBottom: "20px" }}>⏳ Booking your ticket...</div>
            <div className="loader"></div>
          </div>
        )}
        </>
        {/* Popup and fadeIn/popupSlide keyframes */}
        <style>
        {`
        @keyframes popupSlide {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        `}
        </style>
      </main>
    </div>
  );
}

export default App;