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

// 「ボイロ系」「ボカロ系」ボタンで内部的に付与されるタグ（いずれか含む＝OR）
const CATEGORY_TAGS = {
  voiroid: ["ボイロ", "ボイスロイド", "ソフトフェアトーク", "ソフトウェアトーク劇場", "VOICELOID"],
  vocaloid: ["ボカロ", "UTAU", "ソフトウェアシンガー", "vocaloidオリジナル曲", "VOCALOID"],
};

const translations = {
  ja: {
    pageTitle: "妖精さんプレイヤー",
    heading: "妖精さんプレイヤー",
    lead: "条件を指定して、ニコニコに投稿された動画とランダムで出会えます",
    leadSub: "タグ検索とキーワード検索、どちらか一方だけでも使えます",
    languageLabel: "言語",
    voiceCategoryLabel: "Q1：どんな動画を探してるの？",
    voiroidLabel: "ボイロ・解説・劇場系",
    vocaloidLabel: "ボカロ・音楽系",
    voiceCategoryTooltip:
      "それぞれのボタンで以下のタグが内部的にいずれか含む（OR）で付与されます\n「ボイロ・解説・劇場系」ボイロ、ボイスロイド、ソフトフェアトーク、ソフトウェアトーク劇場、VOICELOID\n「ボカロ・音楽系」ボカロ、UTAU、ソフトウェアシンガー、vocaloidオリジナル曲、VOCALOID",
    includeTagsLabel: "Q2：気になるタグは何？",
    includeTagsNote: "半角、全角スペースを加えて複数入力した場合、すべて含む（AND）結果がでます",
    includeTagsPlaceholder: "例: 初音ミク オリジナル曲",
    keywordLabel: "Q４：キーワードでもいいよ？",
    keywordNote: "キーワード検索はタイトル・動画詳細欄を参照します。",
    keywordPlaceholder: "例: リミックス",
    keywordSuggestNote: "Wikipediaの記事タイトルをランダムで取得することができます",
    keywordSuggestButton: "キーワードを提案してもらう",
    keywordExpandTitle: "キーワードを広げる？",
    keywordExpandNote: "入力中の単語から、類義語・関連語をWikipediaで探して「いずれか含む（OR）」に広げます",
    keywordExpandButton: "キーワードを広げる",
    disclaimerPrefix: "非公式ツールです。問い合わせなどはこちらから",
    filterToggleLabel: "フィルター設定（投稿日など）",
    viewsRangeLabel: "Q３：森の奥まで行ってみる？",
    minViewsLabel: "再生数（下限）",
    maxViewsLabel: "再生数（上限）",
    viewsPlaceholder: "指定なし",
    dateRangeLabel: "投稿日の範囲",
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
    statusNeedTag: "含めるタグかキーワードのどちらかを入力してください。",
    statusSearching: "検索中...",
    statusSuggesting: "単語を探しています...",
    statusExpanding: "類義語・関連語を探しています...",
    statusExpandFailed: "うまく広げられませんでした。別の単語で試してみてください。",
    statusFailed: "検索に失敗しました。しばらくしてからもう一度お試しください。",
    statusNoResults: "条件に一致する動画が見つかりませんでした。タグや条件を変えてお試しください。",
    statusNetworkError: "通信エラーが発生しました。時間をおいて再度お試しください。",
    statusLoopedRound: "すべて再生したので、最初からもう一周します。",
    resultCountSuffix: "件ヒットしました",
    uploaderLoading: "投稿者を取得中...",
    uploaderPrefix: "投稿者: ",
    uploaderUnknown: "投稿者: 取得できませんでした",
    nextButton: "次の動画と出会う",
    watchOnNicoButton: "ニコニコで見る",
  },
  zh: {
    pageTitle: "妖精播放器",
    heading: "妖精播放器",
    lead: "设定条件后，随机与投稿到niconico的视频相遇",
    leadSub: "标签搜索和关键词搜索，只使用其中一种也可以",
    languageLabel: "语言",
    voiceCategoryLabel: "Q1：想找什么样的视频？",
    voiroidLabel: "VOICEROID・解说・剧场系",
    vocaloidLabel: "VOCALOID・音乐系",
    voiceCategoryTooltip:
      "点击按钮后，会在内部以「包含任意一个（OR）」的方式附加以下标签\n「VOICEROID・解说・剧场系」ボイロ、ボイスロイド、ソフトフェアトーク、ソフトウェアトーク劇場、VOICELOID\n「VOCALOID・音乐系」ボカロ、UTAU、ソフトウェアシンガー、vocaloidオリジナル曲、VOCALOID",
    includeTagsLabel: "Q2：在意的标签是什么？",
    includeTagsNote: "用半角或全角空格输入多个标签时，会显示全部包含（AND）的结果",
    includeTagsPlaceholder: "例：初音未来 原创曲",
    keywordLabel: "Q４：也可以用关键词吗？",
    keywordNote: "关键词搜索会参照标题和视频简介栏。",
    keywordPlaceholder: "例：混音",
    keywordSuggestNote: "可以随机获取一个Wikipedia的文章标题",
    keywordSuggestButton: "让妖精推荐关键词",
    keywordExpandTitle: "扩展关键词？",
    keywordExpandNote: "根据输入的词语，从Wikipedia查找同义词・相关词，以「包含任意一个（OR）」的方式扩展",
    keywordExpandButton: "扩展关键词",
    disclaimerPrefix: "这是非官方工具。如需联系，请通过",
    filterToggleLabel: "筛选设置（投稿日期等）",
    viewsRangeLabel: "Q３：要不要深入森林深处看看？",
    minViewsLabel: "播放数（下限）",
    maxViewsLabel: "播放数（上限）",
    viewsPlaceholder: "不限",
    dateRangeLabel: "投稿日期范围",
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
    resultCountSuffix: "个结果",
    uploaderLoading: "正在获取投稿者...",
    uploaderPrefix: "投稿者：",
    uploaderUnknown: "投稿者：获取失败",
    nextButton: "邂逅下一个视频",
    watchOnNicoButton: "在niconico观看",
  },
  ko: {
    pageTitle: "요정 플레이어",
    heading: "요정 플레이어",
    lead: "조건을 지정하면 니코니코에 올라온 동영상과 무작위로 만날 수 있어요",
    leadSub: "태그 검색과 키워드 검색, 둘 중 하나만 사용해도 됩니다",
    languageLabel: "언어",
    voiceCategoryLabel: "Q1：어떤 영상을 찾고 있어?",
    voiroidLabel: "보이로이드・해설・극장 계열",
    vocaloidLabel: "보카로이드・음악 계열",
    voiceCategoryTooltip:
      "각 버튼을 누르면 내부적으로 다음 태그가 「하나라도 포함(OR)」 조건으로 추가됩니다\n「보이로이드・해설・극장 계열」ボイロ、ボイスロイド、ソフトフェアトーク、ソフトウェアトーク劇場、VOICELOID\n「보카로이드・음악 계열」ボカロ、UTAU、ソフトウェアシンガー、vocaloidオリジナル曲、VOCALOID",
    includeTagsLabel: "Q2：궁금한 태그가 있나요?",
    includeTagsNote: "반각・전각 공백으로 여러 개 입력하면 모두 포함（AND）된 결과가 나옵니다",
    includeTagsPlaceholder: "예: 하츠네 미쿠 오리지널곡",
    keywordLabel: "Q４：키워드도 괜찮아?",
    keywordNote: "키워드 검색은 제목・동영상 설명란을 참조합니다.",
    keywordPlaceholder: "예: 리믹스",
    keywordSuggestNote: "Wikipedia 문서 제목을 무작위로 가져올 수 있습니다",
    keywordSuggestButton: "키워드 제안받기",
    keywordExpandTitle: "키워드를 넓혀볼까?",
    keywordExpandNote: "입력한 단어를 바탕으로 Wikipedia에서 유의어・관련어를 찾아 「하나라도 포함(OR)」으로 넓힙니다",
    keywordExpandButton: "키워드 넓히기",
    disclaimerPrefix: "비공식 도구입니다. 문의는 이쪽으로",
    filterToggleLabel: "필터 설정（게시일 등）",
    viewsRangeLabel: "Q３：숲 깊은 곳까지 가볼까?",
    minViewsLabel: "조회수（하한）",
    maxViewsLabel: "조회수（상한）",
    viewsPlaceholder: "지정 안 함",
    dateRangeLabel: "게시일 범위",
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
    resultCountSuffix: "건 검색됨",
    uploaderLoading: "업로더 정보를 가져오는 중...",
    uploaderPrefix: "업로더: ",
    uploaderUnknown: "업로더: 가져오지 못했습니다",
    nextButton: "다음 동영상과 만나기",
    watchOnNicoButton: "니코니코에서 보기",
  },
  en: {
    pageTitle: "Fairy Player",
    heading: "Fairy Player",
    lead: "Set your conditions and randomly meet videos posted on Niconico",
    leadSub: "You can use tag search and keyword search independently, or just one of them",
    languageLabel: "Language",
    voiceCategoryLabel: "Q1: What kind of video are you looking for?",
    voiroidLabel: "VOICEROID / Narration / Theater",
    vocaloidLabel: "VOCALOID / Music",
    voiceCategoryTooltip:
      "Each button internally adds the following tags with an OR condition\n\"VOICEROID / Narration / Theater\": \u30dc\u30a4\u30ed, \u30dc\u30a4\u30b9\u30ed\u30a4\u30c9, \u30bd\u30d5\u30c8\u30d5\u30a7\u30a2\u30c8\u30fc\u30af, \u30bd\u30d5\u30c8\u30a6\u30a7\u30a2\u30c8\u30fc\u30af\u5287\u5834, VOICELOID\n\"VOCALOID / Music\": \u30dc\u30ab\u30ed, UTAU, \u30bd\u30d5\u30c8\u30a6\u30a7\u30a2\u30b7\u30f3\u30ac\u30fc, vocaloid\u30aa\u30ea\u30b8\u30ca\u30eb\u66f2, VOCALOID",
    includeTagsLabel: "Q2: What tags interest you?",
    includeTagsNote: "Entering multiple tags separated by spaces returns videos matching all of them (AND)",
    includeTagsPlaceholder: "e.g. Hatsune Miku original song",
    keywordLabel: "Q4: A keyword works too?",
    keywordNote: "Keyword search looks at the title and video description.",
    keywordPlaceholder: "e.g. remix",
    keywordSuggestNote: "You can fetch a random Wikipedia article title",
    keywordSuggestButton: "Suggest a keyword",
    keywordExpandTitle: "Expand the keyword?",
    keywordExpandNote: "Looks up synonyms and related words on Wikipedia for your keyword and adds them with an OR condition",
    keywordExpandButton: "Expand keyword",
    disclaimerPrefix: "This is an unofficial tool. For inquiries, contact",
    filterToggleLabel: "Filter settings (upload date, etc.)",
    viewsRangeLabel: "Q3: Want to go deeper into the forest?",
    minViewsLabel: "Min. views",
    maxViewsLabel: "Max. views",
    viewsPlaceholder: "No limit",
    dateRangeLabel: "Upload date range",
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
    resultCountSuffix: " results",
    uploaderLoading: "Loading uploader...",
    uploaderPrefix: "Uploader: ",
    uploaderUnknown: "Uploader: unavailable",
    nextButton: "Meet the next video",
    watchOnNicoButton: "Watch on Niconico",
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
const statusEl = document.getElementById("status");
const resultSection = document.getElementById("result");
const resultCountEl = document.getElementById("result-count");
const currentTitleEl = document.getElementById("current-title");
const currentUploaderEl = document.getElementById("current-uploader");
const playerEl = document.getElementById("player");
const nextButton = document.getElementById("next-button");
const watchOnNicoLink = document.getElementById("watch-on-nico");
const languageSelect = document.getElementById("language-select");
const voiroidToggle = document.getElementById("voiroid-toggle");
const vocaloidToggle = document.getElementById("vocaloid-toggle");
const voiceCategoryInfo = document.getElementById("voice-category-info");

// 検索でヒットした動画一覧（ランダムに取得した最大100件）
let videoList = [];
// 「次の動画と出会う」で既に再生した動画のcontentId
let playedContentIds = new Set();
// 選択中の音声合成系統（voiroid / vocaloid のどちらか、両方、または空のSet）
let selectedVoiceCategories = new Set();

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

  voiceCategoryInfo.title = translations[lang].voiceCategoryTooltip;
}

languageSelect.addEventListener("change", () => {
  applyLanguage(languageSelect.value);
});

applyLanguage("ja");

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
  playRandomVideo();
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

  // ボイロ系／ボカロ系トグルで選ばれたタグ（選ばれている系統すべてを、いずれか含む＝OR）
  if (voiceCategories && voiceCategories.size > 0) {
    const combinedTags = [...voiceCategories].flatMap((category) => CATEGORY_TAGS[category] || []);
    if (combinedTags.length > 0) {
      filters.push({
        type: "or",
        filters: [...new Set(combinedTags)].map((tag) => ({
          type: "equal",
          field: "tagsExact",
          value: tag,
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
    fields: "contentId,title,viewCounter",
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
    resultCountEl.textContent = `${totalHitCount.toLocaleString()}${translations[currentLang].resultCountSuffix}`;
    resultSection.hidden = false;
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

async function playRandomVideo() {
  if (videoList.length === 0) return;

  const video = pickNextVideo();
  currentTitleEl.textContent = video.title;
  currentUploaderEl.textContent = translations[currentLang].uploaderLoading;
  watchOnNicoLink.href = `https://www.nicovideo.jp/watch/${video.contentId}`;

  // 再生エリアを空にしてから、ニコニコの公式埋め込みスクリプトを差し込む
  playerEl.innerHTML = "";
  const embedScript = document.createElement("script");
  embedScript.src = `https://embed.nicovideo.jp/watch/${video.contentId}/script?w=640&h=360`;
  playerEl.appendChild(embedScript);

  const uploaderName = await fetchUploaderName(video.contentId);
  currentUploaderEl.textContent = uploaderName
    ? `${translations[currentLang].uploaderPrefix}${uploaderName}`
    : translations[currentLang].uploaderUnknown;
}

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
