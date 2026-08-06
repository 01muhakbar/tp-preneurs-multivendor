export type DuitkuItemDetail = {
  name: string;
  price: number;
  quantity: number;
};

export type DuitkuCustomerAddress = {
  firstName: string;
  lastName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  countryCode?: string;
};

export type DuitkuCustomerDetail = {
  firstName: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  merchantCustomerId?: string;
  billingAddress?: DuitkuCustomerAddress;
  shippingAddress?: DuitkuCustomerAddress;
};

export type DuitkuCreateInvoiceRequest = {
  paymentAmount: number;
  merchantOrderId: string;
  productDetails: string;
  additionalParam?: string;
  merchantUserInfo?: string;
  paymentMethod?: string;
  customerVaName?: string;
  email: string;
  phoneNumber?: string;
  itemDetails?: DuitkuItemDetail[];
  customerDetail?: DuitkuCustomerDetail;
  callbackUrl: string;
  returnUrl: string;
  expiryPeriod?: number;
};

export type DuitkuCreateInvoiceResponse = {
  merchantCode?: string;
  reference?: string;
  paymentUrl?: string;
  statusCode?: string;
  statusMessage?: string;
  vaNumber?: string;
  amount?: string | number;
};

export type NormalizedDuitkuCreateInvoiceResponse = {
  ok: boolean;
  statusCode: string;
  statusMessage: string;
  merchantCode: string | null;
  reference: string | null;
  paymentUrl: string | null;
  vaNumber: string | null;
  amount: number | null;
  raw: DuitkuCreateInvoiceResponse;
};

export type DuitkuCreateInvoiceInput = Omit<
  DuitkuCreateInvoiceRequest,
  "callbackUrl" | "returnUrl"
> & {
  callbackUrl?: string;
  returnUrl?: string;
};
