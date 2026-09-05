export type Category = "inbox" | "grocery" | "todo" | "system";

export type Member = {
  id: string;
  name: string;
  initial: string;
  role: "가족대표" | "구성원";
  avatar_url?: string | null;
  online?: boolean;
};

export type Item = {
  id: string;
  title: string;
  category: Category;
  done: boolean;
  addedBy: string;
  assignee?: string;
  meta?: string;
  created_at: string;
};

export const memberName = (members: Member[], id?: string) =>
  members.find((m) => m.id === id)?.name ?? "가족";

export type Comment = {
  id: string;
  item_id: string;
  family_id: string;
  author_id: string;
  content: string;
  created_at: string;
};
