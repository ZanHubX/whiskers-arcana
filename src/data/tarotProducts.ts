/**
 * Tarot and oracle decks displayed in the public Tarot Shop.
 *
 * Add each real product below and place its photo in public/products/.
 * Example:
 * {
 *   id: "moonlit-tarot",
 *   name: "Moonlit Tarot",
 *   description: "A short description of this deck.",
 *   image: "/products/moonlit-tarot.jpg",
 *   price: 35000,
 *   currency: "MMK",
 *   availability: "available",
 * }
 */

export type TarotProduct = {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: number;
  currency?: string;
  availability: "available" | "preorder" | "sold-out";
  condition?: string;
};

export const tarotProducts: TarotProduct[] = [
  {
    id: "korenji-tarot",
    name: "Korenji Tarot (Hard Box)",
    description: "Card Stock: Textured Finish (Easy to Shuffle).",
    image: "/products/korenji-tarot.png",
    price: 35000,
    currency: "MMK",
    availability: "available",
    condition: "99% New",
  },
];
