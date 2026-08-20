export const OVERTIME_VALIDATION = {
  threshold: {
    hours: {
      daily: { min: 1, max: 24 },
      weekly: { min: 1, max: 168 },
    },
    minutes: { min: 0, max: 59 },
  },
  alertFrequency: {
    totalAlerts: { min: 1, max: 10 },
    intervalMinutes: { min: 5, max: 1440 },
  },
} as const;
