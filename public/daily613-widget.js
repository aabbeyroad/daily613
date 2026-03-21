// ============================================================
// daily613 홈 위젯 for Scriptable
// ============================================================
// 설치 방법:
//   1. App Store에서 "Scriptable" 앱 설치
//   2. Scriptable 앱을 열고 새 스크립트 생성
//   3. 이 코드를 전체 붙여넣기
//   4. 홈 화면에 Scriptable 위젯 추가
//   5. 위젯 길게 누르기 → 위젯 편집 → Script 선택 후 파라미터에
//      "이메일|비밀번호" 형식으로 입력 (예: user@email.com|mypassword)
//   6. 처음 실행 후 자동으로 저장됨 (이후 파라미터 비워도 됨)
// ============================================================

const API_KEY = "AIzaSyBfPGP771XgNdnBTQypbt-I_js3_7nuDAA";
const PROJECT_ID = "daily613-66a6f";
const APP_URL = "https://daily613-66a6f.firebaseapp.com";
const KEYCHAIN_KEY = "daily613_creds";

// ---- 인증 ----
async function signIn(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const req = new Request(url);
  req.method = "POST";
  req.headers = { "Content-Type": "application/json" };
  req.body = JSON.stringify({ email, password, returnSecureToken: true });
  const res = await req.loadJSON();
  if (res.error) throw new Error(res.error.message);
  return { idToken: res.idToken, uid: res.localId };
}

// ---- Firestore 파싱 ----
function parseValue(val) {
  if (!val) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue);
  if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.nullValue !== undefined) return null;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.arrayValue !== undefined)
    return (val.arrayValue.values || []).map(parseValue);
  if (val.mapValue !== undefined) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {}))
      obj[k] = parseValue(v);
    return obj;
  }
  return null;
}

async function fetchData(uid, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const req = new Request(url);
  req.headers = { Authorization: `Bearer ${idToken}` };
  const res = await req.loadJSON();
  if (res.error) throw new Error(res.error.message);
  const fields = res.fields || {};
  return {
    routines: parseValue(fields.routines) || [],
    records: parseValue(fields.records) || [],
  };
}

