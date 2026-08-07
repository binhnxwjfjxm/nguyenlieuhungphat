export interface CustomerProfile {
  customerCode: string;
  displayName: string;
  phone: string;
  outletName: string;
}

export interface CustomerSession {
  token: string;
  profile: CustomerProfile;
  signedInAt: string;
}

export interface SignInInput {
  phone: string;
  password: string;
}

export interface Category {
  id: string;
  name: string;
  shortName: string;
}

export type ProductAvailability = "available" | "out_of_stock" | "paused";
export type ProductVisualTone = "wheat" | "sugar" | "starch" | "additive";
export type PurchaseMode = "retail" | "case";

export interface ProductPriceView {
  amount: number | null;
  currency: "VND";
  status: "available" | "customer_price_pending";
}

export interface Product {
  sku: string;
  familySku: string;
  categoryId: string;
  name: string;
  aliases: string[];
  brand: string;
  productType: string;
  flavor: string | null;
  size: string;
  purchaseMode: PurchaseMode;
  caseQuantity: number | null;
  packaging: string;
  unit: string;
  description: string;
  availability: ProductAvailability;
  price: ProductPriceView;
  visualTone: ProductVisualTone;
}

export interface ProductSearchInput {
  categoryId?: string | null;
  query?: string;
  purchaseMode?: PurchaseMode | null;
  brand?: string | null;
  productType?: string | null;
  flavor?: string | null;
  size?: string | null;
}

export interface CartLine {
  sku: string;
  quantity: number;
  note?: string;
}

export interface Cart {
  lines: CartLine[];
  updatedAt: string;
}

export interface DeliveryAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  isDefault: boolean;
}

export interface CheckoutDraft {
  addressId: string | null;
  orderNote: string;
  updatedAt: string;
}

export interface SubmitOrderInput {
  addressId: string;
  orderNote: string;
  submissionKey: string;
}

export interface CustomerOrderLine {
  sku: string;
  productName: string;
  packaging: string;
  unit: string;
  quantity: number;
  note: string;
  unitPrice: number | null;
  currency: "VND";
}

export type OrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RECEIVED"
  | "CONFIRMED"
  | "PROCESSING"
  | "DELIVERING"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface CustomerOrder {
  id: string;
  code: string;
  submittedAt: string;
  status: OrderStatus;
  statusTimeline: OrderStatusEvent[];
  address: DeliveryAddress;
  lines: CustomerOrderLine[];
  totalQuantity: number;
  pricedSubtotal: number;
  hasPendingPrice: boolean;
  orderNote: string;
  submissionKey: string;
}

export interface ReorderOrderResult {
  cart: Cart;
  addedLineCount: number;
  skippedLineCount: number;
}

export type AnnouncementKind = "order" | "company" | "promotion" | "system";

export interface Announcement {
  id: string;
  kind: AnnouncementKind;
  title: string;
  summary: string;
  body: string;
  publishedAt: string;
  featured: boolean;
  targetHref?: string;
  readAt: string | null;
}

export interface NotificationPreference {
  orderUpdates: boolean;
  companyNews: boolean;
  promotions: boolean;
  updatedAt: string;
}

export interface CustomerOrderingAdapter {
  signIn(input: SignInInput): Promise<CustomerSession>;
  getSession(): Promise<CustomerSession | null>;
  signOut(): Promise<void>;
  listCategories(): Promise<Category[]>;
  listProducts(input?: ProductSearchInput): Promise<Product[]>;
  getProductBySku(sku: string): Promise<Product | null>;
  getCart(): Promise<Cart>;
  saveCart(cart: Cart): Promise<void>;
  listDeliveryAddresses(): Promise<DeliveryAddress[]>;
  getCheckoutDraft(): Promise<CheckoutDraft>;
  saveCheckoutDraft(draft: CheckoutDraft): Promise<void>;
  submitOrder(input: SubmitOrderInput): Promise<CustomerOrder>;
  listOrders(): Promise<CustomerOrder[]>;
  getOrderById(orderId: string): Promise<CustomerOrder | null>;
  cancelOrder(orderId: string): Promise<CustomerOrder>;
  reorderOrder(orderId: string): Promise<ReorderOrderResult>;
  listAnnouncements(): Promise<Announcement[]>;
  getAnnouncementById(announcementId: string): Promise<Announcement | null>;
  markAnnouncementRead(announcementId: string): Promise<Announcement>;
  getNotificationPreference(): Promise<NotificationPreference>;
  saveNotificationPreference(preference: NotificationPreference): Promise<NotificationPreference>;
}
