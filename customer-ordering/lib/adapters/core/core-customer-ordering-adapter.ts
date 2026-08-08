import type {
  Announcement,
  Cart,
  CartLine,
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
import { loadClerkBrowser } from "@/lib/auth/clerk-browser";
import { productMatchesQuery, productSearchRank } from "@/lib/catalog-search";
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/lib/adapters/mock/mock-catalog";
import { MockCustomerOrderingAdapter } from "@/lib/adapters/mock/mock-customer-ordering-adapter";
import { BrowserStorage, type KeyValueStorage } from "@/lib/storage/browser-storage";

interface PortalEnvelope<T> {
  data?: T;
  error?: { code?: string; message?: string; retryable?: boolean; details?: unknown };
}

interface PortalCatalogItem {
  sku: string;
  name: string;
  variantName: string;
  unitCode: string | null;
  price: Product["price"];
}

interface PortalCatalogPage {
  items: PortalCatalogItem[];
  hasMore: boolean;
  limit: number;
  offset: number;
}

type ClerkRuntime = Awaited<ReturnType<typeof loadClerkBrowser>> & {
  session?: { getToken(): Promise<string | null> };
  user?: { id?: string };
};

export class CustomerPortalRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable: boolean,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "CustomerPortalRequestError";
  }
}

const PAGE_SIZE = 50;
const PAGE_BATCH_SIZE = 4;
const MAX_CATALOG_ITEMS = 10_000;
const CORE_CART_KEY = "core-cart:v1";
const CORE_CHECKOUT_DRAFT_KEY = "core-checkout-draft:v1";
const sharedCatalogByUser = new Map<string, Promise<Product[]>>();

class PrefixedStorage implements KeyValueStorage {
  constructor(private readonly storage: KeyValueStorage, private readonly prefix: string) {}
  get<T>(key: string): T | null { return this.storage.get<T>(`${this.prefix}:${key}`); }
  set<T>(key: string, value: T): void { this.storage.set(`${this.prefix}:${key}`, value); }
  remove(key: string): void { this.storage.remove(`${this.prefix}:${key}`); }
}

function cloneProduct(product: Product): Product {
  return { ...product, aliases: [...product.aliases], price: { ...product.price } };
}

function canonicalSku(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? "";
}

function sanitizeCoreCart(cart: Partial<Cart> | null): Cart {
  const lines: CartLine[] = (Array.isArray(cart?.lines) ? cart.lines : [])
    .map((line) => ({
      sku: canonicalSku(line?.sku),
      quantity: typeof line?.quantity === "number" && Number.isFinite(line.quantity)
        ? Math.min(999, Math.max(1, Math.trunc(line.quantity)))
        : 0,
      ...(line?.note?.trim() ? { note: line.note.trim().slice(0, 2000) } : {}),
    }))
    .filter((line) => Boolean(line.sku) && line.quantity > 0);
  return { lines, updatedAt: typeof cart?.updatedAt === "string" ? cart.updatedAt : new Date().toISOString() };
}

function genericProduct(item: PortalCatalogItem): Product {
  return {
    sku: item.sku,
    familySku: item.sku,
    categoryId: "other",
    name: item.name || item.variantName || item.sku,
    aliases: [],
    brand: "",
    productType: "",
    flavor: null,
    size: item.variantName || "",
    purchaseMode: "retail",
    caseQuantity: null,
    packaging: item.unitCode || "đơn vị",
    unit: item.unitCode || "đơn vị",
    description: "",
    availability: "available",
    price: { ...item.price },
    visualTone: "wheat",
  };
}

function mapCatalogItem(item: PortalCatalogItem): Product {
  const metadata = MOCK_PRODUCTS.find((product) => product.sku.toUpperCase() === item.sku.toUpperCase());
  return metadata
    ? { ...cloneProduct(metadata), availability: "available", price: { ...item.price } }
    : genericProduct(item);
}

function filterCatalog(products: Product[], input: ProductSearchInput = {}): Product[] {
  const query = input.query?.trim() ?? "";
  return products
    .filter((product) => !input.categoryId || product.categoryId === input.categoryId)
    .filter((product) => !input.purchaseMode || product.purchaseMode === input.purchaseMode)
    .filter((product) => !input.brand || product.brand === input.brand)
    .filter((product) => !input.productType || product.productType === input.productType)
    .filter((product) => !input.flavor || product.flavor === input.flavor)
    .filter((product) => !input.size || product.size === input.size)
    .filter((product) => productMatchesQuery(product, query))
    .sort((left, right) => {
      const rank = productSearchRank(left, query) - productSearchRank(right, query);
      return rank || left.name.localeCompare(right.name, "vi") || left.sku.localeCompare(right.sku);
    });
}

