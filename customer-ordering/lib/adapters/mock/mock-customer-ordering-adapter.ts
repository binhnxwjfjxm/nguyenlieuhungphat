import type { Cart, CustomerOrderingAdapter, CustomerSession, SignInInput } from "@/lib/contracts";
import type { KeyValueStorage } from "@/lib/storage/browser-storage";

const SESSION_KEY = "hp-customer-ordering:session:v1";
const CART_KEY = "hp-customer-ordering:cart:v1";

export class MockCustomerOrderingAdapter implements CustomerOrderingAdapter {
  constructor(private readonly storage: KeyValueStorage) {}
  async signIn(input: SignInInput): Promise<CustomerSession> {
    if (!input.phone.trim() || !input.password.trim()) throw new Error("Vui lòng nhập đủ số điện thoại và mật khẩu.");
    const session: CustomerSession = { token: "mock-customer-session", signedInAt: new Date().toISOString(), profile: { customerCode: "HP-KH-0001", displayName: "Nguyễn Văn A", outletName: "Khách hàng Hưng Phát", phone: input.phone.trim() } };
    this.storage.set(SESSION_KEY, session);
    return session;
  }
  async getSession() { return this.storage.get<CustomerSession>(SESSION_KEY); }
  async signOut() { this.storage.remove(SESSION_KEY); }
  async getCart(): Promise<Cart> { return this.storage.get<Cart>(CART_KEY) ?? { lines: [], updatedAt: new Date(0).toISOString() }; }
  async saveCart(cart: Cart) { this.storage.set(CART_KEY, cart); }
}
