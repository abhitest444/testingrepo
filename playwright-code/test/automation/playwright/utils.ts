import { Page } from '@playwright/test';
import { AutomationLoginData } from './logins';
import DashboardPage from './pages/DashboardPage';
import { openQBOsingleTa } from './pages/QBOLogin';
import SingleTimeActivityPage from './pages/SingleTimeActivityPage';
import { overridePlugin } from './plugin/overridePlugin';

const { faker } = require('@faker-js/faker');

export const LABELS = {
  miles: 'Miles',
  CRUD: 'CRUD',
  Save: 'Save',
  SaveNew: 'Save and new',
  SaveClose: 'Save and close',
  UpdateCreate: 'Update after create', // create a new id and load it
  CreateUpdate: 'Create and update', //only load existing id and update
  Duration: 'Duration',
  BillRate: 'Bill rate',
  QBO: 'Intuit QuickBooks Online',
  WTA: 'Weekly timesheet',
  Weekly: 'WeeklyTimeEntry',
  WeeklyNoAccess: 'Roles with no access',
  WeeklyHasAccess: 'Roles having access',
  timeFor: 'Name',
  Customers: 'Customers',
  Service: 'Service',
  Class: 'Class',
  Location: 'Location',
  PayType: 'Pay type',
  NoPayType: 'No available pay types',
  CostRate: 'Cost rate',
  CostRatePerHour: 'Cost rate (per hour)',
  Name: 'Name',
  Taxable: 'Taxable',
  Billable: 'Billable',
  BillablePerHour: 'Billable (per hour)',
  NotesLabel: 'Notes',
  Delete: 'Delete',
  ClassFieldToggle: 'Class field toggle',
  SaveSettings: 'Save settings',
  ClearAllLines: 'Clear all lines',
  CustomerAndProject: 'Customers/Project',
  fieldContainingValueSoNotRemoveMessage:
    "There's information on these fields, so you can't remove it from the form.",
  DeleteTimeRow: 'Delete time row',
  ServiceFieldToggle: 'Service field toggle',
  LocationFieldToggle: 'Location field toggle',
  PayTypeFieldToggle: 'Pay type field toggle',
  BillableFieldToggle: 'Billable field toggle',
  CostRateFieldToggle: 'Cost Rate field toggle',
  TaxableFieldToggle: 'Taxable field toggle',
  SettingPersists: 'Setting Persists',
  DoYouWantToLeaveWithoutSaving: 'Do you want to leave without saving?',
  WeekdayColumnSelectionUpdate: 'Weekday column selection update',
  AtLeastOneWeekdayRequire: 'At least one week day selection require.',
  Sunday: 'Sunday',
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
  Saturday: 'Saturday',
  atLeastOneWeekdayRequire: 'At least one weekday required.',
  nameFieldSearchAndSelect: 'Name field search and select',
  nameFieldIsRequire: 'Name field is required validated',
  switchUserYouLostTheData:
    "If you select a different employee or vendor, you'll lose the data you entered. Do you want to continue?",
  Yes: 'Yes',
  AddNewEmployee: 'Add new employee',
  Employee: 'Employee',
  Customer: 'Customer',
  AddNewCustomer: 'Add new customer',
  SelectWeek: 'Select a week',
  SelectName: 'Select name',
  AddNewLocation: 'Add new location',
  LocationDrawerHeader: 'New Location',
  AddNewService: 'Add new service',
  ServiceDrawerHeader: 'Product or service',
  Features: 'Features',
  Validations: 'Validations',
  ContactType: 'Contact type',
  FirstName: 'First name *',
  LastName: 'Last name *',
  CompanyName: 'Company name',
  ClassName: 'Class name',
  switchWeekYouLostTheData:
    "If you select a different week, you'll lose the data you entered. Do you want to continue?",
  CurrencyUpdate: 'INR - Indian Rupee',
  CurrencySymbolUpdateDisplayed: '₹',
  CurrencyUS: 'USD - United States Dollar',
  CurrencyUSSymbol: '$',
  DeSelectWeekDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
  PrintButton: 'Print time table',
  Settings: 'Settings',
  Break: 'Break',
  thisMonth: 'This month',
  displayBy: 'Display by',
  date: 'Date',
};

export const COMMONS = {
  Notes: 'Random notes ',
};

