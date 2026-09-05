// Cloudflare Workers のプロキシURL（ニコニコの各APIをCORS制限なしで呼ぶための中継先）
const PROXY_BASE_URL = "https://old-cell-59f7nico-proxy.hitoiki4105.workers.dev/";

// キーワード提案ボタンで使う候補ワード（私が手打ちで用意した固定リストです。外部辞書やAPIは使っていません。自由に増減してOK）
const KEYWORD_SUGGESTIONS = [
  // ムード・感情
  "切ない", "エモい", "疾走感", "癒し", "失恋", "ノスタルジー", "ダーク",
  "浮遊感", "ミステリアス", "ハッピー", "儚い", "情熱", "幻想的", "孤独",
  "希望", "切実", "狂気", "多幸感", "郷愁", "焦燥感",
  // ジャンル・スタイル
  "ロック", "ポップ", "ジャズ", "クラシック", "エレクトロニカ", "ローファイ",
  "シティポップ", "パンク", "フォーク", "レゲエ", "ヒップホップ", "オーケストラ",
  "アンビエント", "フューチャーベース", "ドラムンベース", "民族音楽", "チップチューン",
  "ブレイクコア", "ハードコア", "アカペラ",
  // 季節・時間・情景
  "夏", "冬", "春", "秋", "深夜", "朝", "夕暮れ", "雨の日", "花火", "桜",
  "満月", "星空", "台風", "梅雨",
  // テーマ・物語
  "青春", "恋愛", "冒険", "旅", "都会", "田舎", "宇宙", "海", "学校",
  "別れ", "再会", "戦い", "日常", "非日常", "SF", "ファンタジー",
  // 制作技法
  "リミックス", "カバー", "セルフカバー", "メドレー", "アレンジ", "弾いてみた",
  "歌ってみた", "踊ってみた", "耐久", "作業用",
];

// 投稿時ジャンル一覧（「音楽・サウンド」以外を列挙する用）
const ALL_GENRES = [
  "アニメ", "ゲーム", "エンタメ", "ラジオ", "歌ってみた", "演奏してみた", "踊ってみた",
  "VOCALOID", "ニコニコインディーズ", "動物", "自然", "料理", "旅行・アウトドア",
  "乗り物", "スポーツ", "社会・政治・時事", "技術・工作", "解説・講座", "その他",
];

// 「ボイロ系」「ボカロ系」ボタンで内部的に付与されるジャンル条件
// vocaloid: 投稿時ジャンルが「音楽・サウンド」のもの
// voiroid : 投稿時ジャンルが「音楽・サウンド」以外のもの
const CATEGORY_GENRES = {
  vocaloid: ["音楽・サウンド"],
  voiroid: ALL_GENRES.filter((g) => g !== "音楽・サウンド"),
};

