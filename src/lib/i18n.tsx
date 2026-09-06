import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "ko" | "en" | "ja" | "zh";
export type LangSetting = Lang | "auto";

export const SUPPORTED_LANGS: Lang[] = ["ko", "en", "ja", "zh"];
const STORAGE_KEY = "language";

function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return "ko";
  const code = navigator.language?.slice(0, 2).toLowerCase();
  return (SUPPORTED_LANGS as string[]).includes(code) ? (code as Lang) : "ko";
}

function resolveLang(setting: LangSetting): Lang {
  return setting === "auto" ? detectBrowserLang() : setting;
}

type Dict = Record<string, Record<Lang, string>>;

// prettier-ignore
const dict: Dict = {
  "appName": { ko: "담아락", en: "DamaRock", ja: "DamaRock", zh: "DamaRock" },

  // common
  "common.cancel": { ko: "취소", en: "Cancel", ja: "キャンセル", zh: "取消" },
  "common.add": { ko: "추가", en: "Add", ja: "追加", zh: "添加" },
  "common.close": { ko: "닫기", en: "Close", ja: "閉じる", zh: "关闭" },
  "common.back": { ko: "뒤로", en: "Back", ja: "戻る", zh: "返回" },
  "common.edit": { ko: "수정", en: "Edit", ja: "編集", zh: "编辑" },
  "common.delete": { ko: "삭제", en: "Delete", ja: "削除", zh: "删除" },
  "common.retry": { ko: "다시 시도", en: "Retry", ja: "再試行", zh: "重试" },
  "common.me": { ko: "나", en: "Me", ja: "自分", zh: "我" },
  "common.grocery": { ko: "장보기", en: "Groceries", ja: "買い物", zh: "购物" },
  "common.todo": { ko: "할 일", en: "To-do", ja: "やること", zh: "待办" },
  "common.memo": { ko: "메모", en: "Note", ja: "メモ", zh: "备忘" },
  "common.comments": { ko: "댓글 {{n}}", en: "{{n}} comments", ja: "コメント{{n}}", zh: "评论{{n}}" },

  // auth
  "auth.headline1": { ko: "우리집 장보기와 할 일을", en: "Groceries and to-dos", ja: "わが家の買い物とやることを", zh: "把家里的购物和待办事项" },
  "auth.headline2": { ko: "가족과 한곳에", en: "shared with your family", ja: "家族とひとつの場所に", zh: "和家人放在一起" },
  "auth.subtitle": { ko: "누가 적어도 실시간으로 함께 채워져요.\n초대 코드 하나면 가족과 바로 시작할 수 있어요.", en: "Whoever adds something, everyone sees it live.\nOne invite code and your family is set up.", ja: "誰かが入力すると、リアルタイムで共有されます。\n招待コード一つで家族とすぐに始められます。", zh: "无论谁添加，家人都能实时看到。\n一个邀请码即可与家人一起开始使用。" },
  "auth.feature1": { ko: "장보기 항목과 할 일을 깔끔하게 관리", en: "Manage groceries and to-dos cleanly", ja: "買い物とやることをすっきり管理", zh: "整洁地管理购物和待办事项" },
  "auth.feature2": { ko: "캘린더로 일정을 한눈에 파악", en: "See your schedule at a glance on the calendar", ja: "カレンダーで予定を一目で把握", zh: "在日历上一目了然地查看日程" },
  "auth.feature3": { ko: "항목별 실시간 댓글로 쉽게 상의해요", en: "Discuss easily with live comments on each item", ja: "項目ごとのリアルタイムコメントで簡単に相談", zh: "通过每个项目的实时评论轻松沟通" },
  "auth.kakao": { ko: "카카오로 시작하기", en: "Continue with Kakao", ja: "カカオで始める", zh: "使用 Kakao 继续" },
  "auth.google": { ko: "Google로 시작하기", en: "Continue with Google", ja: "Googleで始める", zh: "使用 Google 继续" },
  "auth.recentLogin": { ko: "최근 로그인", en: "Last used", ja: "最近使用", zh: "最近使用" },
  "auth.errorAlreadyRegistered": { ko: "이미 다른 소셜 계정(카카오 또는 구글)으로 가입된 이메일입니다. 기존 계정으로 로그인해주세요.", en: "This email is already registered with a different sign-in method (Kakao or Google). Please sign in with your existing account.", ja: "このメールアドレスは別のログイン方法（カカオまたはGoogle）で登録済みです。既存のアカウントでログインしてください。", zh: "该邮箱已使用其他登录方式（Kakao 或 Google）注册。请使用现有账号登录。" },

  // onboarding
  "onboarding.signOut": { ko: "로그아웃", en: "Sign out", ja: "ログアウト", zh: "退出登录" },
  "onboarding.title": { ko: "아직 참여한 가족 공간이 없어요", en: "You haven't joined a family space yet", ja: "まだ参加した家族スペースがありません", zh: "您还没有加入任何家庭空间" },
  "onboarding.subtitle": { ko: "새로 만들거나 초대 코드로 참여해보세요.", en: "Create a new one or join with an invite code.", ja: "新しく作るか、招待コードで参加してみましょう。", zh: "创建一个新空间，或使用邀请码加入。" },
  "onboarding.createTitle": { ko: "가족 공간 만들기", en: "Create a family space", ja: "家族スペースを作る", zh: "创建家庭空间" },
  "onboarding.createDesc": { ko: "우리 가족만의 공간을 새로 시작해요", en: "Start a brand-new space just for your family", ja: "あなたの家族だけのスペースを新しく始めましょう", zh: "为您的家庭开启一个全新的空间" },
  "onboarding.joinTitle": { ko: "초대 코드로 참여하기", en: "Join with an invite code", ja: "招待コードで参加する", zh: "使用邀请码加入" },
  "onboarding.joinDesc": { ko: "가족에게 받은 코드를 입력해요", en: "Enter the code you got from your family", ja: "家族から受け取ったコードを入力します", zh: "输入您从家人那里获得的邀请码" },
  "onboarding.createHeading": { ko: "우리 가족이 모일 공간의 이름을 지어주세요.", en: "Give your family's space a name.", ja: "家族が集まるスペースの名前をつけてください。", zh: "为您家人聚集的空间取个名字。" },
  "onboarding.familyNameLabel": { ko: "가족 이름", en: "Family name", ja: "家族の名前", zh: "家庭名称" },
  "onboarding.familyNamePlaceholder": { ko: "예: 우리집", en: "e.g. My Family", ja: "例：わが家", zh: "例如：我们家" },
  "onboarding.defaultFamilyName": { ko: "우리집", en: "My Family", ja: "わが家", zh: "我们家" },
  "onboarding.createSubmit": { ko: "만들기", en: "Create", ja: "作成", zh: "创建" },
  "onboarding.joinHeading": { ko: "전달받은 6자리 코드를 입력해주세요.", en: "Enter the 6-digit code you were given.", ja: "受け取った6桁のコードを入力してください。", zh: "请输入您收到的 6 位邀请码。" },
  "onboarding.codeLabel": { ko: "초대 코드", en: "Invite code", ja: "招待コード", zh: "邀请码" },
  "onboarding.codePlaceholder": { ko: "예: 742-819", en: "e.g. 742-819", ja: "例：742-819", zh: "例如：742-819" },
  "onboarding.joinSubmit": { ko: "참여하기", en: "Join", ja: "参加する", zh: "加入" },

  // app shell
  "app.errorTitle": { ko: "문제가 생겼어요", en: "Something went wrong", ja: "問題が発生しました", zh: "出了点问题" },

  // home
  "home.activity": { ko: "소식", en: "Activity", ja: "アクティビティ", zh: "动态" },
  "home.search": { ko: "검색", en: "Search", ja: "検索", zh: "搜索" },
  "home.settings": { ko: "설정", en: "Settings", ja: "設定", zh: "设置" },
  "home.inviteBannerTitle": { ko: "가족을 초대해보세요!", en: "Invite your family!", ja: "家族を招待しましょう！", zh: "邀请您的家人吧！" },
  "home.inviteBannerDesc": { ko: "함께 기록하면 더 편해요", en: "It's easier when you track things together", ja: "一緒に記録するともっと便利です", zh: "一起记录会更方便" },
  "home.inviteCta": { ko: "초대하기", en: "Invite", ja: "招待する", zh: "邀请" },
  "home.searchPlaceholder": { ko: "장보기, 할일 검색 (삭제된 항목 제외)", en: "Search groceries and to-dos (excludes deleted)", ja: "買い物・やることを検索（削除済みを除く）", zh: "搜索购物和待办事项（不含已删除）" },
  "home.searchEmpty": { ko: "검색어를 입력하세요", en: "Type something to search", ja: "検索キーワードを入力してください", zh: "请输入搜索关键词" },
  "home.searchNoResults": { ko: "'{{query}}'에 대한 검색 결과가 없어요", en: "No results for '{{query}}'", ja: "「{{query}}」の検索結果はありません", zh: "没有找到「{{query}}」的结果" },
  "home.remaining": { ko: "{{n}}개 남았어요", en: "{{n}} left", ja: "残り{{n}}件", zh: "还剩 {{n}} 项" },
  "home.remainingSuffix": { ko: "개 남았어요", en: "left", ja: "件残り", zh: "项待办" },
  "home.summaryLine": { ko: "장보기 {{grocery}} · 할 일 {{todo}}", en: "Groceries {{grocery}} · To-dos {{todo}}", ja: "買い物{{grocery}}・やること{{todo}}", zh: "购物 {{grocery}} · 待办 {{todo}}" },
  "home.doneToday": { ko: "오늘 {{n}}개 완료", en: "{{n}} done today", ja: "本日{{n}}件完了", zh: "今日完成 {{n}} 项" },
  "home.newlyAdded": { ko: "새로 담은 것", en: "Just added", ja: "新しく追加したもの", zh: "新添加的" },
  "home.todoListTitle": { ko: "할 일 목록", en: "To-do list", ja: "やることリスト", zh: "待办列表" },
  "home.addGroceryPlaceholder": { ko: "새로운 장보기 항목을 추가하세요...", en: "Add a new grocery item...", ja: "新しい買い物項目を追加...", zh: "添加新的购物项目..." },
  "home.emptyTitle": { ko: "아직 담긴 게 없어요", en: "Nothing here yet", ja: "まだ何もありません", zh: "还没有任何内容" },
  "home.emptyDesc": { ko: "다 떨어진 것이나 할 일이 떠오르면\n아래 입력창에 바로 담아보세요", en: "Whenever you run out of something or think of a task,\nadd it right in the box below", ja: "なくなったものや、やるべきことを思いついたら\n下の入力欄にすぐ追加してみましょう", zh: "想到缺什么或要做什么时\n直接在下方输入框添加吧" },
  "home.errorTitle": { ko: "목록을 불러오지 못했어요", en: "Couldn't load your list", ja: "リストを読み込めませんでした", zh: "无法加载列表" },
  "home.errorDesc": { ko: "인터넷 연결을 확인하고\n다시 시도해주세요", en: "Please check your internet connection\nand try again", ja: "インターネット接続を確認して\nもう一度お試しください", zh: "请检查网络连接\n然后重试" },
  "home.promptEditItem": { ko: "수정할 내용을 입력하세요:", en: "Edit this item:", ja: "修正する内容を入力してください：", zh: "请输入修改内容：" },
  "home.promptEditTodo": { ko: "할 일을 수정하세요:", en: "Edit the to-do:", ja: "やることを修正してください：", zh: "请修改待办事项：" },
  "home.promptEditDate": { ko: "날짜를 수정하세요 (YYYY-MM-DD):", en: "Edit the date (YYYY-MM-DD):", ja: "日付を修正してください（YYYY-MM-DD）：", zh: "请修改日期（YYYY-MM-DD）：" },
  "home.confirmDelete": { ko: "항목 삭제 시, 달린 댓글도 모두 삭제됩니다. 그래도 삭제하시겠습니까?", en: "Deleting this item will also delete all its comments. Delete anyway?", ja: "項目を削除すると、付いているコメントもすべて削除されます。削除しますか？", zh: "删除该项目将同时删除其所有评论。仍要删除吗？" },

  // grocery folders
  "grocery.itemsHeading": { ko: "장보기 항목", en: "Grocery items", ja: "買い物項目", zh: "购物项目" },
  "grocery.folderNamePrompt": { ko: "폴더 이름을 입력해주세요.", en: "Please enter a folder name.", ja: "フォルダ名を入力してください。", zh: "请输入文件夹名称。" },
  "grocery.folderCreated": { ko: "새 폴더가 추가되었습니다.", en: "New folder added.", ja: "新しいフォルダが追加されました。", zh: "新文件夹已添加。" },
  "grocery.iconPrompt": { ko: "아이콘(이모지)을 입력해주세요.", en: "Please enter an icon (emoji).", ja: "アイコン（絵文字）を入力してください。", zh: "请输入图标（表情符号）。" },
  "grocery.iconChanged": { ko: "아이콘이 변경되었습니다.", en: "Icon updated.", ja: "アイコンが変更されました。", zh: "图标已更新。" },
  "grocery.folderDeleted": { ko: "폴더가 삭제되었습니다.", en: "Folder deleted.", ja: "フォルダが削除されました。", zh: "文件夹已删除。" },
  "grocery.movedToUnsorted": { ko: "미분류로 이동되었습니다.", en: "Moved to unsorted.", ja: "未分類に移動しました。", zh: "已移至未分类。" },
  "grocery.movedToFolder": { ko: "'{{name}}' 폴더로 이동되었습니다.", en: "Moved to '{{name}}'.", ja: "「{{name}}」フォルダに移動しました。", zh: "已移至「{{name}}」文件夹。" },
  "grocery.noFolders": { ko: "생성된 폴더가 없습니다. 먼저 폴더를 추가해주세요.", en: "No folders yet. Add one first.", ja: "作成されたフォルダがありません。先にフォルダを追加してください。", zh: "还没有文件夹，请先添加一个。" },
  "grocery.changeIconTitle": { ko: "아이콘 변경", en: "Change icon", ja: "アイコン変更", zh: "更改图标" },
  "grocery.defaultFolder": { ko: "기본 폴더", en: "Default folder", ja: "デフォルトフォルダ", zh: "默认文件夹" },
  "grocery.unsorted": { ko: "미분류", en: "Unsorted", ja: "未分類", zh: "未分类" },
  "grocery.addFolder": { ko: "새 폴더 추가", en: "Add folder", ja: "新しいフォルダを追加", zh: "添加文件夹" },
  "grocery.purchased": { ko: "구매완료", en: "Purchased", ja: "購入済み", zh: "已购买" },
  "grocery.deletedSection": { ko: "삭제됨", en: "Deleted", ja: "削除済み", zh: "已删除" },
  "grocery.autoDeleteNote": { ko: "30일 후 자동 삭제", en: "Auto-deletes after 30 days", ja: "30日後に自動削除", zh: "30 天后自动删除" },
  "grocery.noDeletedItems": { ko: "삭제된 항목이 없습니다", en: "No deleted items", ja: "削除された項目はありません", zh: "没有已删除的项目" },
  "grocery.restore": { ko: "복구", en: "Restore", ja: "復元", zh: "恢复" },
  "grocery.confirmHardDelete": { ko: "완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.", en: "Permanently delete this? This can't be undone.", ja: "完全に削除しますか？この操作は元に戻せません。", zh: "确定要永久删除吗？此操作无法撤销。" },
  "grocery.newFolderTitle": { ko: "새 폴더", en: "New folder", ja: "新しいフォルダ", zh: "新建文件夹" },
  "grocery.folderNamePlaceholder": { ko: "폴더 이름", en: "Folder name", ja: "フォルダ名", zh: "文件夹名称" },
  "grocery.deleteFolderTitle": { ko: "폴더 삭제", en: "Delete folder", ja: "フォルダ削除", zh: "删除文件夹" },
  "grocery.deleteFolderDesc": { ko: "폴더를 삭제하시겠습니까?\n안에 있는 항목은 '미분류'로 이동됩니다.", en: "Delete this folder?\nItems inside will move to \"Unsorted\".", ja: "フォルダを削除しますか？\n中の項目は「未分類」に移動します。", zh: "确定要删除该文件夹吗？\n其中的项目将移至「未分类」。" },
  "grocery.selectMoveFolder": { ko: "이동할 폴더 선택", en: "Choose a folder to move to", ja: "移動先のフォルダを選択", zh: "选择要移动到的文件夹" },

  // add item / add grocery sheets
  "addItem.title": { ko: "새 항목 담기", en: "Add a new item", ja: "新しい項目を追加", zh: "添加新项目" },
  "addItem.whatToAdd": { ko: "무엇을 담을까요", en: "What are you adding", ja: "何を追加しますか", zh: "要添加什么" },
  "addItem.groceryPlaceholder": { ko: "예: 우유", en: "e.g. Milk", ja: "例：牛乳", zh: "例如：牛奶" },
  "addItem.todoPlaceholder": { ko: "예: 지우 학원비 입금", en: "e.g. Pay for Jiwoo's classes", ja: "例：ジウの塾代の入金", zh: "例如：交智友的补习费" },
  "addItem.noteLabel": { ko: "수량이나 메모", en: "Quantity or note", ja: "数量やメモ", zh: "数量或备注" },
  "addItem.optional": { ko: " (선택)", en: " (optional)", ja: "（任意）", zh: "（可选）" },
  "addItem.notePlaceholder": { ko: "예: 2개", en: "e.g. 2", ja: "例：2個", zh: "例如：2个" },
  "addItem.dueLabel": { ko: "언제까지", en: "Due", ja: "期限", zh: "截止时间" },
  "addItem.dueToday": { ko: "오늘", en: "Today", ja: "今日", zh: "今天" },
  "addItem.dueWeekend": { ko: "이번 주말", en: "This weekend", ja: "今週末", zh: "本周末" },
  "addItem.dueNextWeek": { ko: "다음 주", en: "Next week", ja: "来週", zh: "下周" },
  "addItem.assigneeLabel": { ko: "담당자", en: "Assignee", ja: "担当者", zh: "负责人" },
  "addItem.submit": { ko: "담기", en: "Add", ja: "追加", zh: "添加" },
  "addGrocery.title": { ko: "장보기 추가", en: "Add grocery item", ja: "買い物を追加", zh: "添加购物项目" },
  "addGrocery.chooseFolder": { ko: "폴더 선택", en: "Choose a folder", ja: "フォルダを選択", zh: "选择文件夹" },
  "addGrocery.itemLabel": { ko: "살 것", en: "Item", ja: "買うもの", zh: "购买项" },
  "addGrocery.itemPlaceholder": { ko: "예: 서울우유 1L", en: "e.g. Milk 1L", ja: "例：牛乳1L", zh: "例如：牛奶 1L" },
  "addGrocery.noteLabel": { ko: "메모 (선택)", en: "Note (optional)", ja: "メモ（任意）", zh: "备注（可选）" },
  "addGrocery.notePlaceholder": { ko: "추가 설명이나 개수를 적어주세요", en: "Add any extra detail or quantity", ja: "補足説明や個数を入力してください", zh: "请填写补充说明或数量" },

  // item detail / comments
  "itemDetail.loading": { ko: "댓글을 불러오는 중...", en: "Loading comments...", ja: "コメントを読み込み中...", zh: "正在加载评论..." },
  "itemDetail.empty": { ko: "첫 댓글을 남겨보세요!", en: "Be the first to comment!", ja: "最初のコメントを残しましょう！", zh: "抢先留下第一条评论吧！" },
  "itemDetail.placeholder": { ko: "댓글 입력...", en: "Write a comment...", ja: "コメントを入力...", zh: "输入评论..." },
  "itemDetail.editPrompt": { ko: "댓글을 수정하세요:", en: "Edit your comment:", ja: "コメントを修正してください：", zh: "请修改评论：" },
  "itemDetail.confirmDelete": { ko: "댓글을 삭제하시겠습니까?", en: "Delete this comment?", ja: "コメントを削除しますか？", zh: "确定要删除这条评论吗？" },
  "itemDetail.addFailed": { ko: "댓글 등록에 실패했어요. 다시 시도해주세요.", en: "Couldn't post the comment. Please try again.", ja: "コメントの投稿に失敗しました。もう一度お試しください。", zh: "评论发布失败，请重试。" },
  "itemDetail.editFailed": { ko: "댓글 수정에 실패했어요. 다시 시도해주세요.", en: "Couldn't edit the comment. Please try again.", ja: "コメントの修正に失敗しました。もう一度お試しください。", zh: "评论修改失败，请重试。" },
  "itemDetail.deleteFailed": { ko: "댓글 삭제에 실패했어요. 다시 시도해주세요.", en: "Couldn't delete the comment. Please try again.", ja: "コメントの削除に失敗しました。もう一度お試しください。", zh: "评论删除失败，请重试。" },

  // item rows
  "itemRows.empty": { ko: "모두 담아뒀어요", en: "All caught up", ja: "すべて完了しました", zh: "全部完成啦" },
  "itemRows.move": { ko: "폴더 이동", en: "Move folder", ja: "フォルダ移動", zh: "移动文件夹" },
  "itemRows.editItem": { ko: "항목 수정", en: "Edit item", ja: "項目を修正", zh: "编辑项目" },
  "itemRows.deleteItem": { ko: "항목 삭제", en: "Delete item", ja: "項目を削除", zh: "删除项目" },
  "itemRows.done": { ko: "담음 ({{n}})", en: "Done ({{n}})", ja: "完了（{{n}}）", zh: "已完成（{{n}}）" },

  // calendar
  "calendar.noSchedule": { ko: "등록된 일정이 없어요", en: "No events yet", ja: "登録された予定はありません", zh: "还没有安排的日程" },
  "calendar.selectDate": { ko: "날짜를 선택하세요", en: "Select a date", ja: "日付を選択してください", zh: "请选择日期" },
  "calendar.addTodoPlaceholder": { ko: "{{day}}일 할 일 추가...", en: "Add a to-do for the {{day}}...", ja: "{{day}}日のやることを追加...", zh: "为 {{day}} 日添加待办..." },
  "calendar.dayEvents": { ko: "{{month}}월 {{day}}일 일정", en: "Events on {{month}}/{{day}}", ja: "{{month}}月{{day}}日の予定", zh: "{{month}}月{{day}}日的日程" },

  // activity
  "activity.title": { ko: "활동 내역", en: "Activity", ja: "アクティビティ", zh: "活动记录" },
  "activity.recent": { ko: "최근 가족 활동", en: "Recent family activity", ja: "最近の家族の活動", zh: "最近的家庭动态" },
  "activity.empty": { ko: "아직 등록된 활동이 없어요.", en: "No activity yet.", ja: "まだ登録された活動はありません。", zh: "暂无活动记录。" },
  "activity.completed": { ko: "{{name}}님이 '{{title}}' 항목을 완료했어요!", en: "{{name}} completed '{{title}}'!", ja: "{{name}}さんが「{{title}}」を完了しました！", zh: "{{name}} 完成了「{{title}}」！" },
  "activity.added": { ko: "{{name}}님이 '{{title}}' 항목을 추가했어요.", en: "{{name}} added '{{title}}'.", ja: "{{name}}さんが「{{title}}」を追加しました。", zh: "{{name}} 添加了「{{title}}」。" },
  "time.justNow": { ko: "방금 전", en: "just now", ja: "たった今", zh: "刚刚" },
  "time.minutesAgo": { ko: "{{n}}분 전", en: "{{n}}m ago", ja: "{{n}}分前", zh: "{{n}}分钟前" },
  "time.hoursAgo": { ko: "{{n}}시간 전", en: "{{n}}h ago", ja: "{{n}}時間前", zh: "{{n}}小时前" },
  "time.daysAgo": { ko: "{{n}}일 전", en: "{{n}}d ago", ja: "{{n}}日前", zh: "{{n}}天前" },

  // family invite
  "invite.header": { ko: "가족 구성원", en: "Family members", ja: "家族メンバー", zh: "家庭成员" },
  "invite.sectionTitle": { ko: "가족 초대", en: "Invite family", ja: "家族を招待", zh: "邀请家人" },
  "invite.manageGroup": { ko: "그룹 관리하기", en: "Manage group", ja: "グループ管理", zh: "管理群组" },
  "invite.shareByCode": { ko: "코드로 알려주기", en: "Share by code", ja: "コードで知らせる", zh: "通过邀请码分享" },
  "invite.codeExpiry": { ko: "(자동 1일 후 만료)", en: "(expires in 1 day)", ja: "（1日後に自動失効）", zh: "（1天后自动失效）" },
  "invite.refreshCode": { ko: "새 코드 발급받기", en: "Get a new code", ja: "新しいコードを発行", zh: "获取新邀请码" },
  "invite.kakaoShare": { ko: "카카오톡으로 공유하기", en: "Share via KakaoTalk", ja: "カカオトークで共有", zh: "通过 KakaoTalk 分享" },
  "invite.kakaoNotReady": { ko: "카카오톡 공유가 초기화되지 않았습니다. 관리자에게 문의하세요.", en: "KakaoTalk sharing isn't ready yet. Please contact the admin.", ja: "カカオトーク共有が初期化されていません。管理者にお問い合わせください。", zh: "KakaoTalk 分享尚未初始化，请联系管理员。" },
  "invite.copied": { ko: "복사됨", en: "Copied", ja: "コピーしました", zh: "已复制" },
  "invite.copyLink": { ko: "초대 링크 복사", en: "Copy invite link", ja: "招待リンクをコピー", zh: "复制邀请链接" },
  "invite.shareOther": { ko: "다른 앱으로 공유", en: "Share via other apps", ja: "他のアプリで共有", zh: "通过其他应用分享" },
  "invite.membersSection": { ko: "구성원", en: "Members", ja: "メンバー", zh: "成员" },
  "invite.pendingSection": { ko: "초대 대기 중", en: "Pending invites", ja: "招待中", zh: "待接受邀请" },
  "invite.pendingDesc": { ko: "코드 공유함 · 아직 참여 전", en: "Code shared · not joined yet", ja: "コード共有済み・未参加", zh: "已分享邀请码 · 尚未加入" },
  "invite.kakaoShareText": { ko: "[담아락] 우리집 그룹에 초대합니다.\n아래 링크를 누르면 바로 참여할 수 있어요!\n\n{{url}}", en: "[DamaRock] You're invited to join our family group.\nTap the link below to join right away!\n\n{{url}}", ja: "【DamaRock】家族グループへの招待です。\n下のリンクをタップするとすぐに参加できます！\n\n{{url}}", zh: "【DamaRock】邀请您加入我们的家庭群组。\n点击下方链接即可立即加入！\n\n{{url}}" },
  "invite.shareText": { ko: "담아락 \"{{family}}\"에 초대할게요! 아래 링크를 열면 바로 들어올 수 있어요.\n{{url}}", en: "You're invited to \"{{family}}\" on DamaRock! Open the link below to join.\n{{url}}", ja: "DamaRockの「{{family}}」にご招待します！下のリンクを開くとすぐに参加できます。\n{{url}}", zh: "邀请您加入 DamaRock 的「{{family}}」！点击下方链接即可加入。\n{{url}}" },

  // settings
  "settings.header": { ko: "설정", en: "Settings", ja: "設定", zh: "设置" },
  "settings.role": { ko: "가족 구성원", en: "Family member", ja: "家族メンバー", zh: "家庭成员" },
  "settings.loginMethod": { ko: "로그인 방식", en: "Sign-in method", ja: "ログイン方法", zh: "登录方式" },
  "settings.providerKakao": { ko: "카카오톡", en: "KakaoTalk", ja: "カカオトーク", zh: "KakaoTalk" },
  "settings.providerGoogle": { ko: "Google", en: "Google", ja: "Google", zh: "Google" },
  "settings.providerEmail": { ko: "이메일", en: "Email", ja: "メール", zh: "邮箱" },
  "settings.editNamePrompt": { ko: "새로운 표시 이름을 입력하세요", en: "Enter a new display name", ja: "新しい表示名を入力してください", zh: "请输入新的显示名称" },
  "settings.editFamilyNamePrompt": { ko: "새로운 가족 이름을 입력하세요", en: "Enter a new family name", ja: "新しい家族の名前を入力してください", zh: "请输入新的家庭名称" },
  "settings.installGroup": { ko: "앱 설치", en: "App install", ja: "アプリのインストール", zh: "安装应用" },
  "settings.installedLabel": { ko: "이미 설치되어 있어요", en: "Already installed", ja: "すでにインストール済みです", zh: "已安装" },
  "settings.installedDesc": { ko: "홈 화면 아이콘으로 담아락을 실행할 수 있어요", en: "Launch DamaRock from your home screen icon", ja: "ホーム画面のアイコンからDamaRockを起動できます", zh: "可通过主屏幕图标启动 DamaRock" },
  "settings.installLabel": { ko: "홈 화면에 앱 설치하기", en: "Install app to home screen", ja: "ホーム画面にアプリをインストール", zh: "将应用安装到主屏幕" },
  "settings.installInAppLabel": { ko: "카카오톡 등 인앱 브라우저에서는 설치할 수 없어요", en: "Can't install from an in-app browser (KakaoTalk, etc.)", ja: "カカオトークなどアプリ内ブラウザではインストールできません", zh: "无法在 KakaoTalk 等应用内浏览器中安装" },
  "settings.installInAppDesc": { ko: "오른쪽 위 메뉴에서 '다른 브라우저로 열기'를 선택한 뒤 설치해주세요", en: "Open the top-right menu and choose \"Open in browser\" first", ja: "右上のメニューから「他のブラウザで開く」を選んでからインストールしてください", zh: "请先在右上角菜单中选择「在浏览器中打开」" },
  "settings.installIOSLabel": { ko: "홈 화면에 추가하기", en: "Add to Home Screen", ja: "ホーム画面に追加", zh: "添加到主屏幕" },
  "settings.installIOSDesc": { ko: "하단 공유 버튼을 누른 뒤 '홈 화면에 추가'를 선택해주세요", en: "Tap the Share button, then choose \"Add to Home Screen\"", ja: "下部の共有ボタンを押して「ホーム画面に追加」を選んでください", zh: "点击底部分享按钮，然后选择「添加到主屏幕」" },
  "settings.installUnsupportedLabel": { ko: "이 브라우저는 자동 설치를 지원하지 않아요", en: "This browser doesn't support automatic install", ja: "このブラウザは自動インストールに対応していません", zh: "此浏览器不支持自动安装" },
  "settings.installUnsupportedDesc": { ko: "Chrome, Edge, 삼성 인터넷 등에서 다시 시도해주세요", en: "Please try again in Chrome, Edge, or Samsung Internet", ja: "Chrome、Edge、Samsung Internetなどでお試しください", zh: "请尝试使用 Chrome、Edge 或三星浏览器" },
  "settings.groupManagement": { ko: "그룹 관리", en: "Group management", ja: "グループ管理", zh: "群组管理" },
  "settings.familyName": { ko: "가족 이름", en: "Family name", ja: "家族の名前", zh: "家庭名称" },
  "settings.timeTogether": { ko: "함께한 시간", en: "Time together", ja: "一緒に過ごした時間", zh: "共同记录的时间" },
  "settings.timeTogetherDesc": { ko: "우리가 함께 기록하기 시작한 날", en: "The day we started tracking together", ja: "一緒に記録を始めた日", zh: "我们开始一起记录的日子" },
  "settings.daysTogether": { ko: "{{n}}일째 함께 기록 중", en: "{{n}} days together", ja: "{{n}}日目、一緒に記録中", zh: "共同记录 {{n}} 天" },
  "settings.groupMembers": { ko: "그룹 멤버", en: "Group members", ja: "グループメンバー", zh: "群组成员" },
  "settings.memberCount": { ko: "총 {{n}}명", en: "{{n}} members", ja: "合計{{n}}人", zh: "共 {{n}} 人" },
  "settings.switchGroup": { ko: "다른 그룹 참여하기", en: "Join another group", ja: "他のグループに参加", zh: "加入其他群组" },
  "settings.switchGroupDesc": { ko: "여러 그룹을 오가며 사용할 수 있어요", en: "Switch between multiple groups anytime", ja: "複数のグループを行き来して使えます", zh: "可在多个群组之间切换使用" },
  "settings.themeGroup": { ko: "테마 및 화면", en: "Theme & display", ja: "テーマと画面", zh: "主题与显示" },
  "settings.designTheme": { ko: "디자인 테마", en: "Design theme", ja: "デザインテーマ", zh: "设计主题" },
  "settings.notificationGroup": { ko: "알림 설정", en: "Notifications", ja: "通知設定", zh: "通知设置" },
  "settings.notifyNewItem": { ko: "새 항목 및 일정 추가", en: "New items and schedule", ja: "新しい項目・予定の追加", zh: "新项目和日程添加" },
  "settings.notifyComments": { ko: "새 댓글 알림", en: "New comment alerts", ja: "新しいコメント通知", zh: "新评论提醒" },
  "settings.notifyBriefing": { ko: "모닝 브리핑", en: "Morning briefing", ja: "モーニングブリーフィング", zh: "晨间简报" },
  "settings.notifyBriefingDesc": { ko: "오늘의 일정과 장보기를 아침에 알려드려요", en: "Get today's schedule and groceries every morning", ja: "今日の予定と買い物を朝にお知らせします", zh: "每天早晨为您播报今日日程与购物清单" },
  "settings.notifySummary": { ko: "주간 요약", en: "Weekly summary", ja: "週間サマリー", zh: "每周摘要" },
  "settings.quietMode": { ko: "조용히 알림 (야간 모드)", en: "Quiet hours (night mode)", ja: "サイレント通知（夜間モード）", zh: "静音通知（夜间模式）" },
  "settings.quietModeDesc": { ko: "설정한 시간에는 푸시 알림이 울리지 않아요", en: "Push notifications stay silent during this time", ja: "設定した時間帯はプッシュ通知が鳴りません", zh: "在设定时间内推送通知将保持静音" },
  "settings.quietStart": { ko: "시작", en: "Start", ja: "開始", zh: "开始" },
  "settings.quietEnd": { ko: "종료", en: "End", ja: "終了", zh: "结束" },
  "settings.regionGroup": { ko: "언어 및 지역", en: "Language & region", ja: "言語と地域", zh: "语言与地区" },
  "settings.languageLabel": { ko: "언어 설정", en: "Language", ja: "言語設定", zh: "语言设置" },
  "settings.langAuto": { ko: "자동 (시스템)", en: "Auto (system)", ja: "自動（システム）", zh: "自动（系统）" },
  "settings.holidayLabel": { ko: "달력 공휴일 기준", en: "Calendar holidays", ja: "カレンダーの祝日基準", zh: "日历假期基准" },
  "settings.holidayAuto": { ko: "자동 (시스템)", en: "Auto (system)", ja: "自動（システム）", zh: "自动（系统）" },
  "settings.additionalGroup": { ko: "추가 설정", en: "More settings", ja: "その他の設定", zh: "更多设置" },
  "settings.swipeAction": { ko: "스와이프로 삭제/완료", en: "Swipe to delete/complete", ja: "スワイプで削除・完了", zh: "滑动删除/完成" },
  "settings.swipeActionDesc": { ko: "탭 이동 대신 항목을 밀어서 액션을 띄웁니다.", en: "Swipe an item instead of tapping to bring up actions.", ja: "タップの代わりに項目をスワイプしてアクションを表示します。", zh: "滑动项目而非点击以显示操作。" },
  "settings.accountGroup": { ko: "계정 관리", en: "Account", ja: "アカウント管理", zh: "账户管理" },
  "settings.signOut": { ko: "로그아웃", en: "Sign out", ja: "ログアウト", zh: "退出登录" },
  "settings.deleteAccount": { ko: "계정 삭제", en: "Delete account", ja: "アカウント削除", zh: "删除账户" },
  "settings.confirmDeleteAccount": { ko: "정말 계정을 삭제하시겠습니까? 되돌릴 수 없습니다.", en: "Are you sure you want to delete your account? This can't be undone.", ja: "本当にアカウントを削除しますか？元に戻せません。", zh: "确定要删除账户吗？此操作无法撤销。" },
  "settings.deleteAccountUnavailable": { ko: "계정 삭제 처리는 서버 연동 후 지원됩니다.", en: "Account deletion will be supported once server support is added.", ja: "アカウント削除はサーバー対応後にサポートされます。", zh: "账户删除功能将在服务器支持后提供。" },

  // theme names
  "theme.clean-blue": { ko: "오션 블루", en: "Ocean Blue", ja: "オーシャンブルー", zh: "海洋蓝" },
  "theme.bonfire": { ko: "선셋 오렌지", en: "Sunset Orange", ja: "サンセットオレンジ", zh: "日落橙" },
  "theme.ink": { ko: "미드나잇 잉크", en: "Midnight Ink", ja: "ミッドナイトインク", zh: "午夜墨" },
  "theme.dark": { ko: "다크 모드", en: "Dark Mode", ja: "ダークモード", zh: "深色模式" },
  "theme.postit": { ko: "레몬 옐로우", en: "Lemon Yellow", ja: "レモンイエロー", zh: "柠檬黄" },
  "theme.beige-navy": { ko: "네이비 베이지", en: "Navy Beige", ja: "ネイビーベージュ", zh: "藏青米色" },
  "theme.lavender": { ko: "라벤더 퍼플", en: "Lavender Purple", ja: "ラベンダーパープル", zh: "薰衣草紫" },
  "theme.forest": { ko: "포레스트 그린", en: "Forest Green", ja: "フォレストグリーン", zh: "森林绿" },
  "theme.cherry": { ko: "체리 핑크", en: "Cherry Pink", ja: "チェリーピンク", zh: "樱桃粉" },
  "theme.mint": { ko: "민트 스카이", en: "Mint Sky", ja: "ミントスカイ", zh: "薄荷天蓝" },
  "theme.grape-dark": { ko: "그레이프 다크", en: "Grape Dark", ja: "グレープダーク", zh: "葡萄暗紫" },

  // roles & regions
  "role.leader": { ko: "관리자", en: "Admin", ja: "管理者", zh: "管理员" },
  "role.member": { ko: "구성원", en: "Member", ja: "メンバー", zh: "成员" },
  "holiday.kr": { ko: "한국 🇰🇷", en: "Korea 🇰🇷", ja: "韓国 🇰🇷", zh: "韩国 🇰🇷" },
  "holiday.us": { ko: "미국 🇺🇸", en: "USA 🇺🇸", ja: "アメリカ 🇺🇸", zh: "美国 🇺🇸" },
  "holiday.jp": { ko: "일본 🇯🇵", en: "Japan 🇯🇵", ja: "日本 🇯🇵", zh: "日本 🇯🇵" },
  "holiday.cn": { ko: "중국 🇨🇳", en: "China 🇨🇳", ja: "中国 🇨🇳", zh: "中国 🇨🇳" },

  // notifications & background errors
  "errors.familyNotFound": { ko: "가족 정보를 찾을 수 없어요", en: "Couldn't find that family", ja: "家族情報が見つかりません", zh: "找不到家庭信息" },
  "errors.networkError": { ko: "인터넷 연결을 확인해주세요", en: "Please check your internet connection", ja: "インターネット接続を確認してください", zh: "请检查网络连接" },
  "errors.offlineActionBlocked": { ko: "오프라인 상태예요. 인터넷에 연결되면 다시 시도해주세요.", en: "You're offline. Please try again once you're back online.", ja: "オフラインです。オンラインに戻ってから再度お試しください。", zh: "您已离线，请联网后重试。" },
  "app.offlineBanner": { ko: "오프라인 상태예요 · 최신 정보가 아닐 수 있어요", en: "You're offline · this may not be up to date", ja: "オフラインです・最新の情報でない場合があります", zh: "您已离线 · 内容可能不是最新的" },
  "errors.addItemFailedTitle": { ko: "아이템 추가 실패", en: "Failed to add item", ja: "アイテムの追加に失敗しました", zh: "添加项目失败" },
  "errors.detail": { ko: "상세", en: "Detail", ja: "詳細", zh: "详情" },
  "errors.hint": { ko: "힌트", en: "Hint", ja: "ヒント", zh: "提示" },
  "notif.activityTitle": { ko: "담아락 가족 활동", en: "DamaRock family activity", ja: "DamaRock 家族アクティビティ", zh: "DamaRock 家庭动态" },
  "notif.newsTitle": { ko: "담아락 소식", en: "DamaRock news", ja: "DamaRock からのお知らせ", zh: "DamaRock 消息" },
  "notif.memberJoined": { ko: "새로운 가족 구성원이 참여했습니다!", en: "A new family member has joined!", ja: "新しい家族メンバーが参加しました！", zh: "新的家庭成员已加入！" },
  "notif.newComment": { ko: "새로운 댓글이 달렸어요.", en: "Someone left a new comment.", ja: "新しいコメントが届きました。", zh: "有新的评论。" },
  "notif.itemInserted": { ko: "새로운 {{category}} '{{title}}'(이)가 등록되었습니다.", en: "New {{category}} '{{title}}' was added.", ja: "新しい{{category}}「{{title}}」が登録されました。", zh: "已添加新的{{category}}「{{title}}」。" },
  "notif.itemUpdated": { ko: "{{category}} '{{title}}'(이)가 수정/완료되었습니다.", en: "{{category}} '{{title}}' was updated/completed.", ja: "{{category}}「{{title}}」が修正・完了されました。", zh: "{{category}}「{{title}}」已更新/完成。" },
  "notif.itemDeleted": { ko: "{{category}} '{{title}}'(이)가 삭제되었습니다.", en: "{{category}} '{{title}}' was deleted.", ja: "{{category}}「{{title}}」が削除されました。", zh: "{{category}}「{{title}}」已删除。" },
  "notif.categoryGroceryItem": { ko: "장보기 항목", en: "grocery item", ja: "買い物項目", zh: "购物项目" },
  "notif.categoryItem": { ko: "항목", en: "item", ja: "項目", zh: "项目" },

  // multi-group switcher
  "groups.title": { ko: "그룹 전환", en: "Switch group", ja: "グループ切り替え", zh: "切换群组" },
  "groups.current": { ko: "사용 중", en: "Active", ja: "使用中", zh: "使用中" },
  "groups.createNew": { ko: "새 그룹 만들기", en: "Create a new group", ja: "新しいグループを作る", zh: "创建新群组" },
  "groups.joinExisting": { ko: "코드로 참여하기", en: "Join with a code", ja: "コードで参加する", zh: "使用邀请码加入" },
  "groups.switched": { ko: "'{{name}}' 그룹으로 전환했습니다.", en: "Switched to '{{name}}'.", ja: "「{{name}}」グループに切り替えました。", zh: "已切换到「{{name}}」群组。" },
};

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ""));
}

