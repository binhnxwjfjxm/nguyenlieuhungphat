import type { Cart, CustomerOrderingAdapter, CustomerSession, SignInInput } from "@/lib/contracts";
import { MockCustomerOrderingAdapter } from "@/lib/adapters/mock/mock-customer-ordering-adapter";
import { BrowserStorage } from "@/lib/storage/browser-storage";

export class CustomerOrderingService {
  constructor(private readonly adapter: CustomerOrderingAdapter) {}
  signIn(input: SignInInput): Promise<CustomerSession> { return this.adapter.signIn(input); }
  getSession(): Promise<CustomerSession | null> { return this.adapter.getSession(); }
  signOut(): Promise<void> { return this.adapter.signOut(); }
  getCart(): Promise<Cart> { return this.adapter.getCart(); }
  saveCart(cart: Cart): Promise<void> { return this.adapter.saveCart(cart); }
}

export function createCustomerOrderingService() { return new CustomerOrderingService(new MockCustomerOrderingAdapter(new BrowserStorage())); }