export const USER_ROLES = {
  companyAdmin: 'Company Admin',
  freeDataCompanyAdmin: 'Free Data Company Admin',
  qboUser: 'QBO user',
  p0serviceprice: 'Service Price',
  p0companyAdmin: 'P0Company Admin',
  expenseManager: 'Expense Manager',
  inHouseAccountant: 'In house accountant',
  inventoryManager: 'Inventory manager',
  payrollManager: 'Payroll manager',
  salesManager: 'Sales manager',
  standardAllAccess: 'Standard all access',
  standardNoAcces: 'Standard no access',
  accountsReceivableManager: 'Accounts receivable manager',
  accountsPayableManager: 'Accounts payable manager',
  standardLimitedCustomersAndVendors: 'Standard limited customers and vendors',
  hrManager: 'HR Manager',
  cAQlQBPlusCanada: 'CA QL QB Plus (Canada)',
  qbAdvancedWithPayrollElite: 'QB Advanced w/ Payroll Elite',
  qbEssentialsWithPayrollPremium: 'QB Essentials w/ Payroll Premium',
  qbAdvancedWithTimeElite: 'QB Advanced w/ Time Elite',
  qbPlusWithTimePremium: 'QB Plus w/ Time Premium',
  qbAdvanced: 'QB Advanced',
  qbPlus: 'QB Plus',
  qbEssential: 'QB Essential',
  viewCompanyReports: 'View company reports',
  canadaQBPlus: 'CA QL QB Plus (Canada)',
  timeTrackOnly: 'Time tracking only',
};

export const testData = {
  duration: '05:00',
  duration2: '10:00',
  costRate: '2:00',
  billableRate: '4.00',
  billableRate2: '6.00',
  defaultBillableRate: '50.00',
  serviceBillableRate: '30.00',
  note1: 'test note 1',
  note2: 'test note 2',
  startTime: '1:00 AM',
  endTime: '2:00 AM',
  option1: 1,
  option3: 3,
  teamMemberName: 'Abhilash Test',
  customerName: 'three customer',
  locationName: 'test location 1',
  serviceName: 'Sales',
  randomName: `Test ${faker.name.firstName()}${faker.datatype.number({
    min: 10,
    max: 99,
  })}`,
  randomName2: `Test ${faker.name.firstName()}${faker.datatype.number({
    min: 10,
    max: 99,
  })}`,
  randomName3: `Test ${faker.name.firstName()}${faker.datatype.number({
    min: 10,
    max: 99,
  })}`,
  randomName4: `Test ${faker.name.firstName()}${faker.datatype.number({
    min: 10,
    max: 99,
  })}`,
  randomNumber: `Test ${faker.datatype.number({ min: 10000, max: 99999 })}`,
  randomNumber2: `Test ${faker.datatype.number({ min: 10000, max: 99999 })}`,
  randomLastName: `Emp${faker.name.lastName()}`,
  randomClassName: `C${faker.name.firstName()}`,
  randomCompanyName: `${faker.name.firstName()}`,
  unformattedDuration: '5',
  unformattedDuration2: '4.5',
  formattedDuration2: '04:30',
  unformattedStartTime: '1',
  unformattedEndTime: '2',
  invalidStartTime: '44 AM',
  invalidEndTime: '55 AM',
  className1: 'class test 1',
  className2: 'class test 2',
  startTime2: '2:00 AM',
  endTime2: '3:00 AM',
  option2: 2,
  startTime3: '4:00 AM',
  endTime3: '9:00 AM',
  breakTime: '2:00',
  summaryTime: '3',
  breaktime2: '1:00',
  feedback: 'Test Feedback',
  vendorName: 'test vendor1',
  empName: 'Test Emp1',
  costRate2: '7.00',
  supplierName: 'test supplier 1',
  startTimeGB: '04:00',
  endTimeGB: '09:00',
};

export const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const UNSAVED_CHANGES_MODAL_BASE_XPATH = `//div[@data-testid='ModalDialog']`;

