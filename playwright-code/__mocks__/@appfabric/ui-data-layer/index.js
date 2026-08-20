export const util = {
  GlobalId: {
    convertToLocalId: (globalId) => `convertToLocalId(${globalId})`,
    retrieveTypeCode: (globalId) => `retrieveTypeCode(${globalId})`,
    convertToGlobalId: (realmId, v4TypeName, localId, version) =>
      `convertToGlobalId(${realmId}, ${localId}, ${version})`,
  },
};
