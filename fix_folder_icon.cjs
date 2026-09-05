const fs = require('fs');
let code = fs.readFileSync('src/GroceryFolders.tsx', 'utf-8');

const oldChangeIcon = `            {popup.type === 'CHANGE_ICON' && (
              <>
                <h3 className="font-bold text-lg">아이콘 변경</h3>
                <input 
                  autoFocus
                  className="w-full bg-chrome rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-2xl text-center" 
                  placeholder="이모지 입력"
                  maxLength={5}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConfirmPopup()}
                />
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 py-3 rounded-xl font-bold bg-chrome text-foreground/70" onClick={() => setPopup({ type: 'NONE' })}>취소</button>
                  <button className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-foreground" onClick={handleConfirmPopup}>변경</button>
                </div>
              </>
            )}`;

const newChangeIcon = `            {popup.type === 'CHANGE_ICON' && (
              <>
                <h3 className="font-bold text-lg mb-2">아이콘 변경</h3>
                <div className="grid grid-cols-5 gap-3 max-h-60 overflow-y-auto p-1 scrollbar-hide">
                  {["📁", "🛒", "🍗", "🥦", "🍎", "🧀", "🍞", "🍦", "🍷", "🐟", "📦", "💊", "🧼", "🍼", "💧", "☕", "🎂", "🍽", "🔪", "🥩", "🎉", "🔥", "🏠", "💡", "💰"].map(emoji => (
                    <button 
                      key={emoji}
                      onClick={() => {
                        saveFolders(folders.map(f => f.id === popup.folderId ? { ...f, icon: emoji } : f));
                        setPopup({ type: 'NONE' });
                      }}
                      className="text-3xl hover:scale-110 active:scale-90 transition-transform flex items-center justify-center p-2 rounded-xl hover:bg-chrome"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-3 rounded-xl font-bold bg-chrome text-foreground/70" onClick={() => setPopup({ type: 'NONE' })}>닫기</button>
                </div>
              </>
            )}`;

code = code.replace(oldChangeIcon, newChangeIcon);
fs.writeFileSync('src/GroceryFolders.tsx', code);
