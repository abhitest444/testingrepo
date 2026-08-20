import { RoleBasedAccounts, TimeActivityExperience } from '../types';

export const prodGBAccounts: RoleBasedAccounts = {
  companyAdmin: {
    testAccounts: {
      OTXE001: {
        username: 'testproductionGBPE01_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341457134653601',
        companyInfo: 'GBPayrollObillElite1',
      },
      OTXP001: {
        username: 'testproductionGBPP01_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341457134709309',
        companyInfo: 'GBPayrollObillPremium01',
      },
      QBTE001: {
        username: 'testdm06_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '',
        companyInfo: '',
      },
      QBTP001: {
        username: 'testdm05_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '',
        companyInfo: '',
      },
    },
  },
};
