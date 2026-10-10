declare module "midtrans-client" {
  interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }

  interface ItemDetail {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }

  interface TransactionParams {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    item_details?: ItemDetail[];
  }

  interface TransactionResult {
    token: string;
    redirect_url: string;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(params: TransactionParams): Promise<TransactionResult>;
  }

  class CoreApi {
    constructor(config: SnapConfig);
    charge(params: Record<string, unknown>): Promise<Record<string, unknown>>;
    approve(transactionId: string): Promise<Record<string, unknown>>;
    cancel(transactionId: string): Promise<Record<string, unknown>>;
    expire(transactionId: string): Promise<Record<string, unknown>>;
    refund(
      transactionId: string,
      params?: Record<string, unknown>
    ): Promise<Record<string, unknown>>;
  }

  export { Snap, CoreApi };
}
