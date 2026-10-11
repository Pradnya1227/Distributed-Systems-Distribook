import React, { useReducer, useState, useMemo, useEffect, useRef } from "react";
import {
  LayoutDashboard, Search, CalendarCheck, Inbox, Building2, Settings, LogOut,
  Boxes, CalendarClock, Ban, ClipboardList, Server, Share2, Layers, Zap,
  ScrollText, CheckCircle2, XCircle, AlertTriangle, ChevronRight, ChevronLeft,
  Plus, Minus, Users, MapPin, Wifi, Monitor, Snowflake, Bell, Check
} from "lucide-react";

/* =========================================================================
   COLOR TOKENS — light, academic, green/blue duotone (no gradients/glass)
   ========================================================================= */
const C = {
  bg: "#F5F9F7",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF5F1",
  border: "#DCE7E1",
  borderSoft: "#E7EFEA",
  ink: "#1E2A26",
  inkSoft: "#5C6D67",
  inkFaint: "#8B9C95",
  green50: "#E7F4EC", green100: "#D2EADA", green300: "#8FCBA8",
  green500: "#3C8F63", green600: "#2E7150", green900: "#163524",
  blue50: "#E8F2F8", blue100: "#D1E5F1", blue300: "#8FBEDA",
  blue500: "#2F76A3", blue600: "#255E82", blue900: "#173347",
  amber100: "#F8E8CE", amber600: "#A8721E",
  red100: "#F8DEDA", red600: "#AE3E30",
  gray100: "#EEF0EF", gray600: "#6B7570",
};
const FONT = "'Segoe UI', Inter, system-ui, -apple-system, sans-serif";

/* =========================================================================
   MOCK DATA LAYER  (data/*.ts equivalents)
   ========================================================================= */
const USERS = {
  "pradnya.wakode23@pccoepune.org": { name: "Pradnya Wakode", role: "student", email: "pradnya.wakode23@pccoepune.org" },
  "shreeya.patil23@pccoepune.org": { name: "Shreeya Patil", role: "student", email: "shreeya.patil23@pccoepune.org" },
  "faculty@pccoepune.org": { name: "Faculty Member", role: "faculty", email: "faculty@pccoepune.org" },
  "coordinator@pccoepune.org": { name: "Hall Coordinator", role: "coordinator", email: "coordinator@pccoepune.org" },
  "labassistant@pccoepune.org": { name: "Lab Assistant", role: "labassistant", email: "labassistant@pccoepune.org" },
  "admin@pccoepune.org": { name: "System Admin", role: "admin", email: "admin@pccoepune.org" },
};

function downloadBookingConfirmation(booking, resource) {
  if (!booking) return;
  
  if (!window.jspdf) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      generatePDF(booking, resource);
    };
    document.head.appendChild(script);
  } else {
    generatePDF(booking, resource);
  }
}

function generatePDF(booking, resource) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("DistriBook Booking Confirmation", 14, 20);
  
  doc.setLineWidth(0.5);
  doc.line(14, 25, 196, 25);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  
  const fields = [
    ["Booking ID", booking.id],
    ["User Name", booking.userName || "N/A"],
    ["User Email", booking.userEmail || booking.userId || "N/A"],
    ["Resource ID", booking.resourceId],
    ["Resource Name", resource?.name || "N/A"],
    ["Resource Type", resource?.type || "N/A"],
    ["Building", resource?.building || "N/A"],
    ["Floor", String(resource?.floor ?? "N/A")],
    ["Scheduled Date", booking.date || "N/A"],
    ["Date Range", (booking.startDate && booking.endDate) ? `${booking.startDate} to ${booking.endDate}` : "N/A"],
    ["Time Slot", `${booking.start || booking.startTime} - ${booking.end || booking.endTime}`],
    ["Purpose / Event", booking.purpose || booking.eventName || "N/A"],
    ["Participants", String(booking.participants || "N/A")],
    ["Status", booking.status || "N/A"],
    ["Faculty In-charge", booking.facultyEmail || "N/A"],
    ["Hall Coordinator", resource?.coordinatorEmail || "coordinator@pccoepune.org"]
  ];
  
  let y = 35;
  fields.forEach(([label, value]) => {
    if (value && value !== "N/A" && value !== "null") {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 60, y);
      y += 10;
    }
  });
  
  doc.line(14, y, 196, y);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, y + 8);
  
  doc.save(`Booking_Confirmation_${booking.id}.pdf`);
}

const TIMETABLE = {
  "COMP-LAB-203": [
    { day: "Monday", start: "10:00", end: "11:00", subject: "Data Structures", department: "Computer Engineering" },
    { day: "Monday", start: "11:00", end: "12:00", subject: "DBMS", department: "Computer Engineering" },
    { day: "Monday", start: "14:00", end: "16:00", subject: "Operating Systems", department: "Computer Engineering" },
  ],
  "COMP-LAB-204": [
    { day: "Monday", start: "09:00", end: "13:00", subject: "Networks Lab", department: "Computer Engineering" },
  ],
  "AIML-LAB-102": [
    { day: "Monday", start: "10:00", end: "12:00", subject: "Machine Learning Lab", department: "AI/ML" },
  ],
  "ENTC-LAB-302": [
    { day: "Monday", start: "13:00", end: "15:00", subject: "Signals Lab", department: "ENTC" },
  ],
};

const INITIAL_SERVICES = [
  { id: "gateway", name: "API Gateway", port: 8080, version: "1.4.0", status: "online", instances: [{ id: "gw-1", status: "online", requests: 512 }], uptime: 99.9 },
  { id: "resource", name: "Resource Service", port: 3001, version: "1.0.0", status: "online", instances: [{ id: "res-1", status: "online", requests: 0 }], uptime: 100.0 },
  { id: "booking", name: "Booking Service", port: 8082, version: "1.3.0", status: "online", instances: [
      { id: "booking-1", status: "online", requests: 34 },
      { id: "booking-2", status: "online", requests: 29 },
      { id: "booking-3", status: "online", requests: 31 },
    ], uptime: 99.6 },
  { id: "timetable", name: "Timetable Service", port: 8083, version: "1.1.4", status: "online", instances: [{ id: "tt-1", status: "online", requests: 148 }], uptime: 99.9 },
  { id: "notification", name: "Notification Service", port: 8084, version: "1.0.7", status: "online", instances: [{ id: "notif-1", status: "online", requests: 88 }], uptime: 99.7 },
  { id: "rabbitmq", name: "RabbitMQ", port: 5672, version: "3.13", status: "online", instances: [{ id: "mq-1", status: "online", requests: 640 }], uptime: 99.9 },
  { id: "postgres", name: "PostgreSQL", port: 5432, version: "18", status: "online", instances: [{ id: "pg-1", status: "online", requests: 980 }], uptime: 99.9 },
  { id: "redis", name: "Redis", port: 6379, version: "7.2", status: "online", instances: [{ id: "redis-1", status: "online", requests: 305 }], uptime: 99.9 },
];

let idCounter = 1000;
const nextId = (prefix) => `${prefix}-${idCounter++}`;
const nowStr = () => new Date().toLocaleTimeString("en-IN", { hour12: false });

/* =========================================================================
   UTILITIES  (utils/timeConflict.ts, utils/availability.ts)
   ========================================================================= */
const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const overlaps = (s1, e1, s2, e2) => s1 < e2 && e1 > s2;
const dayOf = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
};
function checkAvailability(state, resourceId, date, start, end, capacityNeeded) {
  const resource = state.resources.find((r) => r.id === resourceId);
  if (!resource) return { available: false, reason: "Resource not found" };
  if (resource.status !== "active") return { available: false, reason: "Resource disabled" };
  if (capacityNeeded && capacityNeeded > resource.capacity) return { available: false, reason: "Insufficient capacity" };
  const rs = toMin(start), re = toMin(end);
  const day = dayOf(date);
  const tt = state.timetable[resourceId] || [];
  for (const e of tt) if (e.day === day && overlaps(rs, re, toMin(e.start), toMin(e.end)))
    return { available: false, reason: `Occupied by timetable (${e.subject})` };
  const bk = state.bookings.find((b) => {
    if (b.resourceId !== resourceId) return false;
    const isApproved = b.status === "confirmed" || b.status?.toUpperCase() === "APPROVED";
    if (!isApproved) return false;
    const matchesDate = (b.startDate && b.endDate)
      ? (date >= b.startDate && date <= b.endDate)
      : (b.date === date);
    return matchesDate && overlaps(rs, re, toMin(b.start || b.startTime), toMin(b.end || b.endTime));
  });
  if (bk) return { available: false, reason: "Already booked" };
  const blk = state.blockedSlots.find((b) => {
    if (b.resourceId !== resourceId) return false;
    const matchesDate = (b.startDate && b.endDate)
      ? (date >= b.startDate && date <= b.endDate)
      : (b.date === date);
    return matchesDate && overlaps(rs, re, toMin(b.start || b.startTime), toMin(b.end || b.endTime));
  });
  if (blk) return { available: false, reason: blk.reason };
  return { available: true, reason: null };
}
function dayTimeline(state, resourceId, date) {
  const day = dayOf(date);
  const segs = [];
  for (let h = 8; h < 18; h++) {
    const s = `${String(h).padStart(2, "0")}:00`, e = `${String(h + 1).padStart(2, "0")}:00`;
    const r = checkAvailability(state, resourceId, date, s, e, 0);
    let kind = "free";
    if (!r.available) {
      if (r.reason?.startsWith("Occupied")) kind = "timetable";
      else if (r.reason === "Already booked") kind = "booked";
      else if (r.reason && r.reason !== "Insufficient capacity") kind = "blocked";
    }
    segs.push({ hour: h, kind, label: r.reason });
  }
  return segs;
}

async function authFetch(url, options = {}) {
  const email = sessionStorage.getItem('activeUserEmail') || 'admin@pccoepune.org';
  const headers = {
    ...options.headers,
    'X-User-Email': email
  };
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  console.log(`Active user:\n${email}`);

  return fetch(url, {
    ...options,
    headers
  });
}

/* =========================================================================
   RESOURCE SERVICE LAYER (HTTP client connecting to the real backend)
   ========================================================================= */
const resourceService = {
  async getResources() {
    const baseUrl = import.meta.env.VITE_RESOURCE_SERVICE_URL || 'http://localhost:3001';
    const res = await authFetch(`${baseUrl}/resources`);
    if (!res.ok) throw new Error("Failed to fetch resources from backend");
    return res.json();
  },

  async searchResources(state, filters) {
    const baseUrl = import.meta.env.VITE_RESOURCE_SERVICE_URL || 'http://localhost:3001';
    const url = new URL(`${baseUrl}/resources/search`);
    if (filters.type && filters.type !== "Any") url.searchParams.append('type', filters.type);
    if (filters.building && filters.building !== "Any") url.searchParams.append('building', filters.building);
    if (filters.department && filters.department !== "Any") url.searchParams.append('department', filters.department);
    if (filters.capacity) url.searchParams.append('capacity', filters.capacity);

    const res = await authFetch(url.toString());
    if (!res.ok) throw new Error("Search failed");
    const resources = await res.json();

    return resources.map((r) => ({
      resource: r,
      ...checkAvailability(state, r.id, filters.date, filters.start, filters.end, Number(filters.capacity) || 0)
    }));
  },

  async getResource(id) {
    const baseUrl = import.meta.env.VITE_RESOURCE_SERVICE_URL || 'http://localhost:3001';
    const res = await authFetch(`${baseUrl}/resources/${id}`);
    if (!res.ok) throw new Error("Failed to fetch resource details");
    return res.json();
  }
};

const timetableService = {
  getSchedule(state, resourceId) { return state.timetable[resourceId] || []; },
};

