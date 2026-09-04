export type Category = "inbox" | "grocery" | "todo";

export type Member = {
  id: string;
  name: string;
  initial: string;
  role: "어른" | "아이";
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
};

export const memberName = (members: Member[], id?: string) =>
  members.find((m) => m.id === id)?.name ?? "가족";
