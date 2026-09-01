// Cloudflare Workers のプロキシURL（ニコニコの各APIをCORS制限なしで呼ぶための中継先）
const PROXY_BASE_URL = "https://old-cell-59f7nico-proxy.hitoiki4105.workers.dev/";

const form = document.getElementById("search-form");
const includeTagsInput = document.getElementById("include-tags");
const excludeTagsInput = document.getElementById("exclude-tags");
const minViewsInput = document.getElementById("min-views");
const maxViewsInput = document.getElementById("max-views");
const yearFromInput = document.getElementById("year-from");
const yearToInput = document.getElementById("year-to");
const searchButton = document.getElementById("search-button");
const statusEl = document.getElementById("status");
const resultSection = document.getElementById("result");
const resultCountEl = document.getElementById("result-count");
const currentTitleEl = document.getElementById("current-title");
const currentUploaderEl = document.getElementById("current-uploader");
const playerEl = document.getElementById("player");
const nextButton = document.getElementById("next-button");

// 検索でヒットした動画一覧（ランダムに取得した最大100件）を保持しておく
let videoList = [];

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runSearch();
});

nextButton.addEventListener("click", () => {
  playRandomVideo();
});

// 再生数入力欄の「-100」「+100」ボタン
document.querySelectorAll(".step-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const targetInput = document.getElementById(button.dataset.target);
    const step = Number(button.dataset.step);
    const current = Number(targetInput.value) || 0;
    targetInput.value = Math.max(0, current + step);
  });
});

// カンマ区切りの入力文字列を、空白を除いたタグの配列にする
function parseTags(rawText) {
  return rawText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

// 入力内容から、ニコニコAPI用の q パラメータ（検索キーワード式）を組み立てる
function buildQuery(includeTags, excludeTags, matchMode) {
  let q = "";

  if (includeTags.length > 0) {
    q = matchMode === "OR" ? includeTags.join(" OR ") : includeTags.join(" ");
  }

  for (const tag of excludeTags) {
    q += ` -${tag}`;
  }

  return q.trim();
}

// 検索条件（タグ・フィルタ）だけをまとめたパラメータを組み立てる
// （_limit, _offset, _sort はリクエストの用途ごとに後から付け足す）
function buildBaseParams() {
  const includeTags = parseTags(includeTagsInput.value);
  const excludeTags = parseTags(excludeTagsInput.value);
  const matchMode = form.querySelector('input[name="match-mode"]:checked').value;
  const minViews = minViewsInput.value;
  const maxViews = maxViewsInput.value;
  const yearFrom = yearFromInput.value;
  const yearTo = yearToInput.value;

  if (includeTags.length === 0) {
    return null;
  }

  const q = buildQuery(includeTags, excludeTags, matchMode);

  const params = new URLSearchParams({
    q,
    targets: "tags",
    fields: "contentId,title,viewCounter",
    _sort: "-viewCounter",
    _context: "nico-tag-player",
  });

  if (minViews) {
    params.set("filters[viewCounter][gte]", minViews);
  }
  if (maxViews) {
    params.set("filters[viewCounter][lte]", maxViews);
  }
  if (yearFrom) {
    params.set("filters[startTime][gte]", `${yearFrom}-01-01T00:00:00+09:00`);
  }
  if (yearTo) {
    // 指定した年の「翌年1月1日より前」までを対象にする
    params.set("filters[startTime][lt]", `${Number(yearTo) + 1}-01-01T00:00:00+09:00`);
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
    setStatus("含めるタグを1つ以上入力してください。");
    return;
  }

  setStatus("検索中...");
  searchButton.disabled = true;
  resultSection.hidden = true;

  try {
    // 1回目：ヒット件数だけを把握するための軽いリクエスト
    const countParams = new URLSearchParams(baseParams);
    countParams.set("_limit", "1");
    countParams.set("_offset", "0");
    const countData = await fetchSearch(countParams);

    if (countData.meta.status !== 200) {
      setStatus("検索に失敗しました。しばらくしてからもう一度お試しください。");
      return;
    }

    const totalHitCount = countData.meta.totalCount;

    if (totalHitCount === 0) {
      videoList = [];
      setStatus("条件に一致する動画が見つかりませんでした。タグや条件を変えてお試しください。");
      return;
    }

    // 2回目：ランダムな開始位置から最大100件を取得する
    // （_offset の上限は100,000なので、そこも超えないようにする）
    const limit = 100;
    const maxOffset = Math.max(0, Math.min(totalHitCount - limit, 100000 - limit));
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

    const listParams = new URLSearchParams(baseParams);
    listParams.set("_limit", String(limit));
    listParams.set("_offset", String(randomOffset));
    const listData = await fetchSearch(listParams);

    if (listData.meta.status !== 200) {
      setStatus("検索に失敗しました。しばらくしてからもう一度お試しください。");
      return;
    }

    videoList = listData.data || [];

    if (videoList.length === 0) {
      setStatus("条件に一致する動画が見つかりませんでした。タグや条件を変えてお試しください。");
      return;
    }

    setStatus("");
    // ニコニコのタグ検索結果と同じ「ヒット件数」を表示する
    resultCountEl.textContent = `${totalHitCount.toLocaleString()}件ヒットしました`;
    resultSection.hidden = false;
    await playRandomVideo();
  } catch (error) {
    console.error(error);
    setStatus("通信エラーが発生しました。時間をおいて再度お試しください。");
  } finally {
    searchButton.disabled = false;
  }
}

async function playRandomVideo() {
  if (videoList.length === 0) return;

  const video = videoList[Math.floor(Math.random() * videoList.length)];
  currentTitleEl.textContent = video.title;
  currentUploaderEl.textContent = "投稿者を取得中...";

  // 再生エリアを空にしてから、ニコニコの公式埋め込みスクリプトを差し込む
  playerEl.innerHTML = "";
  const embedScript = document.createElement("script");
  embedScript.src = `https://embed.nicovideo.jp/watch/${video.contentId}/script?w=640&h=360`;
  playerEl.appendChild(embedScript);

  const uploaderName = await fetchUploaderName(video.contentId);
  currentUploaderEl.textContent = uploaderName
    ? `投稿者: ${uploaderName}`
    : "投稿者: 取得できませんでした";
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
