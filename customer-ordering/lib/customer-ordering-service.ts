import type {
  Announcement,
  Cart,
  Category,
  CheckoutDraft,
  CustomerOrder,
  CustomerOrderingAdapter,
  CustomerSession,
  DeliveryAddress,
  NotificationPreference,
  Product,
  ProductSearchInput,
  ReorderOrderResult,
  SignInInput,
  SubmitOrderInput,
} from "@/lib/contracts";
import { MockCustomerOrderingAdapter } from "@/lib/adapters/mock/mock-customer-ordering-adapter";
import { BrowserStorage } from "@/lib/storage/browser-storage";

export class CustomerOrderingService {
  constructor(private readonly adapter: CustomerOrderingAdapter) {}
  signIn(input: SignInInput): Promise<CustomerSession> { return this.adapter.signIn(input); }
  getSession(): Promise<CustomerSession | null> { return this.adapter.getSession(); }
  signOut(): Promise<void> { return this.adapter.signOut(); }
  listCategories(): Promise<Category[]> { return this.adapter.listCategories(); }
  listProducts(input?: ProductSearchInput): Promise<Product[]> { return this.adapter.listProducts(input); }
  getProductBySku(sku: string): Promise<Product | null> { return this.adapter.getProductBySku(sku); }
  getCart(): Promise<Cart> { return this.adapter.getCart(); }
  saveCart(cart: Cart): Promise<void> { return this.adapter.saveCart(cart); }
  listDeliveryAddresses(): Promise<DeliveryAddress[]> { return this.adapter.listDeliveryAddresses(); }
  getCheckoutDraft(): Promise<CheckoutDraft> { return this.adapter.getCheckoutDraft(); }
  saveCheckoutDraft(draft: CheckoutDraft): Promise<void> { return this.adapter.saveCheckoutDraft(draft); }
  submitOrder(input: SubmitOrderInput): Promise<CustomerOrder> { return this.adapter.submitOrder(input); }
  listOrders(): Promise<CustomerOrder[]> { return this.adapter.listOrders(); }
  getOrderById(orderId: string): Promise<CustomerOrder | null> { return this.adapter.getOrderById(orderId); }
  cancelOrder(orderId: string): Promise<CustomerOrder> { return this.adapter.cancelOrder(orderId); }
  reorderOrder(orderId: string): Promise<ReorderOrderResult> { return this.adapter.reorderOrder(orderId); }
  listAnnouncements(): Promise<Announcement[]> { return this.adapter.listAnnouncements(); }
  getAnnouncementById(announcementId: string): Promise<Announcement | null> { return this.adapter.getAnnouncementById(announcementId); }
  markAnnouncementRead(announcementId: string): Promise<Announcement> { return this.adapter.markAnnouncementRead(announcementId); }
  getNotificationPreference(): Promise<NotificationPreference> { return this.adapter.getNotificationPreference(); }
  saveNotificationPreference(preference: NotificationPreference): Promise<NotificationPreference> {
    return this.adapter.saveNotificationPreference(preference);
  }
}

export function createCustomerOrderingService(): CustomerOrderingService {
  return new CustomerOrderingService(new MockCustomerOrderingAdapter(new BrowserStorage()));
}