const translations = {
  ja: {
    pageTitle: "妖精さんプレイヤー",
    heading: "妖精さんプレイヤー",
    subtitle: "ニコニコ動画ランダム再生ツール（非公式）",
    lead: "条件を指定して、ニコニコに投稿された動画とランダムで出会えます",
    leadSub: "タグ検索とキーワード検索、どちらか一方だけでも使えるよ。",
    tagMapPrefix: "あ、",
    tagMapSuffix: "ってツール、知ってる？",
    languageLabel: "言語",
    voiceCategoryLabel: "Q4：ジャンル、指定する？（オプション）",
    voiroidLabel: "ボイロ・解説・劇場系",
    vocaloidLabel: "ボカロ・音楽系",
    voiceCategoryNoteToggle: "説明をきく",
    voiceCategoryNote:
      "投稿時のジャンルで動画を探す場所を選びます。\n・ボカロ・音楽系：「音楽・サウンド」\n・ボイロ・解説・劇場系：「音楽・サウンド」以外",
    includeTagsLabel: "Q1：気になるタグは何？",
    includeTagsNoteToggle: "説明をきく",
    fineTuneToggle: "細かく絞り込みたい？",
    includeTagsNote:
      "・半角、全角スペースを加えて複数入力した場合、すべて含む（AND）結果がでるよ。\n・ニコニコ動画でのタグ検索結果とヒット件数が違うことがあるよ。原因は不明だよ。",
    includeTagsPlaceholder: "例: 初音ミク オリジナル曲",
    keywordLabel: "Q3：キーワードでもいいよ？",
    keywordNote: "キーワード検索は動画のタイトル・動画詳細欄を参照するよ。",
    keywordPlayToggle: "キーワードであそんじゃう？",
    keywordPlaceholder: "例: リミックス",
    keywordSuggestNote: "Wikipediaの記事タイトルをランダムで取得できるよ。",
    keywordSuggestButton: "キーワードを提案してもらう",
    keywordExpandTitle: "キーワードを広げる？",
    keywordExpandNote: "入力中の単語から、類義語・関連語をWikipediaで探して「いずれか含む（OR）」に広げられるよ。",
    keywordExpandButton: "キーワードを広げる",
    disclaimerPrefix: "問い合わせなどはこちらから",
    filterToggleLabel: "フィルター設定（投稿日など）",
    viewsRangeLabel: "Q2：森の奥まで行ってみる？",
    viewsBoxNote: "森の奥にはたくさんの動画があるよ。",
    minViewsLabel: "再生数（下限）",
    maxViewsLabel: "再生数（上限）",
    viewsPlaceholder: "指定なし",
    dateRangeLabel: "Q5：投稿日を指定する？（オプション）",
    dateModeRange: "期間で指定",
    dateModeSingle: "特定の1日を指定",
    yearFromLabel: "投稿年（から）",
    yearToLabel: "投稿年（まで）",
    yearPlaceholder: "指定なし",
    specificDateLabel: "投稿日",
    matchModeLabel: "含めるタグの条件",
    matchModeAnd: "すべて含む（AND）",
    matchModeOr: "いずれか含む（OR）",
    excludeTagsLabel: "除外するタグ（半角、全角スペースで複数入力可）",
    excludeTagsPlaceholder: "例: R-18",
    searchButton: "妖精さんと探しに行こう！",
    statusNeedTag: "含めるタグかキーワードのどっちかは教えて、ね？",
    statusSearching: "検索中...",
    statusSuggesting: "単語を探しています...",
    statusExpanding: "類義語・関連語を探しています...",
    statusExpandFailed: "うまく広げられませんでした。別の単語で試してみてください。",
    statusFailed: "検索に失敗しました。しばらくしてからもう一度お試しください。",
    statusNoResults: "条件に一致する動画が見つかりませんでした。タグや条件を変えてお試しください。",
    statusNetworkError: "通信エラーが発生しました。時間をおいて再度お試しください。",
    statusLoopedRound: "すべて再生したので、最初からもう一周します。",
    resultCountLabel: "【{label}】で検索して、{count}の動画が見つかったよ",
    searchLabelTag: "タグ：",
    searchLabelKeyword: "キーワード：",
    searchLabelJoiner: "、",
    scrollToQ1Button: "🏷️ Q1へ",
    uploaderLoading: "投稿者を取得中...",
    uploaderPrefix: "投稿者: ",
    uploaderUnknown: "投稿者: 取得できませんでした",
    nextButton: "次の動画と出会う",
    watchOnNicoButton: "ニコニコで見る",
    historyTitle: "出会った動画の記録",
    historyNote: "・クリックすると、ニコニコ動画に飛びます。",
    historyVisibleNote: "・最新の５件を表示しています",
    historyMoreButton: "記録をもっとみる",
    historyMoreNote: "・新しいウィンドウが開きます",
    historyGroupToggle: "検索語【{label}】で出会った動画",
    historyWindowClosedNote: "元のページが閉じられたか、リンクが切れています。元のページからもう一度「記録をもっとみる」を開いてください。",
    historyWindowReloadNote: "・このウィンドウは更新すると真っ白になります。",
  },
  zh: {
    pageTitle: "视频森林，妖精播放器",
    heading: "视频森林，妖精播放器",
    subtitle: "niconico随机播放工具（非官方）",
    lead: "设定条件后，随机与投稿到niconico的视频相遇",
    leadSub: "标签搜索和关键词搜索，只使用其中一种也可以。",
    tagMapPrefix: "对了，你知道",
    tagMapSuffix: "这个工具吗？",
    languageLabel: "语言",
    voiceCategoryLabel: "Q4：想找什么样的视频？（可选）",
    voiroidLabel: "VOICEROID・解说・剧场系",
    vocaloidLabel: "VOCALOID・音乐系",
    voiceCategoryNoteToggle: "查看说明",
    voiceCategoryNote:
      "根据投稿时的分类来选择搜索视频的范围。\n・VOCALOID・音乐系：「音乐・音效」\n・VOICEROID・解说・剧场系：「音乐・音效」以外",
    includeTagsLabel: "Q1：在意的标签是什么？",
    includeTagsNoteToggle: "查看说明",
    fineTuneToggle: "想要更精细地筛选？",
    includeTagsNote:
      "・用半角或全角空格输入多个标签时，会显示全部包含（AND）的结果。\n有时候和niconico动画站内标签搜索的结果数量会不同，原因不明。",
    includeTagsPlaceholder: "例：初音未来 原创曲",
    keywordLabel: "Q3：也可以用关键词吗？",
    keywordPlayToggle: "要不要玩玩关键词？",
    keywordNote: "关键词搜索会参照标题和视频简介栏。",
    keywordPlaceholder: "例：混音",
    keywordSuggestNote: "可以随机获取一个Wikipedia的文章标题",
    keywordSuggestButton: "让妖精推荐关键词",
    keywordExpandTitle: "扩展关键词？",
    keywordExpandNote: "根据输入的词语，从Wikipedia查找同义词・相关词，以「包含任意一个（OR）」的方式扩展",
    keywordExpandButton: "扩展关键词",
    disclaimerPrefix: "这是非官方工具。如需联系，请通过",
    filterToggleLabel: "筛选设置（投稿日期等）",
    viewsRangeLabel: "Q2：要不要深入森林深处看看？",
    viewsBoxNote: "森林深处，还有很多视频等着你。",
    minViewsLabel: "播放数（下限）",
    maxViewsLabel: "播放数（上限）",
    viewsPlaceholder: "不限",
    dateRangeLabel: "Q5：要指定投稿日期吗？（可选）",
    dateModeRange: "按区间指定",
    dateModeSingle: "指定某一天",
    yearFromLabel: "投稿年份（从）",
    yearToLabel: "投稿年份（到）",
    yearPlaceholder: "不限",
    specificDateLabel: "投稿日期",
    matchModeLabel: "标签匹配条件",
    matchModeAnd: "全部包含（AND）",
    matchModeOr: "包含任意一个（OR）",
    excludeTagsLabel: "排除的标签（可用半角或全角空格分隔多个）",
    excludeTagsPlaceholder: "例：R-18",
    searchButton: "和妖精一起去找找看！",
    statusNeedTag: "请输入标签或关键词中的至少一项。",
    statusSearching: "正在搜索...",
    statusSuggesting: "正在查找单词...",
    statusExpanding: "正在查找同义词・相关词...",
    statusExpandFailed: "未能成功扩展，请换个词试试。",
    statusFailed: "搜索失败，请稍后再试。",
    statusNoResults: "没有找到符合条件的视频，请更改标签或筛选条件后重试。",
    statusNetworkError: "发生通信错误，请稍后重试。",
    statusLoopedRound: "已经全部播放过了，将重新从头开始循环。",
    resultCountLabel: "以【{label}】搜索，找到{count}个结果",
    searchLabelTag: "标签：",
    searchLabelKeyword: "关键词：",
    searchLabelJoiner: "、",
    scrollToQ1Button: "🏷️ 前往Q1",
    uploaderLoading: "正在获取投稿者...",
    uploaderPrefix: "投稿者：",
    uploaderUnknown: "投稿者：获取失败",
    nextButton: "邂逅下一个视频",
    watchOnNicoButton: "在niconico观看",
    historyTitle: "相遇过的视频记录",
    historyNote: "・点击即可跳转到niconico动画。",
    historyVisibleNote: "・显示最新的5条记录",
    historyMoreButton: "追寻足迹",
    historyMoreNote: "・会打开新窗口",
    historyGroupToggle: "以搜索词【{label}】相遇的视频",
    historyWindowClosedNote: "原页面已关闭或连接已断开，请从原页面重新打开「追寻足迹」。",
    historyWindowReloadNote: "・此窗口刷新后会变成空白页面。",
  },
  ko: {
    pageTitle: "영상의 숲, 요정 플레이어",
    heading: "영상의 숲, 요정 플레이어",
    subtitle: "니코니코 동영상 랜덤 재생 도구（비공식）",
    lead: "조건을 지정하면 니코니코에 올라온 동영상과 무작위로 만날 수 있어요",
    leadSub: "태그 검색과 키워드 검색, 둘 중 하나만 사용해도 됩니다.",
    tagMapPrefix: "아, ",
    tagMapSuffix: "이라는 도구 알아?",
    languageLabel: "언어",
    voiceCategoryLabel: "Q4：어떤 영상을 찾고 있어?（선택）",
    voiroidLabel: "보이로이드・해설・극장 계열",
    vocaloidLabel: "보카로이드・음악 계열",
    voiceCategoryNoteToggle: "설명 보기",
    voiceCategoryNote:
      "게시 당시의 장르로 영상을 찾을 범위를 선택합니다.\n・보카로이드・음악 계열：「음악・사운드」\n・보이로이드・해설・극장 계열：「음악・사운드」 이외",
    includeTagsLabel: "Q1：궁금한 태그가 있나요?",
    includeTagsNoteToggle: "설명 보기",
    fineTuneToggle: "세밀하게 좁혀볼까?",
    includeTagsNote:
      "・반각・전각 공백으로 여러 개 입력하면 모두 포함（AND）된 결과가 나옵니다.\n니코니코 동영상 사이트 자체의 태그 검색 결과와 검색 건수가 다를 수 있습니다. 원인은 알 수 없습니다.",
    includeTagsPlaceholder: "예: 하츠네 미쿠 오리지널곡",
    keywordLabel: "Q3：키워드도 괜찮아?",
    keywordNote: "키워드 검색은 제목・동영상 설명란을 참조합니다.",
    keywordPlayToggle: "키워드로 놀아볼까?",
    keywordPlaceholder: "예: 리믹스",
    keywordSuggestNote: "Wikipedia 문서 제목을 무작위로 가져올 수 있습니다",
    keywordSuggestButton: "키워드 제안받기",
    keywordExpandTitle: "키워드를 넓혀볼까?",
    keywordExpandNote: "입력한 단어를 바탕으로 Wikipedia에서 유의어・관련어를 찾아 「하나라도 포함(OR)」으로 넓힙니다",
    keywordExpandButton: "키워드 넓히기",
    disclaimerPrefix: "비공식 도구입니다. 문의는 이쪽으로",
    filterToggleLabel: "필터 설정（게시일 등）",
    viewsRangeLabel: "Q2：숲 깊은 곳까지 가볼까?",
    viewsBoxNote: "숲 깊은 곳에는 아직 많은 영상이 있어.",
    minViewsLabel: "조회수（하한）",
    maxViewsLabel: "조회수（상한）",
    viewsPlaceholder: "지정 안 함",
    dateRangeLabel: "Q5：게시일을 지정할까?（선택）",
    dateModeRange: "기간으로 지정",
    dateModeSingle: "특정 하루 지정",
    yearFromLabel: "게시 연도（부터）",
    yearToLabel: "게시 연도（까지）",
    yearPlaceholder: "지정 안 함",
    specificDateLabel: "게시일",
    matchModeLabel: "포함 태그 조건",
    matchModeAnd: "모두 포함（AND）",
    matchModeOr: "하나라도 포함（OR）",
    excludeTagsLabel: "제외할 태그（반각・전각 공백으로 여러 개 입력 가능）",
    excludeTagsPlaceholder: "예: R-18",
    searchButton: "요정과 함께 찾으러 가요!",
    statusNeedTag: "포함할 태그나 키워드 중 하나는 입력해 주세요.",
    statusSearching: "검색 중...",
    statusSuggesting: "단어를 찾는 중...",
    statusExpanding: "유의어・관련어를 찾는 중...",
    statusExpandFailed: "잘 넓히지 못했습니다. 다른 단어로 시도해 주세요.",
    statusFailed: "검색에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    statusNoResults: "조건에 맞는 동영상을 찾지 못했습니다. 태그나 조건을 변경해 보세요.",
    statusNetworkError: "통신 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    statusLoopedRound: "모두 재생했으므로 처음부터 다시 순환합니다.",
    resultCountLabel: "【{label}】(으)로 검색해서 {count}개의 동영상을 찾았어",
    searchLabelTag: "태그：",
    searchLabelKeyword: "키워드：",
    searchLabelJoiner: "、",
    scrollToQ1Button: "🏷️ Q1로",
    uploaderLoading: "업로더 정보를 가져오는 중...",
    uploaderPrefix: "업로더: ",
    uploaderUnknown: "업로더: 가져오지 못했습니다",
    nextButton: "다음 동영상과 만나기",
    watchOnNicoButton: "니코니코에서 보기",
    historyTitle: "만난 동영상 기록",
    historyNote: "・클릭하면 니코니코 동영상으로 이동합니다.",
    historyVisibleNote: "・최신 5건을 표시하고 있습니다",
    historyMoreButton: "기록 더 보기",
    historyMoreNote: "・새 창이 열립니다",
    historyGroupToggle: "검색어【{label}】(으)로 만난 동영상",
    historyWindowClosedNote: "원본 페이지가 닫혔거나 연결이 끊어졌습니다. 원본 페이지에서 다시 「기록 더 보기」를 열어 주세요.",
    historyWindowReloadNote: "・이 창은 새로고침하면 빈 화면이 됩니다.",
  },
  en: {
    pageTitle: "Forest of Videos, Fairy Player",
    heading: "Forest of Videos, Fairy Player",
    subtitle: "An unofficial random-play tool for Niconico videos",
    lead: "Set your conditions and randomly meet videos posted on Niconico",
    leadSub: "You can use tag search and keyword search independently, or just one of them.",
    tagMapPrefix: "Oh, do you know about ",
    tagMapSuffix: ", a tool for exploring tags?",
    languageLabel: "Language",
    voiceCategoryLabel: "Q4: What kind of video are you looking for? (Optional)",
    voiroidLabel: "VOICEROID / Narration / Theater",
    vocaloidLabel: "VOCALOID / Music",
    voiceCategoryNoteToggle: "Hear the explanation",
    voiceCategoryNote:
      "Choose which range of videos to search based on their genre at the time of posting.\n\u2022 VOCALOID / Music: \"Music & Sound\"\n\u2022 VOICEROID / Narration / Theater: anything other than \"Music & Sound\"",
    includeTagsLabel: "Q1: What tags interest you?",
    includeTagsNoteToggle: "Hear the explanation",
    fineTuneToggle: "Fine-tune your search?",
    includeTagsNote:
      "\u2022 Entering multiple tags separated by spaces returns videos matching all of them (AND).\nThe hit count may differ from Niconico's own tag search. The reason is unknown.",
    includeTagsPlaceholder: "e.g. Hatsune Miku original song",
    keywordLabel: "Q3: A keyword works too?",
    keywordNote: "Keyword search looks at the title and video description.",
    keywordPlayToggle: "Want to play with keywords?",
    keywordPlaceholder: "e.g. remix",
    keywordSuggestNote: "You can fetch a random Wikipedia article title",
    keywordSuggestButton: "Suggest a keyword",
    keywordExpandTitle: "Expand the keyword?",
    keywordExpandNote: "Looks up synonyms and related words on Wikipedia for your keyword and adds them with an OR condition",
    keywordExpandButton: "Expand keyword",
    disclaimerPrefix: "This is an unofficial tool. For inquiries, contact",
    filterToggleLabel: "Filter settings (upload date, etc.)",
    viewsRangeLabel: "Q2: Want to go deeper into the forest?",
    viewsBoxNote: "There are still plenty of videos deep in the forest.",
    minViewsLabel: "Min. views",
    maxViewsLabel: "Max. views",
    viewsPlaceholder: "No limit",
    dateRangeLabel: "Q5: Specify an upload date? (Optional)",
    dateModeRange: "Specify a range",
    dateModeSingle: "Specify a single day",
    yearFromLabel: "From year",
    yearToLabel: "To year",
    yearPlaceholder: "No limit",
    specificDateLabel: "Upload date",
    matchModeLabel: "Tag match condition",
    matchModeAnd: "Match all (AND)",
    matchModeOr: "Match any (OR)",
    excludeTagsLabel: "Tags to exclude (separate with spaces)",
    excludeTagsPlaceholder: "e.g. R-18",
    searchButton: "Let's go searching with the fairy!",
    statusNeedTag: "Please enter at least a tag or a keyword.",
    statusSearching: "Searching...",
    statusSuggesting: "Looking for a word...",
    statusExpanding: "Looking up synonyms and related words...",
    statusExpandFailed: "Couldn't expand that word. Try a different one.",
    statusFailed: "Search failed. Please try again later.",
    statusNoResults: "No videos matched your conditions. Try different tags or filters.",
    statusNetworkError: "A network error occurred. Please try again later.",
    statusLoopedRound: "You've seen them all - starting over from the top.",
    resultCountLabel: "Searched for 【{label}】 - found {count} videos",
    searchLabelTag: "Tag: ",
    searchLabelKeyword: "Keyword: ",
    searchLabelJoiner: ", ",
    scrollToQ1Button: "🏷️ To Q1",
    uploaderLoading: "Loading uploader...",
    uploaderPrefix: "Uploader: ",
    uploaderUnknown: "Uploader: unavailable",
    nextButton: "Meet the next video",
    watchOnNicoButton: "Watch on Niconico",
    historyTitle: "Videos you've met",
    historyNote: "* Click a video to open it on Niconico.",
    historyVisibleNote: "* Showing the 5 most recent",
    historyMoreButton: "See more history",
    historyMoreNote: "* Opens a new window",
    historyGroupToggle: "Videos found with 【{label}】",
    historyWindowClosedNote: "The original page has been closed or the link is no longer active. Please open \"See more history\" again from the original page.",
    historyWindowReloadNote: "* This window will go blank if you reload it.",
  },
};

