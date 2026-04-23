import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      restaurantId: string | null;
    } & DefaultSession["user"];
  }
}

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

export type Cart = {
  items: CartItem[];
  total: number;
};
