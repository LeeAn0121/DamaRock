import { useState, useMemo } from "react";
import { IconChevronLeft, IconChevronRight, IconCheck } from "@tabler/icons-react";
import type { Item, Member } from "./data";
import { memberName } from "./data";
import clsx from "clsx";

export default function CalendarPage({
  items,
  members,
  onBack,
  onToggleDone,
}: {
  items: Item[];
  members: Member[];
  onBack: () => void;
  onToggleDone: (id: string) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

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
      // Use created_at as the primary date for display purposes
      // (Ideally this would be a separate due_date column)
      const date = new Date(item.created_at);
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
  const groceries = selectedItems.filter(i => i.category === "grocery");

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border/60 px-2 py-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="뒤로"
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-chrome/60 active:bg-chrome"
            >
              <IconChevronLeft size={24} stroke={1.75} />
            </button>
            <h1 className="text-lg font-extrabold text-foreground tracking-tight">가족 달력</h1>
          </div>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="mr-3 px-3 py-1.5 text-sm font-bold text-primary bg-primary/10 rounded-full active:bg-primary/20 transition-colors"
          >
            오늘
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-10">
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
            <h3 className="text-sm font-bold text-muted-foreground mb-4">
              {selectedDay ? `${month + 1}월 ${selectedDay}일 일정` : "날짜를 선택하세요"}
            </h3>
            
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
                      {todos.map(item => (
                        <li key={item.id} className="flex items-start gap-3">
                          <button onClick={() => onToggleDone(item.id)} className={clsx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors", item.done ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent")}>
                            <IconCheck size={13} stroke={3} />
                          </button>
                          <div className="flex flex-col">
                            <span className={clsx("text-sm font-bold", item.done ? "text-muted-foreground line-through" : "text-foreground")}>{item.title}</span>
                            <span className="text-xs text-muted-foreground mt-0.5">{memberName(members, item.addedBy)} {item.meta && ` · ${item.meta}`}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {groceries.length > 0 && (
                  <div className="rounded-2xl bg-surface p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-[#FF8A00] mb-3 flex items-center gap-1">
                      <span className="w-1 h-3 bg-[#FF8A00] rounded-full" /> 장보기
                    </h4>
                    <ul className="flex flex-col gap-3">
                      {groceries.map(item => (
                        <li key={item.id} className="flex items-start gap-3">
                          <button onClick={() => onToggleDone(item.id)} className={clsx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors", item.done ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent")}>
                            <IconCheck size={13} stroke={3} />
                          </button>
                          <div className="flex flex-col">
                            <span className={clsx("text-sm font-bold", item.done ? "text-muted-foreground line-through" : "text-foreground")}>{item.title}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
