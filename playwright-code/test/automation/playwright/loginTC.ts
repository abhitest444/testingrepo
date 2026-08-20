export type AutomationLoginDataTC = {
  email: string;
  password: string;
  realmId: string;
  companyInfo: string;
  timeActivityExperience?: TimeActivityExperience;
};

export type AutomationLoginTC = {
  scenario?: string;
  preprod?: AutomationLoginDataTC;
  prod?: AutomationLoginDataTC;
};

export enum TimeActivityExperience {
  Legacy,
  New,
  Drawer,
}
