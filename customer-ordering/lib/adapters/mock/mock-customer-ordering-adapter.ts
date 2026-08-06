import type {
  Cart,
  Category,
  CustomerOrderingAdapter,
  CustomerSession,
  Product,
  ProductSearchInput,
  SignInInput,
} from "@/lib/contracts";
import type { KeyValueStorage } from "@/lib/storage/browser-storage";
import {
  cloneProduct,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  normalizeCatalogText,
} from "@/lib/adapters/mock/mock-catalog";

const SESSION_KEY = "hp-customer-ordering:session:v1";
const CART_KEY = "hp-customer-ordering:cart:v1";

export class MockCustomerOrderingAdapter implements CustomerOrderingAdapter {
  constructor(private readonly storage: KeyValueStorage) {}

  async signIn(input: SignInInput): Promise<CustomerSession> {
    if (!input.phone.trim() || !input.password.trim()) {
      throw new Error("Vui lòng nhập đủ số điện thoại và mật khẩu.");
    }
    const session: CustomerSession = {
      token: "mock-customer-session",
      signedInAt: new Date().toISOString(),
      profile: {
        customerCode: "HP-KH-0001",
        displayName: "Nguyễn Văn A",
        outletName: "Khách hàng Hưng Phát",
        phone: input.phone.trim(),
      },
    };
    this.storage.set(SESSION_KEY, session);
    return session;
  }

  async getSession(): Promise<CustomerSession | null> {
    return this.storage.get<CustomerSession>(SESSION_KEY);
  }

  async signOut(): Promise<void> {
    this.storage.remove(SESSION_KEY);
  }

  async listCategories(): Promise<Category[]> {
    return MOCK_CATEGORIES.map((category) => ({ ...category }));
  }

  async listProducts(input: ProductSearchInput = {}): Promise<Product[]> {
    const query = normalizeCatalogText(input.query ?? "");
    return MOCK_PRODUCTS
      .filter((product) => !input.categoryId || product.categoryId === input.categoryId)
      .filter((product) => {
        if (!query) return true;
        return normalizeCatalogText(
          [product.code, product.name, product.packaging, product.unit, ...product.aliases].join(" "),
        ).includes(query);
      })
      .map(cloneProduct)
      .sort((left, right) => left.name.localeCompare(right.name, "vi"));
  }

  async getProductById(productId: string): Promise<Product | null> {
    const product = MOCK_PRODUCTS.find((item) => item.id === productId);
    return product ? cloneProduct(product) : null;
  }

  async getCart(): Promise<Cart> {
    return this.storage.get<Cart>(CART_KEY) ?? {
      lines: [],
      updatedAt: new Date(0).toISOString(),
    };
  }

  async saveCart(cart: Cart): Promise<void> {
    this.storage.set(CART_KEY, cart);
  }
}
