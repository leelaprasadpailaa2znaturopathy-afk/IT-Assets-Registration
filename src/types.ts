export interface User {
  _id: string;
  name: string;
  email: string;
  role: "SuperAdmin" | "Admin" | "User";
  activeStatus?: boolean;
}

export interface Department {
  _id: string;
  departmentName: string;
  departmentCode: string;
  activeStatus: boolean;
  isDeleted?: boolean;
}

export interface EquipmentMaster {
  _id: string;
  equipmentName: string;
  equipmentCode: string;
  category: string;
  activeStatus: boolean;
}

export interface Location {
  _id: string;
  locationName: string;
  locationCode: string;
}

export interface Employee {
  _id: string;
  employeeId: string;
  employeeName: string;
  department: Department | string | null;
  departmentId?: string;
  email: string;
  status: "Active" | "Inactive";
}

export interface Asset {
  _id: string;
  assetId: string;
  equipment: EquipmentMaster | string;
  equipmentName: string;
  equipmentCode: string;
  department: Department | string;
  departmentCode: string;
  assignedEmployee?: Employee | null;
  technician?: string;
  maintenanceTeam?: string;
  workCenter?: string;
  location: Location;
  oemSerialNumber: string;
  status: "Active" | "Spare" | "Under Repair" | "Scrap";
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetMovement {
  _id: string;
  movementId: string;
  assetId: string;
  fromEmployee?: Employee | null;
  toEmployee?: Employee | null;
  fromLocation: Location;
  toLocation: Location;
  transferDate: string;
  remarks?: string;
  movedBy?: {
    name: string;
    email: string;
    role?: string;
  } | null;
}

export interface DashboardStats {
  totalAssets: number;
  activeAssets: number;
  spareAssets: number;
  repairAssets: number;
  scrapAssets: number;
}

export interface ChartDataGroup {
  departmentWise: { name: string; value: number }[];
  locationWise: { name: string; value: number }[];
  categoryWise: { name: string; value: number }[];
}

export interface RecentActivities {
  recentAssets: Asset[];
  recentTransfers: AssetMovement[];
}
