import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function getCartItemImage(item: {
  product?: {
    images?: string[];
    colors?: { name: string; hex?: string; image?: string }[];
  };
  selectedColor?: string;
  selectedColorImage?: string;
}): string {
  if (item.selectedColorImage) return item.selectedColorImage;

  const colorName = item.selectedColor;
  if (colorName && item.product?.colors) {
    const matchingColor = item.product.colors.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );
    if (matchingColor?.image) {
      return matchingColor.image;
    }
  }

  if (colorName && item.product?.images) {
    const colorSlug = colorName.toLowerCase().replace(/\s+/g, '-');
    const matchedUrl = item.product.images.find((img) =>
      img.toLowerCase().includes(colorSlug)
    );
    if (matchedUrl) {
      return matchedUrl;
    }
  }

  return item.product?.images?.[0] || '/nilora-logo-transparent.png';
}