const bookingService = {
  checkAvailability,
  async getBookings(userId) {
    const baseUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
    const res = await authFetch(`${baseUrl}/bookings?userId=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch bookings");
    return res.json();
  },
  async createBooking(bookingData) {
    const baseUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
    const res = await authFetch(`${baseUrl}/bookings`, {
      method: 'POST',
      body: JSON.stringify({
        resourceId: bookingData.resourceId,
        date: bookingData.date,
        startTime: bookingData.startTime || bookingData.start,
        endTime: bookingData.endTime || bookingData.end,
        participants: Number(bookingData.participants) || 1,
        purpose: bookingData.purpose,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        eventName: bookingData.eventName,
        facultyEmail: bookingData.facultyEmail
      })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to create booking");
    }
    return res.json();
  },
  async cancelBooking(id) {
    const baseUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
    const res = await authFetch(`${baseUrl}/bookings/${id}/cancel`, {
      method: 'POST'
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to cancel booking");
    }
    return res.json();
  },
  async approveBooking(id) {
    const baseUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
    const res = await authFetch(`${baseUrl}/bookings/${id}/approve`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error("Approval failed");
    return res.json();
  },
  async rejectBooking(id, reason) {
    const baseUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
    const res = await authFetch(`${baseUrl}/bookings/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error("Rejection failed");
    return res.json();
  },
  async getMaintenanceBlocks() {
    const baseUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
    const res = await authFetch(`${baseUrl}/maintenance`);
    if (!res.ok) throw new Error("Failed to fetch maintenance blocks");
    return res.json();
  },
  async createMaintenanceBlock(blockData) {
    const baseUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
    const res = await authFetch(`${baseUrl}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(blockData)
    });
    if (!res.ok) throw new Error("Failed to create maintenance block");
    return res.json();
  },
  async deleteMaintenanceBlock(id) {
    const baseUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
    const res = await authFetch(`${baseUrl}/maintenance/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete maintenance block");
    return res.json();
  }
};

const notificationService = {
  async getNotifications(userId) {
    const baseUrl = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
    const res = await authFetch(`${baseUrl}/notifications/user/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  async getUnreadCount(userId) {
    const baseUrl = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
    const res = await authFetch(`${baseUrl}/notifications/unread-count/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch unread count");
    return res.json();
  },

  async markAsRead(id) {
    const baseUrl = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
    const res = await authFetch(`${baseUrl}/notifications/${id}/read`, { 
      method: 'PATCH'
    });
    if (!res.ok) throw new Error("Failed to mark notification as read");
    return res.json();
  },

  async markAllAsRead(userId) {
    try {
      const list = await this.getNotifications(userId);
      const unreads = list.filter(n => n.status !== 'READ');
      await Promise.all(unreads.map(n => this.markAsRead(n.id)));
      return { success: true };
    } catch (e) {
      console.error("Failed to mark all notifications read:", e);
      throw e;
    }
  }
};

/* =========================================================================
   REDUCER — single source of truth (resources array populated from API)
   ========================================================================= */
const initialState = {
  resources: [],
  timetable: {},
  bookings: [],
  blockedSlots: [
    { id: "BLK-1", resourceId: "COMP-LAB-203", date: "2026-08-26", start: "14:00", end: "16:00", reason: "Maintenance" },
  ],
  requests: [
    { id: "REQ-1", userEmail: "faculty@pccoepune.org", purpose: "Department Workshop", type: "Computer Laboratory", capacity: 50, date: "2026-08-27", start: "14:00", end: "16:00", requirements: "Computers + Projector", status: "pending" },
  ],
  services: INITIAL_SERVICES,
  events: [
    { id: nextId("EVT"), ts: nowStr(), source: "System", destination: "System", event: "SERVICE_STARTED", status: "OK" },
  ],
};

function pushEvent(events, source, destination, event, status = "OK") {
  return [{ id: nextId("EVT"), ts: nowStr(), source, destination, event, status }, ...events].slice(0, 200);
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_BLOCKED_SLOTS": {
      return { ...state, blockedSlots: action.blockedSlots };
    }
    case "SET_RESOURCES": {
      return { ...state, resources: action.resources };
    }
    case "SET_ALL_TIMETABLES": {
      return { ...state, timetable: action.timetable };
    }
    case "SET_ALL_BOOKINGS": {
      return { ...state, bookings: action.bookings };
    }
    case "CREATE_BOOKING": {
      const b = action.booking;
      let events = pushEvent(state.events, "Booking Service", "Timetable Service", "AVAILABILITY_CHECK");
      events = pushEvent(events, "Booking Service", "Booking Service", "BOOKING_COMMITTED");
      events = pushEvent(events, "Booking Service", "RabbitMQ", "MESSAGE_PUBLISHED: BOOKING_CONFIRMED");
      events = pushEvent(events, "RabbitMQ", "Notification Service", "MESSAGE_CONSUMED");
      const services = state.services.map((s) => s.id === "booking"
        ? { ...s, instances: s.instances.map((inst, i) => i === 0 ? { ...inst, requests: inst.requests + 1 } : inst) }
        : s);
      return { ...state, bookings: [b, ...state.bookings], events, services };
    }
    case "CANCEL_BOOKING": {
      const bookings = state.bookings.map((b) => b.id === action.id ? { ...b, status: "cancelled" } : b);
      const events = pushEvent(state.events, "Booking Service", "Booking Service", `BOOKING_CANCELLED (${action.id})`);
      return { ...state, bookings, events };
    }
    case "CREATE_REQUEST": {
      const r = { ...action.request, id: nextId("REQ"), status: "pending" };
      const events = pushEvent(state.events, "Booking Service", "Booking Service", "REQUEST_SUBMITTED");
      return { ...state, requests: [r, ...state.requests], events };
    }
    case "APPROVE_REQUEST": {
      const req = state.requests.find((r) => r.id === action.id);
      const requests = state.requests.map((r) => r.id === action.id ? { ...r, status: "approved" } : r);
      let bookings = state.bookings;
      let events = pushEvent(state.events, "Admin", "Booking Service", `REQUEST_APPROVED (${action.id})`);
      if (req && action.resourceId) {
        const b = { id: nextId("BK-2026-000"), resourceId: action.resourceId, userEmail: req.userEmail, date: req.date, start: req.start, end: req.end, participants: req.capacity, purpose: req.purpose, status: "confirmed", createdAt: "Today" };
        bookings = [b, ...bookings];
        events = pushEvent(events, "Booking Service", "Booking Service", "BOOKING_COMMITTED");
      }
      return { ...state, requests, bookings, events };
    }
    case "REJECT_REQUEST": {
      const requests = state.requests.map((r) => r.id === action.id ? { ...r, status: "rejected" } : r);
      const events = pushEvent(state.events, "Admin", "Booking Service", `REQUEST_REJECTED (${action.id})`);
      return { ...state, requests, events };
    }
    case "ADD_BLOCK": {
      const blk = { ...action.block, id: nextId("BLK") };
      const events = pushEvent(state.events, "Admin", "Resource Service", `SLOT_BLOCKED (${blk.resourceId})`);
      return { ...state, blockedSlots: [blk, ...state.blockedSlots], events };
    }
    case "REMOVE_BLOCK": {
      const blockedSlots = state.blockedSlots.filter((b) => b.id !== action.id);
      const events = pushEvent(state.events, "Admin", "Resource Service", "SLOT_UNBLOCKED");
      return { ...state, blockedSlots, events };
    }
    case "IMPORT_TIMETABLE": {
      const timetable = { ...state.timetable, [action.resourceId]: [...(state.timetable[action.resourceId] || []), ...action.entries] };
      const events = pushEvent(state.events, "Admin", "Timetable Service", `TIMETABLE_IMPORTED (${action.resourceId})`);
      return { ...state, timetable, events };
    }
    case "TOGGLE_SERVICE": {
      const services = state.services.map((s) => s.id === action.id ? { ...s, status: s.status === "online" ? "offline" : "online" } : s);
      const svc = services.find((s) => s.id === action.id);
      const events = pushEvent(state.events, "Admin", svc.name, svc.status === "online" ? "SERVICE_STARTED" : "SERVICE_STOPPED", svc.status === "online" ? "OK" : "FAIL");
      return { ...state, services, events };
    }
    case "ADD_INSTANCE": {
      const services = state.services.map((s) => s.id === action.id
        ? { ...s, instances: [...s.instances, { id: `${action.id}-${s.instances.length + 1}`, status: "online", requests: 0 }] }
        : s);
      const events = pushEvent(state.events, "Admin", action.id, "INSTANCE_STARTED");
      return { ...state, services, events };
    }
    case "REMOVE_INSTANCE": {
      const services = state.services.map((s) => s.id === action.id && s.instances.length > 1
        ? { ...s, instances: s.instances.slice(0, -1) }
        : s);
      const events = pushEvent(state.events, "Admin", action.id, "INSTANCE_STOPPED");
      return { ...state, services, events };
    }
    default: return state;
  }
}

/* =========================================================================
   SMALL UI PRIMITIVES
   ========================================================================= */
const Badge = ({ tone = "gray", children, icon }) => {
  const map = {
    green: { bg: C.green100, fg: C.green900 },
    blue: { bg: C.blue100, fg: C.blue900 },
    amber: { bg: C.amber100, fg: C.amber600 },
    red: { bg: C.red100, fg: C.red600 },
    gray: { bg: C.gray100, fg: C.gray600 },
  }[tone];
  return (
    <span style={{ background: map.bg, color: map.fg, fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 5, display: "inline-flex", alignItems: "center", gap: 4, letterSpacing: .01 }}>
      {icon}{children}
    </span>
  );
};
const Card = ({ children, style, ...rest }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, ...style }} {...rest}>{children}</div>
);
const Button = ({ children, tone = "primary", size = "md", style, ...rest }) => {
  const tones = {
    primary: { background: C.green600, color: "#fff", border: `1px solid ${C.green600}` },
    blue: { background: C.blue600, color: "#fff", border: `1px solid ${C.blue600}` },
    ghost: { background: C.surface, color: C.ink, border: `1px solid ${C.border}` },
    danger: { background: C.surface, color: C.red600, border: `1px solid ${C.red100}` },
  };
  const sizes = { md: { padding: "9px 16px", fontSize: 13.5 }, sm: { padding: "6px 11px", fontSize: 12.5 } };
  return <button style={{ ...tones[tone], ...sizes[size], borderRadius: 7, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, ...style }} {...rest}>{children}</button>;
};
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: .04, color: C.inkSoft, marginBottom: 5 }}>{label}</div>
    {children}
  </div>
);
const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surfaceAlt, fontSize: 13.5, color: C.ink, fontFamily: FONT };
const SectionTitle = ({ title, sub, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", margin: "26px 0 12px" }}>
    <div><div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>{sub && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>{sub}</div>}</div>
    {action}
  </div>
);
const StatusDot = ({ online }) => <span style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: online ? C.green500 : C.red600, marginRight: 6 }} />;

