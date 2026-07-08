import bcryptjs from "bcryptjs";

// Types corresponding to database entities
export interface IDepartment {
  _id: string;
  departmentName: string;
  departmentCode: string;
  activeStatus: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IEquipmentMaster {
  _id: string;
  equipmentName: string;
  equipmentCode: string;
  category: string;
  activeStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IEmployee {
  _id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string; // references department
  email: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface ILocation {
  _id: string;
  locationName: string;
  locationCode: string; // e.g., TGH-FB-B1-1F
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "Admin" | "User" | "SuperAdmin";
  activeStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAsset {
  _id: string;
  assetId: string; // TGH-{DepartmentCode}-{EquipmentCode}-{Sequence}
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  departmentId: string;
  departmentCode: string;
  assignedEmployeeId: string | null;
  technician: string;
  maintenanceTeam: string;
  workCenter: string;
  locationId: string;
  oemSerialNumber: string;
  status: "Active" | "Spare" | "Under Repair" | "Scrap";
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAssetMovement {
  _id: string;
  movementId: string;
  assetId: string; // Reference to Asset assetId
  fromEmployeeId: string | null;
  toEmployeeId: string | null;
  fromLocationId: string;
  toLocationId: string;
  transferDate: string;
  remarks: string;
  movedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICounter {
  _id: string; // DEPCODE-EQCODE, e.g. "IT-LT"
  lastNumber: number;
}

// In-Memory Database Collections
export class DbStore {
  users: IUser[] = [];
  departments: IDepartment[] = [];
  equipmentMasters: IEquipmentMaster[] = [];
  employees: IEmployee[] = [];
  locations: ILocation[] = [];
  assets: IAsset[] = [];
  assetMovements: IAssetMovement[] = [];
  counters: ICounter[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    const salt = bcryptjs.genSaltSync(10);
    const adminHash = bcryptjs.hashSync("admin123", salt);
    const userHash = bcryptjs.hashSync("user123", salt);

    // 1. Seed Users
    this.users = [
      {
        _id: "u-0",
        name: "Super Administrator",
        email: "superadmin@tgh.com",
        passwordHash: adminHash,
        role: "SuperAdmin",
        activeStatus: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "u-1",
        name: "John Smith",
        email: "admin@tgh.com",
        passwordHash: adminHash,
        role: "Admin",
        activeStatus: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "u-2",
        name: "Sarah Miller",
        email: "user@tgh.com",
        passwordHash: userHash,
        role: "User",
        activeStatus: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "u-3",
        name: "David Kim",
        email: "david@tgh.com",
        passwordHash: userHash,
        role: "User",
        activeStatus: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // 2. Seed Departments
    this.departments = [
      {
        _id: "d-1",
        departmentName: "IT & Electronics",
        departmentCode: "IT",
        activeStatus: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "d-2",
        departmentName: "Electrical & Power",
        departmentCode: "ELE",
        activeStatus: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "d-3",
        departmentName: "Furniture & Fixtures",
        departmentCode: "FUR",
        activeStatus: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // 3. Seed Equipment Masters
    this.equipmentMasters = [
      {
        _id: "eq-1",
        equipmentName: "Laptop",
        equipmentCode: "LT",
        category: "Computers",
        activeStatus: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "eq-2",
        equipmentName: "Hard Disk",
        equipmentCode: "HD",
        category: "Storage",
        activeStatus: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "eq-3",
        equipmentName: "Printer",
        equipmentCode: "PR",
        category: "Peripherals",
        activeStatus: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "eq-4",
        equipmentName: "UPS",
        equipmentCode: "UPS",
        category: "Power equipment",
        activeStatus: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // 4. Seed Locations
    this.locations = [
      {
        _id: "l-1",
        locationName: "Front Building 1 Floor 1",
        locationCode: "TGH-FB-B1-1F",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "l-2",
        locationName: "Front Building 1 Floor 2",
        locationCode: "TGH-FB-B1-2F",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "l-3",
        locationName: "Front Building 2 Floor 1",
        locationCode: "TGH-FB-B2-1F",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // 5. Seed Employees
    this.employees = [
      {
        _id: "emp-1",
        employeeId: "EMP001",
        employeeName: "Alice Wang",
        departmentId: "d-1", // IT
        email: "alice@tgh.com",
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "emp-2",
        employeeId: "EMP002",
        employeeName: "David Kim",
        departmentId: "d-1", // IT
        email: "david@tgh.com",
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "emp-3",
        employeeId: "EMP003",
        employeeName: "Sarah Miller",
        departmentId: "d-2", // ELE
        email: "user@tgh.com",
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "emp-4",
        employeeId: "EMP045",
        employeeName: "Mark Evans",
        departmentId: "d-3", // FUR
        email: "mark@tgh.com",
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // 6. Seed Counters
    this.counters = [
      { _id: "IT-LT", lastNumber: 2 },
      { _id: "IT-HD", lastNumber: 1 },
      { _id: "IT-PR", lastNumber: 1 },
      { _id: "ELE-UPS", lastNumber: 1 },
    ];

    // 7. Seed Assets
    this.assets = [
      {
        _id: "ast-1",
        assetId: "TGH-IT-LT-0001",
        equipmentId: "eq-1",
        equipmentName: "Laptop",
        equipmentCode: "LT",
        departmentId: "d-1",
        departmentCode: "IT",
        assignedEmployeeId: "emp-1", // Alice Wang
        technician: "Chris Evans",
        maintenanceTeam: "IT Core Team",
        workCenter: "WC-01",
        locationId: "l-1", // FB B1 1F
        oemSerialNumber: "SN-MAC778129",
        status: "Active",
        remarks: "Excellent hardware, issued to Product designer.",
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      },
      {
        _id: "ast-2",
        assetId: "TGH-IT-LT-0002",
        equipmentId: "eq-1",
        equipmentName: "Laptop",
        equipmentCode: "LT",
        departmentId: "d-1",
        departmentCode: "IT",
        assignedEmployeeId: "emp-2", // David Kim
        technician: "Chris Evans",
        maintenanceTeam: "IT Core Team",
        workCenter: "WC-01",
        locationId: "l-2", // FB B1 2F
        oemSerialNumber: "SN-DELL224190",
        status: "Active",
        remarks: "Assigned for development tasks.",
        createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      },
      {
        _id: "ast-3",
        assetId: "TGH-IT-HD-0001",
        equipmentId: "eq-2",
        equipmentName: "Hard Disk",
        equipmentCode: "HD",
        departmentId: "d-1",
        departmentCode: "IT",
        assignedEmployeeId: null, // Spare
        technician: "Chris Evans",
        maintenanceTeam: "Backup Support",
        workCenter: "WC-01",
        locationId: "l-1",
        oemSerialNumber: "SN-WD-RED-4TB",
        status: "Spare",
        remarks: "Stored in IT locker room.",
        createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
      },
      {
        _id: "ast-4",
        assetId: "TGH-ELE-UPS-0001",
        equipmentId: "eq-4",
        equipmentName: "UPS",
        equipmentCode: "UPS",
        departmentId: "d-2",
        departmentCode: "ELE",
        assignedEmployeeId: "emp-3", // Sarah Miller
        technician: "Gaurav Sen",
        maintenanceTeam: "Power Grid Ops",
        workCenter: "WC-Power",
        locationId: "l-3",
        oemSerialNumber: "SN-APC-2KVA-332",
        status: "Under Repair",
        remarks: "Experiencing irregular voltage drops.",
        createdAt: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
    ];

    // 8. Seed Asset Movements (Asset History Logs)
    this.assetMovements = [
      {
        _id: "mov-1",
        movementId: "MOV-000001",
        assetId: "TGH-IT-LT-0001",
        fromEmployeeId: null,
        toEmployeeId: "emp-1", // Alice Wang
        fromLocationId: "l-3",
        toLocationId: "l-1",
        transferDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        remarks: "Initial allocation upon employee onboarding.",
        movedByUserId: "u-1", // John Smith Admin
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      },
      {
        _id: "mov-2",
        movementId: "MOV-000002",
        assetId: "TGH-IT-LT-0002",
        fromEmployeeId: "emp-1",
        toEmployeeId: "emp-2", // Reassigned Alice to David
        fromLocationId: "l-1",
        toLocationId: "l-2",
        transferDate: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        remarks: "Temporary hardware exchange for high performance GPU requirements.",
        movedByUserId: "u-1",
        createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      },
    ];
  }

  // Atomic Auto ID Generation Logic
  generateAssetId(departmentCode: string, equipmentCode: string): string {
    const key = `${departmentCode.toUpperCase()}-${equipmentCode.toUpperCase()}`;
    let counter = this.counters.find((c) => c._id === key);
    if (!counter) {
      counter = { _id: key, lastNumber: 0 };
      this.counters.push(counter);
    }
    counter.lastNumber += 1;
    const sequenceStr = String(counter.lastNumber).padStart(4, "0");
    return `TGH-${departmentCode.toUpperCase()}-${equipmentCode.toUpperCase()}-${sequenceStr}`;
  }

  // Generate Movement tracking ID sequential counter
  generateMovementId(): string {
    const nextSeq = this.assetMovements.length + 1;
    return `MOV-${String(nextSeq).padStart(6, "0")}`;
  }
}

// Global variable representing stateful in-memory database
export const store = new DbStore();
