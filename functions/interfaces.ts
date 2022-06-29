export interface LineItemTaxEntry {
  id: number;
  total: string;
  subtotal: string;
}

export interface WooCommerceLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  taxes: LineItemTaxEntry[];
  meta_data: { [key: string]: string | number };
  sku: string;
  price: number;
  parent_name: string | null;
}

export interface WebhookRequestBody {
  id: number;
  status: string;
  date_created: string;
  total: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
  };
  customer_user_agent: string;
  line_items: WooCommerceLineItem[];
  secret: string;
}