export const NOTES_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse blandit massa metus, sit amet tempus dui consequat vitae. Quisque posuere et diam non tincidunt. Suspendisse ultrices mauris et augue suscipit mollis. Curabitur ac vestibulum lorem, quis fermentum massa. In congue ipsum id velit pharetra tincidunt. Morbi vehicula, nibh non consequat interdum, neque libero tincidunt magna, in cursus nisl enim et ligula. Vestibulum ligula mauris, consectetur in justo ut, ornare interdum orci. Pellentesque rutrum magna vitae nisl tincidunt pulvinar sed eget dui. Nam sed varius eros, ac commodo nulla. Maecenas ut elit vel dolor interdum ultricies sit amet a urna. Etiam dapibus sapien eget lacus feugiat, dignissim molestie quam pharetra. Curabitur quis gravida nisl. Sed vel fermentum risus. Quisque mollis ligula ac est sagittis, sit amet rhoncus augue facilisis. Aenean egestas iaculis nibh feugiat hendrerit. Donec vestibulum mollis nisl non accumsan. Nunc est est, consequat at purus ut, bibendum tincidunt erat. In vel gravida massa. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin cursus faucibus lectus. Nulla vehicula leo in tempor faucibus. In vehicula vehicula quam nec commodo. Proin pellentesque ullamcorper vehicula. Quisque viverra tellus vel pretium faucibus. Aliquam euismod ipsum risus, nec blandit lacus cursus eu. Proin ac efficitur metus. Vivamus a leo vitae purus egestas sagittis. Quisque diam velit, varius sit amet turpis ut, convallis ornare augue. Duis quis enim quam. Suspendisse potenti. Nullam a dolor velit. Cras in neque in ex fermentum rutrum. Sed semper eleifend nibh quis auctor. Aliquam erat volutpat. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In ut dictum elit, vel elementum justo. Donec diam leo, fringilla vel enim non, pulvinar feugiat velit. Proin risus dui, hendrerit at consectetur in, auctor venenatis quam. Morbi arcu lacus, luctus ac tincidunt scelerisque, ultrices nec purus. Aenean sed nunc nec magna mattis tincidunt. Vestibulum ultricies dui in mollis ultrices. Sed ac sapien blandit, viverra massa non, molestie ex. Cras ac leo arcu. Duis bibendum commodo nisl, eget interdum felis feugiat vel. Sed laoreet augue tellus, vitae sodales elit varius quis. Morbi luctus placerat ligula, sit amet sodales enim pulvinar efficitur. Etiam in nisi libero. Etiam ullamcorper neque at tempus varius. Donec semper tortor arcu. Sed pulvinar suscipit tortor eget condimentum. Curabitur fermentum molestie rutrum. Etiam pellentesque venenatis cursus. Aenean eu aliquam ante, non lacinia mi. Nullam a tempor neque, et tristique sem. Donec pretium felis vitae urna auctor, venenatis fringilla eros fermentum. Curabitur id velit sit amet risus molestie aliquam sed quis odio. Cras non massa et mauris posuere facilisis. Morbi ex lectus, laoreet ac neque in, tristique ornare lectus. Morbi interdum facilisis ipsum, nec pulvinar turpis luctus nec. Donec eleifend consectetur dui vitae hendrerit. Donec lacinia lorem facilisis tellus hendrerit hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse blandit massa metus, sit amet tempus dui consequat vitae. Quisque posuere et diam non tincidunt. Suspendisse ultrices mauris et augue suscipit mollis. Curabitur ac vestibulum lorem, quis fermentum massa. In congue ipsum id velit pharetra tincidunt. Morbi vehicula, nibh non consequat interdum, neque libero tincidunt magna, in cursus nisl enim et ligula. Vestibulum ligula mauris, consectetur in justo ut, ornare interdum orci. Pellentesque rutrum magna vitae nisl tincidunt pulvinar sed eget dui. Nam sed varius eros, ac commodo nulla. Maecenas ut elit vel dolor interdum ultricies sit amet a urna. Etiam dapibus sapien eget lacus feugiat, dignissim molestie quam pharetra. Curabitur quis gravida nisl. Sed vel fermentum risus. Quisque mollis ligula ac est sagittis, sit amet rhoncus augue facilisis. Aenean egestas iaculis nibh feugiat hendrerit. Donec vestibulum mollis nisl non accumsan. Nunc est est, consequat at purus ut, bibendum tincidunt erat. In vel gravida massa. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin cursus faucibus lectus. Nulla vehicula leo in tempor faucibus. In vehicula vehicula quam nec commodo. Proin pellentesque ullamcorper vehicula. Quisque viverra tellus vel pretium faucibus. Aliquam euismod ipsum risus, nec blandit lacus cursus eu. Proin ac efficitur metus. Vivamus a leo vitae purus egestas sagittis. Quisque diam velit, varius sit amet turpis ut, convallis ornare augue. Duis quis enim quam. Suspendisse potenti. Nullam a dolor velit. Cras in neque in ex fermentum rutrum. Sed semper eleifend nibh quis auctor';