// ---- 날짜 ----
function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayLabel() {
  const d = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

// ---- 레벨 표시 ----
function levelSymbol(level) {
  return { none: "○", done: "●", more: "◆", max: "★" }[level] || "○";
}

function levelColor(level) {
  return {
    none: new Color("#636366"),
    done: new Color("#3B82F6"),
    more: new Color("#8B5CF6"),
    max:  new Color("#F59E0B"),
  }[level] || new Color("#636366");
}

function levelLabel(level) {
  return { done: "완료", more: "더", max: "최대" }[level] || "";
}

// ---- 위젯 생성 ----
async function buildWidget(routines, records) {
  const today = todayStr();
  const activeRoutines = routines
    .filter((r) => !r.archived)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const record = records.find((r) => r.date === today);
  const checks = record ? record.checks || {} : {};

  const completed = activeRoutines.filter(
    (r) => checks[r.id] && checks[r.id] !== "none"
  ).length;
  const total = activeRoutines.length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const isSmall = config.widgetFamily === "small";
  const isMedium = config.widgetFamily === "medium";
  const maxRows = isSmall ? 5 : isMedium ? 7 : 12;

  const w = new ListWidget();
  w.backgroundColor = new Color("#1C1C1E");
  w.setPadding(14, 14, 12, 14);
  w.url = APP_URL;

  // 헤더 행
  const header = w.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  const dateText = header.addText(todayLabel());
  dateText.textColor = new Color("#EBEBF5CC");
  dateText.font = Font.mediumSystemFont(12);

  header.addSpacer();

  const rateColor =
    rate === 100 ? new Color("#34D399") : rate >= 50 ? new Color("#60A5FA") : new Color("#F87171");
  const rateText = header.addText(`${rate}%`);
  rateText.textColor = rateColor;
  rateText.font = Font.boldSystemFont(13);

  w.addSpacer(6);

  // 진행률 바
  const barBg = w.addStack();
  barBg.size = new Size(0, 3);
  barBg.backgroundColor = new Color("#3A3A3C");
  barBg.cornerRadius = 1.5;

  // filled portion (Scriptable에서 진행률 바를 직접 그릴 수 없으므로 텍스트로 표현)
  w.addSpacer(8);

  // 루틴 목록
  const visible = activeRoutines.slice(0, maxRows);
  for (const routine of visible) {
    const level = checks[routine.id] || "none";
    const isDone = level !== "none";

    const row = w.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    row.spacing = 5;

    const sym = row.addText(levelSymbol(level));
    sym.textColor = levelColor(level);
    sym.font = Font.systemFont(10);

    const name = row.addText(routine.name);
    name.textColor = isDone ? Color.white() : new Color("#8E8E93");
    name.font = isDone ? Font.mediumSystemFont(12) : Font.systemFont(12);
    name.lineLimit = 1;
    name.minimumScaleFactor = 0.8;

    row.addSpacer();

    if (isDone) {
      const lbl = row.addText(levelLabel(level));
      lbl.textColor = levelColor(level);
      lbl.font = Font.systemFont(10);
    }

    w.addSpacer(4);
  }

  if (activeRoutines.length > maxRows) {
    w.addSpacer(2);
    const more = w.addText(`+${activeRoutines.length - maxRows}개`);
    more.textColor = new Color("#636366");
    more.font = Font.systemFont(10);
  }

  w.addSpacer();

  // 푸터
  const footer = w.addText(`${completed}/${total} 완료`);
  footer.textColor = new Color("#636366");
  footer.font = Font.systemFont(10);

  return w;
}

// ---- 오류 위젯 ----
function errorWidget(msg) {
  const w = new ListWidget();
  w.backgroundColor = new Color("#1C1C1E");
  w.setPadding(14, 14, 14, 14);
  const title = w.addText("daily613");
  title.textColor = new Color("#FF453A");
  title.font = Font.boldSystemFont(13);
  w.addSpacer(6);
  const body = w.addText(msg);
  body.textColor = new Color("#8E8E93");
  body.font = Font.systemFont(11);
  body.lineLimit = 4;
  return w;
}

// ---- 설정 필요 위젯 ----
function setupWidget() {
  const w = new ListWidget();
  w.backgroundColor = new Color("#1C1C1E");
  w.setPadding(14, 14, 14, 14);
  const title = w.addText("daily613 위젯");
  title.textColor = Color.white();
  title.font = Font.boldSystemFont(13);
  w.addSpacer(8);
  const msg = w.addText(
    "위젯 파라미터에\n이메일|비밀번호\n를 입력해주세요"
  );
  msg.textColor = new Color("#8E8E93");
  msg.font = Font.systemFont(12);
  return w;
}

// ---- 메인 ----
async function main() {
  let email, password;

  // 1) 키체인에서 로드
  if (Keychain.contains(KEYCHAIN_KEY)) {
    const saved = JSON.parse(Keychain.get(KEYCHAIN_KEY));
    email = saved.email;
    password = saved.password;
  }

  // 2) 위젯 파라미터에서 로드 (첫 실행 시)
  if ((!email || !password) && args.widgetParameter) {
    const parts = args.widgetParameter.split("|");
    if (parts.length >= 2) {
      email = parts[0].trim();
      password = parts[1].trim();
      Keychain.set(KEYCHAIN_KEY, JSON.stringify({ email, password }));
    }
  }

  if (!email || !password) {
    const w = setupWidget();
    Script.setWidget(w);
    if (config.runsInApp) await w.presentSmall();
    return;
  }

  try {
    const { idToken, uid } = await signIn(email, password);
    const { routines, records } = await fetchData(uid, idToken);
    const w = await buildWidget(routines, records);
    Script.setWidget(w);
    if (config.runsInApp) {
      if (config.widgetFamily === "small") await w.presentSmall();
      else await w.presentMedium();
    }
  } catch (e) {
    const w = errorWidget(e.message || "알 수 없는 오류");
    Script.setWidget(w);
    if (config.runsInApp) await w.presentSmall();
  }
}

main();