let currentLang = "ja";

const form = document.getElementById("search-form");
const includeTagsInput = document.getElementById("include-tags");
const excludeTagsInput = document.getElementById("exclude-tags");
const keywordInput = document.getElementById("keyword");
const keywordSuggestButton = document.getElementById("keyword-suggest-button");
const keywordExpandButton = document.getElementById("keyword-expand-button");
const minViewsInput = document.getElementById("min-views");
const maxViewsInput = document.getElementById("max-views");
const yearFromInput = document.getElementById("year-from");
const yearToInput = document.getElementById("year-to");
const specificDateInput = document.getElementById("specific-date");
const dateRangeBlock = document.getElementById("date-range-block");
const dateSingleBlock = document.getElementById("date-single-block");
const searchButton = document.getElementById("search-button");
const leadTextEl = document.getElementById("lead-text");
const section11InnerEl = document.getElementById("section-s11-inner");
const statusEl = document.getElementById("status");
const resultSection = document.getElementById("result");
const resultCountEl = document.getElementById("result-count");
const currentTitleEl = document.getElementById("current-title");
const currentUploaderEl = document.getElementById("current-uploader");
const playerEl = document.getElementById("player");
const playerEmbedEl = document.getElementById("player-embed");
const playerThumbEl = document.getElementById("player-thumb");
const playerFairyEl = document.getElementById("player-fairy");
const nextButton = document.getElementById("next-button");
const watchOnNicoLink = document.getElementById("watch-on-nico");
const resultActionsEl = document.getElementById("result-actions");
const languageSelect = document.getElementById("language-select");
const voiroidToggle = document.getElementById("voiroid-toggle");
const vocaloidToggle = document.getElementById("vocaloid-toggle");
const voiceCategoryNoteToggle = document.getElementById("voice-category-note-toggle");
const voiceCategoryNoteEl = document.getElementById("voice-category-note");
const includeTagsNoteToggle = document.getElementById("include-tags-note-toggle");
const fineTuneToggle = document.getElementById("fine-tune-toggle");
const fineTunePanel = document.getElementById("fine-tune-panel");
const includeTagsNoteEl = document.getElementById("include-tags-note");
const keywordPlayToggle = document.getElementById("keyword-play-toggle");
const keywordPlayEl = document.getElementById("keyword-play");
const historySection = document.getElementById("history");
const historyListEl = document.getElementById("history-list");
const historyMoreButton = document.getElementById("history-more-button");
const historyMoreNoteEl = document.getElementById("history-more-note");
const scrollToQ1Button = document.getElementById("scroll-to-q1-button");
const q1Section = document.getElementById("q1-section");

