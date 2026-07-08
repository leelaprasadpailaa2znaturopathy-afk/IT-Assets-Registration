import {
  User, Department, EquipmentMaster, Location, Employee,
  Asset, AssetMovement, DashboardStats, ChartDataGroup, RecentActivities
} from "../types";

const BASE_URL = "/api";

// Diagnostic helper
export function debugAuthState() {
  const token = localStorage.getItem("tgh_token");
  const user = localStorage.getItem("tgh_user");
  console.log("[AUTH DEBUG]", {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token ? `${token.substring(0, 20)}...` : "NO TOKEN",
    hasUser: !!user,
    userObj: user ? JSON.parse(user) : null,
    timestamp: new Date().toISOString()
  });
}

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("tgh_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("[API] Warning: No token found in localStorage. User may not be authenticated.");
  }
  return headers;
}

function getAuthHeadersOnly(): HeadersInit {
  const token = localStorage.getItem("tgh_token");
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("[API] Warning: No token found in localStorage for auth-only request.");
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMsg = "An error occurred";
    try {
      const errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch {
      errorMsg = `Status ${response.status}: ${response.statusText}`;
    }
    
    // Handle 401 Unauthorized - clear session and notify
    if (response.status === 401) {
      console.error("[API] Authentication error (401):", errorMsg);
      localStorage.removeItem("tgh_token");
      localStorage.removeItem("tgh_user");
      window.location.href = "/";
    }
    
    throw new Error(errorMsg);
  }
  return response.json() as Promise<T>;
}