function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 40 }}>
      <div style={{ width: 34, height: 34, border: `3px solid ${C.border}`, borderTopColor: C.green600, borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.9s linear infinite" }} />
      <div style={{ fontSize: 14, fontWeight: 600 }}>{message}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* =========================================================================
   MAIN APP
   ========================================================================= */
export default function DistriBookApp() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [page, setPage] = useState(() => {
    const saved = sessionStorage.getItem('currentUser');
    if (saved) {
      const u = JSON.parse(saved);
      if (u.role === "admin") return "admin-dashboard";
      if (u.role === "coordinator") return "coordinator-dashboard";
      if (u.role === "labassistant") return "labassistant-dashboard";
      return "dashboard";
    }
    return "dashboard";
  });
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchFilters, setSearchFilters] = useState({ type: "Any", building: "Any", department: "Any", capacity: "", date: "2026-08-25", start: "10:00", end: "12:00" });
  const [searchResults, setSearchResults] = useState(null);
  const [bookingDraft, setBookingDraft] = useState(null);
  const [bookingFlow, setBookingFlow] = useState({ stage: "idle", result: null });
  const [tab, setTab] = useState("Upcoming");
  const [eventFilter, setEventFilter] = useState({ service: "All", status: "All" });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const refreshNotifications = async (userEmail) => {
    if (!userEmail) return;
    try {
      const data = await notificationService.getNotifications(userEmail);
      setNotifications(data);
      const countData = await notificationService.getUnreadCount(userEmail);
      setUnreadCount(countData.count);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err.message);
    }
  };

  useEffect(() => {
    if (user) {
      refreshNotifications(user.email);
      const interval = setInterval(() => {
        refreshNotifications(user.email);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      refreshNotifications(user.email);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(user.email);
      refreshNotifications(user.email);
    } catch (err) {
      console.error(err);
    }
  };

  const go = (p) => setPage(p);

  useEffect(() => {
    async function loadResourcesTimetablesAndBookings() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch resources
        const data = await resourceService.getResources();
        dispatch({ type: "SET_RESOURCES", resources: data });
        
        // Fetch timetables
        const timetableUrl = import.meta.env.VITE_TIMETABLE_SERVICE_URL || 'http://localhost:3002';
        const ttRes = await authFetch(`${timetableUrl}/timetables`);
        if (!ttRes.ok) throw new Error("Failed to fetch weekly schedules");
        const ttData = await ttRes.json();
        
        const timetableMap = {};
        for (const entry of ttData) {
          if (!timetableMap[entry.resourceId]) {
            timetableMap[entry.resourceId] = [];
          }
          timetableMap[entry.resourceId].push({
            day: entry.day,
            start: entry.start,
            end: entry.end,
            subject: entry.subject,
            department: entry.department
          });
        }
        dispatch({ type: "SET_ALL_TIMETABLES", timetable: timetableMap });

        // Fetch bookings
        const bookingUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
        const bkRes = await authFetch(`${bookingUrl}/bookings`);
        if (!bkRes.ok) throw new Error("Failed to fetch bookings");
        const bkData = await bkRes.json();
        dispatch({ type: "SET_ALL_BOOKINGS", bookings: bkData });
        
        // Fetch maintenance blocks
        try {
          const blocks = await bookingService.getMaintenanceBlocks();
          const mappedBlocks = blocks.map(b => ({
            id: b.id,
            resourceId: b.resourceId,
            date: b.startDate,
            startDate: b.startDate,
            endDate: b.endDate,
            start: b.startTime,
            end: b.endTime,
            reason: b.reason
          }));
          dispatch({ type: "SET_BLOCKED_SLOTS", blockedSlots: mappedBlocks });
        } catch (e) {
          console.warn("Failed to fetch maintenance blocks:", e);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load college resources, weekly timetables, or persistent bookings. Make sure the Resource Service (:3001), Timetable Service (:3002), and Booking Service (:3003) are running.");
      } finally {
        setLoading(false);
      }
    }
    loadResourcesTimetablesAndBookings();
  }, []);

  if (!user) return <LoginScreen onLogin={(u) => {
    sessionStorage.setItem('currentUser', JSON.stringify(u));
    sessionStorage.setItem('activeUserEmail', u.email);
    setUser(u);
    if (u.role === "admin") setPage("admin-dashboard");
    else if (u.role === "coordinator") setPage("coordinator-dashboard");
    else if (u.role === "labassistant") setPage("labassistant-dashboard");
    else setPage("dashboard");
  }} />;

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.ink, alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Connecting to Resource Service..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.ink, alignItems: "center", justifyContent: "center" }}>
        <Card style={{ maxWidth: 420, textAlign: "center", padding: 30 }}>
          <XCircle size={40} color={C.red600} style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Connection Failed</div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 20 }}>{error}</div>
          <Button tone="primary" onClick={() => window.location.reload()}>Retry Connection</Button>
        </Card>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const bookingSvc = state.services.find((s) => s.id === "booking");
  const bookingOffline = bookingSvc.status === "offline";

  async function runSearch() {
    try {
      const results = await resourceService.searchResources(state, searchFilters);
      setSearchResults(results);
    } catch (err) {
      alert("Search failed. Ensure the Resource Service is running.");
      console.error(err);
    }
  }

  function openResource(id) { setSelectedResource(id); go("resource-detail"); }
  function startBooking(resourceId) {
    const res = state.resources.find(r => r.id === resourceId);
    setBookingDraft({
      resourceId,
      bookingType: "single",
      date: searchFilters.date || new Date().toISOString().split('T')[0],
      startDate: searchFilters.date || new Date().toISOString().split('T')[0],
      endDate: searchFilters.date || new Date().toISOString().split('T')[0],
      start: searchFilters.start || "10:00",
      end: searchFilters.end || "11:00",
      participants: 45,
      purpose: "Workshop",
      eventName: "Academic Event",
      facultyEmail: "faculty@pccoepune.org",
      requirements: ""
    });
    setBookingFlow({ stage: "idle", result: null });
    go("booking");
  }
  async function handleCancel(id) {
    try {
      await bookingService.cancelBooking(id);
      dispatch({ type: "CANCEL_BOOKING", id });
      setTimeout(() => refreshNotifications(user.email), 800);
    } catch (err) {
      alert("Failed to cancel booking: " + err.message);
    }
  }

  async function submitBooking() {
    if (bookingOffline) { setBookingFlow({ stage: "failed", result: { reason: "Booking Service is currently OFFLINE (see Fault Simulation)." } }); return; }
    const steps = ["validating", "rechecking", "processing"];
    for (const s of steps) { setBookingFlow({ stage: s, result: null }); await new Promise((r) => setTimeout(r, 550)); }
    
    try {
      const res = state.resources.find(r => r.id === bookingDraft.resourceId);
      const newBooking = await bookingService.createBooking({
        resourceId: bookingDraft.resourceId,
        userEmail: user.email,
        userName: user.name,
        date: bookingDraft.bookingType === "multi-day" ? null : bookingDraft.date,
        startDate: bookingDraft.bookingType === "multi-day" ? bookingDraft.startDate : null,
        endDate: bookingDraft.bookingType === "multi-day" ? bookingDraft.endDate : null,
        startTime: bookingDraft.start,
        endTime: bookingDraft.end,
        participants: Number(bookingDraft.participants) || 1,
        purpose: bookingDraft.purpose,
        eventName: bookingDraft.bookingType === "multi-day" ? bookingDraft.eventName : null,
        facultyEmail: (bookingDraft.bookingType === "multi-day" || res?.requiresApproval) ? bookingDraft.facultyEmail : null
      });
      // Fetch updated bookings list from backend to get correct statuses/approvals
      const bookingUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
      const bkRes = await authFetch(`${bookingUrl}/bookings`);
      if (bkRes.ok) {
        const bkData = await bkRes.json();
        dispatch({ type: "SET_ALL_BOOKINGS", bookings: bkData });
      } else {
        dispatch({ type: "CREATE_BOOKING", booking: newBooking });
      }
      setBookingFlow({ stage: "confirmed", result: null });
      setTimeout(() => refreshNotifications(user.email), 800);
    } catch (err) {
      setBookingFlow({ stage: "failed", result: { reason: err.message } });
    }
  }

  const stats = {
    available: state.resources.filter((r) => r.status === "active").length,
    upcoming: state.bookings.filter((b) => b.userEmail === user.email && b.status === "confirmed").length,
    pending: state.requests.filter((r) => r.userEmail === user.email && r.status === "pending").length,
    total: state.bookings.filter((b) => b.userEmail === user.email).length,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.ink }}>
      <Sidebar user={user} isAdmin={isAdmin} page={page} go={go} onLogout={() => { sessionStorage.removeItem('currentUser'); sessionStorage.setItem('activeUserEmail', 'admin@pccoepune.org'); setUser(null); setPage("dashboard"); }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Header
          user={user}
          isAdmin={isAdmin}
          bookingOffline={bookingOffline}
          notifications={notifications}
          unreadCount={unreadCount}
          showDropdown={showNotificationsDropdown}
          setShowDropdown={setShowNotificationsDropdown}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
        <div style={{ padding: "24px 30px 60px", maxWidth: 1180 }}>
          {page === "dashboard" && <Dashboard user={user} state={state} stats={stats} go={go} />}
          {page === "coordinator-dashboard" && <CoordinatorDashboard state={state} user={user} go={go} />}
          {page === "labassistant-dashboard" && <LabAssistantDashboard state={state} user={user} go={go} />}
          {page === "faculty-approvals" && <FacultyApprovals state={state} user={user} dispatch={dispatch} />}
          {page === "coordinator-approvals" && <CoordinatorApprovals state={state} user={user} dispatch={dispatch} />}
          {page === "labassistant-approvals" && <LabAssistantApprovals state={state} user={user} dispatch={dispatch} />}
          {page === "hall-availability" && <AvailabilityChart state={state} resourceFilterType="hall" />}
          {page === "lab-availability" && <AvailabilityChart state={state} resourceFilterType="lab" />}
          {page === "find" && <FindResources filters={searchFilters} setFilters={setSearchFilters} onSearch={runSearch} results={searchResults} onView={openResource} onBook={startBooking} />}
          {page === "resource-detail" && selectedResource && <ResourceDetail state={state} resourceId={selectedResource} onBook={startBooking} filters={searchFilters} setFilters={setSearchFilters} />}
          {page === "booking" && bookingDraft && <BookingPage state={state} draft={bookingDraft} setDraft={setBookingDraft} flow={bookingFlow} onSubmit={submitBooking} go={go} bookingOffline={bookingOffline} />}
          {page === "mybookings" && <MyBookings state={state} user={user} tab={tab} setTab={setTab} onCancel={handleCancel} />}
          {page === "requests" && <Requests state={state} user={user} isAdmin={isAdmin} dispatch={dispatch} />}
          {page === "campus" && <CampusExplorer state={state} onView={openResource} />}

          {isAdmin && page === "admin-dashboard" && <AdminDashboard state={state} />}
          {isAdmin && page === "admin-resources" && <AdminResources state={state} />}
          {isAdmin && page === "timetable" && <TimetableAdmin state={state} dispatch={dispatch} />}
          {isAdmin && page === "blocked" && <BlockedSlots state={state} dispatch={dispatch} />}
          {isAdmin && page === "admin-bookings" && <AdminBookings state={state} />}
          {isAdmin && page === "admin-requests" && <Requests state={state} user={user} isAdmin={isAdmin} dispatch={dispatch} />}
          {isAdmin && page === "services" && <ServicesPage state={state} dispatch={dispatch} />}
          {isAdmin && page === "communication" && <CommunicationPage state={state} />}
          {isAdmin && page === "scalability" && <ScalabilityPage state={state} dispatch={dispatch} />}
          {isAdmin && page === "fault" && <FaultSimulation state={state} dispatch={dispatch} />}
          {isAdmin && page === "eventlogs" && <EventLogs state={state} filter={eventFilter} setFilter={setEventFilter} />}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   AVAILABILITY TIMELINE (shared component)
   ========================================================================= */
function Timeline({ segs }) {
  const colors = { free: C.green300, timetable: C.blue500, booked: C.red600, blocked: C.amber600 };
  const labels = { free: "Available", timetable: "Class", booked: "Booked", blocked: "Blocked" };
  return (
    <div>
      <div style={{ display: "flex", gap: 2, height: 26, borderRadius: 5, overflow: "hidden" }}>
        {segs.map((s) => <div key={s.hour} title={`${s.hour}:00 — ${labels[s.kind]}`} style={{ flex: 1, background: colors[s.kind] }} />)}
      </div>
      <div style={{ display: "flex", fontSize: 10.5, color: C.inkFaint, marginTop: 4 }}>
        {segs.map((s) => <div key={s.hour} style={{ flex: 1 }}>{s.hour}</div>)}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11.5, color: C.inkSoft }}>
        {Object.keys(colors).map((k) => <span key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}><i style={{ width: 9, height: 9, borderRadius: 2, background: colors[k], display: "inline-block" }} />{labels[k]}</span>)}
      </div>
    </div>
  );
}

/* =========================================================================
   STUDENT / FACULTY PAGES
   ========================================================================= */
function Dashboard({ user, state, stats, go }) {
  const upcoming = state.bookings.find((b) => b.userEmail === user.email && b.status === "confirmed");
  const resource = upcoming && state.resources.find((r) => r.id === upcoming.resourceId);
  const activity = [
    { text: "Booking confirmed — Computer Lab 203", tone: "green" },
    { text: "Request submitted — Department Workshop", tone: "amber" },
    { text: "Booking cancelled — Classroom 201", tone: "red" },
  ];
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Good morning, {user.name.split(" ")[0]}</div>
      <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 4, marginBottom: 16 }}>Find and reserve classrooms, laboratories and shared campus resources.</div>
      <Button tone="primary" onClick={() => go("find")}><Search size={15} /> Find a Resource</Button>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 24 }}>
        {[["Available Resources", stats.available, "green"], ["Upcoming Bookings", stats.upcoming, "blue"], ["Pending Requests", stats.pending, "amber"], ["My Total Bookings", stats.total, "gray"]].map(([label, val, tone]) => (
          <Card key={label}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.inkSoft }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: tone === "green" ? C.green600 : tone === "blue" ? C.blue600 : tone === "amber" ? C.amber600 : C.ink }}>{val}</div>
          </Card>
        ))}
      </div>

      {resource && <>
        <SectionTitle title="Upcoming booking" />
        <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Badge tone="blue">{resource.type}</Badge>
            <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 8 }}>{resource.name}</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>{upcoming.date} · {upcoming.start}–{upcoming.end} · {resource.building} • Floor {resource.floor}</div>
          </div>
          <Badge tone="green">CONFIRMED</Badge>
        </Card>
      </>}

      <SectionTitle title="Recent activity" />
      <Card>
        {activity.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < activity.length - 1 ? `1px solid ${C.borderSoft}` : "none", fontSize: 13 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.tone === "green" ? C.green500 : a.tone === "amber" ? C.amber600 : C.red600 }} />
            {a.text}
          </div>
        ))}
      </Card>
    </div>
  );
}