export const USERS_BILL_RATE_NOTAPPLICABLE =
  'In house accountant,Sales manager,HR Manager,Time tracking only, QB Plus w/ Time Premium, QB Advanced w/ Payroll Elite';

export const USERS_TIME_ACTIVITY_NOTAPPLICABLE =
  'Accounts payable manager,Expense Manager,Inventory manager,Standard no access,QB Essential,QB Plus,QB Advanced,View company reports';

export const USERS_TIME_ACTIVITY_DRAWER_APPLICABLE =
  'QB Plus,QB Advanced,QB Essential';

// HR Manager, -- as per documenr HR manager doesnt have rights
export const USERS_TIME_ACTIVITY_NOTEMP_APPLICABLE =
  'Accounts receivable manager,Sales manager,In house accountant,Time tracking only';

export const USERS_TIME_ACTIVITY_NOTCLASS_APPLICABLE =
  'Accounts receivable manager,Sales manager,Payroll manager,HR Manager,QB Essentials w/ Payroll Premium,Time tracking only';

export const USERS_TIME_ACTIVITY_NOTLOCATION_APPLICABLE =
  'Accounts receivable manager,Sales manager,Payroll manager,HR Manager,QB Essentials w/ Payroll Premium,Time tracking only';

export const USERS_TIME_ACTIVITY_NOTCUSTOMER_APPLICABLE =
  'HR Manager,Payroll manager,Time tracking only';

export const USERS_TIME_ACTIVITY_NOTSERVICE_APPLICABLE =
  'HR Manager,Time tracking only';

export const USERS_TIME_ACTIVITY_NO_RELEVANT_FIELDS_SETTINGS_APPLICABLE =
  'Accounts receivable manager,HR Manager,Payroll manager,Sales manager';

export const USERS_HAVE_NO_ACCESS_TO_UPDATE_QBO_SETTINGS =
  'Accounts payable manager,Expense Manager,Inventory manager,Standard no access,QB Essential,QB Plus,QB Advanced,View company reports,HR Manager,Sales manager,Payroll manager,Time tracking only';

export const USERS_TIME_ACTIVITY_PAYTYPE_NOTVISIBLE =
  'Standard all access,QB Advanced w/ Time Elite,In house accountant,Payroll manager,Sales manager,Accounts receivable manager,HR Manager,QB Plus w/ Time Premium,Time tracking only';

export const USERS_TIME_ACTIVITY_LOCATION_NOT_VISIBLE =
  'QB Essentials w/ Payroll Premium';

export const USERS_TIME_ACTIVITY_CLASS_NOT_VISIBLE =
  'QB Essentials w/ Payroll Premium';

export const USERS_TIME_ACTIVITY_NEW_EMP_CREATE_ACCESS_DENIED =
  'In house accountant,Sales manager,Time tracking only';

export const setupAndNavigateSingleTA = async (
  page: Page,
  company: AutomationLoginData,
) => {
  await openQBOsingleTa(page, company);
  await overridePlugin(page);

  const singleTimeActPage = new SingleTimeActivityPage(page);
  const dashboardPage = new DashboardPage(page);

  // navigate to trowser
  if (
    page.url() === 'https://e2e.qbo.intuit.com/app/homepage?launchSetup=false'
  ) {
    await singleTimeActPage.navigateToSingleTime();
    await page.waitForTimeout(3000);
  }
  await singleTimeActPage.navigateToSingleTime();
  await page.waitForTimeout(3000);

  //validating of add time drawer is visible
  if (await dashboardPage.validateAddTimeDrawerVisible()) {
    return; // if visible pass the case
  } else {
    // Check if user role has access to time activity
    if (await dashboardPage.noTimeActivityAccess()) {
      return false;
    } else {
      // else execute the case for the role
      return true;
    }
  }
};
