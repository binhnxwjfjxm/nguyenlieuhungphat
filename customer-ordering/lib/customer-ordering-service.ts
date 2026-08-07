import type {
  Cart,
  Category,
  CheckoutDraft,
  CustomerOrder,
  CustomerOrderingAdapter,
  CustomerSession,
  DeliveryAddress,
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

  signIn(input: SignInInput): Promise<CustomerSession> {
    return this.adapter.signIn(input);
  }

  getSession(): Promise<CustomerSession | null> {
    return this.adapter.getSession();
  }

  signOut(): Promise<void> {
    return this.adapter.signOut();
  }

  listCategories(): Promise<Category[]> {
    return this.adapter.listCategories();
  }

  listProducts(input?: ProductSearchInput): Promise<Product[]> {
    return this.adapter.listProducts(input);
  }

  getProductById(productId: string): Promise<Product | null> {
    return this.adapter.getProductById(productId);
  }

  getCart(): Promise<Cart> {
    return this.adapter.getCart();
  }

  saveCart(cart: Cart): Promise<void> {
    return this.adapter.saveCart(cart);
  }

  listDeliveryAddresses(): Promise<DeliveryAddress[]> {
    return this.adapter.listDeliveryAddresses();
  }

  getCheckoutDraft(): Promise<CheckoutDraft> {
    return this.adapter.getCheckoutDraft();
  }

  saveCheckoutDraft(draft: CheckoutDraft): Promise<void> {
    return this.adapter.saveCheckoutDraft(draft);
  }

  submitOrder(input: SubmitOrderInput): Promise<CustomerOrder> {
    return this.adapter.submitOrder(input);
  }

  listOrders(): Promise<CustomerOrder[]> {
    return this.adapter.listOrders();
  }

  getOrderById(orderId: string): Promise<CustomerOrder | null> {
    return this.adapter.getOrderById(orderId);
  }

  cancelOrder(orderId: string): Promise<CustomerOrder> {
    return this.adapter.cancelOrder(orderId);
  }

  reorderOrder(orderId: string): Promise<ReorderOrderResult> {
    return this.adapter.reorderOrder(orderId);
  }
}

export function createCustomerOrderingService(): CustomerOrderingService {
  return new CustomerOrderingService(new MockCustomerOrderingAdapter(new BrowserStorage()));
}
