import React, { useState, useMemo } from "react";
import { IconChevronLeft, IconChevronRight, IconCheck, IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import type { Item, Member } from "./data";
import { memberName } from "./data";
import clsx from "clsx";

export default function CalendarView({
  items,
  members,
  comments = [],
  userId,
  onToggleDone,
  onAddTodo,
  onDelete,
  onEdit,
}: {
  items: Item[];
  members: Member[];
  comments?: import("./data").Comment[];
  userId?: string | null;
  onToggleDone: (id: string) => void;
  onAddTodo: (title: string, dateStr: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (item: Item) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draft, setDraft] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Create array of days for the grid
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfMonth + 1;
    if (day > 0 && day <= daysInMonth) return day;
    return null;
  });

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const itemsByDate = useMemo(() => {
    const map = new Map<number, Item[]>();
    items.forEach(item => {
      if (item.category !== "todo") return;
      // Use created_at as the primary date for display purposes
      const date = (item.meta && item.meta.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)) ? new Date(item.meta) : new Date(item.created_at);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const d = date.getDate();
        if (!map.has(d)) map.set(d, []);
        map.get(d)!.push(item);
      }
    });
    return map;
  }, [items, year, month]);

  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const selectedItems = selectedDay ? itemsByDate.get(selectedDay) || [] : [];
  const todos = selectedItems.filter(i => i.category === "todo");


  return (
    <div className="flex-1 pb-10">
      {/* Calendar Controls */}
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              {year}년 {month + 1}월
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-sm active:bg-chrome">
                <IconChevronLeft size={20} stroke={2} />
              </button>
              <button onClick={nextMonth} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-sm active:bg-chrome">
                <IconChevronRight size={20} stroke={2} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="px-5">
            <div className="grid grid-cols-7 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <div key={day} className={clsx("text-center text-xs font-bold", i === 0 ? "text-danger" : i === 6 ? "text-primary" : "text-muted-foreground")}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-2 gap-x-1">
              {days.map((day, i) => {
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                const isSelected = day === selectedDay;
                const hasItems = day && itemsByDate.has(day);
                const isWeekend = i % 7 === 0 || i % 7 === 6;

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!day}
                    onClick={() => day && setSelectedDay(day)}
                    className={clsx(
                      "relative flex h-12 flex-col items-center justify-center rounded-xl transition-all",
                      !day && "invisible",
                      isSelected && "bg-primary text-primary-foreground shadow-md font-bold",
                      !isSelected && isToday && "bg-primary/10 text-primary font-bold",
                      !isSelected && !isToday && day && "bg-surface hover:bg-chrome/60 active:bg-chrome",
                      !isSelected && !isToday && isWeekend && "text-muted-foreground"
                    )}
                  >
                    <span>{day}</span>
                    {hasItems && (
                      <span className={clsx("absolute bottom-1.5 h-1.5 w-1.5 rounded-full", isSelected ? "bg-background" : "bg-primary")} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Items */}
          <div className="mt-8 px-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-muted-foreground">
                {selectedDay ? `${month + 1}월 ${selectedDay}일 일정` : "날짜를 선택하세요"}
              </h3>
            </div>
            
            {selectedDay && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim() && selectedDay) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                    onAddTodo(draft.trim(), dateStr);
                    setDraft("");
                  }
                }}
                className="mb-5 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`${selectedDay}일 할 일 추가...`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 rounded-xl bg-surface px-4 py-3 text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
                >
                  <IconPlus size={20} stroke={2} />
                </button>
              </form>
            )}

            {selectedDay && selectedItems.length === 0 ? (
              <div className="rounded-2xl border border-border border-dashed p-8 text-center text-muted-foreground">
                <p className="text-sm font-medium">등록된 일정이 없어요</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {todos.length > 0 && (
                  <div className="rounded-2xl bg-surface p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-primary mb-3 flex items-center gap-1">
                      <span className="w-1 h-3 bg-primary rounded-full" /> 할 일
                    </h4>
                    <ul className="flex flex-col gap-3">
                      {todos.map(item => {
                        const itemComments = comments.filter(c => c.item_id === item.id);
                        return (
                        <React.Fragment key={item.id}>
                        <li className="flex items-start gap-3 group">
                          <button onClick={() => onToggleDone(item.id)} className={clsx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors", item.done ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent")}>
                            <IconCheck size={13} stroke={3} />
                          </button>
                          <div className="flex flex-col flex-1 min-w-0" data-meta={item.meta || undefined}>
                            <span className={clsx("text-sm font-bold truncate", item.done ? "text-muted-foreground line-through" : "text-foreground")}>{item.title}</span>
                            <span className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-2">
                              {item.addedBy === userId ? "나" : memberName(members, item.addedBy)}
                              {itemComments.length > 0 && (
                                <span className="font-bold text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                  댓글 {itemComments.length}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                              <button onClick={() => onEdit(item)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                                <IconEdit size={16} stroke={2} />
                              </button>
                            )}
                            {onDelete && (
                              <button onClick={() => onDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-danger transition-colors">
                                <IconTrash size={16} stroke={2} />
                              </button>
                            )}
                          </div>
                        </li>
                        {itemComments.length > 0 && (
                          <div className="flex flex-col gap-2 pb-3 px-10 relative z-10 -mt-1">
                            {itemComments.map(c => {
                              const isMe = c.author_id === userId;
                              return (
                                <div key={c.id} className={clsx("px-3 py-2 rounded-2xl text-[13px] leading-tight max-w-[90%]", isMe ? "bg-primary/10 text-foreground self-end rounded-tr-sm" : "bg-chrome text-foreground self-start rounded-tl-sm")}>
                                  <span className={clsx("block text-[10px] font-bold mb-0.5", isMe ? "text-primary text-right" : "text-muted-foreground")}>
                                    {isMe ? "나" : memberName(members, c.author_id)}
                                  </span>
                                  {c.content}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        </React.Fragment>
                        );
                      })}
                    </ul>
                  </div>
                )}

              </div>
            )}
      </div>
    </div>
  );
}
