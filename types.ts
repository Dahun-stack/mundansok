export type Category = "studio" | "dress" | "makeup";
export type Slot = "am" | "pm";

export const CATEGORIES: Category[] = ["studio", "dress", "makeup"];

export const CATEGORY_LABEL: Record<Category, string> = {
  studio: "스튜디오",
  dress: "드레스",
  makeup: "메이크업",
};

export interface Addon {
  id: string;
  vendor_id: string;
  name: string;
  amount: number;
  required: boolean;
  sort_order: number;
}

export interface Vendor {
  id: string;
  slug: string;
  category: Category;
  name: string;
  area: string;
  description: string | null;
  base_price: number;
  rating: number;
  review_count: number;
  tags: string[];
  status: "pending" | "active" | "suspended";
}

export interface VendorWithAddons extends Vendor {
  addons: Addon[];
}

/** 업체별로 열려 있는 슬롯: { [vendorId]: { "2027-05-09": ["am","pm"] } } */
export type SlotMap = Record<string, Record<string, Slot[]>>;
