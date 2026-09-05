const fs = require('fs');
let code = fs.readFileSync('src/HomeList.tsx', 'utf-8');

// 1. Remove old Todo toggle
const oldToggle = `              {/* Todo View Toggle */}
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
              </div>`;
code = code.replace(oldToggle, '');

// 2. Add new toggle to Tabs
const oldTabs = `            할 일
          </button>
        </div>`;

const newTabs = `            할 일
          </button>
          
          {currentTab === "todo" && (
            <div className="flex-1 flex justify-end">
              <button 
                onClick={() => setTodoView(v => v === "list" ? "calendar" : "list")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border/60 text-muted-foreground hover:text-primary hover:bg-chrome active:scale-95 transition-all shadow-sm"
              >
                {todoView === "list" ? <IconCalendar size={20} stroke={2} /> : <IconList size={20} stroke={2} />}
              </button>
            </div>
          )}
        </div>`;

code = code.replace(oldTabs, newTabs);

fs.writeFileSync('src/HomeList.tsx', code);
