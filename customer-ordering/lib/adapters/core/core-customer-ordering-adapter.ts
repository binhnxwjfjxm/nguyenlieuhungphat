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
import { loadClerkBrowser } from "@/lib/auth/clerk-browser";
import { productMatchesQuery, productSearchRank } from "@/lib/catalog-search";
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/lib/adapters/mock/mock-catalog";
import { MockCustomerOrderingAdapter } from "@/lib/adapters/mock/mock-customer-ordering-adapter";
import { BrowserStorage } from "@/lib/storage/browser-storage";

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
const localAdapter = () => new MockCustomerOrderingAdapter(new BrowserStorage());

function cloneProduct(product: Product): Product {
  return { ...product, aliases: [...product.aliases], price: { ...product.price } };
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

async function clerkBrowser() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) throw new CustomerPortalRequestError("CLERK_NOT_CONFIGURED", "Đăng nhập khách hàng chưa được cấu hình.", false, 503);
  return await loadClerkBrowser(publishableKey) as Awaited<ReturnType<typeof loadClerkBrowser>> & { session?: { getToken(): Promise<string | null> } };
}

async function clerkToken(): Promise<string> {
  const clerk = await clerkBrowser();
  const token = await clerk.session?.getToken();
  if (!token) throw new CustomerPortalRequestError("CUSTOMER_PORTAL_AUTH_REQUIRED", "Vui lòng đăng nhập lại để tiếp tục.", false, 401);
  return token;
}

async function requestPortal<T>(path: string, init: RequestInit = {}, idempotencyKey?: string): Promise<T> {
  const token = await clerkToken();
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

export class CoreCustomerOrderingAdapter implements CustomerOrderingAdapter {
  private readonly local = localAdapter();
  private catalogPromise: Promise<Product[]> | null = null;

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
    await clerk.signOut();
  }

  async listCategories(): Promise<Category[]> {
    return MOCK_CATEGORIES.map((category) => ({ ...category }));
  }

  private async loadCatalog(): Promise<Product[]> {
    if (this.catalogPromise) return this.catalogPromise;
    this.catalogPromise = (async () => {
      const products: Product[] = [];
      for (let offset = 0; offset < 10_000; offset += PAGE_SIZE) {
        const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
        const page = await requestPortal<PortalCatalogPage>(`/catalog?${query.toString()}`);
        products.push(...page.items.map(mapCatalogItem));
        if (!page.hasMore || page.items.length === 0) break;
      }
      return products;
    })();
    try {
      return await this.catalogPromise;
    } catch (error) {
      this.catalogPromise = null;
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

  getCart(): Promise<Cart> { return this.local.getCart(); }
  saveCart(cart: Cart): Promise<void> { return this.local.saveCart(cart); }

  async listDeliveryAddresses(): Promise<DeliveryAddress[]> {
    const data = await requestPortal<{ addresses: DeliveryAddress[] }>("/addresses");
    return data.addresses.map((address) => ({ ...address }));
  }

  getCheckoutDraft(): Promise<CheckoutDraft> { return this.local.getCheckoutDraft(); }
  saveCheckoutDraft(draft: CheckoutDraft): Promise<void> { return this.local.saveCheckoutDraft(draft); }

  async submitOrder(input: SubmitOrderInput): Promise<CustomerOrder> {
    const cart = await this.local.getCart();
    const data = await requestPortal<{ order: CustomerOrder }>(
      "/orders",
      { method: "POST", body: JSON.stringify({ addressId: input.addressId, orderNote: input.orderNote, lines: cart.lines }) },
      input.submissionKey,
    );
    await this.local.saveCart({ lines: [], updatedAt: new Date().toISOString() });
    await this.local.saveCheckoutDraft({ addressId: null, orderNote: "", updatedAt: new Date().toISOString() });
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
    const key = `portal-cancel:${orderId}`;
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
    const cart = await this.local.getCart();
    const quantities = new Map(cart.lines.map((line) => [line.sku.toUpperCase(), { ...line }]));
    let addedLineCount = 0;
    let skippedLineCount = 0;
    for (const line of order.lines) {
      const product = available.get(line.sku.toUpperCase());
      if (!product || product.availability !== "available") { skippedLineCount += 1; continue; }
      const current = quantities.get(line.sku.toUpperCase());
      quantities.set(line.sku.toUpperCase(), {
        sku: line.sku,
        quantity: (current?.quantity ?? 0) + line.quantity,
        ...(line.note ? { note: line.note } : current?.note ? { note: current.note } : {}),
      });
      addedLineCount += 1;
    }
    const next: Cart = { lines: [...quantities.values()], updatedAt: new Date().toISOString() };
    await this.local.saveCart(next);
    return { cart: next, addedLineCount, skippedLineCount };
  }

  listAnnouncements(): Promise<Announcement[]> { return this.local.listAnnouncements(); }
  getAnnouncementById(id: string): Promise<Announcement | null> { return this.local.getAnnouncementById(id); }
  markAnnouncementRead(id: string): Promise<Announcement> { return this.local.markAnnouncementRead(id); }
  getNotificationPreference(): Promise<NotificationPreference> { return this.local.getNotificationPreference(); }
  saveNotificationPreference(value: NotificationPreference): Promise<NotificationPreference> { return this.local.saveNotificationPreference(value); }
}