const TYPES = ["Any", "Classroom", "Computer Laboratory", "ENTC Laboratory", "AI/ML Laboratory", "Mechanical Laboratory", "Seminar Hall", "GD Room", "Reading Hall"];
const BUILDINGS = ["Any", "Main Building", "Mechanical Building", "Architecture Building"];
const DEPARTMENTS = ["Any", "Common", "AI/ML", "Computer Engineering", "ENTC", "First Year", "Mechanical", "Architecture"];

function FindResources({ filters, setFilters, onSearch, results, onView, onBook }) {
  const set = (k, v) => setFilters({ ...filters, [k]: v });
  return (
    <div>
      <div style={{ fontSize: 19, fontWeight: 700 }}>Find Resources</div>
      <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3, marginBottom: 18 }}>Search for classrooms, laboratories and shared resources based on your requirements.</div>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          <Field label="Resource Type"><select style={inputStyle} value={filters.type} onChange={(e) => set("type", e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Building"><select style={inputStyle} value={filters.building} onChange={(e) => set("building", e.target.value)}>{BUILDINGS.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Department"><select style={inputStyle} value={filters.department} onChange={(e) => set("department", e.target.value)}>{DEPARTMENTS.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Minimum Capacity"><input type="number" style={inputStyle} value={filters.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="50" /></Field>
          <Field label="Date"><input type="date" style={inputStyle} value={filters.date} onChange={(e) => set("date", e.target.value)} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="Start Time"><input type="time" style={inputStyle} value={filters.start} onChange={(e) => set("start", e.target.value)} /></Field>
            <Field label="End Time"><input type="time" style={inputStyle} value={filters.end} onChange={(e) => set("end", e.target.value)} /></Field>
          </div>
        </div>
        <Button tone="primary" onClick={onSearch}><Search size={15} /> Search Availability</Button>
      </Card>

      {results && (
        <>
          <SectionTitle title={`${results.length} resources found`} sub={`Requested: ${filters.start} – ${filters.end} on ${filters.date}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {results.map(({ resource: r, available, reason }) => (
              <Card key={r.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <Badge tone="blue">{r.type.toUpperCase()}</Badge>
                    <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 8 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{r.building} • Floor {r.floor} · {r.department}</div>
                  </div>
                  {available ? <Badge tone="green" icon={<CheckCircle2 size={12} />}>AVAILABLE</Badge> : <Badge tone="red" icon={<XCircle size={12} />}>UNAVAILABLE</Badge>}
                </div>
                <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 10 }}>Capacity: <b style={{ color: C.ink }}>{r.capacity}</b></div>
                <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>{r.facilities.join(" · ")}</div>
                <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 4 }} className="mono">Node: {r.nodeId}</div>
                {!available && <div style={{ marginTop: 8, fontSize: 12, color: C.red600 }}>Reason: {reason}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Button tone="ghost" size="sm" onClick={() => onView(r.id)}>View Details</Button>
                  <Button tone="primary" size="sm" disabled={!available} style={!available ? { opacity: .45, cursor: "not-allowed" } : {}} onClick={() => available && onBook(r.id)}>Book</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ResourceDetail({ state, resourceId, onBook, filters, setFilters }) {
  const r = state.resources.find((x) => x.id === resourceId);
  const segs = dayTimeline(state, resourceId, filters.date);
  if (!r) return null;
  return (
    <div>
      <div style={{ fontSize: 12, color: C.inkFaint, marginBottom: 10 }}>Find Resources → <b style={{ color: C.inkSoft }}>{r.name}</b></div>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <Card>
          <Badge tone="blue">{r.type.toUpperCase()}</Badge>
          <div style={{ fontSize: 21, fontWeight: 700, marginTop: 10 }}>{r.name}</div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3 }}>{r.building} · Floor {r.floor} · {r.department}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase" }}>Capacity</div><div style={{ fontSize: 20, fontWeight: 700 }}>{r.capacity}</div></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase" }}>Node</div><div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.nodeId}</div></div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", marginTop: 16 }}>Facilities</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>{r.facilities.map((f) => <Badge key={f} tone="green">✓ {f}</Badge>)}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", marginBottom: 10 }}>Check Availability</div>
          <Field label="Date"><input type="date" style={inputStyle} value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="Start"><input type="time" style={inputStyle} value={filters.start} onChange={(e) => setFilters({ ...filters, start: e.target.value })} /></Field>
            <Field label="End"><input type="time" style={inputStyle} value={filters.end} onChange={(e) => setFilters({ ...filters, end: e.target.value })} /></Field>
          </div>
          <Button tone="blue" style={{ width: "100%", justifyContent: "center" }} onClick={() => onBook(r.id)}>Book This Resource</Button>
        </Card>
      </div>
      <SectionTitle title="Availability" sub={`${dayOf(filters.date)} · ${filters.date}`} />
      <Card><Timeline segs={segs} /></Card>
    </div>
  );
}

function BookingPage({ state, draft, setDraft, flow, onSubmit, go, bookingOffline }) {
  const r = state.resources.find((x) => x.id === draft.resourceId);
  const check = checkAvailability(state, draft.resourceId, draft.bookingType === "multi-day" ? draft.startDate : draft.date, draft.start, draft.end, Number(draft.participants));
  const set = (k, v) => setDraft({ ...draft, [k]: v });

  if (flow.stage === "confirmed") {
    const b = state.bookings.find(x => x.resourceId === draft.resourceId) || state.bookings[0];
    const requiresApp = r?.requiresApproval || draft.bookingType === "multi-day";
    return (
      <Card style={{ maxWidth: 460, margin: "20px auto", textAlign: "center", padding: 32 }}>
        <CheckCircle2 size={40} color={requiresApp ? C.amber600 : C.green600} />
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 10 }}>{requiresApp ? "Booking Request Submitted" : "Booking Confirmed"}</div>
        <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>{b?.id || "Pending ID"}</div>
        <div style={{ textAlign: "left", marginTop: 18, borderTop: `1px solid ${C.borderSoft}`, paddingTop: 14 }}>
          {[["Resource", r?.name], ["Type", r?.type], ["Date / Range", (b?.startDate && b?.endDate) ? `${b.startDate} to ${b.endDate}` : draft.date], ["Time", `${draft.start} – ${draft.end}`], ["Location", `${r?.building} • Floor ${r?.floor}`]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}><span style={{ color: C.inkSoft }}>{k}</span><b>{v}</b></div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}><span style={{ color: C.inkSoft }}>Status</span><Badge tone={requiresApp ? "amber" : "green"}>{requiresApp ? "PENDING APPROVAL" : "CONFIRMED"}</Badge></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <Button tone="ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => go("mybookings")}>View My Bookings</Button>
          {!requiresApp && b && <Button tone="primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => downloadBookingConfirmation(b, r)}>Download Confirmation</Button>}
        </div>
      </Card>
    );
  }
  if (flow.stage === "failed") {
    return (
      <Card style={{ maxWidth: 460, margin: "20px auto", textAlign: "center", padding: 32 }}>
        <XCircle size={40} color={C.red600} />
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 10 }}>Booking Could Not Be Completed</div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 8 }}>{flow.result?.reason || "The resource was reserved by another request before your booking was committed."}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Button tone="ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => go("find")}>Choose Another Time</Button>
          <Button tone="primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => go("find")}>Find Similar Resources</Button>
        </div>
      </Card>
    );
  }
  if (["validating", "rechecking", "processing"].includes(flow.stage)) {
    const labels = { validating: "Checking resource...", rechecking: "Re-checking availability...", processing: "Processing booking..." };
    return (
      <Card style={{ maxWidth: 420, margin: "40px auto", textAlign: "center", padding: 34 }}>
        <div style={{ width: 34, height: 34, border: `3px solid ${C.border}`, borderTopColor: C.green600, borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.9s linear infinite" }} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>{labels[flow.stage]}</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </Card>
    );
  }

  if (!r) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
      <Card>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Book Resource</div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 14 }}>{r.name} · {r.type} · {r.building}, Floor {r.floor}</div>
        
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button style={{ flex: 1, padding: "8px", borderRadius: "5px", border: draft.bookingType === "single" ? `2px solid ${C.green500}` : `1px solid ${C.border}`, background: draft.bookingType === "single" ? C.green50 : "white", fontWeight: 600, fontSize: 13 }} onClick={() => set("bookingType", "single")}>Single Day</button>
          <button style={{ flex: 1, padding: "8px", borderRadius: "5px", border: draft.bookingType === "multi-day" ? `2px solid ${C.green500}` : `1px solid ${C.border}`, background: draft.bookingType === "multi-day" ? C.green50 : "white", fontWeight: 600, fontSize: 13 }} onClick={() => set("bookingType", "multi-day")}>Multi-Day Event</button>
        </div>

        {(r.requiresApproval || draft.bookingType === "multi-day") && (
          <div style={{ background: C.amber50, border: `1px solid ${C.amber500}`, color: C.amber800, padding: 10, borderRadius: 6, fontSize: 12.5, marginBottom: 14 }}>
            <b>⚠ Approval Required:</b> {draft.bookingType === "multi-day" 
              ? "Multi-day events require approval from both the designated Faculty In-charge and the Hall Coordinator."
              : `This is a controlled resource. It requires approval from authority (${r.coordinatorEmail || "coordinator@pccoepune.org"}) before confirmation.`}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {draft.bookingType === "multi-day" ? (
            <>
              <Field style={{ gridColumn: "span 2" }} label="Event Name"><input style={inputStyle} value={draft.eventName} onChange={(e) => set("eventName", e.target.value)} /></Field>
              <Field label="Start Date"><input type="date" style={inputStyle} value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
              <Field label="End Date"><input type="date" style={inputStyle} value={draft.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
            </>
          ) : (
            <Field style={{ gridColumn: "span 2" }} label="Date"><input type="date" style={inputStyle} value={draft.date} onChange={(e) => set("date", e.target.value)} /></Field>
          )}
          <div style={{ display: "flex", gap: 8, gridColumn: "span 2" }}>
            <Field style={{ flex: 1 }} label="Start Time"><input type="time" style={inputStyle} value={draft.start} onChange={(e) => set("start", e.target.value)} /></Field>
            <Field style={{ flex: 1 }} label="End Time"><input type="time" style={inputStyle} value={draft.end} onChange={(e) => set("end", e.target.value)} /></Field>
          </div>
          <Field label="Number of Participants"><input type="number" style={inputStyle} value={draft.participants} onChange={(e) => set("participants", e.target.value)} /></Field>
          <Field label="Purpose"><input style={inputStyle} value={draft.purpose} onChange={(e) => set("purpose", e.target.value)} /></Field>
          {(draft.bookingType === "multi-day" || r.requiresApproval) && (
            <Field style={{ gridColumn: "span 2" }} label="Faculty In-charge"><select style={inputStyle} value={draft.facultyEmail} onChange={(e) => set("facultyEmail", e.target.value)}><option value="faculty@pccoepune.org">Faculty Member (faculty@pccoepune.org)</option></select></Field>
          )}
        </div>
        <Field label="Additional Requirements"><input style={inputStyle} value={draft.requirements} onChange={(e) => set("requirements", e.target.value)} placeholder="Projector, extra seating…" /></Field>
        {bookingOffline && <div style={{ background: C.red100, color: C.red600, padding: 10, borderRadius: 7, fontSize: 12.5, marginBottom: 10 }}>Booking Service is offline. Submission is disabled until it is restored (see Fault Simulation).</div>}
        <Button tone="primary" style={{ width: "100%", justifyContent: "center" }} disabled={bookingOffline} onClick={onSubmit}>Submit Booking</Button>
      </Card>
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", marginBottom: 8 }}>Availability Summary</div>
        {[
          ["Timetable Conflict", !check.reason?.startsWith("Occupied")],
          ["Existing Booking Conflict", check.reason !== "Already booked"],
          ["Blocked Slot", !(check.reason && !check.reason.startsWith("Occupied") && check.reason !== "Already booked" && check.reason !== "Insufficient capacity")],
          ["Capacity", Number(draft.participants) <= r.capacity],
        ].map(([label, ok]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.borderSoft}`, fontSize: 13 }}>
            <span>{label}</span>
            {label === "Capacity" ? <b style={{ color: ok ? C.green600 : C.red600 }}>{ok ? `✓ ${draft.participants} / ${r.capacity}` : `✗ ${draft.participants} / ${r.capacity}`}</b>
              : <b style={{ color: ok ? C.green600 : C.red600 }}>{ok ? "✓ None" : "⚠ Conflict"}</b>}
          </div>
        ))}
        <div style={{ marginTop: 12, textAlign: "center", padding: 10, borderRadius: 7, background: check.available ? C.green50 : C.red100, color: check.available ? C.green900 : C.red600, fontWeight: 700, fontSize: 13 }}>
          Overall: {check.available ? "AVAILABLE" : "UNAVAILABLE"}
        </div>
      </Card>
    </div>
  );
}

