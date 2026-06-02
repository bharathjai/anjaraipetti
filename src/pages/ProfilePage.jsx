import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, GOOGLE_CLIENT_ID } from "../config/runtime";

function SpiceParticles() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: `${(i * 27) % 95}%`,
    top: `${(i * 31) % 95}%`,
    size: 4 + (i % 3) * 2,
    duration: 8 + (i % 4) * 3,
    delay: i * 0.5
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber/10 blur-[0.5px]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, p.id % 2 === 0 ? 8 : -8, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateProfile, loginWithGoogle, loading: authLoading } = useAuth();
  const location = useLocation();

  // Scroll to address book if requested in state or hash
  useEffect(() => {
    if (user && (location.hash === "#addresses" || location.state?.scroll_to_addresses)) {
      setTimeout(() => {
        const el = document.getElementById("address-book");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }
  }, [user, location]);

  // Personal Info Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Address List state
  const [addresses, setAddresses] = useState([]);
  
  // New/Edit Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null); // null if adding new
  const [addressForm, setAddressForm] = useState({
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false
  });

  // Action status indicators
  const [savingProfile, setSavingProfile] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Initialize Google Sign-in button for guest profile view
  useEffect(() => {
    if (!user && typeof window !== "undefined" && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (response.credential) {
              const res = await loginWithGoogle(response.credential);
              if (res.success) {
                setSuccess("Logged in successfully!");
              } else {
                setError(res.error || "Failed to log in with Google.");
              }
            }
          }
        });
        const btnEl = document.getElementById("google-signin-btn-profile");
        if (btnEl) {
          window.google.accounts.id.renderButton(btnEl, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
            width: "250"
          });
        }
      } catch (err) {
        console.error("Google sign-in failed on Profile Page:", err);
      }
    }
  }, [user, GOOGLE_CLIENT_ID]);



  // Sync state with authenticated user profile
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddresses(user.addresses || []);
    }
  }, [user]);

  if (authLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-porcelain">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-truffle" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm font-bold text-truffle/70 uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <section className="relative min-h-[80vh] mx-auto w-full max-w-xl px-6 flex items-center justify-center">
        <SpiceParticles />
        <div className="w-full text-center bg-gradient-to-br from-almond/50 to-porcelain/90 rounded-3xl border border-amber/30 p-8 shadow-halo backdrop-blur-xl space-y-6 relative overflow-hidden group">
          {/* Accent Glow Element */}
          <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-amber/10 blur-2xl group-hover:bg-amber/15 transition-all duration-500" />
          
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber/10 text-3xl border border-amber/20 relative z-10">
            🔒
          </div>
          <div className="relative z-10">
            <h2 className="font-display text-3xl text-espresso font-semibold">Profile Authentication</h2>
            <p className="text-xs text-truffle/80 mt-2 leading-relaxed font-body">
              Please sign in using your Google account to access your personal profile details, save shipping addresses, and sync your orders.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 pt-2 relative z-10">
            {/* Premium Google Button Wrapper */}
            <div className="relative group/btn overflow-hidden rounded-full p-[2px] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_0_20px_rgba(208,132,62,0.3)] bg-gradient-to-r from-amber via-yellow-500 to-amber-700 w-[254px]">
              <div className="rounded-full bg-white p-0.5">
                <div id="google-signin-btn-profile" className="relative z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Personal Info Form Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setError("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await updateProfile({ name, phone, addresses });
      if (res.success) {
        setSuccess("Profile details updated successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.error || "Failed to update profile.");
      }
    } catch (err) {
      setError("An unexpected error occurred saving details.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Pincode lookup autocomplete
  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    setAddressForm(prev => ({ ...prev, pincode: pin }));

    if (pin.length === 6) {
      try {
        setPincodeLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/pincode/${pin}`);
        if (res.ok) {
          const payload = await res.json();
          if (payload.ok && payload.data?.[0]?.Status === "Success") {
            const postOffices = payload.data[0].PostOffice;
            if (postOffices && postOffices.length > 0) {
              const city = postOffices[0].District || postOffices[0].Taluk || "";
              const state = postOffices[0].State || "";
              setAddressForm(prev => ({
                ...prev,
                city,
                state
              }));
            }
          }
        }
      } catch (err) {
        console.error("Pincode lookup error:", err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // Add or edit address submit handler
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!addressForm.line1.trim() || !addressForm.city.trim() || !addressForm.state.trim()) {
      setError("Address line, City, and State are required.");
      return;
    }

    if (!/^\d{6}$/.test(addressForm.pincode)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    let updatedAddresses = [...addresses];
    
    // If setting default, unset others first
    if (addressForm.isDefault) {
      updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
    } else if (updatedAddresses.length === 0) {
      // Force first address to be default
      addressForm.isDefault = true;
    }

    if (editingAddressIndex !== null) {
      updatedAddresses[editingAddressIndex] = { ...addressForm };
    } else {
      updatedAddresses.push({ ...addressForm });
    }

    // Call update API
    try {
      setSavingProfile(true);
      const res = await updateProfile({ name, phone, addresses: updatedAddresses });
      if (res.success) {
        setAddresses(res.user.addresses);
        setShowAddressForm(false);
        setEditingAddressIndex(null);
        setSuccess(editingAddressIndex !== null ? "Address edited successfully!" : "New address added successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.error || "Failed to save address changes.");
      }
    } catch (err) {
      setError("Unable to save address details.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Delete Address handler
  const handleDeleteAddress = async (indexToDelete) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    setError("");
    setSuccess("");

    const wasDefault = addresses[indexToDelete].isDefault;
    let updatedAddresses = addresses.filter((_, idx) => idx !== indexToDelete);

    // If we deleted default, set the first remaining as default
    if (wasDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    try {
      setSavingProfile(true);
      const res = await updateProfile({ name, phone, addresses: updatedAddresses });
      if (res.success) {
        setAddresses(res.user.addresses);
        setSuccess("Address deleted successfully.");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.error || "Failed to delete address.");
      }
    } catch (err) {
      setError("Unable to delete address.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Make Address Default handler
  const handleMakeDefault = async (indexToDefault) => {
    setError("");
    setSuccess("");

    const updatedAddresses = addresses.map((addr, idx) => ({
      ...addr,
      isDefault: idx === indexToDefault
    }));

    try {
      setSavingProfile(true);
      const res = await updateProfile({ name, phone, addresses: updatedAddresses });
      if (res.success) {
        setAddresses(res.user.addresses);
        setSuccess("Default address updated!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.error || "Failed to update default address.");
      }
    } catch (err) {
      setError("Unable to update address preference.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Open Edit Form
  const openEditForm = (idx) => {
    setEditingAddressIndex(idx);
    setAddressForm({ ...addresses[idx] });
    setShowAddressForm(true);
  };

  // Open Add Form
  const openAddForm = () => {
    setEditingAddressIndex(null);
    setAddressForm({
      line1: "",
      line2: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false
    });
    setShowAddressForm(true);
  };

  return (
    <section className="relative min-h-screen mx-auto w-full max-w-5xl px-6 pb-24 pt-12 md:px-10">
      <SpiceParticles />

      <div className="border-b border-truffle/10 pb-6">
        <h1 className="font-display text-4xl text-espresso sm:text-5xl">My Profile</h1>
        <p className="text-sm text-truffle/70 mt-1">Manage saved shipping addresses and account configurations</p>
      </div>

      {/* Status Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-sm font-medium shadow-sm"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-medium shadow-sm"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {/* Personal Details Panel */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl flex flex-col items-center text-center">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-amber/40 shadow-md object-cover mb-4 shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-amber/20 border-4 border-amber/35 text-espresso font-bold text-3xl flex items-center justify-center mb-4 shrink-0">
                {user.name?.slice(0, 1).toUpperCase()}
              </div>
            )}
            <h2 className="font-display text-2xl text-espresso">{user.name}</h2>
            <p className="text-xs text-truffle/60 -mt-1">{user.email}</p>
          </div>

          <div className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl">
            <h3 className="font-display text-xl text-espresso mb-4">Edit Details</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-truffle/60 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-truffle/20 bg-white px-4 py-2.5 text-sm text-truffle focus:border-cocoa outline-none font-semibold"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-truffle/60 mb-1">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-truffle/50">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full rounded-xl border border-truffle/20 bg-white pl-11 pr-4 py-2.5 text-sm text-truffle focus:border-cocoa outline-none font-semibold"
                    placeholder="10-digit number"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full rounded-xl bg-truffle text-white hover:bg-espresso py-2.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 shadow-sm"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>
        </div>

        {/* Address Book Panel */}
        <div id="address-book" className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-truffle/10 pb-3 mb-6">
              <h3 className="font-display text-2xl text-espresso">Address Book</h3>
              {!showAddressForm && (
                <button
                  onClick={openAddForm}
                  className="rounded-full bg-truffle hover:bg-espresso text-porcelain text-[11px] font-bold uppercase tracking-wider px-4 py-2 transition shadow-sm"
                >
                  + Add Address
                </button>
              )}
            </div>

            {/* Address List */}
            {!showAddressForm && (
              <div className="space-y-4">
                {addresses.length > 0 ? (
                  addresses.map((addr, idx) => (
                    <motion.div
                      key={idx}
                      layoutId={`addr-${idx}`}
                      className={`relative p-5 rounded-2xl border transition-all duration-200 ${
                        addr.isDefault
                          ? "bg-amber/5 border-amber/35 shadow-sm"
                          : "bg-white/60 border-truffle/10 hover:border-truffle/25"
                      }`}
                    >
                      <div className="pr-12">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-bold text-sm text-truffle">Address {idx + 1}</span>
                          {addr.isDefault && (
                            <span className="bg-amber text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-truffle leading-relaxed font-semibold">
                          {addr.line1}
                          {addr.line2 && `, ${addr.line2}`}
                        </p>
                        {addr.landmark && (
                          <p className="text-[11px] text-truffle/60 italic mt-0.5">Landmark: {addr.landmark}</p>
                        )}
                        <p className="text-xs text-truffle/85 font-semibold mt-1">
                          {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
                        </p>
                      </div>

                      {/* Address Actions Dropdown/Panel */}
                      <div className="absolute right-4 top-4 flex items-center gap-2">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleMakeDefault(idx)}
                            title="Set as default address"
                            className="text-[10px] font-bold text-amber hover:underline transition"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => openEditForm(idx)}
                          className="p-1.5 rounded-full hover:bg-truffle/5 text-truffle/60 hover:text-cocoa transition"
                          title="Edit"
                        >
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(idx)}
                          className="p-1.5 rounded-full hover:bg-rose-50 text-truffle/60 hover:text-rose-600 transition"
                          title="Delete"
                        >
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center p-8 bg-porcelain/30 border border-dashed border-truffle/20 rounded-2xl text-truffle/50 text-xs font-semibold">
                    No shipping addresses saved yet. Click "+ Add Address" above to get started.
                  </div>
                )}
              </div>
            )}

            {/* Address Add/Edit Form */}
            {showAddressForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddressSubmit}
                className="space-y-4 bg-porcelain/35 border border-truffle/10 p-5 rounded-2xl"
              >
                <div className="flex items-center justify-between border-b border-truffle/5 pb-2 mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cocoa">
                    {editingAddressIndex !== null ? "Edit Address Details" : "Add New Shipping Address"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="text-xs text-truffle/50 hover:text-truffle transition"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-truffle/60 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, line1: e.target.value }))}
                    className="w-full rounded-xl border border-truffle/20 bg-white px-4 py-2 text-sm text-truffle outline-none focus:border-cocoa font-semibold"
                    placeholder="Door No., Street name, Area"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-truffle/60 mb-1">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={addressForm.line2}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, line2: e.target.value }))}
                      className="w-full rounded-xl border border-truffle/20 bg-white px-4 py-2 text-sm text-truffle outline-none focus:border-cocoa font-semibold"
                      placeholder="Apartment, Suite, Unit"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-truffle/60 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={addressForm.landmark}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                      className="w-full rounded-xl border border-truffle/20 bg-white px-4 py-2 text-sm text-truffle outline-none focus:border-cocoa font-semibold"
                      placeholder="Near spice market, school"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-truffle/60 mb-1">Pincode</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={addressForm.pincode}
                        onChange={handlePincodeChange}
                        className="w-full rounded-xl border border-truffle/20 bg-white px-4 py-2 text-sm text-truffle outline-none focus:border-cocoa font-semibold"
                        placeholder="6-digit pincode"
                      />
                      {pincodeLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="animate-spin h-3.5 w-3.5 text-truffle" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-truffle/60 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full rounded-xl border border-truffle/20 bg-white px-4 py-2 text-sm text-truffle outline-none focus:border-cocoa font-semibold"
                      placeholder="City/District"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-truffle/60 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={addressForm.state}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full rounded-xl border border-truffle/20 bg-white px-4 py-2 text-sm text-truffle outline-none focus:border-cocoa font-semibold"
                      placeholder="State"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="h-4 w-4 rounded border-truffle/20 text-cocoa focus:ring-cocoa"
                  />
                  <label htmlFor="isDefault" className="text-xs font-bold text-truffle/75 select-none cursor-pointer">
                    Set this as my default shipping address
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full rounded-xl bg-truffle text-white hover:bg-espresso py-2.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 shadow"
                >
                  {savingProfile ? "Saving Address..." : editingAddressIndex !== null ? "Save Changes" : "Add Address"}
                </button>
              </motion.form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
