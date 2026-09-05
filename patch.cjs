const fs = require('fs');
let code = fs.readFileSync('src/HomeList.tsx', 'utf-8');

// 1. Add imports
code = code.replace(
  'import CalendarView from "./CalendarView";',
  'import CalendarView from "./CalendarView";\nimport AddGrocerySheet from "./AddGrocerySheet";'
);

// 2. Add states
code = code.replace(
  'const [touchStartX, setTouchStartX] = useState<number | null>(null);',
  'const [touchStartX, setTouchStartX] = useState<number | null>(null);\n  const [todoView, setTodoView] = useState<"list" | "calendar">("list");\n  const [searchQuery, setSearchQuery] = useState("");\n  const [searchOpen, setSearchOpen] = useState(false);\n  const [addGroceryOpen, setAddGroceryOpen] = useState(false);'
);

// 3. Add search icon and banner
const searchIconStr = `
            <button
              type="button"
              aria-label="검색"
              onClick={() => setSearchOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-chrome/60 active:bg-chrome"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
            <button
              type="button"
              aria-label="설정"
`;
code = code.replace(
  `            <button
              type="button"
              aria-label="설정"`,
  searchIconStr.trim()
);

const bannerStr = `
        </header>

        {/* Invite Banner */}
        <div className="px-5 mb-2">
          <div onClick={() => props.onOpenInvite?.()} className="bg-primary/10 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">가족을 초대해보세요!</p>
                <p className="text-[11px] font-medium text-muted-foreground">함께 기록하면 더 편해요</p>
              </div>
            </div>
            <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full" onClick={(e) => { e.stopPropagation(); props.onOpenInvite?.(); }}>초대하기</button>
          </div>
        </div>

        {/* Search Bar Overlay */}
        {searchOpen && (
          <div className="absolute inset-0 z-[100] bg-background/95 backdrop-blur-md px-5 py-4 flex flex-col animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 flex items-center bg-chrome px-4 py-2.5 rounded-2xl border border-border/50">
                <svg className="text-muted-foreground mr-2 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  autoFocus
                  placeholder="장보기, 할일 검색 (삭제된 항목 제외)" 
                  className="bg-transparent flex-1 outline-none text-foreground font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-muted-foreground p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                )}
              </div>
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-sm font-bold text-foreground py-2 px-1">취소</button>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 pb-10">
              {searchQuery.trim().length > 0 ? (
                <div className="bg-surface rounded-2xl shadow-sm border border-border/40 p-2">
                  <ItemRows 
                    items={activeItems.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase().trim()))}
                    onToggle={onToggleDone}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onMove={moveItems}
                    onSelect={setSelectedItem}
                    members={members}
                    comments={comments}
                    userId={userId}
                  />
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm mt-10">검색어를 입력하세요</p>
              )}
            </div>
          </div>
        )}
`;
code = code.replace(
  '        </header>',
  bannerStr.trimStart()
);

// 4. Todo View Toggle and Grocery Add
const todoStr = `
          ) : (
            <>
              {/* Todo View Toggle */}
              <div className="flex justify-center mb-6">
                <div className="bg-chrome p-1 rounded-xl flex gap-1 shadow-inner border border-border/40">
                  <button 
                    className={todoView === "list" ? "px-5 py-1.5 rounded-lg text-sm font-bold transition-all bg-surface shadow-sm text-foreground" : "px-5 py-1.5 rounded-lg text-sm font-bold transition-all text-muted-foreground hover:text-foreground"}
                    onClick={() => setTodoView("list")}
                  >
                    리스트형
                  </button>
                  <button 
                    className={todoView === "calendar" ? "px-5 py-1.5 rounded-lg text-sm font-bold transition-all bg-surface shadow-sm text-foreground" : "px-5 py-1.5 rounded-lg text-sm font-bold transition-all text-muted-foreground hover:text-foreground"}
                    onClick={() => setTodoView("calendar")}
                  >
                    캘린더형
                  </button>
                </div>
              </div>
              
              {todoView === "calendar" ? (
                <CalendarView
                  items={todo}
                  members={members}
                  comments={comments}
                  userId={userId}
                  onToggleDone={onToggleDone}
                  onAddTodo={(title, dateStr) => props.addItem({ title, category: "todo", meta: dateStr })}
                  onDelete={handleDelete}
                  onEdit={handleEditTodo}
                />
              ) : (
                <div className="bg-surface rounded-2xl shadow-sm border border-border/40 p-3">
                  <h3 className="text-sm font-bold text-muted-foreground ml-2 mb-3 mt-1">할 일 목록</h3>
                  <ItemRows 
                    items={todo}
                    onToggle={onToggleDone}
                    onDelete={handleDelete}
                    onEdit={handleEditTodo}
                    onSelect={setSelectedItem}
                    members={members}
                    comments={comments}
                    userId={userId}
                  />
                </div>
              )}
            </>
          )}
`;
const oldTodoRender = `
          ) : (
            <CalendarView 
              items={items} 
              members={members} 
              onToggleDone={onToggleDone} 
              onDelete={handleDelete}
              onEdit={handleEditTodo}
              onAddTodo={(title, dateStr) => props.addItem({ title, category: "todo", meta: dateStr })} 
            />
          )}
`;
code = code.replace(oldTodoRender.trim(), todoStr.trim());

// 5. AddGrocerySheet integration
const quickAddForm = `
        {/* Bottom bar */}
        {currentTab === "grocery" && (
          <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl z-10">
            <div className="bg-surface/80 px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 backdrop-blur-md">
              <button
                onClick={() => setAddGroceryOpen(true)}
                className="w-full flex items-center justify-between gap-3 rounded-full border border-border/50 bg-background p-3 shadow-sm hover:border-primary/50 transition-colors text-left"
              >
                <span className="text-muted-foreground text-sm font-medium pl-2">새로운 장보기 항목을 추가하세요...</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <IconPlus size={18} stroke={2.5} />
                </span>
              </button>
            </div>
          </div>
        )}

        <AddGrocerySheet
          open={addGroceryOpen}
          items={items}
          onClose={() => setAddGroceryOpen(false)}
          onAdd={(folderId, title, memo) => {
            const meta = memo ? folderId + "::MEMO::" + memo : folderId;
            props.addItem({ title, category: "grocery", meta });
          }}
        />
`;

code = code.replace(/\{\/\* Bottom bar \*\/\}.*?<\/form>\s*<\/div>\s*<\/div>\s*\)}/s, quickAddForm.trim());

// 6. Fix onOpenSettings missing onOpenInvite
code = code.replace('onOpenSettings?: () => void;', 'onOpenSettings?: () => void;\n  onOpenInvite?: () => void;');


fs.writeFileSync('src/HomeList.tsx', code);