function MyBookings({ state, user, tab, setTab, onCancel }) {
  const mine = state.bookings.filter((b) => b.userEmail === user.email);
  const byTab = { Upcoming: mine.filter((b) => b.status === "confirmed"), Pending: [], Completed: mine.filter((b) => b.status === "completed"), Cancelled: mine.filter((b) => b.status === "cancelled") };
  const list = byTab[tab];
  return (
    <div>
      <div style={{ display: "flex", gap: 22, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
        {["Upcoming", "Pending", "Completed", "Cancelled"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", padding: "8px 2px", fontSize: 13, fontWeight: 600, color: tab === t ? C.green900 : C.inkFaint, borderBottom: tab === t ? `2px solid ${C.green500}` : "2px solid transparent", cursor: "pointer" }}>{t}</button>
        ))}
      </div>
      {list.length === 0 && <div style={{ fontSize: 13, color: C.inkSoft }}>No bookings in this tab.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {list.map((b) => {
          const r = state.resources.find((x) => x.id === b.resourceId);
          return (
            <Card key={b.id}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <Badge tone="blue">{r?.type || "Resource"}</Badge>
                  <div style={{ fontWeight: 700, marginTop: 8 }}>{r?.name || "Unknown Resource"}</div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>{b.date} · {b.start}–{b.end} · {r?.building || ""}</div>
                </div>
                <Badge tone={b.status === "confirmed" ? "green" : b.status === "cancelled" ? "red" : "gray"}>{b.status.toUpperCase()}</Badge>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button tone="ghost" size="sm" onClick={() => downloadBookingConfirmation(b, r)}>Receipt</Button>
                {b.status === "confirmed" && <Button tone="danger" size="sm" onClick={() => onCancel(b.id)}>Cancel</Button>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Requests({ state, user, isAdmin, dispatch }) {
  const [form, setForm] = useState({ purpose: "Department Workshop", type: "Computer Laboratory", capacity: 50, date: "2026-08-27", start: "14:00", end: "16:00", requirements: "Computers + Projector" });
  const set = (k, v) => setForm({ ...form, [k]: v });
  const list = isAdmin ? state.requests : state.requests.filter((r) => r.userEmail === user.email);

  const approve = (req) => {
    const candidate = state.resources.find((r) => r.type === req.type && r.capacity >= req.capacity && checkAvailability(state, r.id, req.date, req.start, req.end, req.capacity).available);
    dispatch({ type: "APPROVE_REQUEST", id: req.id, resourceId: candidate?.id });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: isAdmin ? "1fr" : "1fr 1fr", gap: 16 }}>
      {!isAdmin && (
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>New Resource Request</div>
          <Field label="Purpose"><input style={inputStyle} value={form.purpose} onChange={(e) => set("purpose", e.target.value)} /></Field>
          <Field label="Resource Type"><select style={inputStyle} value={form.type} onChange={(e) => set("type", e.target.value)}>{TYPES.filter((t) => t !== "Any").map((t) => <option key={t}>{t}</option>)}</select></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Required Capacity"><input type="number" style={inputStyle} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></Field>
            <Field label="Date"><input type="date" style={inputStyle} value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
          </div>
          <Field label="Requirements"><input style={inputStyle} value={form.requirements} onChange={(e) => set("requirements", e.target.value)} /></Field>
          <Button tone="primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => dispatch({ type: "CREATE_REQUEST", request: { ...form, userEmail: user.email, capacity: Number(form.capacity) } })}>Submit Request</Button>
        </Card>
      )}
      <div>
        <SectionTitle title={isAdmin ? "All Requests" : "My Requests"} />
        {list.length === 0 && <div style={{ fontSize: 13, color: C.inkSoft }}>No requests yet.</div>}
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((r) => (
            <Card key={r.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.purpose}</div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>{r.type} · Capacity {r.capacity} · {r.date} · {r.start}–{r.end}</div>
                  {isAdmin && <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 2 }}>{r.userEmail}</div>}
                </div>
                <Badge tone={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "amber"}>{r.status.toUpperCase()}</Badge>
              </div>
              {isAdmin && r.status === "pending" && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Button tone="primary" size="sm" onClick={() => approve(r)}>Approve</Button>
                  <Button tone="danger" size="sm" onClick={() => dispatch({ type: "REJECT_REQUEST", id: r.id })}>Reject</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function CampusExplorer({ state, onView }) {
  const buildings = ["Main Building", "Mechanical Building", "Architecture Building"];
  const [active, setActive] = useState("Main Building");
  const floors = [0, 1, 2, 3, 4];
  const floorLabel = { 0: "Ground Floor", 1: "1st Floor — AI/ML", 2: "2nd Floor — Computer Engineering", 3: "3rd Floor — ENTC", 4: "4th Floor — First Year" };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
        {buildings.map((b) => (
          <Card key={b} style={{ cursor: "pointer", border: active === b ? `1px solid ${C.green500}` : `1px solid ${C.border}` }} onClick={() => setActive(b)}>
            <MapPin size={16} color={C.green600} />
            <div style={{ fontWeight: 700, marginTop: 8 }}>{b}</div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{state.resources.filter((r) => r.building === b).length} resources</div>
          </Card>
        ))}
      </div>
      {active === "Main Building" ? floors.map((f) => {
        const items = state.resources.filter((r) => r.building === active && r.floor === f);
        if (!items.length) return null;
        return (
          <div key={f}>
            <SectionTitle title={floorLabel[f]} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
              {items.map((r) => (
                <Card key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><b>{r.name}</b><div style={{ fontSize: 12, color: C.inkSoft }}>Capacity {r.capacity}</div></div>
                  <Button tone="ghost" size="sm" onClick={() => onView(r.id)}>View</Button>
                </Card>
              ))}
            </div>
          </div>
        );
      }) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {state.resources.filter((r) => r.building === active).map((r) => (
            <Card key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><b>{r.name}</b><div style={{ fontSize: 12, color: C.inkSoft }}>Capacity {r.capacity}</div></div>
              <Button tone="ghost" size="sm" onClick={() => onView(r.id)}>View</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   ADMIN — RESOURCE MANAGEMENT
   ========================================================================= */
function AdminDashboard({ state }) {
  const totalReq = state.services.reduce((a, s) => a + s.instances.reduce((x, i) => x + i.requests, 0), 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[["Total Resources", state.resources.length, C.green600], ["Today's Bookings", state.bookings.filter((b) => b.status === "confirmed").length, C.green600],
        ["Pending Requests", state.requests.filter((r) => r.status === "pending").length, C.amber600], ["Active Services", state.services.filter((s) => s.status === "online").length + "/" + state.services.length, C.blue600],
        ["Total Service Instances", state.services.reduce((a, s) => a + s.instances.length, 0), C.blue600], ["Messages Today", totalReq, C.blue600]].map(([l, v, c]) => (
          <Card key={l}><div style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase" }}>{l}</div><div style={{ fontSize: 26, fontWeight: 700, color: c, marginTop: 6 }}>{v}</div></Card>
        ))}
      </div>
      <SectionTitle title="Distributed System Status" />
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 4 }}>
          {state.services.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 4px", borderBottom: `1px solid ${C.borderSoft}` }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: s.status === "online" ? C.green600 : C.red600, display: "flex", alignItems: "center" }}><StatusDot online={s.status === "online"} />{s.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdminResources({ state }) {
  return (
    <div>
      <SectionTitle title="Resources" action={<Button tone="primary" size="sm"><Plus size={14} /> Add Resource</Button>} />
      <Card style={{ padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{["Resource", "Type", "Building", "Floor", "Capacity", "Node", "Status", "Actions"].map((h) => <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10.5, textTransform: "uppercase", color: C.inkFaint, borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {state.resources.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}`, fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{r.type}</td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{r.building}</td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{r.floor}</td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{r.capacity}</td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{r.nodeId}</td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}><Badge tone={r.status === "active" ? "green" : "gray"}>{r.status.toUpperCase()}</Badge></td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}><Button tone="ghost" size="sm">View</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function TimetableAdmin({ state, dispatch }) {
  const [preview, setPreview] = useState(null);
  const [previewSession, setPreviewSession] = useState(null);
  const fileInputRef = useRef(null);

  const departments = ["AI/ML", "Computer Engineering", "ENTC", "First Year", "Mechanical"];
  
  // Dynamically compute department status based on loaded entries in state.timetable
  const status = {};
  const entryCounts = {};
  for (const dept of departments) {
    let count = 0;
    Object.values(state.timetable).forEach((entries) => {
      entries.forEach((e) => {
        if (e.department === dept) count++;
      });
    });
    status[dept] = count > 0 ? "Uploaded" : "Pending";
    entryCounts[dept] = count;
  }

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const timetableUrl = import.meta.env.VITE_TIMETABLE_SERVICE_URL || 'http://localhost:3002';
      const response = await authFetch(`${timetableUrl}/timetables/import/preview`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload preview failed");
      }

      const result = await response.json();
      setPreviewSession(result);

      const uiPreview = result.rows.map((row) => {
        const errors = row.errors || [];
        const conflicts = row.conflicts || [];
        return {
          day: row.data.day || row.data.dayOfWeek || "Monday",
          start: row.data.start || row.data.startTime || "09:00",
          end: row.data.end || row.data.endTime || "10:00",
          subject: row.data.subject || "Course",
          department: row.data.department || "Common",
          resourceId: row.data.resourceId || "",
          ok: row.status === 'valid',
          conflict: errors.concat(conflicts).join(', ')
        };
      });
      setPreview(uiPreview);
    } catch (err) {
      alert("Failed to parse CSV file: " + err.message);
    } finally {
      e.target.value = '';
    }
  };

  async function confirmImport() {
    if (!previewSession?.previewId) return;

    try {
      const timetableUrl = import.meta.env.VITE_TIMETABLE_SERVICE_URL || 'http://localhost:3002';
      const response = await authFetch(`${timetableUrl}/timetables/import/confirm`, {
        method: 'POST',
        body: JSON.stringify({ previewId: previewSession.previewId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Confirm import failed");
      }

      alert("Timetable entries imported successfully!");
      setPreview(null);
      setPreviewSession(null);

      // Re-load timetables from backend
      const ttRes = await authFetch(`${timetableUrl}/timetables`);
      if (ttRes.ok) {
        const ttData = await ttRes.json();
        const timetableMap = {};
        for (const entry of ttData) {
          if (!timetableMap[entry.resourceId]) {
            timetableMap[entry.resourceId] = [];
          }
          timetableMap[entry.resourceId].push({
            day: entry.day,
            start: entry.start,
            end: entry.end,
            subject: entry.subject,
            department: entry.department
          });
        }
        dispatch({ type: "SET_ALL_TIMETABLES", timetable: timetableMap });
      }
    } catch (err) {
      alert("Failed to confirm import: " + err.message);
    }
  }

  const totalRowsCount = previewSession?.totalRows || 0;
  const validRowsCount = previewSession?.validRows || 0;
  const invalidRowsCount = (previewSession?.invalidRows || 0) + (previewSession?.conflictRows || 0);

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".csv"
      />
      <SectionTitle title="Timetable Management" action={<Button tone="primary" size="sm" onClick={handleUploadClick}><Plus size={14} /> Upload Timetable</Button>} />
      <Card style={{ padding: 0, overflow: "auto", marginBottom: 22 }}>
        <table style={{ width: "100%", fontSize: 13 }}>
          <thead><tr>{["Department", "File", "Status", "Last Updated", "Entries", "Actions"].map((h) => <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10.5, textTransform: "uppercase", color: C.inkFaint, borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d}>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}`, fontWeight: 600 }}>{d}</td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}`, fontSize: 12, color: C.inkSoft }}>{status[d] === "Uploaded" ? `${d.toLowerCase().replace(/\s/g, "_")}.csv` : "—"}</td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}><Badge tone={status[d] === "Uploaded" ? "green" : "amber"}>{status[d]}</Badge></td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{status[d] === "Uploaded" ? "Today" : "—"}</td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{status[d] === "Uploaded" ? entryCounts[d] : 0}</td>
                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}><Button tone="ghost" size="sm">View</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {preview && (
        <>
          <SectionTitle title="Timetable Preview" sub={`${totalRowsCount} total rows found in CSV`} />
          <Card>
            <div style={{ maxHeight: 240, overflow: "auto", marginBottom: 12 }}>
              {preview.map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.borderSoft}`, fontSize: 13 }}>
                  <span>{e.resourceId} · {e.day} · {e.start}–{e.end} · {e.subject} · {e.department}</span>
                  {e.ok ? <Badge tone="green" icon={<CheckCircle2 size={12} />}>Valid</Badge> : <Badge tone="red" icon={<AlertTriangle size={12} />}>Conflict / Error</Badge>}
                </div>
              ))}
            </div>
            {preview.some((e) => !e.ok) && (
              <div style={{ marginTop: 10, fontSize: 12, color: C.red600, maxHeight: 150, overflow: "auto" }}>
                ⚠ Row errors detected:
                <ul style={{ margin: "5px 0 0 20px", padding: 0 }}>
                  {preview.filter(e => !e.ok).map((e, idx) => (
                    <li key={idx}>{e.resourceId} ({e.day} {e.start}–{e.end}): {e.conflict}</li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <span style={{ fontSize: 12, color: C.inkSoft }}>✓ {validRowsCount} entries valid · ⚠ {invalidRowsCount} need attention</span>
              <div style={{ display: "flex", gap: 8 }}>
                <Button tone="ghost" size="sm" onClick={() => setPreview(null)}>Cancel</Button>
                <Button tone="primary" size="sm" disabled={validRowsCount === 0 || invalidRowsCount > 0} style={(validRowsCount === 0 || invalidRowsCount > 0) ? { opacity: .45, cursor: "not-allowed" } : {}} onClick={confirmImport}>Confirm Import</Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function BlockedSlots({ state, dispatch }) {
  const [form, setForm] = useState({ resourceId: state.resources[0]?.id || "COMP-LAB-203", startDate: "2026-08-28", endDate: "2026-08-28", start: "14:00", end: "16:00", reason: "Maintenance" });
  const set = (k, v) => setForm({ ...form, [k]: v });

  const refreshBlocks = async () => {
    try {
      const blocks = await bookingService.getMaintenanceBlocks();
      const mapped = blocks.map(b => ({
        id: b.id,
        resourceId: b.resourceId,
        date: b.startDate,
        startDate: b.startDate,
        endDate: b.endDate,
        start: b.startTime,
        end: b.endTime,
        reason: b.reason
      }));
      dispatch({ type: "SET_BLOCKED_SLOTS", blockedSlots: mapped });
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlock = async () => {
    try {
      await bookingService.createMaintenanceBlock({
        resourceId: form.resourceId,
        startDate: form.startDate,
        endDate: form.endDate,
        startTime: form.start,
        endTime: form.end,
        reason: form.reason
      });
      await refreshBlocks();
      alert("Resource blocked successfully.");
    } catch (e) {
      alert("Failed to block resource: " + e.message);
    }
  };

  const handleRemove = async (id) => {
    try {
      await bookingService.deleteMaintenanceBlock(id);
      await refreshBlocks();
      alert("Block removed successfully.");
    } catch (e) {
      alert("Failed to remove block: " + e.message);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <SectionTitle title="Blocked Resources" />
        {state.blockedSlots.length === 0 && <div style={{ fontSize: 13, color: C.inkSoft }}>No active maintenance blocks.</div>}
        <div style={{ display: "grid", gap: 10 }}>
          {state.blockedSlots.map((b) => {
            const r = state.resources.find((x) => x.id === b.resourceId);
            return (
              <Card key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r?.name || "Unknown Resource"}</div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft }}>{b.startDate && b.endDate ? `${b.startDate} to ${b.endDate}` : b.date} · {b.start}–{b.end}</div>
                  <Badge tone="amber">{b.reason}</Badge>
                </div>
                <Button tone="danger" size="sm" onClick={() => handleRemove(b.id)}>Remove</Button>
              </Card>
            );
          })}
        </div>
      </div>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Block Resource</div>
        <Field label="Resource"><select style={inputStyle} value={form.resourceId} onChange={(e) => set("resourceId", e.target.value)}>{state.resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Field style={{ flex: 1 }} label="Start Date"><input type="date" style={inputStyle} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
          <Field style={{ flex: 1 }} label="End Date"><input type="date" style={inputStyle} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Field style={{ flex: 1 }} label="Start Time"><input type="time" style={inputStyle} value={form.start} onChange={(e) => set("start", e.target.value)} /></Field>
          <Field style={{ flex: 1 }} label="End Time"><input type="time" style={inputStyle} value={form.end} onChange={(e) => set("end", e.target.value)} /></Field>
        </div>
        <Field label="Reason"><select style={inputStyle} value={form.reason} onChange={(e) => set("reason", e.target.value)}>{["Maintenance", "Examination", "Event", "Department Reservation", "Other"].map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Button tone="primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleBlock}>Block Resource</Button>
      </Card>
    </div>
  );
}

function AdminBookings({ state }) {
  return (
    <div>
      <SectionTitle title="All Bookings" />
      <Card style={{ padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", fontSize: 13 }}>
          <thead><tr>{["Booking ID", "Resource", "User", "Date", "Time", "Node", "Status"].map((h) => <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10.5, textTransform: "uppercase", color: C.inkFaint, borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {state.bookings.map((b) => {
              const r = state.resources.find((x) => x.id === b.resourceId);
              return (
                <tr key={b.id}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{b.id}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{r?.name || "Unknown Resource"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{b.userEmail}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{b.date}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{b.start}–{b.end}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{r?.nodeId || ""}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}><Badge tone={b.status === "confirmed" ? "green" : "red"}>{b.status.toUpperCase()}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* =========================================================================
   ADMIN — DISTRIBUTED SYSTEM
   ========================================================================= */
function ServicesPage({ state }) {
  return (
    <div>
      <SectionTitle title="Services" sub="Each backend service and infrastructure component" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {state.services.map((s) => (
          <Card key={s.id} style={{ borderTop: `3px solid ${s.status === "online" ? C.blue500 : C.red600}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b>{s.name}</b>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: s.status === "online" ? C.green600 : C.red600, display: "flex", alignItems: "center" }}><StatusDot online={s.status === "online"} />{s.status.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 8 }}>Port {s.port} · v{s.version}</div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>Instances: {s.instances.length}</div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>Requests: {s.instances.reduce((a, i) => a + i.requests, 0)}</div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>Uptime: {s.uptime}%</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CommunicationPage({ state }) {
  const recent = state.events.slice(0, 10);
  const Box = ({ children, accent = "blue" }) => <div style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${accent === "blue" ? C.blue300 : C.green300}`, background: accent === "blue" ? C.blue50 : C.green50, fontSize: 12, fontWeight: 600, textAlign: "center" }}>{children}</div>;
  return (
    <div>
      <SectionTitle title="Service Communication" sub="Mock inter-service message flow" />
      <Card>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Box>API Gateway</Box>
          <ChevronRight size={16} style={{ transform: "rotate(90deg)" }} color={C.inkFaint} />
          <div style={{ display: "flex", gap: 10 }}>
            <Box accent="green">Resource Service</Box><Box accent="green">Booking Service</Box><Box accent="green">Timetable Service</Box>
          </div>
          <ChevronRight size={16} style={{ transform: "rotate(90deg)" }} color={C.inkFaint} />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Box>RabbitMQ</Box><ChevronRight size={16} color={C.inkFaint} /><Box>Notification Service</Box>
          </div>
        </div>
      </Card>
      <SectionTitle title="Message Log" />
      <Card style={{ padding: 0 }}>
        {recent.map((e) => (
          <div key={e.id} style={{ display: "flex", gap: 12, padding: "9px 14px", borderBottom: `1px solid ${C.borderSoft}`, fontSize: 12.5 }}>
            <span style={{ color: C.inkFaint, width: 70 }} className="mono">{e.ts}</span>
            <span style={{ fontWeight: 600 }}>{e.source} → {e.destination}</span>
            <span style={{ color: C.inkSoft }}>{e.event}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ScalabilityPage({ state, dispatch }) {
  const svc = state.services.find((s) => s.id === "booking");
  const total = svc.instances.reduce((a, i) => a + i.requests, 0) || 1;
  return (
    <div>
      <SectionTitle title="Scalability" sub="Booking Service — horizontal scaling" action={
        <div style={{ display: "flex", gap: 8 }}>
          <Button tone="ghost" size="sm" onClick={() => dispatch({ type: "REMOVE_INSTANCE", id: "booking" })}><Minus size={13} /> Remove Instance</Button>
          <Button tone="primary" size="sm" onClick={() => dispatch({ type: "ADD_INSTANCE", id: "booking" })}><Plus size={13} /> Add Instance</Button>
        </div>
      } />
      <div style={{ fontSize: 13, marginBottom: 12 }}>Current Instances: <b>{svc.instances.length}</b></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
        {svc.instances.map((i) => (
          <Card key={i.id}>
            <b>{i.id}</b>
            <div style={{ marginTop: 6 }}><Badge tone="green"><StatusDot online />ONLINE</Badge></div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 8 }}>{i.requests} requests</div>
          </Card>
        ))}
      </div>
      <SectionTitle title="Request Distribution" />
      <Card>
        {svc.instances.map((i) => (
          <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span style={{ width: 90, fontSize: 12.5, fontWeight: 600 }}>{i.id}</span>
            <div style={{ flex: 1, height: 9, background: C.surfaceAlt, borderRadius: 5, overflow: "hidden" }}>
              <div style={{ width: `${(i.requests / total) * 100}%`, height: "100%", background: C.blue500 }} />
            </div>
            <span style={{ fontSize: 12, color: C.inkSoft, width: 24, textAlign: "right" }}>{i.requests}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function FaultSimulation({ state, dispatch }) {
  return (
    <div>
      <SectionTitle title="Fault Simulation" sub="Toggle a service off to demonstrate isolation and graceful degradation" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {state.services.filter((s) => ["gateway", "resource", "booking", "timetable", "notification"].includes(s.id)).map((s) => (
          <Card key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b>{s.name}</b>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: s.status === "online" ? C.green600 : C.red600 }}><StatusDot online={s.status === "online"} />{s.status.toUpperCase()}</span>
            </div>
            <Button tone={s.status === "online" ? "danger" : "primary"} size="sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={() => dispatch({ type: "TOGGLE_SERVICE", id: s.id })}>
              {s.status === "online" ? "Simulate Failure" : "Restore Service"}
            </Button>
          </Card>
        ))}
      </div>
      {state.services.find((s) => s.id === "booking").status === "offline" && (
        <Card style={{ marginTop: 18, background: C.red100, border: `1px solid ${C.red100}` }}>
          <div style={{ fontWeight: 700, color: C.red600 }}>Booking operations unavailable</div>
          <div style={{ fontSize: 12.5, color: C.ink, marginTop: 8 }}>
            Resource browsing → <b style={{ color: C.green600 }}>AVAILABLE</b> &nbsp;·&nbsp; Timetable viewing → <b style={{ color: C.green600 }}>AVAILABLE</b> &nbsp;·&nbsp; New bookings → <b style={{ color: C.red600 }}>BLOCKED</b>
          </div>
        </Card>
      )}
    </div>
  );
}

function EventLogs({ state, filter, setFilter }) {
  const services = ["All", ...state.services.map((s) => s.name), "Admin", "System"];
  const filtered = state.events.filter((e) => (filter.service === "All" || e.source === filter.service || e.destination === filter.service) && (filter.status === "All" || e.status === filter.status));
  return (
    <div>
      <SectionTitle title="Event Logs" sub="Distributed application event stream" />
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Service"><select style={inputStyle} value={filter.service} onChange={(e) => setFilter({ ...filter, service: e.target.value })}>{services.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Status"><select style={inputStyle} value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>{["All", "OK", "FAIL"].map((s) => <option key={s}>{s}</option>)}</select></Field>
        </div>
      </Card>
      <Card style={{ padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", fontSize: 12.5 }}>
          <thead><tr>{["Timestamp", "Source", "Destination", "Event", "Status"].map((h) => <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontSize: 10.5, textTransform: "uppercase", color: C.inkFaint, borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                <td style={{ padding: "8px 14px", borderBottom: `1px solid ${C.borderSoft}` }} className="mono">{e.ts}</td>
                <td style={{ padding: "8px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{e.source}</td>
                <td style={{ padding: "8px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{e.destination}</td>
                <td style={{ padding: "8px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>{e.event}</td>
                <td style={{ padding: "8px 14px", borderBottom: `1px solid ${C.borderSoft}` }}><Badge tone={e.status === "OK" ? "green" : "red"}>{e.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* =========================================================================
   SIDEBAR / HEADER / LOGIN
   ========================================================================= */
function NavItem({ icon, label, active, onClick, accent = "green" }) {
  const bg = active ? (accent === "blue" ? C.blue50 : C.green50) : "transparent";
  const fg = active ? (accent === "blue" ? C.blue900 : C.green900) : C.inkSoft;
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 7, border: "none", background: bg, color: fg, fontSize: 13.5, fontWeight: active ? 600 : 500, cursor: "pointer", marginBottom: 2 }}>
      {icon}{label}
    </button>
  );
}
function NavLabel({ children }) { return <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: .06, color: C.inkFaint, fontWeight: 700, padding: "0 10px", margin: "16px 0 6px" }}>{children}</div>; }

function Sidebar({ user, isAdmin, page, go, onLogout }) {
  const iconProps = { size: 16, strokeWidth: 1.8 };
  return (
    <div style={{ width: 250, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, padding: "20px 14px", position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 6px 18px" }}>
        <div style={{ display: "flex", gap: 3 }}>
          <div style={{ width: 8, height: 24, borderRadius: 2, background: C.green500 }} />
          <div style={{ width: 8, height: 24, borderRadius: 2, background: C.blue500 }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>DistriBook</div>
          <div style={{ fontSize: 9.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: .05 }}>Resource Network</div>
        </div>
      </div>

      {!isAdmin && (
        <>
          {user?.role === "student" && (
            <>
              <NavItem icon={<LayoutDashboard {...iconProps} />} label="Dashboard" active={page === "dashboard"} onClick={() => go("dashboard")} />
              <NavItem icon={<Search {...iconProps} />} label="Find Resources" active={page === "find"} onClick={() => go("find")} />
              <NavItem icon={<CalendarCheck {...iconProps} />} label="My Bookings" active={page === "mybookings"} onClick={() => go("mybookings")} />
              <NavItem icon={<Inbox {...iconProps} />} label="My Requests" active={page === "requests"} onClick={() => go("requests")} />
              <NavItem icon={<Building2 {...iconProps} />} label="Campus Explorer" active={page === "campus"} onClick={() => go("campus")} />
            </>
          )}
          {user?.role === "faculty" && (
            <>
              <NavItem icon={<LayoutDashboard {...iconProps} />} label="Dashboard" active={page === "dashboard"} onClick={() => go("dashboard")} />
              <NavItem icon={<Search {...iconProps} />} label="Find Resources" active={page === "find"} onClick={() => go("find")} />
              <NavItem icon={<Inbox {...iconProps} />} label="Faculty Approvals" active={page === "faculty-approvals"} onClick={() => go("faculty-approvals")} />
              <NavItem icon={<CalendarCheck {...iconProps} />} label="My Bookings" active={page === "mybookings"} onClick={() => go("mybookings")} />
              <NavItem icon={<Building2 {...iconProps} />} label="Campus Explorer" active={page === "campus"} onClick={() => go("campus")} />
            </>
          )}
          {user?.role === "coordinator" && (
            <>
              <NavItem icon={<LayoutDashboard {...iconProps} />} label="Coordinator Dashboard" active={page === "coordinator-dashboard"} onClick={() => go("coordinator-dashboard")} />
              <NavItem icon={<Inbox {...iconProps} />} label="Hall Approvals" active={page === "coordinator-approvals"} onClick={() => go("coordinator-approvals")} />
              <NavItem icon={<CalendarClock {...iconProps} />} label="Hall Availability" active={page === "hall-availability"} onClick={() => go("hall-availability")} />
            </>
          )}
          {user?.role === "labassistant" && (
            <>
              <NavItem icon={<LayoutDashboard {...iconProps} />} label="Lab Assistant Dashboard" active={page === "labassistant-dashboard"} onClick={() => go("labassistant-dashboard")} />
              <NavItem icon={<Inbox {...iconProps} />} label="Lab Approvals" active={page === "labassistant-approvals"} onClick={() => go("labassistant-approvals")} />
              <NavItem icon={<CalendarClock {...iconProps} />} label="Lab Availability" active={page === "lab-availability"} onClick={() => go("lab-availability")} />
            </>
          )}
        </>
      )}

      {isAdmin && <>
        <NavItem icon={<LayoutDashboard {...iconProps} />} label="Dashboard" active={page === "admin-dashboard"} onClick={() => go("admin-dashboard")} />
        <NavLabel>Resource Management</NavLabel>
        <NavItem icon={<Boxes {...iconProps} />} label="Resources" active={page === "admin-resources"} onClick={() => go("admin-resources")} />
        <NavItem icon={<CalendarClock {...iconProps} />} label="Timetables" active={page === "timetable"} onClick={() => go("timetable")} />
        <NavItem icon={<Ban {...iconProps} />} label="Blocked Slots" active={page === "blocked"} onClick={() => go("blocked")} />
        <NavItem icon={<CalendarCheck {...iconProps} />} label="Bookings" active={page === "admin-bookings"} onClick={() => go("admin-bookings")} />
        <NavItem icon={<Inbox {...iconProps} />} label="Requests" active={page === "admin-requests"} onClick={() => go("admin-requests")} />
        <NavLabel>Distributed System</NavLabel>
        <NavItem accent="blue" icon={<Server {...iconProps} />} label="Services" active={page === "services"} onClick={() => go("services")} />
        <NavItem accent="blue" icon={<Share2 {...iconProps} />} label="Communication" active={page === "communication"} onClick={() => go("communication")} />
        <NavItem accent="blue" icon={<Layers {...iconProps} />} label="Scalability" active={page === "scalability"} onClick={() => go("scalability")} />
        <NavItem accent="blue" icon={<Zap {...iconProps} />} label="Fault Simulation" active={page === "fault"} onClick={() => go("fault")} />
        <NavItem accent="blue" icon={<ScrollText {...iconProps} />} label="Event Logs" active={page === "eventlogs"} onClick={() => go("eventlogs")} />
      </>}

      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: `1px solid ${C.borderSoft}` }}>
        <NavItem icon={<Settings {...iconProps} />} label="Settings" />
        <NavItem icon={<LogOut {...iconProps} />} label="Logout" onClick={onLogout} />
      </div>
    </div>
  );
}

function Header({
  user,
  isAdmin,
  bookingOffline,
  notifications = [],
  unreadCount = 0,
  showDropdown = false,
  setShowDropdown,
  onMarkAsRead,
  onMarkAllAsRead
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 30px", borderBottom: `1px solid ${C.border}`, background: C.surface, position: "sticky", top: 0, zIndex: 10 }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{isAdmin ? "Distributed Resource Management" : "DistriBook"}</div>
        <div style={{ fontSize: 12, color: C.inkSoft }}>Distributed Classroom &amp; Laboratory Resource Booking System</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
        {bookingOffline && <Badge tone="red" icon={<AlertTriangle size={12} />}>Booking Service Offline</Badge>}
        
        {/* Notification Bell */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            position: "relative",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: showDropdown ? C.green600 : C.inkSoft,
            outline: "none"
          }}
          title="Notifications"
        >
          <Bell size={18} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: C.red600,
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              borderRadius: "50%",
              width: 15,
              height: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${C.surface}`
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        <Badge tone={isAdmin ? "blue" : "green"}>{user.role.toUpperCase()}</Badge>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.green600, color: "#fff", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>

        {/* Dropdown Panel */}
        {showDropdown && (
          <div style={{
            position: "absolute",
            top: 40,
            right: 0,
            width: 320,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            zIndex: 100,
            maxHeight: 400,
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              borderBottom: `1px solid ${C.borderSoft}`
            }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.blue600,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div style={{ overflowY: "auto", flex: 1, maxHeight: 300 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "20px 14px", textAlign: "center", color: C.inkFaint, fontSize: 12.5 }}>
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "10px 14px",
                      borderBottom: `1px solid ${C.borderSoft}`,
                      background: n.read ? "transparent" : `${C.blue50}44`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      position: "relative"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <span style={{
                        fontWeight: 600,
                        fontSize: 12.5,
                        color: n.eventType === "booking.cancelled" ? C.red600 : C.green700
                      }}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <button
                          onClick={() => onMarkAsRead(n.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: C.blue600,
                            cursor: "pointer",
                            padding: 2,
                            display: "flex",
                            alignItems: "center"
                          }}
                          title="Mark as read"
                        >
                          <Check size={12} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.3 }}>{n.message}</span>
                    <span style={{ fontSize: 10, color: C.inkFaint }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("pradnya.wakode23@pccoepune.org");
  const [password, setPassword] = useState("");
  const submit = () => { const u = USERS[email.trim().toLowerCase()]; if (u) onLogin(u); else alert("Unknown demo account. Use one of the demo emails below."); };
  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: FONT, background: C.bg }}>
      <div style={{ flex: 1.1, background: C.green900, color: "#fff", padding: "60px 56px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 22 }}>
          <div style={{ width: 26, height: 8, borderRadius: 3, background: C.green300 }} />
          <div style={{ width: 26, height: 8, borderRadius: 3, background: C.blue300 }} />
        </div>
        <div style={{ fontSize: 30, fontWeight: 700 }}>DistriBook</div>
        <div style={{ fontSize: 14, opacity: .85, marginTop: 8, maxWidth: 380, lineHeight: 1.5 }}>
          Distributed Classroom &amp; Laboratory Resource Booking System.
        </div>
        <div style={{ fontSize: 13, opacity: .7, marginTop: 26, maxWidth: 380, lineHeight: 1.6 }}>
          Find, verify and reserve classrooms, laboratories and shared campus
          resources — while the platform runs as a set of independent,
          horizontally-scalable services underneath.
        </div>
        <div style={{ display: "flex", gap: 22, marginTop: 40 }}>
          {["Resource Service", "Booking Service", "Timetable Service"].map((s) => (
            <div key={s} style={{ fontSize: 11.5, opacity: .8, display: "flex", alignItems: "center", gap: 6 }}><StatusDot online />{s}</div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 360 }}>
          <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Sign in</div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 20 }}>Use a demo account to continue.</div>
          <Field label="Email"><input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Password"><input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>
          <Button tone="primary" style={{ width: "100%", justifyContent: "center" }} onClick={submit}>Login</Button>
          <div style={{ marginTop: 18, padding: 12, background: C.surfaceAlt, borderRadius: 8, fontSize: 11.5, color: C.inkSoft, lineHeight: 1.6 }}>
            <b style={{ color: C.ink }}>pradnya.wakode23@pccoepune.org</b> &nbsp;·&nbsp; <b style={{ color: C.ink }}>shreeya.patil23@pccoepune.org</b> &nbsp;·&nbsp; <b style={{ color: C.ink }}>faculty@pccoepune.org</b> &nbsp;·&nbsp; <b style={{ color: C.ink }}>coordinator@pccoepune.org</b> &nbsp;·&nbsp; <b style={{ color: C.ink }}>labassistant@pccoepune.org</b> &nbsp;·&nbsp; <b style={{ color: C.ink }}>admin@pccoepune.org</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function FacultyApprovals({ state, user, dispatch }) {
  const pending = state.bookings.filter(b => b.facultyEmail === user.email && !b.facultyApproved && b.status?.toUpperCase() === "PENDING");

  const handleApprove = async (id) => {
    try {
      await bookingService.approveBooking(id);
      const bookingUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
      const bkRes = await authFetch(`${bookingUrl}/bookings`);
      if (bkRes.ok) {
        dispatch({ type: "SET_ALL_BOOKINGS", bookings: await bkRes.json() });
      }
      alert("Booking request approved by faculty successfully!");
    } catch (e) {
      alert("Failed to approve request: " + e.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejection:") || "Rejected by faculty";
    try {
      await bookingService.rejectBooking(id, reason);
      const bookingUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
      const bkRes = await authFetch(`${bookingUrl}/bookings`);
      if (bkRes.ok) {
        dispatch({ type: "SET_ALL_BOOKINGS", bookings: await bkRes.json() });
      }
      alert("Booking request rejected by faculty.");
    } catch (e) {
      alert("Failed to reject request: " + e.message);
    }
  };

  return (
    <div>
      <SectionTitle title="Faculty Approval Dashboard" />
      <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 16 }}>Review student event booking requests assigned to you for supervision.</div>
      {pending.length === 0 ? (
        <Card><div style={{ fontSize: 13, color: C.inkSoft }}>No pending approvals found.</div></Card>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {pending.map(b => {
            const r = state.resources.find(x => x.id === b.resourceId);
            return (
              <Card key={b.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.eventName || b.purpose}</div>
                    <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>
                      <b>Resource:</b> {r?.name || b.resourceId} · <b>Date:</b> {b.startDate && b.endDate ? `${b.startDate} to ${b.endDate}` : b.date} · <b>Time:</b> {b.start || b.startTime}–{b.end || b.endTime}
                    </div>
                    <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 4 }}>
                      Requested by: {b.userName || b.userId}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button tone="primary" size="sm" onClick={() => handleApprove(b.id)}>Approve</Button>
                    <Button tone="danger" size="sm" onClick={() => handleReject(b.id)}>Reject</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CoordinatorApprovals({ state, user, dispatch }) {
  const pending = state.bookings.filter(b => {
    const r = state.resources.find(x => x.id === b.resourceId);
    const isControlled = r?.requiresApproval;
    const isMultiDay = b.startDate !== null;
    if (b.status?.toUpperCase() !== "PENDING") return false;
    if (!isControlled && !isMultiDay) return false;
    if (b.facultyEmail && !b.facultyApproved) return false;
    return !b.coordinatorApproved;
  });

  const handleApprove = async (id) => {
    try {
      await bookingService.approveBooking(id);
      const bookingUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
      const bkRes = await authFetch(`${bookingUrl}/bookings`);
      if (bkRes.ok) {
        dispatch({ type: "SET_ALL_BOOKINGS", bookings: await bkRes.json() });
      }
      alert("Booking request approved by coordinator successfully!");
    } catch (e) {
      alert("Failed to approve request: " + e.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejection:") || "Rejected by coordinator";
    try {
      await bookingService.rejectBooking(id, reason);
      const bookingUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
      const bkRes = await authFetch(`${bookingUrl}/bookings`);
      if (bkRes.ok) {
        dispatch({ type: "SET_ALL_BOOKINGS", bookings: await bkRes.json() });
      }
      alert("Booking request rejected by coordinator.");
    } catch (e) {
      alert("Failed to reject request: " + e.message);
    }
  };

  return (
    <div>
      <SectionTitle title="Coordinator Approval Dashboard" />
      <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 16 }}>Review controlled resource and faculty-approved event requests for your department.</div>
      {pending.length === 0 ? (
        <Card><div style={{ fontSize: 13, color: C.inkSoft }}>No pending coordinator approvals.</div></Card>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {pending.map(b => {
            const r = state.resources.find(x => x.id === b.resourceId);
            return (
              <Card key={b.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.eventName || b.purpose}</div>
                    <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>
                      <b>Resource:</b> {r?.name || b.resourceId} · <b>Date:</b> {b.startDate && b.endDate ? `${b.startDate} to ${b.endDate}` : b.date} · <b>Time:</b> {b.start || b.startTime}–{b.end || b.endTime}
                    </div>
                    <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 4 }}>
                      Requested by: {b.userName || b.userId} {b.facultyEmail ? `(Faculty Approved)` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button tone="primary" size="sm" onClick={() => handleApprove(b.id)}>Approve</Button>
                    <Button tone="danger" size="sm" onClick={() => handleReject(b.id)}>Reject</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CoordinatorDashboard({ user, state, go }) {
  const pendingCount = state.bookings.filter(b => {
    const r = state.resources.find(x => x.id === b.resourceId);
    const isControlled = r?.requiresApproval;
    const isMultiDay = b.startDate !== null;
    return b.status?.toUpperCase() === "PENDING" && (isControlled || isMultiDay) && (!b.facultyEmail || b.facultyApproved) && !b.coordinatorApproved;
  }).length;

  return (
    <div>
      <SectionTitle title="Coordinator Dashboard" sub={`Welcome back, ${user.name}`} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 13, color: C.inkSoft }}>Pending Approvals</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: pendingCount > 0 ? C.amber600 : C.ink }}>{pendingCount}</div>
          <Button style={{ marginTop: 10 }} tone="primary" size="sm" onClick={() => go("coordinator-approvals")}>Go to Approvals</Button>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: C.inkSoft }}>Hall Availability Map</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>Check the status of seminar halls in real time.</div>
          <Button style={{ marginTop: 18 }} tone="secondary" size="sm" onClick={() => go("hall-availability")}>View Chart</Button>
        </Card>
      </div>
    </div>
  );
}

function LabAssistantDashboard({ user, state, go }) {
  const pendingCount = state.bookings.filter(b => {
    const r = state.resources.find(x => x.id === b.resourceId);
    const isLab = r?.type?.toLowerCase()?.includes("lab") || r?.type?.toLowerCase()?.includes("laboratory");
    return b.status?.toUpperCase() === "PENDING" && isLab && (!b.facultyEmail || b.facultyApproved) && !b.labAssistantApproved;
  }).length;

  return (
    <div>
      <SectionTitle title="Lab Assistant Dashboard" sub={`Welcome back, ${user.name}`} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 13, color: C.inkSoft }}>Pending Lab Approvals</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: pendingCount > 0 ? C.amber600 : C.ink }}>{pendingCount}</div>
          <Button style={{ marginTop: 10 }} tone="primary" size="sm" onClick={() => go("labassistant-approvals")}>Go to Approvals</Button>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: C.inkSoft }}>Lab Availability Map</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>Check laboratory schedules and bookings.</div>
          <Button style={{ marginTop: 18 }} tone="secondary" size="sm" onClick={() => go("lab-availability")}>View Chart</Button>
        </Card>
      </div>
    </div>
  );
}

function LabAssistantApprovals({ state, user, dispatch }) {
  const pending = state.bookings.filter(b => {
    const r = state.resources.find(x => x.id === b.resourceId);
    const isLab = r?.type?.toLowerCase()?.includes("lab") || r?.type?.toLowerCase()?.includes("laboratory");
    if (b.status?.toUpperCase() !== "PENDING") return false;
    if (!isLab) return false;
    if (b.facultyEmail && !b.facultyApproved) return false;
    return !b.labAssistantApproved;
  });

  const handleApprove = async (id) => {
    try {
      await bookingService.approveBooking(id);
      const bookingUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
      const bkRes = await authFetch(`${bookingUrl}/bookings`);
      if (bkRes.ok) {
        dispatch({ type: "SET_ALL_BOOKINGS", bookings: await bkRes.json() });
      }
      alert("Lab booking request approved successfully!");
    } catch (e) {
      alert("Failed to approve request: " + e.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejection:") || "Rejected by lab assistant";
    try {
      await bookingService.rejectBooking(id, reason);
      const bookingUrl = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003';
      const bkRes = await authFetch(`${bookingUrl}/bookings`);
      if (bkRes.ok) {
        dispatch({ type: "SET_ALL_BOOKINGS", bookings: await bkRes.json() });
      }
      alert("Lab booking request rejected.");
    } catch (e) {
      alert("Failed to reject request: " + e.message);
    }
  };

  return (
    <div>
      <SectionTitle title="Lab Approvals Dashboard" />
      <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 16 }}>Review pending laboratory booking requests.</div>
      {pending.length === 0 ? (
        <Card><div style={{ fontSize: 13, color: C.inkSoft }}>No pending lab approvals.</div></Card>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {pending.map(b => {
            const r = state.resources.find(x => x.id === b.resourceId);
            return (
              <Card key={b.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.eventName || b.purpose}</div>
                    <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>
                      <b>Lab Name:</b> {r?.name || b.resourceId} · <b>Date:</b> {b.startDate && b.endDate ? `${b.startDate} to ${b.endDate}` : b.date} · <b>Time:</b> {b.start || b.startTime}–{b.end || b.endTime}
                    </div>
                    <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 4 }}>
                      <b>Requested by:</b> {b.userName || b.userId} · <b>Faculty In-charge:</b> {b.facultyEmail || "None"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button tone="primary" size="sm" onClick={() => handleApprove(b.id)}>Approve</Button>
                    <Button tone="danger" size="sm" onClick={() => handleReject(b.id)}>Reject</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AvailabilityChart({ state, resourceFilterType }) {
  const [selectedDate, setSelectedDate] = useState("2026-08-25");

  const resources = state.resources.filter((r) => {
    const isLab = r.type?.toLowerCase()?.includes("lab") || r.type?.toLowerCase()?.includes("laboratory");
    return resourceFilterType === "lab" ? isLab : !isLab;
  });

  const slots = [
    { label: "08:00 - 09:00", start: "08:00", end: "09:00" },
    { label: "09:00 - 10:00", start: "09:00", end: "10:00" },
    { label: "10:00 - 11:00", start: "10:00", end: "11:00" },
    { label: "11:00 - 12:00", start: "11:00", end: "12:00" },
    { label: "12:00 - 13:00", start: "12:00", end: "13:00" },
    { label: "13:00 - 14:00", start: "13:00", end: "14:00" },
    { label: "14:00 - 15:00", start: "14:00", end: "15:00" },
    { label: "15:00 - 16:00", start: "15:00", end: "16:00" },
    { label: "16:00 - 17:00", start: "16:00", end: "17:00" },
    { label: "17:00 - 18:00", start: "17:00", end: "18:00" }
  ];

  return (
    <div>
      <SectionTitle title={`${resourceFilterType === "lab" ? "Lab" : "Hall"} Availability Chart`} />
      <Card style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>Select Date:</span>
        <input type="date" style={{ ...inputStyle, width: 180 }} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      </Card>
      
      <div style={{ display: "grid", gap: 14 }}>
        {resources.map((res) => (
          <Card key={res.id} style={{ padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{res.name} <span style={{ fontSize: 12, fontWeight: 400, color: C.inkSoft }}>({res.building}, Floor {res.floor})</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {slots.map((slot) => {
                const isMaint = state.blockedSlots.some((b) => {
                  if (b.resourceId !== res.id) return false;
                  const inDateRange = b.startDate && b.endDate && selectedDate >= b.startDate && selectedDate <= b.endDate;
                  const matchesSingleDate = b.date === selectedDate;
                  if (!inDateRange && !matchesSingleDate) return false;
                  const [bsH, bsM] = b.start.split(":").map(Number);
                  const [beH, beM] = b.end.split(":").map(Number);
                  const [sH, sM] = slot.start.split(":").map(Number);
                  const [eH, eM] = slot.end.split(":").map(Number);
                  return (sH * 60 + sM < beH * 60 + beM) && (eH * 60 + eM > bsH * 60 + bsM);
                });

                const booking = state.bookings.find((b) => {
                  if (b.resourceId !== res.id) return false;
                  if (b.status?.toLowerCase() === "cancelled") return false;
                  if (b.status?.toLowerCase() === "rejected") return false;
                  const inRange = b.startDate && b.endDate && selectedDate >= b.startDate && selectedDate <= b.endDate;
                  const matchesSingleDate = b.date === selectedDate;
                  if (!inRange && !matchesSingleDate) return false;
                  
                  const [bsH, bsM] = (b.startTime || b.start).split(":").map(Number);
                  const [beH, beM] = (b.endTime || b.end).split(":").map(Number);
                  const [sH, sM] = slot.start.split(":").map(Number);
                  const [eH, eM] = slot.end.split(":").map(Number);
                  return (sH * 60 + sM < beH * 60 + beM) && (eH * 60 + eM > bsH * 60 + bsM);
                });

                let status = "AVAILABLE";
                let tone = C.green500;
                let bg = C.green100;
                let info = null;

                if (isMaint) {
                  status = "MAINTENANCE";
                  tone = C.inkSoft;
                  bg = C.surfaceAlt;
                } else if (booking) {
                  status = booking.status?.toUpperCase() === "PENDING" ? "PENDING" : "BOOKED";
                  tone = status === "PENDING" ? C.amber600 : C.red600;
                  bg = status === "PENDING" ? C.amber100 : C.red100;
                  info = booking;
                }

                return (
                  <div key={slot.label} style={{
                    padding: "10px 12px",
                    background: bg,
                    border: `1px solid ${tone}`,
                    borderRadius: 6,
                    color: tone,
                    fontSize: 12,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 120
                  }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{slot.label}</div>
                      <div style={{ fontWeight: 800, fontSize: 10, letterSpacing: 0.5, marginTop: 4 }}>{status}</div>
                    </div>
                    {info && (
                      <div style={{ marginTop: 6, fontSize: 10.5, color: C.ink, display: "flex", flexDirection: "column", gap: 1 }}>
                        <span style={{ fontWeight: 700 }}>{info.eventName || info.purpose}</span>
                        <span><b>By:</b> {info.userEmail || info.userId}</span>
                        {info.facultyEmail && <span><b>Faculty:</b> {info.facultyEmail}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