type I18nContextValue = {
  setting: LangSetting;
  lang: Lang;
  setLanguage: (setting: LangSetting) => void;
  t: (key: keyof typeof dict | string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [setting, setSetting] = useState<LangSetting>(() => {
    if (typeof window === "undefined") return "auto";
    return (localStorage.getItem(STORAGE_KEY) as LangSetting | null) || "auto";
  });

  const lang = useMemo(() => resolveLang(setting), [setting]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, setting);
    document.documentElement.lang = lang;
  }, [setting, lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      setting,
      lang,
      setLanguage: setSetting,
      t: (key, vars) => interpolate(dict[key]?.[lang] ?? dict[key]?.ko ?? String(key), vars),
    }),
    [setting, lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within a LanguageProvider");
  return ctx;
}

const WEEKDAYS: Record<Lang, string[]> = {
  ko: ["일", "월", "화", "수", "목", "금", "토"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ja: ["日", "月", "火", "水", "木", "金", "土"],
  zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
};

export function getWeekdayLabels(lang: Lang): string[] {
  return WEEKDAYS[lang];
}

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** month is 0-indexed (Date#getMonth()) */
export function formatMonthYear(lang: Lang, year: number, month: number): string {
  switch (lang) {
    case "en":
      return `${MONTHS_EN[month]} ${year}`;
    case "ja":
    case "zh":
      return `${year}年${month + 1}月`;
    default:
      return `${year}년 ${month + 1}월`;
  }
}