// 検索でヒットした動画一覧（ランダムに取得した最大100件）
let videoList = [];
// 「次の動画と出会う」で既に再生した動画のcontentId
let playedContentIds = new Set();
// 選択中の音声合成系統（voiroid / vocaloid のどちらか、両方、または空のSet）
let selectedVoiceCategories = new Set();
// 出会った動画の記録（新しいものが先頭）
let watchHistory = [];
// 直近に実行した検索の検索語（タグ・キーワード）。履歴の「検索語Xで出会った動画」表示に使う
let currentSearchLabel = "";
// 現在プレイヤーに表示している動画のサムネイルURL（次の動画へのフェード演出で使う）
let currentThumbnailUrl = "";
const HISTORY_VISIBLE_COUNT = 5;

// ==== 言語切り替え ====
function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.title = translations[lang].pageTitle;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (translations[lang][key] !== undefined) {
      el.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (translations[lang][key] !== undefined) {
      el.placeholder = translations[lang][key];
    }
  });

  fitSearchButtonToWidth();
  fitS11ToLeadWidth();
}

// タイトルは固定サイズ（style="font-size: 24px;"）で表示するため、
// 幅いっぱいに自動拡大する機能は無効化しています（以前は fitTitleToWidth() で自動調整していました）

// 検索ボタンの文字サイズを「文字列の幅がボタンの幅の80%になる」ように自動調整する。
// ただし現在のデフォルトサイズ（16px）を下回らないようにする（最小値）。
const SEARCH_BUTTON_MIN_FONT_SIZE = 20; // px（最小値）
const SEARCH_BUTTON_TARGET_RATIO = 0.8; // ボタン幅に対する文字列幅の目標比率

function fitSearchButtonToWidth() {
  const paddingLeft = parseFloat(getComputedStyle(searchButton).paddingLeft) || 0;
  const paddingRight = parseFloat(getComputedStyle(searchButton).paddingRight) || 0;
  const availableWidth = searchButton.clientWidth - paddingLeft - paddingRight;
  if (availableWidth <= 0) return;

  // 最小フォントサイズで実測した文字列幅を基準に、目標幅に届くフォントサイズを逆算する
  searchButton.style.fontSize = `${SEARCH_BUTTON_MIN_FONT_SIZE}px`;
  const measuredWidth = searchButton.scrollWidth - paddingLeft - paddingRight;
  if (measuredWidth <= 0) return;

  const targetWidth = availableWidth * SEARCH_BUTTON_TARGET_RATIO;
  const scaledSize = SEARCH_BUTTON_MIN_FONT_SIZE * (targetWidth / measuredWidth);
  const finalSize = Math.max(SEARCH_BUTTON_MIN_FONT_SIZE, scaledSize);

  searchButton.style.fontSize = `${finalSize}px`;
}

window.addEventListener("resize", fitSearchButtonToWidth);

// S11（あいさつ〜言語設定）の横幅を、サブタイトル（.lead）の実測幅に合わせる。
// これにより、左揃えのまま文字のまとまり全体がS11セルの中央に配置される。
// ブラウザ幅（PC表示）でのみ意味を持つため、S11がGridの1カラム分に収まっている場合はwidthを解除する。
function fitS11ToLeadWidth() {
  if (!leadTextEl || !section11InnerEl) return;
  section11InnerEl.style.width = "auto";
  const leadWidth = leadTextEl.scrollWidth;
  if (leadWidth > 0) {
    section11InnerEl.style.width = `${leadWidth}px`;
  }
}

window.addEventListener("resize", fitS11ToLeadWidth);

languageSelect.addEventListener("change", () => {
  applyLanguage(languageSelect.value);
});

applyLanguage("ja");

// ==== 説明文・補助機能の開閉トグル ====
voiceCategoryNoteToggle.addEventListener("click", () => {
  voiceCategoryNoteEl.hidden = !voiceCategoryNoteEl.hidden;
});

includeTagsNoteToggle.addEventListener("click", () => {
  includeTagsNoteEl.hidden = !includeTagsNoteEl.hidden;
});

fineTuneToggle.addEventListener("click", () => {
  fineTunePanel.hidden = !fineTunePanel.hidden;
});

keywordPlayToggle.addEventListener("click", () => {
  keywordPlayEl.hidden = !keywordPlayEl.hidden;
});

