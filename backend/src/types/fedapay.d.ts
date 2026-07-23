declare module 'fedapay' {
  export class FedaPay {
    static setApiKey(key: string): void;
    static setEnvironment(env: string): void;
    static setApiBase(base: string): void;
    static setApiVersion(version: string): void;
    static setToken(token: string): void;
    static setAccountId(id: string | number): void;
    static getApiKey(): string;
    static getEnvironment(): string;
    static getApiVersion(): string;
    static getApiBase(): string;
    static setVerifySslCerts(value: boolean): void;
    static getVerifySslCerts(): boolean;
    static setCaBundlePath(value: string): void;
    static getCaBundlePath(): string;
  }

  export class Transaction {
    id: number;
    reference: string;
    description: string;
    callback_url: string;
    amount: string;
    status: string;
    created_at: string;
    updated_at: string;

    static create(params?: Record<string, unknown>, headers?: Record<string, string>): Promise<Transaction>;
    static retrieve(id: string | number, params?: Record<string, unknown>, headers?: Record<string, string>): Promise<Transaction>;
    static all(params?: Record<string, unknown>, headers?: Record<string, string>): Promise<FedaPayObject>;
    
    save(headers?: Record<string, string>): Promise<Transaction>;
    delete(headers?: Record<string, string>): Promise<Transaction>;
    wasPaid(): boolean;
    
    generateToken(params?: Record<string, unknown>, headers?: Record<string, string>): Promise<FedaPayObject>;
    sendNowWithToken(mode: string, token: string, params?: Record<string, unknown>, headers?: Record<string, string>): Promise<FedaPayObject>;
    sendNow(mode: string, params?: Record<string, unknown>, headers?: Record<string, string>): Promise<FedaPayObject>;
    getFees(token: string, mode: string, params?: Record<string, unknown>, headers?: Record<string, string>): Promise<FedaPayObject>;
  }

  export class Balance {
    static retrieve(params?: Record<string, unknown>, headers?: Record<string, string>): Promise<FedaPayObject>;
  }

  export class Payout {
    id: number;
    amount: string;
    currency: string;
    status: string;
    description: string;
    mode: string;
    created_at: string;
    updated_at: string;

    static create(params?: Record<string, unknown>, headers?: Record<string, string>): Promise<Payout>;
    static retrieve(id: string | number, params?: Record<string, unknown>, headers?: Record<string, string>): Promise<Payout>;
    static all(params?: Record<string, unknown>, headers?: Record<string, string>): Promise<FedaPayObject>;
    
    sendNow(params?: Record<string, unknown>, headers?: Record<string, string>): Promise<FedaPayObject>;
    save(headers?: Record<string, string>): Promise<Payout>;
    delete(headers?: Record<string, string>): Promise<Payout>;
  }

  export class FedaPayObject {
    [key: string]: unknown;
  }
}
