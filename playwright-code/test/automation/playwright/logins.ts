export type AutomationLoginData = {
  username: string;
  password: string;
  realmId: string;
  companyInfo: string;
  timeActivityExperience?: TimeActivityExperience;
};

export type AutomationLogin = {
  scenario?: string;
  preprod?: AutomationLoginData;
  prod?: AutomationLoginData;
};

export enum TimeActivityExperience {
  Legacy,
  New,
  Drawer,
}

export const getEnv = () =>
  process?.env?.PLAYWRIGHT_ENV === 'prod' ? 'prod' : 'preprod';

export const TIME_TRACKING_WEEKLY_VALIDATIONS_AUTOMATION_LOGINS: AutomationLogin[] =
  [
    {
      scenario: 'Company Admin',
      preprod: {
        username:
          'test1739976345159advancedelitepreprodcadmin_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454018387549',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction109cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454317781899',
        companyInfo: 'InternalFreeTestCompanyproduction109',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // Expense Manager, no Payroll or Time, ROW Region
    {
      scenario: 'Expense Manager',
      preprod: {
        username: 'test1741630401860em_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454142149897',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction24em_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454273128821',
        companyInfo: 'InternalFreeTestCompanyproduction24',
      },
    },
    // In house accountant, no Payroll or Time, ROW Region
    {
      scenario: 'In house accountant',
      preprod: {
        username:
          'test1740049388399advancedelitepreprodiha_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027727101',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction14ihacc_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454271844572',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Inventory manager, no Payroll or Time, ROW Region
    {
      scenario: 'Inventory manager',
      preprod: {
        username:
          'test1740046349174advancedelitepreprodim_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027655561',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction29im_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454273361402',
        companyInfo: '',
      },
    },
    // Payroll manager, no Payroll or Time, ROW Region  Needs to be changed
    {
      scenario: 'Payroll manager',
      preprod: {
        username: 'test1741624683454pm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454141645992',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction18pm_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454272047208',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Sales manager, no Payroll or Time, ROW Region
    {
      scenario: 'Sales manager',
      preprod: {
        username: 'test1741694620201sm_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454149910929',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction35sm_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454288064689',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Standard all access, no Payroll or Time, ROW Region
    {
      scenario: 'Standard all access',
      preprod: {
        username: 'test1741709259252saa_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454150677406',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction42saa_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454288055606',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Standard no access, no Payroll or Time, ROW Region
    {
      scenario: 'Standard no access',
      preprod: {
        username:
          'test1740046349174advancedelitepreprodsna_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027655561',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction151sna_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454560614070',
        companyInfo: 'InternalFreeTestCompanyproduction151',
      },
    },
    // Accounts receivable manager, no Payroll or Time, ROW Region
    {
      scenario: 'Accounts receivable manager',
      preprod: {
        username:
          'test1740048931150advancedelitepreprodarm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027711025',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction11apm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454271190987',
        companyInfo: 'InternalFreeTestCompanyproduction12',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Accounts payable manager, no Payroll or Time, ROW Region
    {
      scenario: 'Accounts payable manager',
      preprod: {
        username: 'test1741615394244apm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454140721397',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction2apm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454270929861',
        companyInfo: 'InternalFreeTestCompanyproduction3',
      },
    },
    {
      scenario: 'HR Manager',
      preprod: {
        username:
          'test1740049866213advancedelitepreprodhrm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027756358',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction152hr_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454560652454',
        companyInfo: 'InternalFreeTestCompanyproduction152',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // View company reports, no Payroll or Time, ROW Region
    {
      scenario: 'View company reports',
      preprod: {
        username: 'test1741710942908vcr_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454150802495',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction50vcr_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454288201991',
        companyInfo: 'InternalFreeTestCompanyproduction50',
      },
    },
    // Time Tracking only, no Payroll or Time, ROW Region
    {
      scenario: 'Time tracking only',
      preprod: {
        username: 'test1743429275199tt_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454293709804',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction153tto_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454560723167',
        companyInfo: 'InternalFreeTestCompanyproduction153',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Essential
    {
      scenario: 'QB Essential',
      preprod: {
        username: 'test1741191044008_iamtestpass',
        password: 'Password1!',
        realmId: '9341454107281501',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
      prod: {
        username: 'testproduction57cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454309928027',
        companyInfo: 'InternalFreeTestCompanyproduction57',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
    },

    // SBGTEST QL QB Plus
    {
      scenario: 'QB Plus',
      preprod: {
        username: 'test1741179521234_iamtestpass',
        password: 'Password1!',
        realmId: '9341454106744237',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
      prod: {
        username: 'testproduction99cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454311316926',
        companyInfo: 'InternalFreeTestCompanyproduction99',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
    },

    // SBGTEST QL QB Advanced
    {
      scenario: 'QB Advanced',
      preprod: {
        username: 'test1741192508032_iamtestpass',
        password: 'Password1!',
        realmId: '9341454107337195',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
      prod: {
        username: 'testproduction64cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454310117746',
        companyInfo: 'InternalFreeTestCompanyproduction64',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
    },

    // SBGTEST QL QB Plus w/ Time Premium
    {
      scenario: 'QB Plus w/ Time Premium',
      preprod: {
        username: 'test1741197478019_iamtestpass',
        password: 'Password1!',
        realmId: '9341454107867037',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction71cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454310444589',
        companyInfo: 'InternalFreeTestCompanyproduction71',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Advanced w/ Time Elite
    {
      scenario: 'QB Advanced w/ Time Elite',
      preprod: {
        username: 'test1741255461631_iamtestpass',
        password: 'Password1!',
        realmId: '9341454114025755',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction78cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454310538045',
        companyInfo: 'InternalFreeTestCompanyproduction78',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Essentials w/ Payroll Premium
    {
      scenario: 'QB Essentials w/ Payroll Premium',
      preprod: {
        username: 'test1741257396519_iamtestpass',
        password: 'Password1!',
        realmId: '9341454114088306',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction85cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454311023788',
        companyInfo: 'InternalFreeTestCompanyproduction85',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Advanced w/ Payroll Elite
    {
      scenario: 'QB Advanced w/ Payroll Elite',
      preprod: {
        username: 'test1741259441730_iamtestpass',
        password: 'Password1!',
        realmId: '9341454114170220',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction92cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454311114945',
        companyInfo: 'InternalFreeTestCompanyproduction92',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST CA QL QB Plus (Canada)
    {
      scenario: 'CA QL QB Plus (Canada)',
      preprod: {
        username: 'test1743169655175_iamtestpass',
        password: 'Password1!',
        realmId: '9341454275877906',
        companyInfo: 'QBO_Advanced_QBOPElite',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction159cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454560964905',
        companyInfo: 'InternalFreeTestCompanyproduction159',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
  ];

export const TIME_TRACKING_WEEKLY_FEATURES_AUTOMATION_LOGINS: AutomationLogin[] =
  [
    {
      scenario: 'Company Admin',
      preprod: {
        username:
          'test1739976345159advancedelitepreprodcadmin_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454018387549',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction185cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454667900355',
        companyInfo: 'InternalFreeTestCompanyproduction185',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    {
      scenario: 'Company Admin Weekly Validations',
      preprod: {
        username:
          'test1739976345159advancedelitepreprodcadmin_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454018387549',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction185cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454667900355',
        companyInfo: 'InternalFreeTestCompanyproduction185',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    {
      scenario: 'Company Admin Features',
      preprod: {
        username:
          'test1739976345159advancedelitepreprodcadmin_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454018387549',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction109cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454317781899',
        companyInfo: 'InternalFreeTestCompanyproduction109',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Expense Manager, no Payroll or Time, ROW Region
    {
      scenario: 'Expense Manager',
      preprod: {
        username: 'test1741630401860em_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454142149897',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction24em_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454273128821',
        companyInfo: 'InternalFreeTestCompanyproduction24',
      },
    },
    // In house accountant, no Payroll or Time, ROW Region
    {
      scenario: 'In house accountant',
      preprod: {
        username:
          'test1740049388399advancedelitepreprodiha_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027727101',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction14ihacc_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454271844572',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Inventory manager, no Payroll or Time, ROW Region
    {
      scenario: 'Inventory manager',
      preprod: {
        username:
          'test1740046349174advancedelitepreprodim_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027655561',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction29im_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454273361402',
        companyInfo: '',
      },
    },
    // Payroll manager, no Payroll or Time, ROW Region  Needs to be changed
    {
      scenario: 'Payroll manager',
      preprod: {
        username: 'test1741624683454pm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454141645992',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction18pm_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454272047208',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Sales manager, no Payroll or Time, ROW Region
    {
      scenario: 'Sales manager',
      preprod: {
        username: 'test1741694620201sm_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454149910929',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction35sm_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454288064689',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Standard all access, no Payroll or Time, ROW Region
    {
      scenario: 'Standard all access',
      preprod: {
        username: 'test1741709259252saa_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454150677406',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction42saa_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454288055606',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Standard no access, no Payroll or Time, ROW Region
    {
      scenario: 'Standard no access',
      preprod: {
        username:
          'test1740046349174advancedelitepreprodsna_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027655561',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction151sna_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454560614070',
        companyInfo: 'InternalFreeTestCompanyproduction151',
      },
    },
    // Accounts receivable manager, no Payroll or Time, ROW Region
    {
      scenario: 'Accounts receivable manager',
      preprod: {
        username:
          'test1740048931150advancedelitepreprodarm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027711025',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction11apm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454271190987',
        companyInfo: 'InternalFreeTestCompanyproduction12',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Accounts payable manager, no Payroll or Time, ROW Region
    {
      scenario: 'Accounts payable manager',
      preprod: {
        username: 'test1741615394244apm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454140721397',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction2apm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454270929861',
        companyInfo: 'InternalFreeTestCompanyproduction3',
      },
    },
    {
      scenario: 'HR Manager',
      preprod: {
        username:
          'test1740049866213advancedelitepreprodhrm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027756358',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction152hr_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454560652454',
        companyInfo: 'InternalFreeTestCompanyproduction152',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // View company reports, no Payroll or Time, ROW Region
    {
      scenario: 'View company reports',
      preprod: {
        username: 'test1741710942908vcr_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454150802495',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction50vcr_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454288201991',
        companyInfo: 'InternalFreeTestCompanyproduction50',
      },
    },
    // Time Tracking only, no Payroll or Time, ROW Region
    {
      scenario: 'Time tracking only',
      preprod: {
        username: 'test1743429275199tt_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454293709804',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction153tto_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454560723167',
        companyInfo: 'InternalFreeTestCompanyproduction153',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Essential
    {
      scenario: 'QB Essential',
      preprod: {
        username: 'test1741191044008_iamtestpass',
        password: 'Password1!',
        realmId: '9341454107281501',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
      prod: {
        username: 'testproduction57cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454309928027',
        companyInfo: 'InternalFreeTestCompanyproduction57',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
    },

    // SBGTEST QL QB Plus
    {
      scenario: 'QB Plus',
      preprod: {
        username: 'test1741179521234_iamtestpass',
        password: 'Password1!',
        realmId: '9341454106744237',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
      prod: {
        username: 'testproduction99cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454311316926',
        companyInfo: 'InternalFreeTestCompanyproduction99',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
    },

    // SBGTEST QL QB Advanced
    {
      scenario: 'QB Advanced',
      preprod: {
        username: 'test1741192508032_iamtestpass',
        password: 'Password1!',
        realmId: '9341454107337195',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
      prod: {
        username: 'testproduction64cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454310117746',
        companyInfo: 'InternalFreeTestCompanyproduction64',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
    },

    // SBGTEST QL QB Plus w/ Time Premium
    {
      scenario: 'QB Plus w/ Time Premium',
      preprod: {
        username: 'test1741197478019_iamtestpass',
        password: 'Password1!',
        realmId: '9341454107867037',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction71cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454310444589',
        companyInfo: 'InternalFreeTestCompanyproduction71',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Advanced w/ Time Elite
    {
      scenario: 'QB Advanced w/ Time Elite',
      preprod: {
        username: 'test1741255461631_iamtestpass',
        password: 'Password1!',
        realmId: '9341454114025755',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction78cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454310538045',
        companyInfo: 'InternalFreeTestCompanyproduction78',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Essentials w/ Payroll Premium
    {
      scenario: 'QB Essentials w/ Payroll Premium',
      preprod: {
        username: 'test1741257396519_iamtestpass',
        password: 'Password1!',
        realmId: '9341454114088306',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction85cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454311023788',
        companyInfo: 'InternalFreeTestCompanyproduction85',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Advanced w/ Payroll Elite
    {
      scenario: 'QB Advanced w/ Payroll Elite',
      preprod: {
        username: 'test1741259441730_iamtestpass',
        password: 'Password1!',
        realmId: '9341454114170220',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction92cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454311114945',
        companyInfo: 'InternalFreeTestCompanyproduction92',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST CA QL QB Plus (Canada)
    {
      scenario: 'CA QL QB Plus (Canada)',
      preprod: {
        username: 'test1743169655175_iamtestpass',
        password: 'Password1!',
        realmId: '9341454275877906',
        companyInfo: 'QBO_Advanced_QBOPElite',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction159cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454560964905',
        companyInfo: 'InternalFreeTestCompanyproduction159',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
  ];

export const TIME_TRACKING_WEEKLY_SETTINGS_AUTOMATION_LOGINS: AutomationLogin[] =
  [
    {
      scenario: 'Company Admin',
      preprod: {
        username:
          'test1739977268072advancedprmpreprodcadmin_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454018431523',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction112cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454317345336',
        companyInfo: 'InternalFreeTestCompanyproduction108',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Expense Manager, no Payroll or Time, ROW Region
    {
      scenario: 'Expense Manager',
      preprod: {
        username: 'test1741630080436em_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454142116818',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction23em_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454273075642',
        companyInfo: 'InternalFreeTestCompanyproduction23',
      },
    },
    // In house accountant, no Payroll or Time, ROW Region
    {
      scenario: 'In house accountant',
      preprod: {
        username:
          'test1740050499914advancedelitepreprodiha_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027784211',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction13apm_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454271792347',
        companyInfo: 'InternalFreeTestCompanyproduction13',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Inventory manager, no Payroll or Time, ROW Region
    {
      scenario: 'Inventory manager',
      preprod: {
        username: 'test1741689456935im_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454149735254',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction28im_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454273323265',
        companyInfo: 'InternalFreeTestCompanyproduction28',
      },
    },
    // Payroll manager, no Payroll or Time, ROW Region  Needs to be changed   // need to add the user
    {
      scenario: 'Payroll manager',
      preprod: {
        username: 'test1741624271693pm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341451736523854',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction17pm_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454271975147',
        companyInfo: 'InternalFreeTestCompanyproduction17',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Sales manager, no Payroll or Time, ROW Region
    {
      scenario: 'Sales manager',
      preprod: {
        username: 'test1741089699390sm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454100485906',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction34sm_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454288033847',
        companyInfo: 'InternalFreeTestCompanyproduction34',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Standard all access, no Payroll or Time, ROW Region
    {
      scenario: 'Standard all access',
      preprod: {
        username: 'test1741708855654saa_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454150665331',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction41saa_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454288072159',
        companyInfo: 'InternalFreeTestCompanyproduction41',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Standard no access, no Payroll or Time, ROW Region
    {
      scenario: 'Standard no access',
      preprod: {
        username:
          'test1740048024342advancedelitepreprodsna_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027683798',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction118sna_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454318372891',
        companyInfo: 'InternalFreeTestCompanyproduction118',
      },
    },
    // Accounts receivable manager, no Payroll or Time, ROW Region
    {
      scenario: 'Accounts receivable manager',
      preprod: {
        username:
          'test1740051056745advancedelitepreprodarm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027796280',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction10apm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454271165195',
        companyInfo: 'InternalFreeTestCompanyproduction11',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // Accounts payable manager, no Payroll or Time, ROW Region
    {
      scenario: 'Accounts payable manager',
      preprod: {
        username: 'test1741610949453apm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454140310950',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction1apm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454270862284',
        companyInfo: 'InternalFreeTestCompanyproduction2',
      },
    },
    {
      scenario: 'HR Manager',
      preprod: {
        username:
          'test1740054205973advancedelitepreprodhrm_iamtestpass@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454027986205',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction116hrm_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454318079921',
        companyInfo: 'InternalFreeTestCompanyproduction116',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
    // View company reports, no Payroll or Time, ROW Region
    {
      scenario: 'View company reports',
      preprod: {
        username: 'test1741710589999vcr_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454150792264',
        companyInfo: '',
      },
      prod: {
        username: 'testproduction49vcr_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454288121011',
        companyInfo: 'InternalFreeTestCompanyproduction49',
      },
    },
    // Time Tracking only, no Payroll or Time, ROW Region   // have to add the user
    {
      scenario: 'Time tracking only',
      preprod: {
        username: 'test1743428883187tt_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454293700137',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction154tto_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454560761072',
        companyInfo: 'InternalFreeTestCompanyproduction154',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Essential
    {
      scenario: 'QB Essential',
      preprod: {
        username: 'test1741191407699_iamtestpass',
        password: 'Password1!',
        realmId: '9341454107291319',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
      prod: {
        username: 'testproduction57cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454309928027',
        companyInfo: 'InternalFreeTestCompanyproduction57',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
    },

    // SBGTEST QL QB Plus
    {
      scenario: 'QB Plus',
      preprod: {
        username: 'test1741179809781_iamtestpass',
        password: 'Password1!',
        realmId: '9341454106778152',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction103cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454311306338',
        companyInfo: 'InternalFreeTestCompanyproduction98',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
    },

    // SBGTEST QL QB Advanced
    {
      scenario: 'QB Advanced',
      preprod: {
        username: 'test1741192605809_iamtestpass',
        password: 'Password1!',
        realmId: '9341454107341720',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
      prod: {
        username: 'testproduction68cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454310223988',
        companyInfo: 'InternalFreeTestCompanyproduction68',
        timeActivityExperience: TimeActivityExperience.Drawer,
      },
    },

    // SBGTEST QL QB Plus w/ Time Premium
    {
      scenario: 'QB Plus w/ Time Premium',
      preprod: {
        username: 'test1741252861863_iamtestpass',
        password: 'Password1!',
        realmId: '9341454113876859',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction70cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454310401510',
        companyInfo: 'InternalFreeTestCompanyproduction70',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Advanced w/ Time Elite
    {
      scenario: 'QB Advanced w/ Time Elite',
      preprod: {
        username: 'test1741255860596_iamtestpass',
        password: 'Password1!',
        realmId: '9341454114038136',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction77cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454310531594',
        companyInfo: 'InternalFreeTestCompanyproduction77',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Essentials w/ Payroll Premium
    {
      scenario: 'QB Essentials w/ Payroll Premium',
      preprod: {
        username: 'test1741257579132_iamtestpass',
        password: 'Password1!',
        realmId: '9341454114092084',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction84cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454311037067',
        companyInfo: 'InternalFreeTestCompanyproduction84',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST QL QB Advanced w/ Payroll Elite
    {
      scenario: 'QB Advanced w/ Payroll Elite',
      preprod: {
        username: 'test1741259825066_iamtestpass',
        password: 'Password1!',
        realmId: '9341454114188180',
        companyInfo: '',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction91cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454311119206',
        companyInfo: 'InternalFreeTestCompanyproduction91',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },

    // SBGTEST CA QL QB Plus (Canada)
    {
      scenario: 'CA QL QB Plus (Canada)',
      preprod: {
        username: 'test1743170149360_iamtestpass',
        password: 'Password1!',
        realmId: '9341454275893522',
        companyInfo: 'QBO_Advanced_QBOPElite',
        timeActivityExperience: TimeActivityExperience.New,
      },
      prod: {
        username: 'testproduction160cadmin_iamtestpass_otp@sharklasers.com',
        password: 'Password1!',
        realmId: '9341454561021873',
        companyInfo: 'InternalFreeTestCompanyproduction160',
        timeActivityExperience: TimeActivityExperience.New,
      },
    },
  ];

export const TIME_TRACKING_WEEKLY_AUTOMATION_LOGINS: AutomationLogin[] = [
  //CRUD
  // Company Admin, no Payroll or Time, ROW Region
  {
    scenario: 'Company Admin',
    preprod: {
      username:
        'test1740046349174advancedelitepreprodcadmin_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454018387549',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction113cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454317985318',
      companyInfo: 'InternalFreeTestCompanyproduction113',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Free data company admin
  {
    scenario: 'Free Data Company Admin',
    preprod: {
      username: 'freeTimeCompany_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341458531975441',
      companyInfo: '',
    },
    prod: {
      username: 'testproductionFDca_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341456807012610',
      companyInfo: '',
    },
  },
  // Expense Manager, no Payroll or Time, ROW Region
  {
    scenario: 'Expense Manager',
    preprod: {
      username:
        'test1740040455569advancedelitepreprodem_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341451736523854',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction22pm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454273053588',
      companyInfo: 'InternalFreeTestCompanyproduction22',
    },
  },
  // In house accountant, no Payroll or Time, ROW Region
  {
    scenario: 'In house accountant',
    preprod: {
      username:
        'test1740052891630advancedelitepreprodiha_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341451736523854',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction12apm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454271767986',
      companyInfo: 'InternalFreeTestCompany13',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Inventory manager, no Payroll or Time, ROW Region
  {
    scenario: 'Inventory manager',
    preprod: {
      username: 'test1741689886419im_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341451736523854',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction27im_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454273267842',
      companyInfo: 'InternalFreeTestCompanyproduction27',
    },
  },
  // Payroll manager, no Payroll or Time, ROW Region  Needs to be changed
  {
    scenario: 'Payroll manager',
    preprod: {
      username: 'test1741018817061pm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454094614687',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction16pm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454271927368',
      companyInfo: 'InternalFreeTestCompanyproduction16',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Sales manager, no Payroll or Time, ROW Region
  {
    scenario: 'Sales manager',
    preprod: {
      username: 'test1741695266379sm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454149932862',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction33sm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454288058564',
      companyInfo: 'InternalFreeTestCompanyproduction33',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Standard all access, no Payroll or Time, ROW Region
  {
    scenario: 'Standard all access',
    preprod: {
      username: 'test1741698722671saa_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454150184881',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction40saa_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454288052927',
      companyInfo: 'InternalFreeTestCompanyproduction40',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Standard no access, no Payroll or Time, ROW Region
  {
    scenario: 'Standard no access',
    preprod: {
      username:
        'test1740046349174advancedelitepreprodsna_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341451736523854',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction117sna_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454318156612',
      companyInfo: 'InternalFreeTestCompanyproduction117',
    },
  },
  // Accounts receivable manager, no Payroll or Time, ROW Region
  {
    scenario: 'Accounts receivable manager',
    preprod: {
      username: 'test1740040455569advancedelitepreprodarm_iamtestpass',
      password: 'Password1!',
      realmId: '9341451736523854',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction9apm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454271118791',
      companyInfo: 'InternalFreeTestCompanyproduction10',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Accounts payable manager, no Payroll or Time, ROW Region
  {
    scenario: 'Accounts payable manager',
    preprod: {
      username: 'test1741607982546apm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454140078332',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction1_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454270861951',
      companyInfo: 'InternalFreeTestCompanyproduction1',
    },
  },
  {
    scenario: 'HR Manager',
    preprod: {
      username:
        'test1740055174500advancedelitepreprodhrm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454028028846',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction115hrm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454318051324',
      companyInfo: 'InternalFreeTestCompanyproduction115',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // View company reports, no Payroll or Time, ROW Region
  {
    scenario: 'View company reports',
    preprod: {
      username: 'test1741711692094vcr_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454150835690',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction48vcr_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454288093310',
      companyInfo: 'InternalFreeTestCompanyproduction48',
    },
  },
  // Time Tracking only, no Payroll or Time, ROW Region
  {
    scenario: 'Time tracking only',
    preprod: {
      username: 'test1743426175418tt_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454293576198',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction155tto_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454560823299',
      companyInfo: 'InternalFreeTestCompanyproduction155',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Essential
  {
    scenario: 'QB Essential',
    preprod: {
      username: 'test1741190686531_iamtestpass',
      password: 'Password1!',
      realmId: '9341454107265634',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
    prod: {
      username: 'testproduction55cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454309510028',
      companyInfo: 'InternalFreeTestCompanyproduction55',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Plus
  {
    scenario: 'QB Plus',
    preprod: {
      username: 'test1740994354625_iamtestpass',
      password: 'Password1!',
      realmId: '9341454093339814',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction97cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454311248185',
      companyInfo: 'InternalFreeTestCompany97',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Advanced
  {
    scenario: 'QB Advanced',
    preprod: {
      username: 'test1741192225436_iamtestpass',
      password: 'Password1!',
      realmId: '9341454107330510',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
    prod: {
      username: 'testproduction62cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310056937',
      companyInfo: 'InternalFreeTestCompanyproduction62',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Plus w/ Time Premium
  {
    scenario: 'QB Plus w/ Time Premium',
    preprod: {
      username: 'test1741193320191_iamtestpass',
      password: 'Password1!',
      realmId: '9341454107507527',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction69cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310416372',
      companyInfo: 'InternalFreeTestCompanyproduction69',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Advanced w/ Time Elite
  {
    scenario: 'QB Advanced w/ Time Elite',
    preprod: {
      username: 'test1741254699597_iamtestpass',
      password: 'Password1!',
      realmId: '9341454114012587',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction76cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310524432',
      companyInfo: 'InternalFreeTestCompanyproduction76',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Essentials w/ Payroll Premium
  {
    scenario: 'QB Essentials w/ Payroll Premium',
    preprod: {
      username: 'test1741256895682_iamtestpass',
      password: 'Password1!',
      realmId: '9341454114070616',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction83cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310868876',
      companyInfo: 'InternalFreeTestCompanyproduction83',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Advanced w/ Payroll Elite
  {
    scenario: 'QB Advanced w/ Payroll Elite',
    preprod: {
      username: 'test1741258754805_iamtestpass',
      password: 'Password1!',
      realmId: '9341454114139205',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction90cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454311119312',
      companyInfo: 'InternalFreeTestCompanyproduction90',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST CA QL QB Plus (Canada)
  {
    scenario: 'CA QL QB Plus (Canada)',
    preprod: {
      username: 'test1743168415763_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454275827549',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction161cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454561101353',
      companyInfo: 'InternalFreeTestCompanyproduction161',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
];

export const TIME_TRACKING_AUTOMATION_LOGINS: AutomationLogin[] = [
  // Company Admin, no Payroll or Time, ROW Region
  {
    scenario: 'Company Admin',
    preprod: {
      username:
        'test1740057178944advancedelitepreprodcadmin_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454028176081',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction107cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454317265776',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Free data company admin
  {
    scenario: 'Free Data Company Admin',
    preprod: {
      username: 'freeTimeCompany_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341458531975441',
      companyInfo: '',
    },
    prod: {
      username: 'testproductionFDca_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341456807012610',
      companyInfo: '',
    },
  },
  // Expense Manager, no Payroll or Time, ROW Region
  {
    scenario: 'Expense Manager',
    preprod: {
      username: 'test1741628745476em_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454141969713',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction25em_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454273183130',
      companyInfo: '',
    },
  },
  // In house accountant, no Payroll or Time, ROW Region
  {
    scenario: 'In house accountant',
    preprod: {
      username:
        'test1740056341057advancedelitepreprodiha_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454028104688',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction15ihacc_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454271882529',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Inventory manager, no Payroll or Time, ROW Region
  {
    scenario: 'Inventory manager',
    preprod: {
      username: 'test1741688536717im_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454149714151',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction30im_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454273437438',
      companyInfo: '',
    },
  },
  // Payroll manager, no Payroll or Time, ROW Region
  {
    scenario: 'Payroll manager',
    preprod: {
      username: 'test1741623325492pm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454141364905',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction19pm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454272069311',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Sales manager, no Payroll or Time, ROW Region
  {
    scenario: 'Sales manager',
    preprod: {
      username: 'test1741022295295sm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454094802735',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction36sm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454288054562',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Standard all access, no Payroll or Time, ROW Region
  {
    scenario: 'Standard all access',
    preprod: {
      username: 'test1741697817855saa_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454150109006',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction43saa_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454288077139',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Standard no access, no Payroll or Time, ROW Region
  {
    scenario: 'Standard no access',
    preprod: {
      username: 'test1741001530958sna_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454093654618',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction121sna_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454318473425',
      companyInfo: '',
    },
  },
  // Accounts receivable manager, no Payroll or Time, ROW Region
  {
    scenario: 'Accounts receivable manager',
    preprod: {
      username: 'test1741616702214arm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454140875692',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction126arm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454318973177',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Accounts payable manager, no Payroll or Time, ROW Region
  {
    scenario: 'Accounts payable manager',
    preprod: {
      username: 'test1741602505368apm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454270954421',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction3apm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341453358228250',
      companyInfo: '',
    },
  },
  // View company reports, no Payroll or Time, ROW Region
  {
    scenario: 'View company reports',
    preprod: {
      username: 'test1741001530958vcm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454093654618',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction51vcr_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454288197053',
      companyInfo: '',
    },
  },
  // Time Tracking only, no Payroll or Time, ROW Region
  {
    scenario: 'Time tracking only',
    preprod: {
      username: 'test1743428504011tt_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454293685615',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction138tt_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454500716386',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Essential
  {
    scenario: 'QB Essential',
    preprod: {
      username: 'test1741191751846_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454107307783',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
    prod: {
      username: 'testproduction58cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454309928429',
      companyInfo: 'InternalFreeTestCompanyproduction58',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Plus
  {
    scenario: 'QB Plus',
    preprod: {
      username: 'test1741180208968_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454106788730',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
    prod: {
      username: 'testproduction100cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454311345649',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Advanced
  {
    scenario: 'QB Advanced',
    preprod: {
      username: 'test1741192926488_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454107358017',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
    prod: {
      username: 'testproduction65cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310152385',
      companyInfo: 'InternalFreeTestCompanyproduction65',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Plus w/ Time Premium
  {
    scenario: 'QB Plus w/ Time Premium',
    preprod: {
      username: 'test1741254016008_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454113938827',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction72cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310432433',
      companyInfo: 'InternalFreeTestCompanyproduction72',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Advanced w/ Time Elite
  {
    scenario: 'QB Advanced w/ Time Elite',
    preprod: {
      username: 'test1741256132700_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454114046052',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction79cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310573025',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Essentials w/ Payroll Premium
  {
    scenario: 'QB Essentials w/ Payroll Premium',
    preprod: {
      username: 'test1741257862397_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454114098429',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction86cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454311050626',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Advanced w/ Payroll Elite
  {
    scenario: 'QB Advanced w/ Payroll Elite',
    preprod: {
      username: 'test1741260327795_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454114209808',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction93cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454311137042',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST CA QL QB Plus (Canada)
  {
    scenario: 'CA QL QB Plus (Canada)',
    preprod: {
      username: 'test1743168664949_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454275841268',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction162cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454561234667',
      companyInfo: 'InternalFreeTestCompanyproduction162',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // HR Manager
  {
    scenario: 'HR Manager',
    preprod: {
      username:
        'test1740050499914advancedelitepreprodhrm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454027784211',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction114hrm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454318027706',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
];

export const TIME_TRACKING_AUTOMATION_SETTINGS_LOGINS: AutomationLogin[] = [
  // Company Admin, no Payroll or Time, ROW Region
  {
    scenario: 'Company Admin',
    preprod: {
      username:
        'test1740052481994advancedelitepreprodcadmin_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454027909896',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction111cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454317889703',
      companyInfo: 'InternalFreeTestCompanyproduction111',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Expense Manager, no Payroll or Time, ROW Region
  {
    scenario: 'Expense Manager',
    preprod: {
      username: 'test1741163760519epm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454106065631',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction129em_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454319157581',
      companyInfo: '',
    },
  },
  // In house accountant, no Payroll or Time, ROW Region
  {
    scenario: 'In house accountant',
    preprod: {
      username:
        'test1740054205973advancedelitepreprodiha_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454027986205',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction106ihacc_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454317215454',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Inventory manager, no Payroll or Time, ROW Region
  {
    scenario: 'Inventory manager',
    preprod: {
      username: 'test1741006653229imgr_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454093946538',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction31im_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454273490856',
      companyInfo: '',
    },
  },
  // Payroll manager, no Payroll or Time, ROW Region
  {
    scenario: 'Payroll manager',
    preprod: {
      username: 'test1741006653229pm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454093946538',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction20pm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454272263994',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Sales manager, no Payroll or Time, ROW Region
  {
    scenario: 'Sales manager',
    preprod: {
      username: 'test1741006653229sm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454093946538',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction37sm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454288074373',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Standard all access, no Payroll or Time, ROW Region
  {
    scenario: 'Standard all access',
    preprod: {
      username:
        'test1740048024342advancedelitepreprodsaa_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454288053858',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction44saa_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341453358228250',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Standard no access, no Payroll or Time, ROW Region
  {
    scenario: 'Standard no access',
    preprod: {
      username:
        'test1740040455569advancedelitepreprodsna_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454093946538',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction120sna_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454318409074',
      companyInfo: '',
    },
  },
  // Accounts receivable manager, no Payroll or Time, ROW Region
  {
    scenario: 'Accounts receivable manager',
    preprod: {
      username:
        'test1740052891630advancedelitepreprodarm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454027931398',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction125arm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454318924086',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Accounts payable manager, no Payroll or Time, ROW Region
  {
    scenario: 'Accounts payable manager',
    preprod: {
      username:
        'test1740052481994advancedelitepreprodapm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454027909896',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction4apm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341453358228250',
      companyInfo: '',
    },
  },
  // View company reports, no Payroll or Time, ROW Region
  {
    scenario: 'View company reports',
    preprod: {
      username: 'test1741006653229vcr_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454093946538',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction53vcr_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454291684780',
      companyInfo: '',
    },
  },
  // Time Tracking only, no Payroll or Time, ROW Region
  {
    scenario: 'Time tracking only',
    preprod: {
      username: 'test1743427263445tt_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454293631464',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction141tt_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454500824615',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Essential
  {
    scenario: 'QB Essential',
    preprod: {
      username: 'test1741191638654_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454107298449',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
    prod: {
      username: 'testproduction60cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454309987793',
      companyInfo: 'InternalFreeTestCompanyproduction60',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Plus
  {
    scenario: 'QB Plus',
    preprod: {
      username: 'test1741179939677_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454106785618',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
    prod: {
      username: 'testproduction102cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454311370307',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Advanced
  {
    scenario: 'QB Advanced',
    preprod: {
      username: 'test1741192754072_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454107349502',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
    prod: {
      username: 'testproduction67cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310184906',
      companyInfo: 'InternalFreeTestCompanyproduction67',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Plus w/ Time Premium
  {
    scenario: 'QB Plus w/ Time Premium',
    preprod: {
      username: 'test1741253694808_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454113916963',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction74cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310388088',
      companyInfo: 'InternalFreeTestCompanyproduction74',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Advanced w/ Time Elite
  {
    scenario: 'QB Advanced w/ Time Elite',
    preprod: {
      username: 'test1741255983981_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454114040097',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction81cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310606517',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Essentials w/ Payroll Premium
  {
    scenario: 'QB Essentials w/ Payroll Premium',
    preprod: {
      username: 'test1741257726261_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454114096670',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction88cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454311057738',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Advanced w/ Payroll Elite
  {
    scenario: 'QB Advanced w/ Payroll Elite',
    preprod: {
      username: 'test1741260058401_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454114200281',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction95cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454311189214',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST CA QL QB Plus (Canada)
  {
    scenario: 'CA QL QB Plus (Canada)',
    preprod: {
      username: 'test1743169360565_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454275867672',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction164cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454561310350',
      companyInfo: 'InternalFreeTestCompanyproduction164',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // HR Manager
  {
    scenario: 'HR Manager',
    preprod: {
      username:
        'test1740049388399advancedelitepreprodhrm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454027727101',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction133hrm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454325526879',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
];

export const TIME_TRACKING_AUTOMATION_FEATURES_LOGINS: AutomationLogin[] = [
  // Company Admin, no Payroll or Time, ROW Region
  {
    scenario: 'Company Admin',
    preprod: {
      username:
        'test1740058213043advancedelitepreprodcadmin_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454028225417',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction110cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454317832544',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Expense Manager, no Payroll or Time, ROW Region
  {
    scenario: 'Expense Manager',
    preprod: {
      username: 'test1741629155940em_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454141998755',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction128em_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454319106709',
      companyInfo: '',
    },
  },
  // In house accountant, no Payroll or Time, ROW Region
  {
    scenario: 'In house accountant',
    preprod: {
      username: 'test1741622203762ihacc_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454141221165',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction105ihacc_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454317192799',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Inventory manager, no Payroll or Time, ROW Region
  {
    scenario: 'Inventory manager',
    preprod: {
      username: 'test1741689056910im_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454149732120',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction32im_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454273517463',
      companyInfo: '',
    },
  },
  // Payroll manager, no Payroll or Time, ROW Region
  {
    scenario: 'Payroll manager',
    preprod: {
      username: 'test1741623772184pm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454141588765',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction21pm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454272348673',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Sales manager, no Payroll or Time, ROW Region
  {
    scenario: 'Sales manager',
    preprod: {
      username: 'test1741692447191sm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454149844865',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction38sm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454288079969',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Standard all access, no Payroll or Time, ROW Region
  {
    scenario: 'Standard all access',
    preprod: {
      username: 'test1741698203881saa_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454150151060',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction45saa_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454288107786',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Standard no access, no Payroll or Time, ROW Region
  {
    scenario: 'Standard no access',
    preprod: {
      username:
        'test1740040455569advancedelitepreprodsna_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454093946538',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction119sna_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454318416703',
      companyInfo: '',
    },
  },
  // Accounts receivable manager, no Payroll or Time, ROW Region
  {
    scenario: 'Accounts receivable manager',
    preprod: {
      username: 'test1741617435636arm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454318761068',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction124arm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341453358228250',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // Accounts payable manager, no Payroll or Time, ROW Region
  {
    scenario: 'Accounts payable manager',
    preprod: {
      username: 'test1741607075239apm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454028001423',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction5apm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454270959572',
      companyInfo: '',
    },
  },
  // View company reports, no Payroll or Time, ROW Region
  {
    scenario: 'View company reports',
    preprod: {
      username: 'test1741711366745vcr_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454150820121',
      companyInfo: '',
    },
    prod: {
      username: 'testproduction53vcr_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454291684780',
      companyInfo: '',
    },
  },
  // Time Tracking only, no Payroll or Time, ROW Region
  {
    scenario: 'Time tracking only',
    preprod: {
      username: 'test1743442657000tt_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454294557763',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction139tt_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454500694249',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Essential
  {
    scenario: 'QB Essential',
    preprod: {
      username: 'test1741191929852_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454107315943',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
    prod: {
      username: 'testproduction59cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454309926655',
      companyInfo: 'InternalFreeTestCompanyproduction59',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Plus
  {
    scenario: 'QB Plus',
    preprod: {
      username: 'test1741180340251_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454106820206',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
    prod: {
      username: 'testproduction101cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454311377247',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Advanced
  {
    scenario: 'QB Advanced',
    preprod: {
      username: 'test1741193032769_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454107362502',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
    prod: {
      username: 'testproduction66cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310167803',
      companyInfo: 'InternalFreeTestCompanyproduction66',
      timeActivityExperience: TimeActivityExperience.Drawer,
    },
  },

  // SBGTEST QL QB Plus w/ Time Premium
  {
    scenario: 'QB Plus w/ Time Premium',
    preprod: {
      username: 'test1741254321163_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454113955383',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction73cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310452098',
      companyInfo: 'InternalFreeTestCompanyproduction73',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Advanced w/ Time Elite
  {
    scenario: 'QB Advanced w/ Time Elite',
    preprod: {
      username: 'test1741256132700_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454114046052',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction80cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454310552229',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Essentials w/ Payroll Premium
  {
    scenario: 'QB Essentials w/ Payroll Premium',
    preprod: {
      username: 'test1741258142323_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454114110553',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction87cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454311059776',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST QL QB Advanced w/ Payroll Elite
  {
    scenario: 'QB Advanced w/ Payroll Elite',
    preprod: {
      username: 'test1741260456304_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454114221210',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction94cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454311163004',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // SBGTEST CA QL QB Plus (Canada)
  {
    scenario: 'CA QL QB Plus (Canada)',
    preprod: {
      username: 'test1743169232776_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454275863929',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction163cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454561273560',
      companyInfo: 'InternalFreeTestCompanyproduction163',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },

  // HR Manager
  {
    scenario: 'HR Manager',
    preprod: {
      username:
        'test1740051996893advancedelitepreprodhrm_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454027827321',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction132hrm_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454325497054',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
];

export const PRIORITY_SINGLE_AUTOMATION_LOGINS: AutomationLogin[] = [
  //CRUD
  // Company Admin, no Payroll or Time, ROW Region
  {
    scenario: 'Company Admin',
    preprod: {
      username: 'test1745333547468_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454018387549',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction150cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454317948104',
      companyInfo: 'InternalFreeTestCompanyproduction112',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  // QBO primary admin user for STE (Time Entries → Single time entry) coverage
  {
    scenario: 'QBO user',
    preprod: {
      username: 'test1778236856154_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction01qbousertest_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  {
    scenario: 'Service Price',
    preprod: {
      username: 'test1751374595332_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction289cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
];

export const PRIORITY_WEEKLY_AUTOMATION_LOGINS: AutomationLogin[] = [
  //CRUD
  // Company Admin, no Payroll or Time, ROW Region
  {
    scenario: 'P0Company Admin',
    preprod: {
      username: 'test1745333465091_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454018387549',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproductionwt166cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '9341456924464358',
      companyInfo: 'WtaTestcompany1',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  {
    scenario: 'Service Price',
    preprod: {
      username: 'test1751374489455_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
    prod: {
      username: 'testproduction265cadmin_iamtestpass_otp@sharklasers.com',
      password: 'Password1!',
      realmId: '',
      companyInfo: '',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
];

export function getLoginData(scenario: string): AutomationLoginData {
  const login = TIME_TRACKING_AUTOMATION_LOGINS.find(
    (login) => login.scenario === scenario,
  );
  if (!login) {
    throw new Error(`Unable to find login for scenario "${scenario}"`);
  }

  const env = getEnv();
  const loginForEnv = login[env];
  if (!loginForEnv) {
    throw new Error(`Unable to find env "${env}" for scenario "${scenario}"`);
  }

  return loginForEnv;
}

export function getWeeklyLoginData(scenario: string): AutomationLoginData {
  const login = TIME_TRACKING_WEEKLY_AUTOMATION_LOGINS.find(
    (login) => login.scenario === scenario,
  );
  if (!login) {
    throw new Error(`Unable to find login for scenario "${scenario}"`);
  }

  const env = getEnv();
  const loginForEnv = login[env];
  if (!loginForEnv) {
    throw new Error(`Unable to find env "${env}" for scenario "${scenario}"`);
  }

  return loginForEnv;
}

export function getWeeklySettingsLoginData(
  scenario: string,
): AutomationLoginData {
  const login = TIME_TRACKING_WEEKLY_SETTINGS_AUTOMATION_LOGINS.find(
    (login) => login.scenario === scenario,
  );
  if (!login) {
    throw new Error(`Unable to find login for scenario "${scenario}"`);
  }

  const env = getEnv();
  const loginForEnv = login[env];
  if (!loginForEnv) {
    throw new Error(`Unable to find env "${env}" for scenario "${scenario}"`);
  }

  return loginForEnv;
}

export function getWeeklyValidationsLoginData(
  scenario: string,
): AutomationLoginData {
  const login = TIME_TRACKING_WEEKLY_VALIDATIONS_AUTOMATION_LOGINS.find(
    (login) => login.scenario === scenario,
  );
  if (!login) {
    throw new Error(`Unable to find login for scenario "${scenario}"`);
  }

  const env = getEnv();
  const loginForEnv = login[env];
  if (!loginForEnv) {
    throw new Error(`Unable to find env "${env}" for scenario "${scenario}"`);
  }

  return loginForEnv;
}

export function getWeeklyFeaturesLoginData(
  scenario: string,
): AutomationLoginData {
  const login = TIME_TRACKING_WEEKLY_FEATURES_AUTOMATION_LOGINS.find(
    (login) => login.scenario === scenario,
  );
  if (!login) {
    throw new Error(`Unable to find login for scenario "${scenario}"`);
  }

  const env = getEnv();
  const loginForEnv = login[env];
  if (!loginForEnv) {
    throw new Error(`Unable to find env "${env}" for scenario "${scenario}"`);
  }

  return loginForEnv;
}

export function getSingleSettingsLoginData(
  scenario: string,
): AutomationLoginData {
  const login = TIME_TRACKING_AUTOMATION_SETTINGS_LOGINS.find(
    (login) => login.scenario === scenario,
  );
  if (!login) {
    throw new Error(`Unable to find login for scenario "${scenario}"`);
  }

  const env = getEnv();
  const loginForEnv = login[env];
  if (!loginForEnv) {
    throw new Error(`Unable to find env "${env}" for scenario "${scenario}"`);
  }

  return loginForEnv;
}

export function getSingleFeaturesLoginData(
  scenario: string,
): AutomationLoginData {
  const login = TIME_TRACKING_AUTOMATION_FEATURES_LOGINS.find(
    (login) => login.scenario === scenario,
  );
  if (!login) {
    throw new Error(`Unable to find login for scenario "${scenario}"`);
  }

  const env = getEnv();
  const loginForEnv = login[env];
  if (!loginForEnv) {
    throw new Error(`Unable to find env "${env}" for scenario "${scenario}"`);
  }

  return loginForEnv;
}

export function getPrioritySingleLoginData(
  scenario: string,
): AutomationLoginData {
  const login = PRIORITY_SINGLE_AUTOMATION_LOGINS.find(
    (login) => login.scenario === scenario,
  );
  if (!login) {
    throw new Error(`Unable to find login for scenario "${scenario}"`);
  }

  const env = getEnv();
  const loginForEnv = login[env];
  if (!loginForEnv) {
    throw new Error(`Unable to find env "${env}" for scenario "${scenario}"`);
  }

  return loginForEnv;
}

export const GB_PRIORITY_SINGLE_AUTOMATION_LOGINS: AutomationLogin[] = [
  //CRUD
  // Company Admin, no Payroll or Time, ROW Region
  {
    scenario: 'Company Admin',
    preprod: {
      username: 'test1759136137371_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '9341454018387549',
      companyInfo: 'Company_GB_OBI-LL7_20057991_29-9-2025',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
  {
    scenario: 'Service Price',
    preprod: {
      username: 'test1758793261625_iamtestpass@sharklasers.com',
      password: 'Password1!',
      realmId: '',
      companyInfo: 'Company_GB_OBI-LL7_20057991_29-9-2025',
      timeActivityExperience: TimeActivityExperience.New,
    },
  },
];

export function getGBPrioritySingleLoginData(
  scenario: string,
): AutomationLoginData {
  const login = GB_PRIORITY_SINGLE_AUTOMATION_LOGINS.find(
    (login) => login.scenario === scenario,
  );
  if (!login) {
    throw new Error(`Unable to find login for scenario "${scenario}"`);
  }

  const env = getEnv();
  const loginForEnv = login[env];
  if (!loginForEnv) {
    throw new Error(`Unable to find env "${env}" for scenario "${scenario}"`);
  }

  return loginForEnv;
}

export function getPriorityWeeklyLoginData(
  scenario: string,
): AutomationLoginData {
  const login = PRIORITY_WEEKLY_AUTOMATION_LOGINS.find(
    (login) => login.scenario === scenario,
  );
  if (!login) {
    throw new Error(`Unable to find login for scenario "${scenario}"`);
  }

  const env = getEnv();
  const loginForEnv = login[env];
  if (!loginForEnv) {
    throw new Error(`Unable to find env "${env}" for scenario "${scenario}"`);
  }

  return loginForEnv;
}
