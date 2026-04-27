// Mock data for CrystalCruize Autospa

export interface Attendant {
  id: string;
  name: string;
  phone: string;
  shift: "morning" | "afternoon" | "evening";
  vehiclesHandled: number;
  totalSales: number;
  commission: number;
  status: "active" | "off-duty";
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
}

export interface ServiceAddOn {
  id: string;
  name: string;
  price: number;
}

export interface CarpetWash {
  size: "Small" | "Medium" | "Large";
  color: string;
  amount: number;
  ownerName: string;
  phone: string;
  attendantId: string;
}

export interface Transaction {
  id: string;
  plateNumber: string;
  vehicleType: string;
  services: string[];
  addOns: string[];
  attendantId: string;
  attendantName: string;
  total: number;
  paymentMethod: string;
  paymentStatus: "paid" | "pending" | "partial";
  timestamp: string;
  notes?: string;
  carpetWash?: CarpetWash;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface Customer {
  id: string;
  plateNumber: string;
  name: string;
  phone: string;
  visits: number;
  loyaltyPoints: number;
  lastVisit: string;
}

export const COMMISSION_RATE = 0.3;

/**
 * Single source of truth for commission calculation.
 * Returns an unrounded number — round only at display time so
 * sums of per-attendant commissions always equal the total commission.
 */
export const calcCommission = (sales: number) => sales * COMMISSION_RATE;

export const EXPENSE_CATEGORIES = [
  "Water",
  "Electricity",
  "Detergents",
  "Fuel",
  "Maintenance",
  "Rent",
  "Security",
];

export const mockAttendants: Attendant[] = [
  { id: "1", name: "Eugene", phone: "0712345678", shift: "morning", vehiclesHandled: 14, totalSales: 5600, commission: 1680, status: "active" },
  { id: "2", name: "Ezra", phone: "0723456789", shift: "morning", vehiclesHandled: 12, totalSales: 4800, commission: 1440, status: "active" },
  { id: "3", name: "Sammy", phone: "0734567890", shift: "afternoon", vehiclesHandled: 10, totalSales: 3900, commission: 1170, status: "active" },
  { id: "4", name: "Simo", phone: "0745678901", shift: "afternoon", vehiclesHandled: 8, totalSales: 3200, commission: 960, status: "active" },
];

export const mockServices: Service[] = [
  { id: "1", name: "Regular Wash Sedan", category: "Sedan", price: 250, duration: 20, description: "Standard exterior & interior wash for sedans" },
  { id: "2", name: "Full Wash Sedan", category: "Sedan", price: 300, duration: 30, description: "Complete thorough wash for sedans" },
  { id: "3", name: "Half Wash Sedan", category: "Sedan", price: 150, duration: 15, description: "Quick exterior-only wash for sedans" },
  { id: "4", name: "Regular Wash SUV", category: "SUV", price: 400, duration: 25, description: "Standard exterior & interior wash for SUVs" },
  { id: "5", name: "Full Wash SUV", category: "SUV", price: 500, duration: 35, description: "Complete thorough wash for SUVs" },
  { id: "6", name: "Half Wash SUV", category: "SUV", price: 200, duration: 15, description: "Quick exterior-only wash for SUVs" },
  { id: "7", name: "Bike Wash Full", category: "Bike", price: 100, duration: 15, description: "Full motorcycle wash" },
  { id: "8", name: "Bike Wash Half", category: "Bike", price: 50, duration: 10, description: "Quick motorcycle rinse" },
];

export const mockAddOns: ServiceAddOn[] = [
  { id: "1", name: "Engine Wash", price: 200 },
  { id: "2", name: "Under Wash", price: 200 },
  { id: "3", name: "Steam Wash 5 Seater", price: 1500 },
  { id: "4", name: "Steam Wash 7 Seater", price: 2000 },
  { id: "5", name: "Waxing", price: 700 },
  { id: "6", name: "Tire Shine", price: 100 },
  { id: "7", name: "Dashboard Polish", price: 100 },
];

export const mockTransactions: Transaction[] = [
  { id: "T001", plateNumber: "KCA 123A", vehicleType: "Sedan", services: ["Regular Wash Sedan"], addOns: ["Tire Shine"], attendantId: "1", attendantName: "Eugene", total: 350, paymentMethod: "M-Pesa", paymentStatus: "paid", timestamp: "2026-02-27T08:30:00" },
  { id: "T002", plateNumber: "KBZ 456B", vehicleType: "SUV", services: ["Full Wash SUV", "Engine Wash"], addOns: [], attendantId: "2", attendantName: "Ezra", total: 700, paymentMethod: "Cash", paymentStatus: "paid", timestamp: "2026-02-27T09:15:00" },
  { id: "T003", plateNumber: "KDA 789C", vehicleType: "Sedan", services: ["Full Wash Sedan"], addOns: ["Waxing", "Dashboard Polish"], attendantId: "2", attendantName: "Ezra", total: 1100, paymentMethod: "M-Pesa", paymentStatus: "paid", timestamp: "2026-02-27T10:00:00" },
  { id: "T004", plateNumber: "KCB 321D", vehicleType: "SUV", services: ["Regular Wash SUV"], addOns: ["Tire Shine"], attendantId: "3", attendantName: "Sammy", total: 500, paymentMethod: "Bank Transfer", paymentStatus: "pending", timestamp: "2026-02-27T11:30:00" },
  { id: "T005", plateNumber: "KAA 654E", vehicleType: "Motorcycle", services: ["Bike Wash Full"], addOns: [], attendantId: "4", attendantName: "Simo", total: 100, paymentMethod: "Cash", paymentStatus: "paid", timestamp: "2026-02-27T12:00:00" },
  { id: "T006", plateNumber: "KDB 987F", vehicleType: "Sedan", services: ["Regular Wash Sedan", "Waxing"], addOns: [], attendantId: "1", attendantName: "Eugene", total: 950, paymentMethod: "M-Pesa", paymentStatus: "paid", timestamp: "2026-02-27T13:45:00" },
];

export const mockExpenses: Expense[] = [
  // Today
  { id: "E001", category: "Water", description: "Water bill - daily", amount: 500, date: "2026-02-27" },
  { id: "E002", category: "Detergents", description: "Car shampoo", amount: 800, date: "2026-02-27" },
  { id: "E003", category: "Electricity", description: "Power - daily", amount: 300, date: "2026-02-27" },
  // This week
  { id: "E004", category: "Fuel", description: "Generator fuel", amount: 2000, date: "2026-02-25" },
  { id: "E005", category: "Maintenance", description: "Pressure washer repair", amount: 1500, date: "2026-02-24" },
  { id: "E006", category: "Detergents", description: "Wax supplies", amount: 1200, date: "2026-02-23" },
  // This month
  { id: "E007", category: "Rent", description: "Monthly rent", amount: 25000, date: "2026-02-01" },
  { id: "E008", category: "Security", description: "Security guard - Feb", amount: 8000, date: "2026-02-01" },
  { id: "E009", category: "Electricity", description: "Power bill - Feb", amount: 4200, date: "2026-02-05" },
  { id: "E010", category: "Water", description: "Water bill - Feb", amount: 5000, date: "2026-02-03" },
];

export const mockCustomers: Customer[] = [
  { id: "C001", plateNumber: "KCA 123A", name: "John Kamau", phone: "0712000001", visits: 16, loyaltyPoints: 160, lastVisit: "2026-02-27" },
  { id: "C002", plateNumber: "KBZ 456B", name: "Susan Njeri", phone: "0712000002", visits: 8, loyaltyPoints: 80, lastVisit: "2026-02-25" },
  { id: "C003", plateNumber: "KDA 789C", name: "Michael Odhiambo", phone: "0712000003", visits: 5, loyaltyPoints: 50, lastVisit: "2026-02-23" },
  { id: "C004", plateNumber: "KDB 987F", name: "Faith Muthoni", phone: "0712000004", visits: 15, loyaltyPoints: 150, lastVisit: "2026-02-27" },
];

export const dashboardStats = {
  totalVehiclesToday: 44,
  totalVehiclesWeek: 210,
  totalVehiclesMonth: 890,
  totalRevenue: 17500,
  avgPerVehicle: 398,
  totalCommission: 5250, // 30% of revenue
  revenueByService: [
    { name: "Regular Wash Sedan", revenue: 5000 },
    { name: "Full Wash Sedan", revenue: 3600 },
    { name: "Regular Wash SUV", revenue: 3200 },
    { name: "Full Wash SUV", revenue: 2500 },
    { name: "Half Wash Sedan", revenue: 1200 },
    { name: "Half Wash SUV", revenue: 800 },
    { name: "Bike Wash Full", revenue: 700 },
    { name: "Bike Wash Half", revenue: 500 },
  ],
  revenueByPayment: [
    { name: "M-Pesa", value: 10500 },
    { name: "Cash", value: 5000 },
    { name: "Bank Transfer", value: 1500 },
    { name: "Corporate", value: 500 },
  ],
  peakHours: [
    { hour: "7AM", vehicles: 3 },
    { hour: "8AM", vehicles: 7 },
    { hour: "9AM", vehicles: 9 },
    { hour: "10AM", vehicles: 8 },
    { hour: "11AM", vehicles: 6 },
    { hour: "12PM", vehicles: 5 },
    { hour: "1PM", vehicles: 4 },
    { hour: "2PM", vehicles: 3 },
    { hour: "3PM", vehicles: 5 },
    { hour: "4PM", vehicles: 6 },
    { hour: "5PM", vehicles: 8 },
    { hour: "6PM", vehicles: 4 },
  ],
  todayExpenses: 1600,
  todayProfit: 15900,
};
