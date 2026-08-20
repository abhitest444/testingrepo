export class UxPersistentStore {
  private store: Map<string, any> = new Map();

  async initialize(): Promise<this> {
    // Initialize the store or any other setup logic
    return this;
  }

  async getPreference(key: string, context?: any) {
    // Retrieve the preference from the store
    const pref = this.store.get(this.getStoreKey(key, context));
    return Promise.resolve(pref);
  }

  async setPreference(key: string, value: any, context: any): Promise<void> {
    // Set the preference in the store
    this.store.set(this.getStoreKey(key, context), value);
  }

  // eslint-disable-next-line class-methods-use-this
  private getStoreKey(key: string, context?: any): string {
    return context ? `${context}:${key}` : key;
  }
}
