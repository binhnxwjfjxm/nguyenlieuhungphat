import type {
  Cart,
  Category,
  CustomerOrderingAdapter,
  CustomerSession,
  Product,
  ProductSearchInput,
  SignInInput,
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
}

export function createCustomerOrderingService(): CustomerOrderingService {
  return new CustomerOrderingService(new MockCustomerOrderingAdapter(new BrowserStorage()));
}
