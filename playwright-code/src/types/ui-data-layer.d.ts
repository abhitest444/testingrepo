declare module '@appfabric/ui-data-layer' {
  export const util: {
    GlobalId: {
      convertToGlobalId: (
        realmId: string,
        entityType: string,
        entityId: string,
        version?: string,
      ) => string;
    };
  };
}