// ==== 画面右下の固定ボタン：Q1セクションへスクロール ====
scrollToQ1Button.addEventListener("click", () => {
  q1Section.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ==== キーワード提案ボタン（Wikipediaのランダム記事APIから取得。失敗時は手元のリストにフォールバック） ====
keywordSuggestButton.addEventListener("click", async () => {
  keywordSuggestButton.disabled = true;
  setStatus(translations[currentLang].statusSuggesting);

  try {
    const word = await fetchRandomWordFromWikipedia();
    keywordInput.value = word || pickFallbackSuggestion();
  } catch (error) {
    console.error(error);
    keywordInput.value = pickFallbackSuggestion();
  } finally {
    setStatus("");
    keywordSuggestButton.disabled = false;
  }
});

function pickFallbackSuggestion() {
  return KEYWORD_SUGGESTIONS[Math.floor(Math.random() * KEYWORD_SUGGESTIONS.length)];
}

// Wikipedia の「ランダム記事」APIから記事タイトルを1つ取得する
async function fetchRandomWordFromWikipedia() {
  const wikiLang = ["ja", "zh", "ko", "en"].includes(currentLang) ? currentLang : "ja";
  const apiBase = `https://${wikiLang}.wikipedia.org/w/api.php`;
  const url = `${apiBase}?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*`;

  const response = await fetch(url);
  const data = await response.json();
  const page = data.query && data.query.random && data.query.random[0];

  if (!page) return null;

  const title = page.title.replace(/[（(].*?[）)]/g, "").trim();
  // あまりに長いタイトルはキーワードとして扱いにくいので、その場合はフォールバックに任せる
  return title.length > 0 && title.length <= 15 ? title : null;
}

// ==== キーワードを広げるボタン（Wikipedia APIで類義語・関連語を取得） ====
keywordExpandButton.addEventListener("click", () => {
  expandKeyword();
});

async function expandKeyword() {
  const original = keywordInput.value.trim();
  if (!original) {
    setStatus(translations[currentLang].statusNeedTag);
    return;
  }

  keywordExpandButton.disabled = true;
  setStatus(translations[currentLang].statusExpanding);

  try {
    const relatedWords = await fetchRelatedWordsFromWikipedia(original);

    if (relatedWords.length === 0) {
      setStatus(translations[currentLang].statusExpandFailed);
      return;
    }

    const uniqueWords = [...new Set([original, ...relatedWords])];
    keywordInput.value = uniqueWords.join(" OR ");
    setStatus("");
  } catch (error) {
    console.error(error);
    setStatus(translations[currentLang].statusExpandFailed);
  } finally {
    keywordExpandButton.disabled = false;
  }
}

// Wikipedia の Action API（CORS対応のため origin=* を付与）を使って、
// 1. 入力語に近い記事タイトルを検索し、
// 2. その記事に近い記事（morelike検索）を取得して、類義語・関連語の候補とする
async function fetchRelatedWordsFromWikipedia(word) {
  const wikiLang = ["ja", "zh", "ko", "en"].includes(currentLang) ? currentLang : "ja";
  const apiBase = `https://${wikiLang}.wikipedia.org/w/api.php`;

  const searchUrl =
    `${apiBase}?action=query&list=search&srsearch=${encodeURIComponent(word)}` +
    `&srlimit=1&format=json&origin=*`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  const hit = searchData.query && searchData.query.search && searchData.query.search[0];
  if (!hit) return [];

  const relatedUrl =
    `${apiBase}?action=query&list=search&srsearch=${encodeURIComponent("morelike:" + hit.title)}` +
    `&srlimit=5&format=json&origin=*`;
  const relatedRes = await fetch(relatedUrl);
  const relatedData = await relatedRes.json();
  const results = (relatedData.query && relatedData.query.search) || [];

  return results
    .map((item) => item.title.replace(/[（(].*?[）)]/g, "").trim())
    .filter((title) => title.length > 0 && title.length <= 20)
    .slice(0, 5);
}

// ==== ボイロ系／ボカロ系トグル（それぞれ独立してON/OFFできる） ====
function toggleVoiceCategory(category) {
  if (selectedVoiceCategories.has(category)) {
    selectedVoiceCategories.delete(category);
  } else {
    selectedVoiceCategories.add(category);
  }
  voiroidToggle.classList.toggle("active", selectedVoiceCategories.has("voiroid"));
  vocaloidToggle.classList.toggle("active", selectedVoiceCategories.has("vocaloid"));
  voiroidToggle.setAttribute("aria-pressed", String(selectedVoiceCategories.has("voiroid")));
  vocaloidToggle.setAttribute("aria-pressed", String(selectedVoiceCategories.has("vocaloid")));
}

voiroidToggle.addEventListener("click", () => toggleVoiceCategory("voiroid"));
vocaloidToggle.addEventListener("click", () => toggleVoiceCategory("vocaloid"));

// ==== 投稿日の指定方法の切り替え ====
document.querySelectorAll('input[name="date-mode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const mode = form.querySelector('input[name="date-mode"]:checked').value;
    dateRangeBlock.hidden = mode !== "range";
    dateSingleBlock.hidden = mode !== "single";
  });
});

// ==== フォーム送信・次の動画ボタン ====
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runSearch();
});

nextButton.addEventListener("click", () => {
  playRandomVideo({ animate: true });
});

// 再生数（上限）が（下限）より小さくならないようにする
function enforceViewsOrder() {
  const min = Number(minViewsInput.value) || 0;
  if (minViewsInput.value !== "") {
    maxViewsInput.min = String(min);
    if (maxViewsInput.value !== "" && Number(maxViewsInput.value) < min) {
      maxViewsInput.value = min;
    }
  } else {
    maxViewsInput.min = "0";
  }
}
minViewsInput.addEventListener("input", enforceViewsOrder);
maxViewsInput.addEventListener("input", enforceViewsOrder);

// ==== 検索条件の組み立て ====