export const api = {
  // 1. Authentication
  async login(payload: { email: string; password?: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ token: string; user: User }>(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<{ user: User }>(res);
  },

  // 2. Departments
  async getDepartments(): Promise<Department[]> {
    const res = await fetch(`${BASE_URL}/departments`, { headers: getHeaders() });
    return handleResponse<Department[]>(res);
  },

  async createDepartment(data: Partial<Department>): Promise<Department> {
    const res = await fetch(`${BASE_URL}/departments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Department>(res);
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    const res = await fetch(`${BASE_URL}/departments/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Department>(res);
  },

  async deleteDepartment(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/departments/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // 3. Equipment Masters
  async getEquipment(): Promise<EquipmentMaster[]> {
    const res = await fetch(`${BASE_URL}/equipment`, { headers: getHeaders() });
    return handleResponse<EquipmentMaster[]>(res);
  },

  async createEquipment(data: Partial<EquipmentMaster>): Promise<EquipmentMaster> {
    const res = await fetch(`${BASE_URL}/equipment`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<EquipmentMaster>(res);
  },

  async updateEquipment(id: string, data: Partial<EquipmentMaster>): Promise<EquipmentMaster> {
    const res = await fetch(`${BASE_URL}/equipment/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<EquipmentMaster>(res);
  },

  async deleteEquipment(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/equipment/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // 4. Locations
  async getLocations(): Promise<Location[]> {
    const res = await fetch(`${BASE_URL}/locations`, { headers: getHeaders() });
    return handleResponse<Location[]>(res);
  },

  async createLocation(data: Partial<Location>): Promise<Location> {
    const res = await fetch(`${BASE_URL}/locations`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Location>(res);
  },

  async updateLocation(id: string, data: Partial<Location>): Promise<Location> {
    const res = await fetch(`${BASE_URL}/locations/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Location>(res);
  },

  async deleteLocation(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/locations/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // 5. Employees
  async getEmployees(): Promise<Employee[]> {
    const res = await fetch(`${BASE_URL}/employees`, { headers: getHeaders() });
    return handleResponse<Employee[]>(res);
  },

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    const res = await fetch(`${BASE_URL}/employees`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Employee>(res);
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const res = await fetch(`${BASE_URL}/employees/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Employee>(res);
  },

  async deleteEmployee(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/employees/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // 6. Assets
  async getAssets(): Promise<Asset[]> {
    const res = await fetch(`${BASE_URL}/assets`, { headers: getHeaders() });
    return handleResponse<Asset[]>(res);
  },

  async getAssetDetails(id: string): Promise<Asset> {
    const res = await fetch(`${BASE_URL}/assets/${id}`, { headers: getHeaders() });
    return handleResponse<Asset>(res);
  },

  async createAsset(data: Partial<Asset>): Promise<Asset> {
    const res = await fetch(`${BASE_URL}/assets`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Asset>(res);
  },

  async updateAsset(id: string, data: Partial<Asset>): Promise<Asset> {
    const res = await fetch(`${BASE_URL}/assets/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Asset>(res);
  },

  async deleteAsset(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/assets/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  async transferAsset(id: string, payload: {
    toEmployeeId?: string;
    toLocationId?: string;
    remarks: string;
  }): Promise<{ message: string; movement: AssetMovement }> {
    const res = await fetch(`${BASE_URL}/assets/${id}/transfer`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; movement: AssetMovement }>(res);
  },

  async getAssetMovements(id: string): Promise<AssetMovement[]> {
    const res = await fetch(`${BASE_URL}/assets/${id}/movements`, { headers: getHeaders() });
    return handleResponse<AssetMovement[]>(res);
  },

  async getAllMovements(): Promise<AssetMovement[]> {
    const res = await fetch(`${BASE_URL}/movements`, { headers: getHeaders() });
    return handleResponse<AssetMovement[]>(res);
  },

  // 7. Bulk Import (sends parsed rows to server)
  async bulkImport(rows: any[]): Promise<{ count: number; message: string }> {
    const res = await fetch(`${BASE_URL}/assets/import`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ rcvAssets: rows }),
    });
    return handleResponse<{ count: number; message: string }>(res);
  },

  // 8. Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${BASE_URL}/dashboard/stats`, { headers: getHeaders() });
    return handleResponse<DashboardStats>(res);
  },

  async getDashboardCharts(): Promise<ChartDataGroup> {
    const res = await fetch(`${BASE_URL}/dashboard/charts`, { headers: getHeaders() });
    return handleResponse<ChartDataGroup>(res);
  },

  async getDashboardActivities(): Promise<RecentActivities> {
    const res = await fetch(`${BASE_URL}/dashboard/activities`, { headers: getHeaders() });
    return handleResponse<RecentActivities>(res);
  },

  // 9. Reports Data API
  async getReportsData(type: string): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/reports?type=${type}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },


  // 10. Admin Utilities
  async getDbStatus(): Promise<{ mongoConnected: boolean; dbName: string; readyState: number }> {
    const res = await fetch(`${BASE_URL}/admin/db-status`, { headers: getHeaders() });
    return handleResponse<{ mongoConnected: boolean; dbName: string; readyState: number }>(res);
  },

  async resetDatabase(): Promise<{ message: string; deleted: Record<string, { deletedCount: number }> }> {
    const res = await fetch(`${BASE_URL}/admin/reset-database`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<{ message: string; deleted: Record<string, { deletedCount: number }> }>(res);
  },

  getExportCsvUrl(type: string): string {
    const token = localStorage.getItem("tgh_token") || "";
    return `/api/reports/export-csv?type=${type}&token=${encodeURIComponent(token)}`;
  },

  // 11. User Management
  async getAllUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${BASE_URL}/admin/users`, { headers: getHeaders() });
    return handleResponse<{ users: User[] }>(res);
  },

  async createUser(data: Partial<User> & { password: string }): Promise<{ user: User }> {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ user: User }>(res);
  },

  async updateUser(id: string, data: Partial<User>): Promise<{ user: User }> {
    const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ user: User }>(res);
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // 12. Single Asset Creation (form-based)
  async createSingleAsset(data: {
    equipmentId: string;
    departmentId: string;
    locationId: string;
    assignedEmployeeId?: string;
    oemSerialNumber: string;
    status: string;
    technician?: string;
    maintenanceTeam?: string;
    workCenter?: string;
    remarks?: string;
  }): Promise<Asset> {
    const res = await fetch(`${BASE_URL}/assets`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Asset>(res);
  },

  // 13. File Upload for Bulk Import (parses file on client side)
  async uploadBulkFile(file: File): Promise<{ rows: any[]; fileName: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length < 2) {
              reject(new Error("CSV file must have a header row and at least one data row."));
              return;
            }
            const delimiter = lines[0].includes("\t") ? "\t" : ",";
            const headers = lines[0].split(delimiter).map(h => h.replace(/["]+/g, "").trim().toLowerCase());
            const rows: any[] = [];
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(delimiter).map(c => c.replace(/["]+/g, "").trim());
              const rowObj: any = {};
              headers.forEach((hdr, idx) => {
                rowObj[hdr] = cols[idx] || "";
              });
              rows.push(rowObj);
            }
            resolve({ rows, fileName: file.name });
          } catch (err: any) {
            reject(new Error("Failed to parse CSV file: " + err.message));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read CSV file."));
        reader.readAsText(file);
      } else if (ext === "xlsx" || ext === "xls") {
        // Use the xlsx library (already in dependencies)
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            // Dynamically import xlsx
            import("xlsx").then((XLSX) => {
              const workbook = XLSX.read(data, { type: "array" });
              const sheetName = workbook.SheetNames[0];
              const jsonData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);
              // Normalize keys to lowercase
              const rows = jsonData.map((row: any) => {
                const normalized: any = {};
                Object.keys(row).forEach((key) => {
                  normalized[key.toLowerCase()] = row[key];
                });
                return normalized;
              });
              resolve({ rows, fileName: file.name });
            }).catch((err) => {
              reject(new Error("Failed to parse Excel file: " + err.message));
            });
          } catch (err: any) {
            reject(new Error("Failed to read Excel file: " + err.message));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read Excel file."));
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error("Unsupported file format. Please upload CSV or Excel (.xlsx/.xls) files."));
      }
    });
  }
};