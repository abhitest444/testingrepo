export interface EntityRef {
  id: string | null;
  name: string | null; // need name to print
}

export interface JobCostingDetails {
  billable: boolean;
  billRate: number | null;
  costRate: number | null;
}
export interface labelPreferenceRef {
  DepartmentTerminology: string;
  CustomerTerminology: string;
}

export interface ServiceSalesData {
  billRate: number | null;
  taxable: boolean;
}
