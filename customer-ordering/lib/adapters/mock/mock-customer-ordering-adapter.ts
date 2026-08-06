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
  SignInInput,
  SubmitOrderInput,
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
const CHECKOUT_DRAFT_KEY = "hp-customer-ordering:checkout-draft:v1";
const ORDERS_KEY = "hp-customer-ordering:orders:v1";

const MOCK_DELIVERY_ADDRESSES: DeliveryAddress[] = [
  {
    id: "address-main",
    label: "Cửa hàng chính",
    recipientName: "Nguyễn Văn A",
    phone: "0901 234 567",
    addressLine: "125 Nguyễn Văn Linh, phường Tân Phong, TP. Hồ Chí Minh",
    isDefault: true,
  },
  {
    id: "address-warehouse",
    label: "Kho nhận hàng",
    recipientName: "Trần Minh Khoa",
    phone: "0908 456 789",
    addressLine: "18 Đường số 6, KCN Tân Tạo, TP. Hồ Chí Minh",
    isDefault: false,
  },
];

function cloneAddress(address: DeliveryAddress): DeliveryAddress {
  return { ...address };
}

function cloneOrder(order: CustomerOrder): CustomerOrder {
  return {
    ...order,
    address: cloneAddress(order.address),
    lines: order.lines.map((line) => ({ ...line })),
  };
}

function sanitizeCart(cart: Cart): Cart {
  const lines = cart.lines
    .filter((line) => line.productId && Number.isFinite(line.quantity) && line.quantity > 0)
    .map((line) => ({
      productId: line.productId,
      quantity: Math.min(999, Math.max(1, Math.trunc(line.quantity))),
      note: line.note?.trim() || undefined,
    }));
  return { lines, updatedAt: cart.updatedAt || new Date().toISOString() };
}

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
    return sanitizeCart(
      this.storage.get<Cart>(CART_KEY) ?? {
        lines: [],
        updatedAt: new Date(0).toISOString(),
      },
    );
  }

  async saveCart(cart: Cart): Promise<void> {
    this.storage.set(CART_KEY, sanitizeCart(cart));
  }

  async listDeliveryAddresses(): Promise<DeliveryAddress[]> {
    return MOCK_DELIVERY_ADDRESSES.map(cloneAddress);
  }

  async getCheckoutDraft(): Promise<CheckoutDraft> {
    return (
      this.storage.get<CheckoutDraft>(CHECKOUT_DRAFT_KEY) ?? {
        addressId: MOCK_DELIVERY_ADDRESSES.find((address) => address.isDefault)?.id ?? null,
        orderNote: "",
        updatedAt: new Date(0).toISOString(),
      }
    );
  }

  async saveCheckoutDraft(draft: CheckoutDraft): Promise<void> {
    this.storage.set(CHECKOUT_DRAFT_KEY, {
      addressId: draft.addressId,
      orderNote: draft.orderNote.slice(0, 500),
      updatedAt: draft.updatedAt || new Date().toISOString(),
    });
  }

  async submitOrder(input: SubmitOrderInput): Promise<CustomerOrder> {
    const existingOrders = this.storage.get<CustomerOrder[]>(ORDERS_KEY) ?? [];
    const duplicate = existingOrders.find((order) => order.submissionKey === input.submissionKey);
    if (duplicate) return cloneOrder(duplicate);

    const cart = await this.getCart();
    if (cart.lines.length === 0) {
      throw new Error("Giỏ hàng đang trống.");
    }

    const address = MOCK_DELIVERY_ADDRESSES.find((item) => item.id === input.addressId);
    if (!address) {
      throw new Error("Vui lòng chọn địa chỉ nhận hàng hợp lệ.");
    }

    const lines = cart.lines.map((line) => {
      const product = MOCK_PRODUCTS.find((item) => item.id === line.productId);
      if (!product) throw new Error("Có sản phẩm không còn trong danh mục.");
      if (product.availability !== "available") {
        throw new Error(`${product.name} hiện không thể nhận đơn.`);
      }
      return {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        packaging: product.packaging,
        unit: product.unit,
        quantity: line.quantity,
        note: line.note ?? "",
        unitPrice: product.price.status === "available" ? product.price.amount : null,
        currency: product.price.currency,
      };
    });

    const submittedAt = new Date().toISOString();
    const id = `mock-order-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const order: CustomerOrder = {
      id,
      code: `HP-${submittedAt.slice(2, 10).replaceAll("-", "")}-${id.slice(-5).toUpperCase()}`,
      submittedAt,
      address: cloneAddress(address),
      lines,
      totalQuantity: lines.reduce((total, line) => total + line.quantity, 0),
      pricedSubtotal: lines.reduce(
        (total, line) => total + (line.unitPrice === null ? 0 : line.unitPrice * line.quantity),
        0,
      ),
      hasPendingPrice: lines.some((line) => line.unitPrice === null),
      orderNote: input.orderNote.trim().slice(0, 500),
      submissionKey: input.submissionKey,
    };

    this.storage.set(ORDERS_KEY, [order, ...existingOrders].slice(0, 50));
    this.storage.set(CART_KEY, { lines: [], updatedAt: submittedAt });
    this.storage.remove(CHECKOUT_DRAFT_KEY);
    return cloneOrder(order);
  }

  async getOrderById(orderId: string): Promise<CustomerOrder | null> {
    const order = (this.storage.get<CustomerOrder[]>(ORDERS_KEY) ?? []).find(
      (item) => item.id === orderId,
    );
    return order ? cloneOrder(order) : null;
  }
}