async function clerkBrowser(): Promise<ClerkRuntime> {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) throw new CustomerPortalRequestError("CLERK_NOT_CONFIGURED", "Đăng nhập khách hàng chưa được cấu hình.", false, 503);
  return await loadClerkBrowser(publishableKey) as ClerkRuntime;
}

async function clerkIdentity(): Promise<{ clerk: ClerkRuntime; userId: string; token: string }> {
  const clerk = await clerkBrowser();
  const userId = clerk.user?.id?.trim() ?? "";
  const token = await clerk.session?.getToken();
  if (!userId || !token) throw new CustomerPortalRequestError("CUSTOMER_PORTAL_AUTH_REQUIRED", "Vui lòng đăng nhập lại để tiếp tục.", false, 401);
  return { clerk, userId, token };
}

async function requestPortal<T>(path: string, init: RequestInit = {}, idempotencyKey?: string): Promise<T> {
  const { token } = await clerkIdentity();
  let response: Response;
  try {
    response = await fetch(`/api/customer-portal${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new CustomerPortalRequestError("CUSTOMER_PORTAL_UNAVAILABLE", "Không kết nối được hệ thống đặt hàng. Vui lòng thử lại.", true, 503);
  }
  let envelope: PortalEnvelope<T> = {};
  try { envelope = await response.json() as PortalEnvelope<T>; } catch { /* normalized below */ }
  if (!response.ok || envelope.data === undefined) {
    throw new CustomerPortalRequestError(
      envelope.error?.code || "CUSTOMER_PORTAL_REQUEST_FAILED",
      envelope.error?.message || "Yêu cầu đặt hàng không thành công.",
      envelope.error?.retryable === true || response.status >= 500,
      response.status,
    );
  }
  return envelope.data;
}

async function fetchCatalogPages(): Promise<Product[]> {
  const products: Product[] = [];
  for (let startOffset = 0; startOffset < MAX_CATALOG_ITEMS; startOffset += PAGE_SIZE * PAGE_BATCH_SIZE) {
    const offsets = Array.from({ length: PAGE_BATCH_SIZE }, (_, index) => startOffset + index * PAGE_SIZE)
      .filter((offset) => offset < MAX_CATALOG_ITEMS);
    const pages = await Promise.all(offsets.map(async (offset) => {
      const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      return requestPortal<PortalCatalogPage>(`/catalog?${query.toString()}`);
    }));
    let reachedEnd = false;
    for (const page of pages) {
      products.push(...page.items.map(mapCatalogItem));
      if (!page.hasMore || page.items.length < PAGE_SIZE) {
        reachedEnd = true;
        break;
      }
    }
    if (reachedEnd) break;
  }
  return products;
}

export class CoreCustomerOrderingAdapter implements CustomerOrderingAdapter {
  private readonly storage = new BrowserStorage();

  private async userStorage(): Promise<PrefixedStorage> {
    const { userId } = await clerkIdentity();
    return new PrefixedStorage(this.storage, `hp-customer-ordering:core-user:${encodeURIComponent(userId)}`);
  }

  private async local(): Promise<MockCustomerOrderingAdapter> {
    return new MockCustomerOrderingAdapter(await this.userStorage());
  }

  async signIn(_input: SignInInput): Promise<CustomerSession> {
    throw new CustomerPortalRequestError("CLERK_SIGN_IN_REQUIRED", "Đăng nhập được quản lý bởi Clerk.", false, 400);
  }

  async getSession(): Promise<CustomerSession | null> {
    try {
      const data = await requestPortal<{ profile: CustomerSession["profile"] }>("/me");
      return { token: "", profile: data.profile, signedInAt: new Date().toISOString() };
    } catch (error) {
      if (error instanceof CustomerPortalRequestError && error.statusCode === 401) return null;
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const clerk = await clerkBrowser();
    const userId = clerk.user?.id?.trim();
    if (userId) sharedCatalogByUser.delete(userId);
    await clerk.signOut();
  }

  async listCategories(): Promise<Category[]> {
    return MOCK_CATEGORIES.map((category) => ({ ...category }));
  }

  private async loadCatalog(): Promise<Product[]> {
    const { userId } = await clerkIdentity();
    let promise = sharedCatalogByUser.get(userId);
    if (!promise) {
      promise = fetchCatalogPages();
      sharedCatalogByUser.set(userId, promise);
    }
    try {
      return await promise;
    } catch (error) {
      if (sharedCatalogByUser.get(userId) === promise) sharedCatalogByUser.delete(userId);
      throw error;
    }
  }

  async listProducts(input: ProductSearchInput = {}): Promise<Product[]> {
    return filterCatalog((await this.loadCatalog()).map(cloneProduct), input);
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    const normalized = sku.trim().toUpperCase();
    const found = (await this.loadCatalog()).find((product) => product.sku.toUpperCase() === normalized);
    return found ? cloneProduct(found) : null;
  }

  async getCart(): Promise<Cart> {
    const storage = await this.userStorage();
    return sanitizeCoreCart(storage.get<Partial<Cart>>(CORE_CART_KEY));
  }

  async saveCart(cart: Cart): Promise<void> {
    const storage = await this.userStorage();
    storage.set(CORE_CART_KEY, sanitizeCoreCart(cart));
  }

  async listDeliveryAddresses(): Promise<DeliveryAddress[]> {
    const data = await requestPortal<{ addresses: DeliveryAddress[] }>("/addresses");
    return data.addresses.map((address) => ({ ...address }));
  }

  async getCheckoutDraft(): Promise<CheckoutDraft> {
    const storage = await this.userStorage();
    const stored = storage.get<CheckoutDraft>(CORE_CHECKOUT_DRAFT_KEY);
    return stored ?? { addressId: null, orderNote: "", updatedAt: new Date(0).toISOString() };
  }

  async saveCheckoutDraft(draft: CheckoutDraft): Promise<void> {
    const storage = await this.userStorage();
    storage.set(CORE_CHECKOUT_DRAFT_KEY, {
      addressId: draft.addressId,
      orderNote: draft.orderNote.slice(0, 500),
      updatedAt: draft.updatedAt || new Date().toISOString(),
    });
  }

  async submitOrder(input: SubmitOrderInput): Promise<CustomerOrder> {
    const cart = await this.getCart();
    const data = await requestPortal<{ order: CustomerOrder }>(
      "/orders",
      { method: "POST", body: JSON.stringify({ addressId: input.addressId, orderNote: input.orderNote, lines: cart.lines }) },
      input.submissionKey,
    );
    await this.saveCart({ lines: [], updatedAt: new Date().toISOString() });
    await this.saveCheckoutDraft({ addressId: null, orderNote: "", updatedAt: new Date().toISOString() });
    return data.order;
  }

  async listOrders(): Promise<CustomerOrder[]> {
    const data = await requestPortal<{ orders: CustomerOrder[] }>("/orders");
    return data.orders;
  }

  async getOrderById(orderId: string): Promise<CustomerOrder | null> {
    try {
      const data = await requestPortal<{ order: CustomerOrder }>(`/orders/${encodeURIComponent(orderId)}`);
      return data.order;
    } catch (error) {
      if (error instanceof CustomerPortalRequestError && error.statusCode === 404) return null;
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<CustomerOrder> {
    const key = `portal-cancel-${orderId}`;
    const data = await requestPortal<{ order: CustomerOrder }>(
      `/orders/${encodeURIComponent(orderId)}/cancel`,
      { method: "POST", body: JSON.stringify({}) },
      key,
    );
    return data.order;
  }

  async reorderOrder(orderId: string): Promise<ReorderOrderResult> {
    const order = await this.getOrderById(orderId);
    if (!order) throw new CustomerPortalRequestError("CUSTOMER_PORTAL_ORDER_NOT_FOUND", "Không tìm thấy đơn hàng.", false, 404);
    const available = new Map((await this.loadCatalog()).map((product) => [product.sku.toUpperCase(), product]));
    const cart = await this.getCart();
    const quantities = new Map(cart.lines.map((line) => [line.sku.toUpperCase(), { ...line }]));
    let addedLineCount = 0;
    let skippedLineCount = 0;
    for (const line of order.lines) {
      const product = available.get(line.sku.toUpperCase());
      if (!product || product.availability !== "available") { skippedLineCount += 1; continue; }
      const current = quantities.get(line.sku.toUpperCase());
      quantities.set(line.sku.toUpperCase(), {
        sku: line.sku,
        quantity: Math.min(999, (current?.quantity ?? 0) + line.quantity),
        ...(line.note ? { note: line.note } : current?.note ? { note: current.note } : {}),
      });
      addedLineCount += 1;
    }
    if (addedLineCount === 0) throw new CustomerPortalRequestError("CUSTOMER_PORTAL_REORDER_UNAVAILABLE", "Các mặt hàng trong đơn cũ hiện chưa thể thêm lại vào giỏ.", false, 409);
    const next = sanitizeCoreCart({ lines: [...quantities.values()], updatedAt: new Date().toISOString() });
    await this.saveCart(next);
    return { cart: next, addedLineCount, skippedLineCount };
  }

  async listAnnouncements(): Promise<Announcement[]> { return (await this.local()).listAnnouncements(); }
  async getAnnouncementById(id: string): Promise<Announcement | null> { return (await this.local()).getAnnouncementById(id); }
  async markAnnouncementRead(id: string): Promise<Announcement> { return (await this.local()).markAnnouncementRead(id); }
  async getNotificationPreference(): Promise<NotificationPreference> { return (await this.local()).getNotificationPreference(); }
  async saveNotificationPreference(value: NotificationPreference): Promise<NotificationPreference> { return (await this.local()).saveNotificationPreference(value); }
}
