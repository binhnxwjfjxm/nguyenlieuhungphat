export interface CustomerProfile { customerCode: string; displayName: string; phone: string; outletName: string; }
export interface CustomerSession { token: string; profile: CustomerProfile; signedInAt: string; }
export interface SignInInput { phone: string; password: string; }
export interface CartLine { productId: string; quantity: number; }
export interface Cart { lines: CartLine[]; updatedAt: string; }
export interface CustomerOrderingAdapter {
  signIn(input: SignInInput): Promise<CustomerSession>;
  getSession(): Promise<CustomerSession | null>;
  signOut(): Promise<void>;
  getCart(): Promise<Cart>;
  saveCart(cart: Cart): Promise<void>;
}
