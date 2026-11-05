
/**
 * Whiskers & Whispers Arcana
 * Tarot & Oracle Deck Product Catalogue
 *
 * HOW TO ADD A PRODUCT:
 * 1. Put the product image inside: public/products/
 * 2. Add the product details below.
 * 3. Make sure the image filename matches exactly.
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
    image: "/products/moonlit-tarot.jpg",
    price: 35000,
    currency: "MMK",
    availability: "available",
    condition: "99% New",
  }, 
  {
    id: "The Wild Muse Oracle",
    name: "The Wild Muse Oracle",
    description: "Card Stock: Glossy Finish (Easy to Shuffle)",
    image: "/products/twmo.jpg",
    price: 17000,
    currency: "MMK",
    availability: "available",
    condition: "99% New",
  },
  {
    id: "Tea Leaf Oracle ",
    name: "Tea Leaf Oracle(200 Cards Included)",
    description: "Card Finish: Matte Finish",
    image: "/products/tlo.jpg",
    price: 35000,
    currency: "MMK",
    availability: "available",
    condition: "99% New",
  },
];