// 半角/全角スペース区切りの入力文字列を、タグの配列にする
function parseTags(rawText) {
  return rawText
    .trim()
    .split(/[\s\u3000]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

// "YYYY-MM-DD" の翌日の日付文字列を返す
function nextDateString(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + 1);
  const ny = date.getUTCFullYear();
  const nm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nd = String(date.getUTCDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

// 投稿日の条件（期間指定 or 特定の1日）から from/to のISO日時を作る
function buildDateRange() {
  const mode = form.querySelector('input[name="date-mode"]:checked').value;

  if (mode === "single") {
    if (!specificDateInput.value) return null;
    return {
      from: `${specificDateInput.value}T00:00:00+09:00`,
      to: `${nextDateString(specificDateInput.value)}T00:00:00+09:00`,
    };
  }

  const yearFrom = yearFromInput.value;
  const yearTo = yearToInput.value;
  if (!yearFrom && !yearTo) return null;

  return {
    from: yearFrom ? `${yearFrom}-01-01T00:00:00+09:00` : undefined,
    to: yearTo ? `${Number(yearTo) + 1}-01-01T00:00:00+09:00` : undefined,
  };
}

// タグ・再生数・投稿日の条件をまとめた jsonFilter オブジェクトを組み立てる
function buildJsonFilter({ includeTags, excludeTags, matchMode, minViews, maxViews, dateRange, voiceCategories }) {
  const filters = [];

  const tagEqualNodes = includeTags.map((tag) => ({
    type: "equal",
    field: "tagsExact",
    value: tag,
  }));
  if (tagEqualNodes.length === 1) {
    filters.push(tagEqualNodes[0]);
  } else if (tagEqualNodes.length > 1) {
    filters.push({
      type: matchMode === "OR" ? "or" : "and",
      filters: tagEqualNodes,
    });
  }

  // ボイロ系／ボカロ系トグルで選ばれた投稿時ジャンル（選ばれている系統すべてを、いずれか含む＝OR）
  if (voiceCategories && voiceCategories.size > 0) {
    const combinedGenres = [...voiceCategories].flatMap((category) => CATEGORY_GENRES[category] || []);
    if (combinedGenres.length > 0) {
      filters.push({
        type: "or",
        filters: [...new Set(combinedGenres)].map((genre) => ({
          type: "equal",
          field: "genre",
          value: genre,
        })),
      });
    }
  }

  for (const tag of excludeTags) {
    filters.push({
      type: "not",
      filter: { type: "equal", field: "tagsExact", value: tag },
    });
  }

  if (minViews || maxViews) {
    filters.push({
      type: "range",
      field: "viewCounter",
      from: minViews || undefined,
      to: maxViews || undefined,
      include_lower: true,
      include_upper: true,
    });
  }

  if (dateRange) {
    filters.push({
      type: "range",
      field: "startTime",
      from: dateRange.from,
      to: dateRange.to,
      include_lower: true,
      include_upper: false,
    });
  }

  if (filters.length === 0) return null;
  if (filters.length === 1) return filters[0];
  return { type: "and", filters };
}

// 検索条件（キーワード・タグ・フィルタ）をまとめたパラメータを組み立てる
// （_limit, _offset はリクエストの用途ごとに後から付け足す）
// タグ・キーワードの入力内容から「検索語X」の表示ラベルを組み立てる
// 例：「タグ：初音ミク、キーワード：リミックス」（片方だけならその項目のみ）
function buildSearchLabel(includeTags, keyword) {
  const t = translations[currentLang];
  const parts = [];
  if (includeTags.length > 0) {
    parts.push(`${t.searchLabelTag}${includeTags.join(" ")}`);
  }
  if (keyword) {
    parts.push(`${t.searchLabelKeyword}${keyword}`);
  }
  return parts.join(t.searchLabelJoiner);
}

function buildBaseParams() {
  const includeTags = parseTags(includeTagsInput.value);
  const excludeTags = parseTags(excludeTagsInput.value);
  const matchMode = form.querySelector('input[name="match-mode"]:checked').value;
  const minViews = minViewsInput.value;
  const maxViews = maxViewsInput.value;
  const keyword = keywordInput.value.trim();
  const dateRange = buildDateRange();

  // タグ・キーワードのどちらも空なら検索できない
  if (includeTags.length === 0 && !keyword) {
    return null;
  }

  const params = new URLSearchParams({
    q: keyword,
    _sort: "-viewCounter",
    _context: "nico-tag-player",
    fields: "contentId,title,viewCounter,thumbnailUrl",
  });

  if (keyword) {
    params.set("targets", "title,description");
  }

  const jsonFilter = buildJsonFilter({
    includeTags,
    excludeTags,
    matchMode,
    minViews,
    maxViews,
    dateRange,
    voiceCategories: selectedVoiceCategories,
  });

  if (jsonFilter) {
    params.set("jsonFilter", JSON.stringify(jsonFilter));
  }

  return params;
}

async function fetchSearch(params) {
  const response = await fetch(`${PROXY_BASE_URL}?${params.toString()}`);
  return response.json();
}

async function runSearch() {
  const baseParams = buildBaseParams();

  if (!baseParams) {
    setStatus(translations[currentLang].statusNeedTag);
    return;
  }

  currentSearchLabel = buildSearchLabel(parseTags(includeTagsInput.value), keywordInput.value.trim());

  setStatus(translations[currentLang].statusSearching);
  searchButton.disabled = true;
  resultSection.hidden = true;

  try {
    // 1回目：ヒット件数だけを把握するための軽いリクエスト
    const countParams = new URLSearchParams(baseParams);
    countParams.set("_limit", "1");
    countParams.set("_offset", "0");
    const countData = await fetchSearch(countParams);

    if (countData.meta.status !== 200) {
      setStatus(translations[currentLang].statusFailed);
      return;
    }

    const totalHitCount = countData.meta.totalCount;

    if (totalHitCount === 0) {
      videoList = [];
      setStatus(translations[currentLang].statusNoResults);
      return;
    }

    // 2回目：ランダムな開始位置から最大100件を取得する
    const limit = 100;
    const maxOffset = Math.max(0, Math.min(totalHitCount - limit, 100000 - limit));
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

    const listParams = new URLSearchParams(baseParams);
    listParams.set("_limit", String(limit));
    listParams.set("_offset", String(randomOffset));
    const listData = await fetchSearch(listParams);

    if (listData.meta.status !== 200) {
      setStatus(translations[currentLang].statusFailed);
      return;
    }

    videoList = listData.data || [];

    if (videoList.length === 0) {
      setStatus(translations[currentLang].statusNoResults);
      return;
    }

    playedContentIds = new Set();
    setStatus("");
    resultCountEl.textContent = translations[currentLang].resultCountLabel
      .replace("{label}", currentSearchLabel)
      .replace("{count}", totalHitCount.toLocaleString());
    resultSection.hidden = false;
    document.querySelector(".video-meeting-spot").scrollIntoView({ behavior: "smooth", block: "center" });
    playRandomVideo();
  } catch (error) {
    console.error(error);
    setStatus(translations[currentLang].statusNetworkError);
  } finally {
    searchButton.disabled = false;
  }
}

// 未再生の動画から1本選ぶ。全部再生済みならリセットして最初から
function pickNextVideo() {
  const unplayed = videoList.filter((v) => !playedContentIds.has(v.contentId));

  if (unplayed.length === 0) {
    playedContentIds = new Set();
    setStatus(translations[currentLang].statusLoopedRound);
    const video = videoList[Math.floor(Math.random() * videoList.length)];
    playedContentIds.add(video.contentId);
    return video;
  }

  setStatus("");
  const video = unplayed[Math.floor(Math.random() * unplayed.length)];
  playedContentIds.add(video.contentId);
  return video;
}

const FAIRY_VARIANTS = ["spin-active", "wave-rtl", "wave-ltr"];

// ニコニコの埋め込みスクリプトは640x360固定サイズのiframeを生成するため、
// 生成され次第それを検知して、プレイヤー枠（#player）いっぱいに広がるよう上書きする。
// 戻り値のPromiseは、iframeが実際にDOMへ現れた時点（またはタイムアウト）でresolveする。
// これにより「新しいiframeがまだ存在しない透明な状態」を確実に把握できる。
function observeEmbedIframeResize(containerEl) {
  const applySize = (iframe) => {
    iframe.removeAttribute("width");
    iframe.removeAttribute("height");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
  };

  return new Promise((resolve) => {
    const existingIframe = containerEl.querySelector("iframe");
    if (existingIframe) {
      applySize(existingIframe);
      resolve(existingIframe);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const iframe = containerEl.querySelector("iframe");
      if (iframe) {
        applySize(iframe);
        obs.disconnect();
        resolve(iframe);
      }
    });
    observer.observe(containerEl, { childList: true, subtree: true });

    // 万一iframeが現れなくても監視し続けないよう、一定時間で諦める
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, 10000);
  });
}

async function playRandomVideo({ animate = false } = {}) {
  if (videoList.length === 0) return;

  const video = pickNextVideo();

  if (animate) {
    // t=0〜0.8: 既存の動画（iframe）のopacityを1→0へ0.8秒かけてフェードアウト
    playerEmbedEl.style.transition = "opacity 0.8s ease";
    playerEmbedEl.classList.add("embed-hidden");
    await new Promise((resolve) => setTimeout(resolve, 800));

    // t=0.8: 妖精のアニメーションを0.8秒間だけ行う
    const fairyVariant = FAIRY_VARIANTS[Math.floor(Math.random() * FAIRY_VARIANTS.length)];
    playerFairyEl.classList.add(fairyVariant);
    playerFairyEl.classList.add("fairy-visible");

    await new Promise((resolve) => setTimeout(resolve, 500));
    playerFairyEl.classList.remove("fairy-visible");

    await new Promise((resolve) => setTimeout(resolve, 300));
    // t=1.6: 妖精のアニメーションを終了
    playerFairyEl.classList.remove(fairyVariant);
  }

  currentTitleEl.textContent = video.title;
  currentUploaderEl.textContent = translations[currentLang].uploaderLoading;
  watchOnNicoLink.href = `https://www.nicovideo.jp/watch/${video.contentId}`;
  currentThumbnailUrl = video.thumbnailUrl || "";
  resultActionsEl.hidden = false;

  // サムネは表示せず、いきなりiframe（ニコニコ埋め込み・再生ボタンを押すと再生される）を埋め込む
  playerThumbEl.style.transition = "none";
  playerThumbEl.classList.add("thumb-hidden");
  playerEmbedEl.innerHTML = "";
  const embedScript = document.createElement("script");
  embedScript.src = `https://embed.nicovideo.jp/watch/${video.contentId}/script?w=640&h=360`;
  playerEmbedEl.appendChild(embedScript);
  observeEmbedIframeResize(playerEmbedEl);

  // t=1.6〜2.4: 次の動画のiframeのopacityを0→1へ0.8秒かけてフェードイン（初回検索時はフェードなしで即表示）
  playerEmbedEl.style.transition = animate ? "opacity 0.8s ease" : "none";
  playerEmbedEl.classList.remove("embed-hidden");

  const uploaderName = await fetchUploaderName(video.contentId);
  currentUploaderEl.textContent = uploaderName
    ? `${translations[currentLang].uploaderPrefix}${uploaderName}`
    : translations[currentLang].uploaderUnknown;

  addToHistory({
    contentId: video.contentId,
    title: video.title,
    uploader: uploaderName,
    thumbnailUrl: video.thumbnailUrl,
    searchLabel: currentSearchLabel,
  });
}

// 出会った動画を記録に追加し、一覧を再描画する
function addToHistory(entry) {
  watchHistory.unshift(entry);
  renderHistory();
}

// 記録一覧の1項目分のDOM（<li>）を組み立てる。元ページ・新規ウィンドウの両方で使う共通処理
function createHistoryItem(entry) {
  const li = document.createElement("li");
  li.className = "history-item";
  li.title = translations[currentLang].historyNote;
  li.addEventListener("click", () => {
    window.open(`https://www.nicovideo.jp/watch/${entry.contentId}`, "_blank", "noopener");
  });

  const img = document.createElement("img");
  img.className = "history-thumb";
  img.src = entry.thumbnailUrl || "";
  img.alt = "";

  const textWrap = document.createElement("div");
  textWrap.className = "history-text";

  const titleEl = document.createElement("p");
  titleEl.className = "history-title";
  titleEl.textContent = entry.title;

  const uploaderEl = document.createElement("p");
  uploaderEl.className = "history-uploader";
  uploaderEl.textContent = entry.uploader
    ? `${translations[currentLang].uploaderPrefix}${entry.uploader}`
    : translations[currentLang].uploaderUnknown;

  textWrap.appendChild(titleEl);
  textWrap.appendChild(uploaderEl);
  li.appendChild(img);
  li.appendChild(textWrap);
  return li;
}

// 記録一覧を描画する（このページには最新5件のみ表示。全件は「記録をもっとみる」から別ウィンドウで見る）
function renderHistory() {
  if (watchHistory.length === 0) return;

  historySection.hidden = false;
  historyListEl.innerHTML = "";

  watchHistory.slice(0, HISTORY_VISIBLE_COUNT).forEach((entry) => {
    historyListEl.appendChild(createHistoryItem(entry));
  });

  const hasMore = watchHistory.length > HISTORY_VISIBLE_COUNT;
  historyMoreButton.hidden = !hasMore;
  historyMoreNoteEl.hidden = !hasMore;

  // 開いている全履歴ウィンドウがあれば、そちらも最新の内容に更新する
  if (historyWindowRef && !historyWindowRef.closed) {
    renderHistoryIntoWindow(historyWindowRef);
  }
}

// 新規ウィンドウの内部に、検索語（searchLabel）ごとにグループ分けし、
// 「検索語【X】で出会った動画」のトグルボタンで開閉できる形で全履歴を描画する
function renderHistoryIntoWindow(win) {
  const rootEl = win.document.getElementById("history-groups");
  if (!rootEl) return;

  const t = translations[currentLang];
  const noHistoryLabel = "(-)"; // 検索語が空だった場合のグループ見出し用フォールバック

  // 検索語（searchLabel）ごとにグループ化。出現順（＝新しい検索が先）を保つ
  const groups = [];
  const groupIndex = new Map();
  watchHistory.forEach((entry) => {
    const label = entry.searchLabel || noHistoryLabel;
    if (!groupIndex.has(label)) {
      groupIndex.set(label, groups.length);
      groups.push({ label, entries: [] });
    }
    groups[groupIndex.get(label)].entries.push(entry);
  });

  rootEl.innerHTML = "";

  groups.forEach((group, index) => {
    const groupEl = win.document.createElement("div");
    groupEl.className = "history-group";

    const toggleBtn = win.document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "pill-button history-group-toggle";
    toggleBtn.textContent = t.historyGroupToggle.replace("{label}", group.label);

    const listEl = win.document.createElement("ul");
    listEl.className = "history-group-list";
    // 最初のグループ（最新の検索）だけ開いた状態にしておく
    listEl.hidden = index !== 0;

    toggleBtn.addEventListener("click", () => {
      listEl.hidden = !listEl.hidden;
    });

    group.entries.forEach((entry) => {
      const li = win.document.createElement("li");
      li.className = "history-item";
      li.title = t.historyNote;
      li.addEventListener("click", () => {
        win.open(`https://www.nicovideo.jp/watch/${entry.contentId}`, "_blank", "noopener");
      });

      const img = win.document.createElement("img");
      img.className = "history-thumb";
      img.src = entry.thumbnailUrl || "";
      img.alt = "";

      const textWrap = win.document.createElement("div");
      textWrap.className = "history-text";

      const titleEl = win.document.createElement("p");
      titleEl.className = "history-title";
      titleEl.textContent = entry.title;

      const uploaderEl = win.document.createElement("p");
      uploaderEl.className = "history-uploader";
      uploaderEl.textContent = entry.uploader
        ? `${t.uploaderPrefix}${entry.uploader}`
        : t.uploaderUnknown;

      textWrap.appendChild(titleEl);
      textWrap.appendChild(uploaderEl);
      li.appendChild(img);
      li.appendChild(textWrap);
      listEl.appendChild(li);
    });

    groupEl.appendChild(toggleBtn);
    groupEl.appendChild(listEl);
    rootEl.appendChild(groupEl);
  });
}

// 「記録をもっとみる」で開く全履歴ウィンドウへの参照（既に開いていれば使い回す）
let historyWindowRef = null;

function openHistoryWindow() {
  if (historyWindowRef && !historyWindowRef.closed) {
    historyWindowRef.focus();
    renderHistoryIntoWindow(historyWindowRef);
    return;
  }

  const win = window.open("", "_blank");
  if (!win) return;
  historyWindowRef = win;
  writeHistoryWindowDocument(win);
}

// 新規ウィンドウの土台HTMLを書き出す。
// window.opener（＝このメインページ）を参照して描画するブートストラップ処理を埋め込むことで、
// リロードされた場合も再度このopener経由で履歴を取得し直し、真っ白にならないようにしている。
// opener自体が閉じられていた場合は、その旨を案内するメッセージを表示する。
function writeHistoryWindowDocument(win) {
  const t = translations[currentLang];
  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="${currentLang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${t.historyTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Hina+Mincho&family=BIZ+UDPGothic:wght@400;700&family=Kiwi+Maru:wght@400;500&family=Sawarabi+Gothic&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="${new URL("style.css", window.location.href).href}" />
</head>
<body>
<main>
  <div class="top-bar">
    <h1 style="font-size: 24px;">${t.historyTitle}</h1>
  </div>
  <section id="history">
    <p class="disclaimer">${t.historyNote}</p>
    <p class="disclaimer">${t.historyWindowReloadNote}</p>
    <div id="history-groups"></div>
    <p class="disclaimer" id="history-closed-note" hidden>${t.historyWindowClosedNote}</p>
  </section>
</main>
<script>
  // リロード時を含め、このページを開くたびに実行される。
  // window.opener（元のページ）が生きていれば、そちらのrenderHistoryIntoWindowを呼んでもらい
  // 最新の履歴を描画してもらう。opener が閉じられていれば、その旨を表示する。
  (function () {
    if (window.opener && !window.opener.closed && typeof window.opener.renderHistoryIntoWindow === "function") {
      window.opener.renderHistoryIntoWindow(window);
    } else {
      var note = document.getElementById("history-closed-note");
      if (note) note.hidden = false;
    }
  })();
</script>
</body>
</html>`);
  win.document.close();
}

historyMoreButton.addEventListener("click", openHistoryWindow);

// 動画の詳細情報API（getthumbinfo）から投稿者名（またはチャンネル名）を取り出す
async function fetchUploaderName(contentId) {
  try {
    const response = await fetch(`${PROXY_BASE_URL}thumbinfo/${contentId}`);
    const xmlText = await response.text();
    const xml = new DOMParser().parseFromString(xmlText, "text/xml");

    const userNickname = xml.querySelector("user_nickname");
    if (userNickname) return userNickname.textContent;

    const chName = xml.querySelector("ch_name");
    if (chName) return chName.textContent;

    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function setStatus(message) {
  statusEl.textContent = message;
}

// ==== 新セクション（#new-player-section）専用ロジック ====
// 既存の #result まわりのコード・変数・関数には一切触れず、完全に独立させる。

const newPlayerCountEl = document.getElementById("new-player-count");
const newPlayerTitleEl = document.getElementById("new-player-title");
const newPlayerUploaderEl = document.getElementById("new-player-uploader");
const newPlayerImageEl = document.getElementById("new-player-image");
const newPlayerEmbedEl = document.getElementById("new-player-embed");
const newPlayerWatchLinkEl = document.getElementById("new-player-watch-link");
const newPlayerNextButtonEl = document.getElementById("new-player-next-button");

let newPlayerVideoList = [];
let newPlayerShownIds = new Set();

async function newPlayerFetchSearch(params) {
  const response = await fetch(`${PROXY_BASE_URL}?${params.toString()}`);
  return response.json();
}

async function newPlayerRunSearch() {
  const baseParams = buildBaseParams();
  if (!baseParams) return;

  const includeTags = parseTags(includeTagsInput.value);
  const keyword = keywordInput.value.trim();
  const labelParts = [];
  if (includeTags.length > 0) labelParts.push(`タグ：${includeTags.join(" ")}`);
  if (keyword) labelParts.push(`キーワード：${keyword}`);
  const label = labelParts.join("、");

  try {
    const countParams = new URLSearchParams(baseParams);
    countParams.set("_limit", "1");
    countParams.set("_offset", "0");
    const countData = await newPlayerFetchSearch(countParams);

    if (countData.meta.status !== 200 || countData.meta.totalCount === 0) {
      newPlayerVideoList = [];
      newPlayerCountEl.textContent = `【${label}】で検索して、0件の動画が見つかったよ`;
      return;
    }

    const totalHitCount = countData.meta.totalCount;
    const limit = 100;
    const maxOffset = Math.max(0, Math.min(totalHitCount - limit, 100000 - limit));
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

    const listParams = new URLSearchParams(baseParams);
    listParams.set("_limit", String(limit));
    listParams.set("_offset", String(randomOffset));
    const listData = await newPlayerFetchSearch(listParams);

    if (listData.meta.status !== 200 || !listData.data || listData.data.length === 0) {
      newPlayerVideoList = [];
      newPlayerCountEl.textContent = `【${label}】で検索して、0件の動画が見つかったよ`;
      return;
    }

    newPlayerVideoList = listData.data;
    newPlayerShownIds = new Set();
    newPlayerCountEl.textContent = `【${label}】で検索して、${totalHitCount.toLocaleString()}件の動画が見つかったよ`;

    newPlayerShowRandomVideo();
  } catch (error) {
    console.error(error);
  }
}

function newPlayerPickVideo() {
  const unshown = newPlayerVideoList.filter((v) => !newPlayerShownIds.has(v.contentId));
  const pool = unshown.length > 0 ? unshown : newPlayerVideoList;
  if (unshown.length === 0) newPlayerShownIds = new Set();
  const video = pool[Math.floor(Math.random() * pool.length)];
  newPlayerShownIds.add(video.contentId);
  return video;
}

async function newPlayerShowRandomVideo() {
  if (newPlayerVideoList.length === 0) return;
  const video = newPlayerPickVideo();

  newPlayerTitleEl.textContent = video.title;
  newPlayerUploaderEl.textContent = "";
  newPlayerWatchLinkEl.href = `https://www.nicovideo.jp/watch/${video.contentId}`;

  // サムネは表示せず、いきなりiframe（ニコニコ埋め込み・再生ボタンを押すと再生される）を埋め込む
  newPlayerImageEl.style.display = "none";
  newPlayerEmbedEl.innerHTML = "";
  const embedScript = document.createElement("script");
  embedScript.src = `https://embed.nicovideo.jp/watch/${video.contentId}/script?w=640&h=360`;
  newPlayerEmbedEl.appendChild(embedScript);
  observeEmbedIframeResize(newPlayerEmbedEl);

  const uploaderName = await fetchUploaderName(video.contentId);
  newPlayerUploaderEl.textContent = uploaderName || "";
}

form.addEventListener("submit", async () => {
  await newPlayerRunSearch();
});

newPlayerNextButtonEl.addEventListener("click", () => {
  newPlayerShowRandomVideo();
});
