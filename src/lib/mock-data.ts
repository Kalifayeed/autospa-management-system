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
  duration: number; // minutes
  description: string;
}

export interface ServiceAddOn {
  id: string;
  name: string;
  price: number;
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
  name: string;
  phone: string;
  visits: number;
  loyaltyPoints: number;
  lastVisit: string;
}

export const mockAttendants: Attendant[] = [
  { id: "1", name: "James Mwangi", phone: "0712345678", shift: "morning", vehiclesHandled: 12, totalSales: 8400, commission: 1260, status: "active" },
  { id: "2", name: "Grace Wanjiku", phone: "0723456789", shift: "morning", vehiclesHandled: 15, totalSales: 10200, commission: 1530, status: "active" },
  { id: "3", name: "Peter Ochieng", phone: "0734567890", shift: "afternoon", vehiclesHandled: 9, totalSales: 6300, commission: 945, status: "active" },
  { id: "4", name: "Mary Akinyi", phone: "0745678901", shift: "afternoon", vehiclesHandled: 11, totalSales: 7700, commission: 1155, status: "active" },
  { id: "5", name: "David Kimani", phone: "0756789012", shift: "evening", vehiclesHandled: 7, totalSales: 4900, commission: 735, status: "off-duty" },
];

export const mockServices: Service[] = [
  { id: "1", name: "Small Car Wash", category: "Wash", price: 500, duration: 20, description: "Exterior & interior wash for sedans and hatchbacks" },
  { id: "2", name: "SUV Wash", category: "Wash", price: 800, duration: 30, description: "Full wash for SUVs, pickups, and larger vehicles" },
  { id: "3", name: "Engine Wash", category: "Specialty", price: 600, duration: 25, description: "Deep engine bay cleaning and degreasing" },
  { id: "4", name: "Full Detailing", category: "Premium", price: 3000, duration: 120, description: "Complete interior and exterior detailing" },
  { id: "5", name: "Wax & Polish", category: "Premium", price: 1500, duration: 60, description: "Professional wax and polish finish" },
  { id: "6", name: "Underwash", category: "Specialty", price: 400, duration: 15, description: "Undercarriage pressure wash" },
  { id: "7", name: "Bike Wash", category: "Wash", price: 300, duration: 15, description: "Motorcycle and bicycle cleaning" },
];

export const mockAddOns: ServiceAddOn[] = [
  { id: "1", name: "Air Freshener", price: 100 },
  { id: "2", name: "Tire Shine", price: 200 },
  { id: "3", name: "Dashboard Polish", price: 150 },
  { id: "4", name: "Seat Conditioning", price: 300 },
  { id: "5", name: "Windshield Treatment", price: 250 },
];

export const mockTransactions: Transaction[] = [
  { id: "T001", plateNumber: "KCA 123A", vehicleType: "Sedan", services: ["Small Car Wash"], addOns: ["Tire Shine"], attendantId: "1", attendantName: "James Mwangi", total: 700, paymentMethod: "M-Pesa", paymentStatus: "paid", timestamp: "2026-02-26T08:30:00" },
  { id: "T002", plateNumber: "KBZ 456B", vehicleType: "SUV", services: ["SUV Wash", "Engine Wash"], addOns: [], attendantId: "2", attendantName: "Grace Wanjiku", total: 1400, paymentMethod: "Cash", paymentStatus: "paid", timestamp: "2026-02-26T09:15:00" },
  { id: "T003", plateNumber: "KDA 789C", vehicleType: "Sedan", services: ["Full Detailing"], addOns: ["Air Freshener", "Dashboard Polish"], attendantId: "2", attendantName: "Grace Wanjiku", total: 3250, paymentMethod: "M-Pesa", paymentStatus: "paid", timestamp: "2026-02-26T10:00:00" },
  { id: "T004", plateNumber: "KCB 321D", vehicleType: "Pickup", services: ["SUV Wash"], addOns: ["Tire Shine"], attendantId: "3", attendantName: "Peter Ochieng", total: 1000, paymentMethod: "Bank Transfer", paymentStatus: "pending", timestamp: "2026-02-26T11:30:00" },
  { id: "T005", plateNumber: "KAA 654E", vehicleType: "Motorcycle", services: ["Bike Wash"], addOns: [], attendantId: "4", attendantName: "Mary Akinyi", total: 300, paymentMethod: "Cash", paymentStatus: "paid", timestamp: "2026-02-26T12:00:00" },
  { id: "T006", plateNumber: "KDB 987F", vehicleType: "Sedan", services: ["Small Car Wash", "Wax & Polish"], addOns: ["Seat Conditioning"], attendantId: "1", attendantName: "James Mwangi", total: 2300, paymentMethod: "M-Pesa", paymentStatus: "paid", timestamp: "2026-02-26T13:45:00" },
];

export const mockExpenses: Expense[] = [
  { id: "E001", category: "Water", description: "Water bill - February", amount: 5000, date: "2026-02-26" },
  { id: "E002", category: "Detergents", description: "Car shampoo & wax supplies", amount: 3500, date: "2026-02-26" },
  { id: "E003", category: "Electricity", description: "Power bill - February", amount: 4200, date: "2026-02-26" },
  { id: "E004", category: "Fuel", description: "Generator fuel", amount: 2000, date: "2026-02-25" },
  { id: "E005", category: "Maintenance", description: "Pressure washer repair", amount: 1500, date: "2026-02-24" },
  { id: "E006", category: "Rent", description: "Monthly rent", amount: 25000, date: "2026-02-01" },
];

export const mockCustomers: Customer[] = [
  { id: "C001", name: "John Kamau", phone: "0712000001", visits: 12, loyaltyPoints: 120, lastVisit: "2026-02-26" },
  { id: "C002", name: "Susan Njeri", phone: "0712000002", visits: 8, loyaltyPoints: 80, lastVisit: "2026-02-25" },
  { id: "C003", name: "Michael Odhiambo", phone: "0712000003", visits: 5, loyaltyPoints: 50, lastVisit: "2026-02-23" },
  { id: "C004", name: "Faith Muthoni", phone: "0712000004", visits: 15, loyaltyPoints: 150, lastVisit: "2026-02-26" },
];

export const dashboardStats = {
  totalVehiclesToday: 54,
  totalRevenue: 37500,
  avgPerVehicle: 694,
  pendingPayments: 3200,
  revenueByService: [
    { name: "Small Car Wash", revenue: 12500 },
    { name: "SUV Wash", revenue: 9600 },
    { name: "Full Detailing", revenue: 6000 },
    { name: "Wax & Polish", revenue: 4500 },
    { name: "Engine Wash", revenue: 2400 },
    { name: "Underwash", revenue: 1600 },
    { name: "Bike Wash", revenue: 900 },
  ],
  revenueByPayment: [
    { name: "M-Pesa", value: 22500 },
    { name: "Cash", value: 10500 },
    { name: "Bank Transfer", value: 3000 },
    { name: "Corporate", value: 1500 },
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
  todayExpenses: 16200,
  todayProfit: 21300,
};
