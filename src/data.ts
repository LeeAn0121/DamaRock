export type Category = "inbox" | "grocery" | "todo";

export type Member = {
  id: string;
  name: string;
  initial: string;
  role: "어른" | "아이";
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

export const MEMBERS: Member[] = [
  { id: "m1", name: "엄마", initial: "엄", role: "어른" },
  { id: "m2", name: "아빠", initial: "아", role: "어른" },
  { id: "m3", name: "지우", initial: "지", role: "아이" },
];

export const memberName = (id?: string) => MEMBERS.find((m) => m.id === id)?.name ?? "나";

export const INITIAL_ITEMS: Item[] = [
  { id: "g1", title: "주방세제", category: "grocery", done: false, addedBy: "m1", meta: "1개" },
  { id: "g2", title: "우유", category: "grocery", done: false, addedBy: "m2", meta: "2개" },
  { id: "g3", title: "두루마리 화장지", category: "grocery", done: false, addedBy: "m3", meta: "1묶음" },
  { id: "g4", title: "계란", category: "grocery", done: true, addedBy: "m1", meta: "1판" },
  { id: "t1", title: "지우 학원비 입금", category: "todo", done: false, addedBy: "m1", meta: "오늘" },
  { id: "t2", title: "주말에 텃밭 물주기", category: "todo", done: false, addedBy: "m2", meta: "이번 주말" },
  { id: "t3", title: "거실 전구 교체", category: "todo", done: true, addedBy: "m2" },
];
