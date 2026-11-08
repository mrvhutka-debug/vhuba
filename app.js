import {
  auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendEmailVerification, GoogleAuthProvider, signInWithPopup,
  PhoneAuthProvider, RecaptchaVerifier, updatePhoneNumber, linkWithCredential,
  doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc, getDocs, where,
  onSnapshot, query, orderBy, limit, serverTimestamp, writeBatch
} from "./firebase.js";
import en from "./en.js";
import hi from "./hi.js";
import ne from "./ne.js";
import X from "./x.js";
import Y from "./x2.js";
import Z from "./x3.js";
import { initSettings } from "./settings.js";
import { initAdmin } from "./admin.js";

/* Vhuba support contact. Fill these two lines with your own details.
   SUPPORT_WA: country code + number, no plus or spaces, e.g. "9779812345678"
   SUPPORT_EMAIL: your support email. Leave "" to hide a button. */
const SUPPORT_WA = "";
const SUPPORT_EMAIL = "";

/* Set this to true only when SMS verification really works (Firebase billing is on).
   Then an owner must verify the phone before adding a room. With false, owners can still
   add rooms, but those rooms stay Pending until an admin approves them. */
const REQUIRE_PHONE_FOR_OWNERS = false;

const T = {
  en: Object.assign({}, en, X.en, Y.en, Z.en),
  hi: Object.assign({}, hi, X.hi, Y.hi, Z.hi),
  ne: Object.assign({}, ne, X.ne, Y.ne, Z.ne)
};

const TITLE_KEY = {
  home: "navHome", find: "navFind", favs: "navFavs", notices: "navNotices",
  mine: "navMine", settings: "navSettings", admin: "navAdmin", profile: "navProfile", owner: "navOwner"
};
const VIEWS = ["home", "find", "favs", "notices", "mine", "settings", "admin", "profile", "owner"];
const DAY = 24 * 60 * 60 * 1000;
const LIFE_DAYS = 30;
const REPORT_LIMIT = 3;
const MAX_PHOTOS = 2;
const MAX_ROOMS = 5;
const CUR = { IN: "INR", NP: "NPR" };
const BUDGETS = { IN: [3000, 3500, 4000, 5000], NP: [5000, 8000, 10000, 15000] };
const DEPOSITS = { IN: [5000, 10000], NP: [8000, 16000] };
const EMPTY_F = { q: "", type: "", loc: "", country: "", budget: "", dep: "", ex: "", own: "", sort: "new" };
const PHOTO_OK = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;

let lang = "en";
let tab = "login";
let profile = null;
let signingUp = false;
let isAdmin = false;
let resendBusy = false;
let afterVerify = "";
let verifySentFor = "";
let currentView = "home";
let roomsData = [];
let pubMap = new Map();
let mineMap = new Map();
let notices = [];
let unsubRooms = null;
let unsubVer = null;
let unsubNotices = null;
let hbTimer = null;
let verifiedSet = new Set();
let reportingId = null;
let seenBefore = Date.now();
let ssAutoDone = false;
let pendingPhotos = [];
let pendingLoc = null;
let myPos = null;
let myPub = null;
let pubCache = {};
let pubReq = new Set();
let pfPhoto = "";
let pvId = null;
let recaptcha = null;
let ownerUid = "";
let ownerBack = "home";
let renderTimer = null;

const $ = (id) => document.getElementById(id);

function esc(t) {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function digits(s) {
  return String(s || "").replace(/\D/g, "");
}

function initials(name) {
  const p = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

function avatarHtml(photo, name) {
  if (typeof photo === "string" && PHOTO_OK.test(photo)) return '<img src="' + photo + '" alt="">';
  return esc(initials(name));
}

function phoneVerifiedNow() {
  return !!(auth.currentUser && auth.currentUser.phoneNumber);
}

/* ---------- CURRENCY (decided by the ROOM's country, never by the viewer) ---------- */
function roomCountry(r) {
  if (r.country === "IN" || r.country === "NP") return r.country;
  return digits(r.cc) === "977" ? "NP" : "IN";
}

function money(n, cur) {
  const v = Number(n);
  const s = isFinite(v) ? v.toLocaleString("en-IN") : String(n);
  return cur === "NPR" ? "NPR " + s : "₹" + s;
}

function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  try { localStorage.setItem("vhubaTheme", dark ? "dark" : "light"); } catch (e) {}
}
let savedDark = false;
try { savedDark = localStorage.getItem("vhubaTheme") === "dark"; } catch (e) {}
applyTheme(savedDark);

function show(id) {
  ["loading", "welcomeScreen", "authScreen", "verifyScreen", "langScreen", "privacyScreen", "appScreen"].forEach((s) => {
    $(s).style.display = (s === id) ? "block" : "none";
  });
  window.scrollTo(0, 0);
}

function openMenu() {
  $("sideMenu").classList.add("open");
  $("menuOverlay").classList.add("open");
}

function closeMenu() {
  $("sideMenu").classList.remove("open");
  $("menuOverlay").classList.remove("open");
}

function uref() {
  return doc(db, "users", auth.currentUser.uid);
}

function showView(v) {
  if (v === "admin" && !isAdmin) return;
  currentView = v;
  VIEWS.forEach((n) => { $(n + "View").style.display = (n === v) ? "block" : "none"; });
  $("pageTitle").textContent = T[lang][TITLE_KEY[v]];
  closeMenu();
  if (v === "admin") admin.load();
  if (v === "notices") { renderNotices(); markNoticesRead(); }
  if (v === "profile") renderProfile();
  if (v === "mine") updateNudge();
  if (v === "find" && profile) {
    seenBefore = profile.lastSeen || Date.now();
    profile.lastSeen = Date.now();
    updateDoc(uref(), { lastSeen: profile.lastSeen }).catch(function () {});
    if (profile.savedSearch && !ssAutoDone) {
      ssAutoDone = true;
      applySaved();
    }
    render();
  }
  window.scrollTo(0, 0);
}

function authError(code) {
  const map = {
    "auth/email-already-in-use": "This email is already registered. Please login.",
    "auth/invalid-email": "Enter a valid email.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/user-not-found": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/too-many-requests": "Too many tries. Please wait and try again.",
    "auth/network-request-failed": "No internet. Please check your connection.",
    "auth/unauthorized-domain": "This website address is not allowed in Firebase yet.",
    "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups for this site and try again.",
    "auth/operation-not-allowed": "Google login is not turned on in Firebase yet.",
    "auth/account-exists-with-different-credential": "This email already has an account. Please login with email and password."
  };
  return map[code] || "Something went wrong. Please try again.";
}

/* ---------- ANALYTICS HELPERS (events and activity) ---------- */
async function logEvent(type, roomId) {
  try {
    if (!auth.currentUser) return;
    const d = { type: type, uid: auth.currentUser.uid, createdAt: serverTimestamp() };
    if (roomId) d.roomId = roomId;
    await addDoc(collection(db, "events"), d);
  } catch (e) {}
}

function beat() {
  if (!auth.currentUser || !profile || document.visibilityState !== "visible") return;
  updateDoc(uref(), { lastActive: serverTimestamp() }).catch(function () {});
}

function startHeartbeat() {
  stopHeartbeat();
  beat();
  hbTimer = setInterval(beat, 120000);
}

function stopHeartbeat() {
  if (hbTimer) { clearInterval(hbTimer); hbTimer = null; }
}

/* Keep the account email, its verified status and the phone verified status on the user's profile,
   so admins can see them. The rules only accept values that match the real login. */
async function syncAuthFields() {
  const u = auth.currentUser;
  if (!u || !profile) return;
  const upd = {};
  if (profile.email !== u.email) upd.email = u.email || "";
  const ev = !!u.emailVerified;
  if (profile.emailVerified !== ev) upd.emailVerified = ev;
  const pv = !!u.phoneNumber && !!profile.phone && u.phoneNumber === "+" + (profile.phoneCc || "91") + String(profile.phone);
  if (profile.phoneVerified !== pv) upd.phoneVerified = pv;
  if (!Object.keys(upd).length) return;
  try {
    await updateDoc(uref(), upd);
    Object.assign(profile, upd);
  } catch (e) {}
}

async function checkAdmin() {
  try {
    await getDocs(query(collection(db, "reports"), limit(1)));
    isAdmin = true;
  } catch (e) {
    isAdmin = false;
  }
}

/* ---------- PUBLIC PROFILE (the only part other people can see) ---------- */
async function loadMyPub() {
  myPub = null;
  try {
    const s = await getDoc(doc(db, "publicProfiles", auth.currentUser.uid));
    myPub = s.exists() ? s.data() : null;
  } catch (e) {}
  if (myPub) pubCache[auth.currentUser.uid] = myPub;
}

async function writePublic(f) {
  const u = auth.currentUser;
  f = f || {};
  const cur = myPub || {};
  const showC = !!(profile && profile.showCountry === true);
  const data = {
    name: String(f.name !== undefined ? f.name : (cur.name || (profile && profile.name) || "")).trim().slice(0, 60) || "User",
    bio: String(f.bio !== undefined ? f.bio : (cur.bio || "")).slice(0, 300),
    photo: f.photo !== undefined ? f.photo : (cur.photo || ""),
    country: showC ? String((profile && profile.country) || "") : "",
    emailVerified: !!u.emailVerified,
    phoneVerified: !!u.phoneNumber,
    updatedAt: serverTimestamp()
  };
  const ref = doc(db, "publicProfiles", u.uid);
  if (myPub) {
    await updateDoc(ref, data);
  } else {
    data.since = serverTimestamp();
    await setDoc(ref, data);
  }
  myPub = Object.assign({}, myPub || {}, data);
  pubCache[u.uid] = myPub;
}

async function syncPublicBadges() {
  const u = auth.currentUser;
  if (!u || !myPub) return;
  if (myPub.emailVerified === !!u.emailVerified && myPub.phoneVerified === !!u.phoneNumber) return;
  try { await writePublic({}); } catch (e) {}
}

async function prepareSession() {
  await syncAuthFields();
  await loadMyPub();
  await syncPublicBadges();
  await checkAdmin();
}

/* ---------- AUTH ---------- */
function setTab(t) {
  tab = t;
  $("tabLogin").className = (t === "login") ? "active" : "";
  $("tabSignup").className = (t === "signup") ? "active" : "";
  $("aName").style.display = (t === "signup") ? "block" : "none";
  $("aCc").style.display = (t === "signup") ? "block" : "none";
  $("aPhone").style.display = (t === "signup") ? "block" : "none";
  $("aBtn").textContent = (t === "signup") ? "Sign up" : "Login";
  $("aMsg").textContent = "";
}

/* Email and password. Customers are not asked to verify their email here. */
async function doAuth() {
  const name = $("aName").value.trim();
  const phone = $("aPhone").value.trim();
  const cc = $("aCc").value;
  const email = $("aEmail").value.trim();
  const pass = $("aPass").value;
  const msg = $("aMsg");
  msg.textContent = "";

  if (!email) { msg.textContent = "Enter your email."; return; }
  if (pass.length < 6) { msg.textContent = "Password must be at least 6 characters."; return; }

  $("aBtn").disabled = true;
  try {
    if (tab === "signup") {
      if (!name) { msg.textContent = "Please enter your name."; $("aBtn").disabled = false; return; }
      if (!/^[0-9]{10}$/.test(phone)) { msg.textContent = "Enter a valid 10 digit phone number."; $("aBtn").disabled = false; return; }
      signingUp = true;
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      profile = {
        name: name, phone: phone, phoneCc: cc, phoneVerified: false,
        country: cc === "977" ? "NP" : "IN", showCountry: false,
        email: cred.user.email || "", emailVerified: false,
        lang: "", accepted: false, hidePhone: false, favs: [], lastSeen: Date.now(),
        createdAt: serverTimestamp(), lastActive: serverTimestamp()
      };
      await setDoc(doc(db, "users", cred.user.uid), profile);
      logEvent("signup");
      myPub = null;
      signingUp = false;
      $("aPass").value = "";
      route();
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
      logEvent("login");
      $("aPass").value = "";
    }
  } catch (e) {
    signingUp = false;
    msg.textContent = authError(e.code);
  }
  $("aBtn").disabled = false;
}

/* Continue with Google. The pop-up must open straight from the tap, so nothing async comes before it. */
async function doGoogle() {
  const msg = $("aMsg");
  msg.textContent = "";
  $("gBtn").disabled = true;
  signingUp = true;
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    const user = cred.user;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      profile = snap.data();
      logEvent("login");
    } else {
      profile = {
        name: user.displayName || (user.email || "").split("@")[0] || "User",
        phone: "", phoneCc: "91", phoneVerified: false, country: "", showCountry: false,
        email: user.email || "", emailVerified: !!user.emailVerified,
        lang: "", accepted: false, hidePhone: false, favs: [], lastSeen: Date.now(),
        createdAt: serverTimestamp(), lastActive: serverTimestamp()
      };
      await setDoc(ref, profile);
      logEvent("signup");
    }
    await prepareSession();
    signingUp = false;
    route();
  } catch (e) {
    signingUp = false;
    if (auth.currentUser && !profile) { try { await signOut(auth); } catch (x) {} }
    if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
      msg.textContent = authError(e.code);
    }
  }
  $("gBtn").disabled = false;
}

async function doLogout() {
  await logEvent("logout");
  stopHeartbeat();
  stopRooms();
  profile = null;
  myPub = null;
  isAdmin = false;
  ssAutoDone = false;
  afterVerify = "";
  verifySentFor = "";
  pvId = null;
  if (recaptcha) { try { recaptcha.clear(); } catch (e) {} recaptcha = null; }
  closeReport();
  closeBig();
  showView("home");
  document.querySelectorAll(".sub").forEach((s) => s.classList.remove("open"));
  await signOut(auth);
}

/* ---------- EMAIL VERIFY (only needed to rent out a room, or to report a room) ---------- */
function needVerify(kind) {
  const u = auth.currentUser;
  if (!u || u.emailVerified) return false;
  afterVerify = (kind === "rent") ? "mine" : "";
  $("verifyEmail").textContent = u.email || "";
  $("vWhy").textContent = T[lang][kind === "rent" ? "verifyToRent" : "verifyToReport"];
  $("vMsg").textContent = "";
  show("verifyScreen");
  if (verifySentFor !== u.uid) {
    verifySentFor = u.uid;
    sendEmailVerification(u).then(() => { $("vMsg").textContent = T[lang].verifySent; }).catch(function () {});
  }
  return true;
}

async function checkVerified() {
  $("vCheck").disabled = true;
  try {
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    if (auth.currentUser.emailVerified) {
      $("vMsg").textContent = "";
      await syncAuthFields();
      await syncPublicBadges();
      const to = afterVerify;
      afterVerify = "";
      show("appScreen");
      if (to === "mine") {
        if (REQUIRE_PHONE_FOR_OWNERS && !phoneVerifiedNow()) { alert(T[lang].needPhone); showView("profile"); }
        else showView("mine");
      }
    } else {
      $("vMsg").textContent = "Not verified yet. Open the link in the email first, then press this button again.";
    }
  } catch (e) {
    $("vMsg").textContent = "Something went wrong. Please try again.";
  }
  $("vCheck").disabled = false;
}

async function resendVerify() {
  if (resendBusy || !auth.currentUser) return;
  resendBusy = true;
  $("vResend").disabled = true;
  try {
    await sendEmailVerification(auth.currentUser);
    $("vMsg").textContent = "Email sent again. Check Inbox and Spam.";
  } catch (e) {
    $("vMsg").textContent = (e.code === "auth/too-many-requests")
      ? "Too many tries. Please wait a few minutes." : "Could not send. Try again later.";
  }
  setTimeout(() => { resendBusy = false; $("vResend").disabled = false; }, 60000);
}

/* ---------- LANGUAGE AND HIDE-PHONE (used by Settings and Profile) ---------- */
async function changeLang(l) {
  lang = l;
  try {
    await updateDoc(uref(), { lang: l });
    profile.lang = l;
  } catch (e) {}
  applyLang();
}

/* Update the phone shown on all my rooms (hidden means empty). Returns false if the rules refuse. */
async function syncRoomsPhone(hide) {
  try {
    const h = (hide === undefined) ? !!profile.hidePhone : hide;
    const snap = await getDocs(query(collection(db, "rooms"), where("uid", "==", auth.currentUser.uid)));
    if (snap.empty) return true;
    const b = writeBatch(db);
    snap.docs.forEach((d) => {
      b.update(d.ref, { phone: h ? "" : String(profile.phone || ""), cc: profile.phoneCc || d.data().cc || "91" });
    });
    await b.commit();
    return true;
  } catch (e) {
    return false;
  }
}

async function applyHide(hide) {
  const ok = await syncRoomsPhone(hide);
  if (!ok) throw new Error("rooms");
  await updateDoc(uref(), { hidePhone: hide });
  profile.hidePhone = hide;
}

/* ---------- SETTINGS + ADMIN CONNECTION ---------- */
const settings = initSettings({
  $: $,
  getProfile: () => profile,
  getLang: () => lang,
  T: () => T[lang],
  applyTheme: applyTheme,
  applyHide: applyHide,
  doLogout: doLogout
});

const admin = initAdmin({
  $: $,
  esc: esc,
  isAdmin: () => isAdmin,
  getRooms: () => roomsData,
  getUid: () => auth.currentUser.uid,
  getProfile: () => profile,
  getVerified: () => verifiedSet,
  logout: doLogout,
  country: roomCountry,
  fmt: (r) => money(r.price, CUR[roomCountry(r)]),
  fmtDep: (r) => (r.deposit === undefined || r.deposit === null)
    ? "not given" : (Number(r.deposit) > 0 ? money(r.deposit, CUR[roomCountry(r)]) : "No deposit")
});

/* ---------- ROUTER ---------- */
function route() {
  if (!auth.currentUser || !profile) { stopRooms(); show("welcomeScreen"); return; }
  if (!profile.lang) { show("langScreen"); return; }
  lang = profile.lang;
  if (profile.lastSeen === undefined) {
    profile.lastSeen = Date.now();
    updateDoc(uref(), { lastSeen: profile.lastSeen }).catch(function () {});
  }
  applyLang();
  $("mAdmin").style.display = isAdmin ? "block" : "none";
  if (!profile.accepted) {
    $("agreeBox").checked = false;
    $("agreeBtn").disabled = true;
    show("privacyScreen");
    return;
  }
  if (!$("phone").value) $("phone").value = profile.phone || "";
  settings.sync();
  showView("home");
  show("appScreen");
  startRooms();
  startHeartbeat();
}

onAuthStateChanged(auth, async (user) => {
  if (signingUp) return;
  if (!user) {
    stopHeartbeat();
    stopRooms();
    profile = null;
    myPub = null;
    isAdmin = false;
    show("welcomeScreen");
    return;
  }
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      profile = snap.data();
    } else {
      profile = {
        name: user.displayName || user.email, phone: "", phoneCc: "91", phoneVerified: false,
        country: "", showCountry: false,
        email: user.email || "", emailVerified: !!user.emailVerified,
        lang: "", accepted: false, hidePhone: false, favs: [], lastSeen: Date.now(),
        createdAt: serverTimestamp(), lastActive: serverTimestamp()
      };
      await setDoc(ref, profile);
    }
    await prepareSession();
    route();
  } catch (e) {
    show("authScreen");
    $("aMsg").textContent = "Could not load your account. Check internet and Firebase rules.";
  }
});

document.addEventListener("visibilitychange", beat);

/* ---------- LANGUAGE + POLICY ---------- */
async function chooseLang(l) {
  try {
    await updateDoc(uref(), { lang: l });
    profile.lang = l;
    route();
  } catch (e) {
    alert(T.en.errGeneric);
  }
}

async function acceptPolicy() {
  try {
    await updateDoc(uref(), { accepted: true });
    profile.accepted = true;
    route();
  } catch (e) {
    alert(T[lang].errGeneric);
  }
}

function setupSupport(t) {
  let h = "";
  if (SUPPORT_WA) {
    h += '<a class="call wa" href="https://wa.me/' + esc(digits(SUPPORT_WA)) +
      '" target="_blank" rel="noopener">' +esc(t.supWa) + '</a>';
  }
  if (SUPPORT_EMAIL) {
    h += '<a class="call map" href="mailto:' + esc(SUPPORT_EMAIL) + '">' + esc(t.supMail) + '</a>';
  }
  $("supBox").innerHTML = h
    ? '<div style="padding:12px"><p class="hint" style="padding:0 0 4px 0">' + esc(t.supTitle) + '</p>' + h + '</div>'
    : '';
}

/* Price filter options are built per country, so rupees and NPR are never mixed. */
function buildPriceFilters() {
  const t = T[lang];
  const c = $("countryFilter").value;
  const b = $("budgetFilter");
  const d = $("depFilter");
  const bv = b.value;
  const dv = d.value;
  let bh = '<option value="">' + esc(t.anyBudget) + '</option>';
  let dh = '<option value="">' + esc(t.depAny) + '</option>';
  if (c) {
    BUDGETS[c].forEach((n) => {
      bh += '<option value="' + n + '">' + esc(t.upto.replace("{n}", money(n, CUR[c]))) + '</option>';
    });
    dh += '<option value="none">' + esc(t.depNone) + '</option>';
    DEPOSITS[c].forEach((n) => {
      dh += '<option value="' + n + '">' + esc(t.depUpto.replace("{n}", money(n, CUR[c]))) + '</option>';
    });
  }
  b.innerHTML = bh;
  d.innerHTML = dh;
  setSel("budgetFilter", bv);
  setSel("depFilter", dv);
  b.disabled = !c;
  d.disabled = !c;
  $("priceHint").textContent = c ? "" : t.priceHint;
  $("priceHint").style.display = c ? "none" : "block";
}

function setSel(id, v) {
  const s = $(id);
  s.value = v;
  if (s.selectedIndex < 0) s.selectedIndex = 0;
}

function updateCurrencyUI() {
  const t = T[lang];
  const c = $("country").value;
  const cur = c ? (CUR[c] + (c === "IN" ? " ₹" : "")) : t.chooseCountryFirst;
  $("price").placeholder = t.rentPh2.replace("{cur}", cur);
  $("deposit").placeholder = t.depositPh2.replace("{cur}", cur);
}

function updateNudge() {
  const t = T[lang];
  $("nudgeText").textContent = t.nudgeText;
  $("phoneNudge").style.display = (auth.currentUser && !phoneVerifiedNow()) ? "block" : "none";
}

function applyLang() {
  const t = T[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t[el.getAttribute("data-i18n")]; });
  document.querySelectorAll("[data-ph]").forEach((el) => { el.placeholder = t[el.getAttribute("data-ph")]; });
  $("policyText").innerHTML = t.privText;
  $("policyText2").innerHTML = t.privText;
  $("lang").value = lang;
  $("pfLang").value = lang;
  $("hello").textContent = profile ? (t.hello + profile.name) : "";
  $("pageTitle").textContent = t[TITLE_KEY[currentView]];
  $("myUidText").textContent = auth.currentUser ? (t.myId + ": " + auth.currentUser.uid) : "";
  $("locInfo").textContent = pendingLoc ? t.locGot : "";
  buildPriceFilters();
  updateCurrencyUI();
  updateNudge();
  setupSupport(t);
  updateNoticeBadge();
  if (currentView === "profile") renderProfileDyn();
  render();
}

/* ---------- ROOM STATE HELPERS ---------- */
function createdMs(r) {
  return (r.createdAt && r.createdAt.toMillis) ? r.createdAt.toMillis() : Date.now();
}
function lastUpdate(r) {
  const ts = r.updatedAt || r.createdAt;
  return (ts && ts.toMillis) ? ts.toMillis() : Date.now();
}
function daysLeft(r) {
  return Math.ceil((lastUpdate(r) + LIFE_DAYS * DAY - Date.now()) / DAY);
}
function apOf(r) { return r.approval || "none"; }
function isExpired(r) { return daysLeft(r) <= 0; }
function isReported(r) { return (r.reportCount || 0) >= REPORT_LIMIT; }
function isRented(r) { return r.status === "rented"; }
function isLive(r) {
  return apOf(r) === "approved" && !isRented(r) && !isExpired(r) && !isReported(r) && !r.hidden;
}
function hasLoc(r) { return typeof r.lat === "number" && typeof r.lng === "number"; }

/* ---------- LOCATION ---------- */
function getPos() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("no geo")); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error("denied")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

function distKm(a, b) {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function round5(x) { return Math.round(x * 100000) / 100000; }

async function useMyLocation() {
  $("locBtn").disabled = true;
  try {
    const p = await getPos();
    pendingLoc = { lat: round5(p.lat), lng: round5(p.lng) };
    $("locInfo").textContent = T[lang].locGot + " (" + pendingLoc.lat.toFixed(4) + ", " + pendingLoc.lng.toFixed(4) + ")";
    $("locClear").style.display = "block";
  } catch (e) {
    alert(T[lang].locFail);
  }
  $("locBtn").disabled = false;
}

function clearLocation() {
  pendingLoc = null;
  $("locInfo").textContent = "";
  $("locClear").style.display = "none";
}

/* ---------- PHOTOS ---------- */
function compress(file, max, q) {
  const mx = max || 600;
  const qu = q || 0.6;
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("read"));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("img"));
      img.onload = () => {
        const s = Math.min(1, mx / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * s));
        const h = Math.max(1, Math.round(img.height * s));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", qu));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

function showPreviews() {
  let h = "";
  pendingPhotos.forEach((p) => { if (PHOTO_OK.test(p)) h += '<img class="ph" src="' + p + '" alt="">'; });
  $("photoPrev").innerHTML = h;
}

async function onPhotos() {
  const files = Array.prototype.slice.call($("photos").files || [], 0, MAX_PHOTOS);
  pendingPhotos = [];
  try {
    for (const f of files) { pendingPhotos.push(await compress(f)); }
  } catch (e) {
    pendingPhotos = [];
    $("photos").value = "";
    alert(T[lang].photoErr);
  }
  showPreviews();
}

function photosHtml(r) {
  const ph = Array.isArray(r.photos) ? r.photos : [];
  let h = "";
  ph.forEach((p, i) => {
    if (typeof p === "string" && PHOTO_OK.test(p)) {
      h += '<img class="ph" src="' + p + '" data-big="' + esc(r.id) + '|' + i + '" alt="">';
    }
  });
  return h ? '<div class="phs">' + h + '</div>' : '';
}

function openBig(val) {
  const parts = String(val).split("|");
  const r = roomsData.find((x) => x.id === parts[0]);
  const p = r && Array.isArray(r.photos) ? r.photos[Number(parts[1])] : null;
  if (typeof p === "string" && PHOTO_OK.test(p)) {
    $("bigImg").src = p;
    $("bigModal").classList.add("open");
  }
}

function closeBig() {
  $("bigModal").classList.remove("open");
  $("bigImg").removeAttribute("src");
}
/* ---------- FILTERS, SORT, SAVED SEARCH ---------- */
function readFilters() {
  return {
    q: $("search").value.trim().toLowerCase(),
    type: $("typeFilter").value,
    loc: $("locFilter").value,
    country: $("countryFilter").value,
    budget: $("budgetFilter").value,
    dep: $("depFilter").value,
    ex: $("exFilter").value,
    own: $("ownFilter").value,
    sort: $("sortBy").value
  };
}

/* Old saved searches had no country and used rupees, so they mean India. */
function normSaved(f) {
  const g = Object.assign({}, EMPTY_F, f || {});
  if (!g.country && (g.budget || g.dep)) g.country = "IN";
  return g;
}

function matches(r, f) {
  if (f.q) {
    const text = ((r.title || "") + " " + (r.area || "")).toLowerCase();
    if (text.indexOf(f.q) === -1) return false;
  }
  if (f.type && r.type !== f.type) return false;
  if (f.loc && r.loc !== f.loc) return false;
  if (f.country && roomCountry(r) !== f.country) return false;
  if (f.budget && Number(r.price) > Number(f.budget)) return false;
  if (f.dep === "none") {
    if (r.deposit !== 0) return false;
  } else if (f.dep) {
    if (r.deposit === undefined || r.deposit === null || Number(r.deposit) > Number(f.dep)) return false;
  }
  if (f.ex === "incl" && r.extras !== "exIncl") return false;
  if (f.own === "owner" && r.ownerType !== "owner") return false;
  return true;
}

function sortRooms(arr, s) {
  const a = arr.slice();
  const group = (r) => (roomCountry(r) === "IN" ? 0 : 1);
  if (s === "low") {
    a.sort((x, y) => (group(x) - group(y)) || (Number(x.price) - Number(y.price)));
  } else if (s === "high") {
    a.sort((x, y) => (group(x) - group(y)) || (Number(y.price) - Number(x.price)));
  } else if (s === "near" && myPos) {
    const d = (r) => (hasLoc(r) ? distKm(myPos, r) : 1e9);
    a.sort((x, y) => d(x) - d(y));
  } else {
    a.sort((x, y) => createdMs(y) - createdMs(x));
  }
  return a;
}

function describe(f, t) {
  const p = [];
  const cur = CUR[f.country || "IN"];
  if (f.q) p.push('"' + f.q + '"');
  if (f.type) p.push(t[f.type]);
  if (f.loc) p.push(t[f.loc]);
  if (f.country) p.push(t["ct" + f.country]);
  if (f.budget) p.push(t.upto.replace("{n}", money(f.budget, cur)));
  if (f.dep === "none") p.push(t.depNone);
  else if (f.dep) p.push(t.depUpto.replace("{n}", money(f.dep, cur)));
  if (f.ex === "incl") p.push(t.exInclOnly);
  if (f.own === "owner") p.push(t.ownOnly);
  p.push(t[f.sort === "low" ? "sLow" : f.sort === "high" ? "sHigh" : f.sort === "near" ? "sNear" : "sNew"]);
  return p.join(" · ");
}

function applySaved() {
  if (!(profile && profile.savedSearch)) return;
  const f = normSaved(profile.savedSearch);
  $("search").value = f.q || "";
  setSel("typeFilter", f.type || "");
  setSel("locFilter", f.loc || "");
  setSel("countryFilter", f.country || "");
  buildPriceFilters();
  setSel("budgetFilter", f.budget || "");
  setSel("depFilter", f.dep || "");
  setSel("exFilter", f.ex || "");
  setSel("ownFilter", f.own || "");
  setSel("sortBy", f.sort || "new");
  if (f.sort === "near" && !myPos) {
    getPos().then((p) => { myPos = p; render(); }).catch(function () {});
  }
  render();
}

async function saveSearch() {
  const f = readFilters();
  try {
    await updateDoc(uref(), { savedSearch: f });
    profile.savedSearch = f;
    render();
    alert(T[lang].ssDone);
  } catch (e) {
    alert(T[lang].errGeneric);
  }
}

async function clearSearch() {
  try {
    await updateDoc(uref(), { savedSearch: null });
    profile.savedSearch = null;
    render();
  } catch (e) {
    alert(T[lang].errGeneric);
  }
}

async function onSortChange() {
  if ($("sortBy").value === "near" && !myPos) {
    try {
      myPos = await getPos();
    } catch (e) {
      alert(T[lang].locFail);
      $("sortBy").value = "new";
    }
  }
  render();
}

/* ---------- FAVOURITES ---------- */
async function toggleFav(id) {
  if (!profile) return;
  const old = profile.favs || [];
  const favs = old.slice();
  const i = favs.indexOf(id);
  if (i === -1) favs.push(id); else favs.splice(i, 1);
  profile.favs = favs;
  render();
  try {
    await updateDoc(uref(), { favs: favs });
  } catch (e) {
    profile.favs = old;
    render();
    alert(T[lang].errGeneric);
  }
}

/* ---------- NOTIFICATIONS (messages from admin about your rooms) ---------- */
const nms = (n) => (n.createdAt && n.createdAt.toMillis) ? n.createdAt.toMillis() : 0;

function updateNoticeBadge() {
  const n = notices.filter((x) => !x.read).length;
  $("mNotices").textContent = T[lang].navNotices + (n ? " (" + n + ")" : "");
}

function renderNotices() {
  const t = T[lang];
  const list = notices.slice().sort((a, b) => nms(b) - nms(a));
  let h = "";
  list.forEach((n) => {
    const base = (t["n_" + n.kind] || "").replace("{title}", n.roomTitle || "");
    h += '<div class="card" style="margin:12px 0"><p>' + esc(base) + '</p>' +
      (n.reason ? '<p>' + esc(t.reasonLabel) + ': ' + esc(n.reason) + '</p>' : '') +
      '<p class="mini">' + esc(n.createdAt && n.createdAt.toDate ? n.createdAt.toDate().toLocaleString() : "") + '</p></div>';
  });
  $("noticeList").innerHTML = h || '<div class="empty">' + esc(t.noNotices) + '</div>';
}

async function markNoticesRead() {
  const un = notices.filter((n) => !n.read);
  if (!un.length) return;
  try {
    const b = writeBatch(db);
    un.forEach((n) => b.update(doc(db, "notices", n.id), { read: true }));
    await b.commit();
  } catch (e) {}
}

/* ---------- ROOMS ---------- */
function schedRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 150);
}

/* Fetch the public profile of the owners shown on screen (only new ones, at most 30 at a time). */
function prefetchOwners(list) {
  const need = [];
  list.forEach((r) => {
    if (r.uid && !(r.uid in pubCache) && !pubReq.has(r.uid) && need.indexOf(r.uid) === -1) need.push(r.uid);
  });
  need.slice(0, 30).forEach((uid) => {
    pubReq.add(uid);
    getDoc(doc(db, "publicProfiles", uid))
      .then((s) => { pubCache[uid] = s.exists() ? s.data() : null; schedRender(); })
      .catch(() => { pubCache[uid] = null; });
  });
}

function startRooms() {
  if (unsubRooms || !auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const toList = (snap) => new Map(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
  const apply = () => {
    const m = new Map(pubMap);
    mineMap.forEach((v, k) => m.set(k, v));
    roomsData = Array.from(m.values());
    render();
  };
  const onErr = () => {
    const msg = '<div class="empty">Could not load rooms. Check internet and Firebase rules.</div>';
    $("list").innerHTML = msg;
    $("favList").innerHTML = msg;
    $("myList").innerHTML = msg;
  };

  if (isAdmin) {
    unsubRooms = onSnapshot(query(collection(db, "rooms"), limit(300)), (snap) => {
      pubMap = toList(snap);
      mineMap = new Map();
      apply();
    }, onErr);
  } else {
    const u1 = onSnapshot(query(collection(db, "rooms"), where("approval", "==", "approved"), limit(150)), (snap) => {
      pubMap = toList(snap);
      apply();
    }, onErr);
    const u2 = onSnapshot(query(collection(db, "rooms"), where("uid", "==", uid)), (snap) => {
      mineMap = toList(snap);
      apply();
    }, onErr);
    unsubRooms = () => { u1(); u2(); };
  }

  unsubVer = onSnapshot(collection(db, "verified"), (snap) => {
    verifiedSet = new Set(snap.docs.map((d) => d.id));
    render();
  }, function () {});

  unsubNotices = onSnapshot(query(collection(db, "notices"), where("toUid", "==", uid), limit(50)), (snap) => {
    notices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    updateNoticeBadge();
    if (currentView === "notices") renderNotices();
  }, function () {});
}

function stopRooms() {
  if (unsubRooms) { unsubRooms(); unsubRooms = null; }
  if (unsubVer) { unsubVer(); unsubVer = null; }
  if (unsubNotices) { unsubNotices(); unsubNotices = null; }
  verifiedSet = new Set();
  pubMap = new Map();
  mineMap = new Map();
  notices = [];
  roomsData = [];
}

function checksHtml(r, t) {
  const photo = Array.isArray(r.photos) && r.photos.length >= 1;
  const emailOk = !!(auth.currentUser && auth.currentUser.emailVerified);
  const nameOk = !!(profile && String(profile.name || "").trim().length >= 2);
  const phoneOk = phoneVerifiedNow();
  const line = (ok, txt) => '<p class="hint" style="padding:2px 0">' + (ok ? "✔ " : "✘ ") + esc(txt) + '</p>';
  return '<p class="hint" style="padding:6px 0 0"><b>' + esc(t.chkTitle) + '</b></p>' +
    line(photo, t.chkPhoto) + line(emailOk, t.chkEmail) + line(nameOk, t.chkName) +
    line(phoneOk, phoneOk ? t.chkPhoneOk : t.chkPhone) +
    (photo ? '' : '<p class="hint" style="padding:2px 0">' + esc(t.noPhotoWarn) + '</p>');
}

function approvalBlock(r, t) {
  const a = apOf(r);
  const label = a === "pending" ? t.stPending : a === "needs_review" ? t.stNeedsReview : t.stRejected;
  const cls = a === "rejected" ? "tag bad" : a === "needs_review" ? "tag new" : "tag";
  let h = '<span class="' + cls + '">' + esc(label) + '</span>';
  if (a === "pending") h += '<p class="hint" style="padding:6px 0">' + esc(t.pendingMsg) + '</p>';
  if (r.approvalReason && (a === "needs_review" || a === "rejected")) {
    h += '<p>' + esc(t.reasonLabel) + ': ' + esc(r.approvalReason) + '</p>';
  }
  if (a === "pending" || a === "needs_review") h += checksHtml(r, t);
  return h;
}

function cardTop(r, t) {
  const c = roomCountry(r);
  const cur = CUR[c];
  const exTag = (r.extras && t[r.extras]) ? '<span class="tag">' + esc(t[r.extras]) + '</span>' : '';
  const verTag = verifiedSet.has(r.uid) ? '<span class="tag ok">' + esc(t.verified) + '</span>' : '';
  const apTag = (apOf(r) === "approved" && r.approvalBy && r.approvalBy !== "legacy")
    ? '<span class="tag ok">✔ ' + esc(t.stApproved) + '</span>' : '';
  const phTag = (r.approvalBy === "auto") ? '<span class="tag ok">📞 ' + esc(t.phoneVerifiedTag) + '</span>' : '';
  const ownTag = r.ownerType === "owner" ? '<span class="tag">' + esc(t.tagOwner) + '</span>'
    : r.ownerType === "broker" ? '<span class="tag bad">' + esc(t.tagBroker) + '</span>' : '';
  const ctTag = '<span class="tag">' + esc(t["tag" + c]) + '</span>';
  const distTag = (myPos && hasLoc(r))
    ? '<span class="tag">' + esc(t.kmAway.replace("{n}", distKm(myPos, r).toFixed(1))) + '</span>' : '';
  const dep = (r.deposit === undefined || r.deposit === null) ? '' :
    '<p>' + esc(t.depositLabel) + ': ' +
    (Number(r.deposit) > 0 ? esc(money(r.deposit, cur)) : esc(t.noDeposit)) + '</p>';
  const desc = r.description ? '<p>' + esc(r.description) + '</p>' : '';
  return '<h3>' + esc(r.title || "") + '</h3>' +
    '<span class="tag">' + esc(t[r.type] || "") + '</span>' +
    '<span class="tag">' + esc(t[r.loc] || "") + '</span>' + ctTag + exTag + ownTag + apTag + phTag + verTag + distTag +
    '<p>' + esc(t.areaLabel) + ': ' + esc(r.area || "") + '</p>' +
    '<p class="price">' + esc(money(r.price, cur)) + ' ' + esc(t.perMonth) + '</p>' + dep + desc +
    photosHtml(r);
}

function contactBtns(r, t) {
  const num = digits(r.phone);
  const cc = digits(r.cc) || "91";
  let h = "";
  if (!num) {
    h += '<div class="phoneoff">' + esc(t.phoneHidden) + '</div>';
  } else {
    h += '<a class="call" href="tel:' + esc(num) + '">' + esc(t.call) + '</a>' +
      '<a class="call wa" href="https://wa.me/' + esc(cc + num) + '" target="_blank" rel="noopener">WhatsApp</a>';
  }
  if (hasLoc(r)) {
    h += '<a class="call map" href="https://www.google.com/maps?q=' + r.lat + ',' + r.lng +
      '" target="_blank" rel="noopener">' + esc(t.openMap) + '</a>';
  }
  return h;
}

function ownerBtn(r, t) {
  const p = pubCache[r.uid];
  const nm = p && p.name ? p.name : "";
  return '<button class="rep" data-owner="' + esc(r.uid) + '">👤 ' +
    esc(nm ? t.ownerBy.replace("{name}", nm) : t.ownerProfile) + '</button>';
}

function heartBtn(id, isFav) {
  return '<button class="heart" data-fav="' + esc(id) + '">' + (isFav ? "❤️" : "🤍") + '</button>';
}

function render() {
  const t = T[lang];
  const myUid = auth.currentUser ? auth.currentUser.uid : "";
  const favs = (profile && profile.favs) || [];
  const saved = profile && profile.savedSearch;

  if (isAdmin) {
    const pc = roomsData.filter((r) => { const a = apOf(r); return a === "pending" || a === "needs_review"; }).length;
    $("mAdmin").textContent = t.navAdmin + (pc ? " (" + pc + ")" : "");
  }

  $("ssText").textContent = saved ? describe(normSaved(saved), t) : t.ssNone;
  $("ssApply").style.display = saved ? "block" : "none";
  $("ssClear").style.display = saved ? "block" : "none";

  const base = Object.assign({}, normSaved(saved || {}), { q: "" });
  const since = (profile && profile.lastSeen) || Date.now();
  const n = roomsData.filter((r) => r.uid !== myUid && isLive(r) && createdMs(r) > since && matches(r, base)).length;
  $("newBadge").textContent = n ? t[saved ? "newMatch" : "newBadge"].replace("{n}", String(n)) : "";
  $("newBadge").style.display = n ? "inline-block" : "none";

  const f = readFilters();
  const found = sortRooms(roomsData.filter((r) => isLive(r) && matches(r, f)), f.sort);
  let html = "";
  found.forEach((r) => {
    const mine = r.uid === myUid;
    html += '<div class="card">' + (mine ? '' : heartBtn(r.id, favs.indexOf(r.id) !== -1)) + cardTop(r, t);
    if (!mine && createdMs(r) > seenBefore) html += '<span class="tag new">' + esc(t.newTag) + '</span>';
    if (mine) {
      html += '<span class="tag">' + esc(t.yours) + '</span>';
    } else {
      html += contactBtns(r, t) + ownerBtn(r, t) +
        '<button class="rep" data-rep="' + esc(r.id) + '">' + esc(t.reportRoom) + '</button>';
    }
    html += '</div>';
  });
  if (!found.length) html = '<div class="empty">' + esc(t.none) + '</div>';
  $("list").innerHTML = html;

  let fhtml = "";
  const favRooms = [];
  favs.forEach((id) => {
    const r = roomsData.find((x) => x.id === id);
    if (!r) {
      fhtml += '<div class="card">' + heartBtn(id, true) +
        '<p class="phoneoff">' + esc(t.noLonger) + '</p></div>';
      return;
    }
    favRooms.push(r);
    fhtml += '<div class="card">' + heartBtn(id, true) + cardTop(r, t);
    if (isLive(r)) {
      fhtml += (r.uid === myUid) ? '<span class="tag">' + esc(t.yours) + '</span>' : contactBtns(r, t) + ownerBtn(r, t);
    } else {
      fhtml += '<span class="tag bad">' + esc(t.noLonger) + '</span>';
    }
    fhtml += '</div>';
  });
  if (!favs.length) fhtml = '<div class="empty">' + esc(t.noFavs) + '</div>';
  $("favList").innerHTML = fhtml;

  let mhtml = "";
  let mcount = 0;
  roomsData.forEach((r) => {
    if (r.uid !== myUid) return;
    mcount++;
    const id = esc(r.id);
    const ap = apOf(r);
    if (ap === "pending" || ap === "needs_review" || ap === "rejected") {
      mhtml += '<div class="card">' + cardTop(r, t) + '<div>' + approvalBlock(r, t) + '</div>' +
        '<button class="del" data-del="' + id + '">' + esc(t.del) + '</button></div>';
      return;
    }
    let badge = "";
    let btns = "";
    if (r.hidden) {
      badge = '<span class="tag bad">' + esc(t.stAdminHidden) + '</span>';
    } else if (isReported(r)) {
      badge = '<span class="tag bad">' + esc(t.stHidden) + '</span>';
    } else if (isRented(r)) {
      badge = '<span class="tag bad">' + esc(t.stRented) + '</span>';
      btns += '<button class="act" data-avail="' + id + '">' + esc(t.btnAvail) + '</button>';
    } else if (isExpired(r)) {
      badge = '<span class="tag bad">' + esc(t.stExpired) + '</span>';
      btns += '<button class="act" data-renew="' + id + '">' + esc(t.btnRenew) + '</button>';
    } else {
      badge = '<span class="tag ok">' + esc(t.stAvail) + '</span>' +
        '<span class="tag">' + esc(t.daysLeft.replace("{n}", String(daysLeft(r)))) + '</span>';
      btns += '<button class="act" data-rent="' + id + '">' + esc(t.btnRented) + '</button>' +
        '<button class="act gray" data-renew="' + id + '">' + esc(t.btnRenew) + '</button>';
    }
    mhtml += '<div class="card">' + cardTop(r, t) + '<div>' + badge + '</div>' + btns +
      '<button class="del" data-del="' + id + '">' + esc(t.del) + '</button></div>';
  });
  if (mcount === 0) mhtml = '<div class="empty">' + esc(t.noMine) + '</div>';
  $("myList").innerHTML = mhtml;

  if (isAdmin && currentView === "admin") admin.onRooms();
  if (currentView === "owner" && ownerUid) renderOwner(ownerUid);
  if (currentView === "profile") renderProfileDyn();
  prefetchOwners(found.concat(favRooms));
}

async function addRoom() {
  const t = T[lang];
  const title = $("title").value.trim();
  const area = $("area").value.trim();
  const loc = $("loc").value;
  const country = $("country").value;
  const price = Number($("price").value);
  const deposit = $("deposit").value.trim() === "" ? 0 : Number($("deposit").value);
  const extras = $("extras").value;
  const ownerType = $("ownerType").value;
  const desc = $("desc").value.trim().slice(0, 500);
  const type = $("type").value;
  const cc = $("cc").value;
  const phone = $("phone").value.trim();
  const hide = !!(profile && profile.hidePhone);

  if (!title || !area || !country || !$("price").value.trim() || !extras || !ownerType || (!hide && !phone)) { alert(t.fillAll); return; }
  if (!(price > 0)) { alert(t.badPrice); return; }
  if (!(deposit >= 0)) { alert(t.badDeposit); return; }
  if (!hide && !/^[0-9]{10}$/.test(phone)) { alert(t.badPhone); return; }

  $("addBtn").disabled = true;
  try {
    /* Every room starts as pending. It is approved automatically only if the login carries a phone
       number verified by SMS code, that number is the one on the room (or the owner hides the number),
       and a photo and a name exist. The database rules check all of this again. */
    let approval = "pending";
    let approvalBy = "system";
    let mismatch = false;
    try {
      const tk = await auth.currentUser.getIdTokenResult(true);
      const tp = tk.claims.phone_number;
      if (tp && pendingPhotos.length >= 1 && String(profile.name || "").trim().length >= 2) {
        if (hide || tp === "+" + cc + phone) { approval = "approved"; approvalBy = "auto"; }
        else mismatch = true;
      }
    } catch (e) {}

    if (!myPub) { try { await writePublic({}); } catch (e) {} }

    const data = {
      title: title, area: area, loc: loc, country: country, currency: CUR[country],
      price: price, deposit: deposit, extras: extras,
      ownerType: ownerType, type: type, cc: cc, phone: hide ? "" : phone,
      status: "available", reportCount: 0,
      approval: approval, approvalBy: approvalBy,
      uid: auth.currentUser.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    };
    if (approval === "approved") data.approvalAt = serverTimestamp();
    if (desc) data.description = desc;
    if (pendingPhotos.length) data.photos = pendingPhotos.slice(0, MAX_PHOTOS);
    if (pendingLoc) { data.lat = pendingLoc.lat; data.lng = pendingLoc.lng; }

    const myUid = auth.currentUser.uid;
    const snap = await getDocs(query(collection(db, "rooms"), where("uid", "==", myUid)));
    const used = new Set(snap.docs.map((d) => d.id));
    let slot = 0;
    for (let i = 1; i <= MAX_ROOMS; i++) {
      if (!used.has(myUid + "_" + i)) { slot = i; break; }
    }
    if (snap.size >= MAX_ROOMS || !slot) {
      alert(t.limit5);
    } else {
      const rid = myUid + "_" + slot;
      await setDoc(doc(db, "rooms", rid), data);
      logEvent("room_added", rid);
      $("title").value = "";
      $("area").value = "";
      $("price").value = "";
      $("deposit").value = "";
      $("extras").value = "";
      $("ownerType").value = "";
      $("desc").value = "";
      $("photos").value = "";
      pendingPhotos = [];
      showPreviews();
      clearLocation();
      alert(approval === "approved" ? t.addedApproved : (t.addedPending + (mismatch ? "\n\n" + t.phoneMismatch : "")));
    }
  } catch (e) {
    alert(t.errGeneric + " (" + (e.code || e.message) + ")");
  }
  $("addBtn").disabled = false;
}

async function deleteRoom(id) {
  if (!confirm(T[lang].confirmDel)) return;
  try {
    await deleteDoc(doc(db, "rooms", id));
  } catch (e) {
    alert(T[lang].errGeneric);
  }
}

async function setStatus(id, status) {
  try {
    await updateDoc(doc(db, "rooms", id), { status: status, updatedAt: serverTimestamp() });
  } catch (e) {
    alert(T[lang].errGeneric);
  }
}

async function renewRoom(id) {
  try {
    await updateDoc(doc(db, "rooms", id), { updatedAt: serverTimestamp() });
    alert(T[lang].saved);
  } catch (e) {
    alert(T[lang].errGeneric);
  }
}
/* ---------- MY PROFILE (private page) ---------- */
function updatePhoneUI() {
  const t = T[lang];
  const u = auth.currentUser;
  if (!u) return;
  const num = digits($("pfPhone").value);
  const typed = "+" + $("pfCc").value + num;
  const ok = !!u.phoneNumber && num.length === 10 && u.phoneNumber === typed;
  let badge = "";
  if (num.length === 10) {
    badge = ok ? '<span class="tag ok">' + esc(t.pfPhoneOk) + '</span>' : '<span class="tag bad">' + esc(t.pfPhoneNo) + '</span>';
  }
  $("pfPhoneBadge").innerHTML = badge;
  $("pvSend").style.display = (num.length === 10 && !ok) ? "block" : "none";
}

function renderProfileDyn() {
  if (!profile || !auth.currentUser) return;
  const t = T[lang];
  const u = auth.currentUser;
  const ev = !!u.emailVerified;
  $("pfEmail").textContent = u.email || "";
  $("pfEmailBadge").innerHTML = ev ? '<span class="tag ok">' + esc(t.pfEmailOk) + '</span>'
    : '<span class="tag bad">' + esc(t.pfEmailNo) + '</span>';
  $("pfVerifyEmail").style.display = ev ? "none" : "block";
  const since = (profile.createdAt && profile.createdAt.toDate) ? profile.createdAt.toDate().toLocaleDateString() : "-";
  const rooms = roomsData.filter((r) => r.uid === u.uid).length;
  $("pfMeta").textContent = t.pfMeta.replace("{since}", since).replace("{rooms}", String(rooms))
    .replace("{favs}", String((profile.favs || []).length));
  $("pfInfo").textContent = t.pfInfo;
  updatePhoneUI();
}

function renderProfile() {
  if (!profile || !auth.currentUser) return;
  const pub = myPub || {};
  $("pfName").value = profile.name || "";
  $("pfBio").value = pub.bio || "";
  $("pfCountry").value = profile.country || "";
  $("pfShowCountry").checked = profile.showCountry === true;
  $("pfCc").value = profile.phoneCc || "91";
  $("pfPhone").value = profile.phone || "";
  $("pfLang").value = lang;
  pfPhoto = pub.photo || "";
  $("pfAvatar").innerHTML = avatarHtml(pfPhoto, profile.name);
  $("pfPhotoDel").style.display = pfPhoto ? "inline-block" : "none";
  $("pfPhoto").value = "";
  $("pvStep2").style.display = "none";
  $("pvCode").value = "";
  $("pvMsg").textContent = "";
  $("pvInfo").textContent = "";
  renderProfileDyn();
}

async function onPfPhoto() {
  const f = ($("pfPhoto").files || [])[0];
  if (!f) return;
  try {
    let q = 0.75;
    let data = await compress(f, 240, q);
    while (data.length > 55000 && q > 0.4) { q -= 0.1; data = await compress(f, 240, q); }
    if (data.length > 55000) throw new Error("big");
    pfPhoto = data;
    $("pfAvatar").innerHTML = avatarHtml(pfPhoto, $("pfName").value);
    $("pfPhotoDel").style.display = "inline-block";
  } catch (e) {
    $("pfPhoto").value = "";
    alert(T[lang].photoErr);
  }
}

function removePfPhoto() {
  pfPhoto = "";
  $("pfPhoto").value = "";
  $("pfAvatar").innerHTML = avatarHtml("", $("pfName").value);
  $("pfPhotoDel").style.display = "none";
}

async function saveProfile() {
  const t = T[lang];
  const name = $("pfName").value.trim();
  const bio = $("pfBio").value.trim().slice(0, 300);
  const country = $("pfCountry").value;
  const showCountry = $("pfShowCountry").checked;
  const cc = $("pfCc").value;
  const phone = digits($("pfPhone").value);
  if (name.length < 2) { alert(t.pfNameShort); return; }
  if (phone && !/^[0-9]{10}$/.test(phone)) { alert(t.badPhone); return; }

  $("pfSave").disabled = true;
  try {
    const u = auth.currentUser;
    const phoneChanged = phone !== String(profile.phone || "") || cc !== (profile.phoneCc || "91");
    const pv = !!u.phoneNumber && !!phone && u.phoneNumber === "+" + cc + phone;
    const upd = { name: name, country: country, showCountry: showCountry, phone: phone, phoneCc: cc, phoneVerified: pv };
    await updateDoc(uref(), upd);
    Object.assign(profile, upd);
    await writePublic({ name: name, bio: bio, photo: pfPhoto });
    $("hello").textContent = t.hello + profile.name;
    let roomsOk = true;
    if (phoneChanged && phone && !profile.hidePhone) roomsOk = await syncRoomsPhone();
    alert(roomsOk ? t.pfSaved : t.pfRoomsPhoneFail);
    renderProfileDyn();
  } catch (e) {
    alert(t.errGeneric + " (" + (e.code || e.message) + ")");
  }
  $("pfSave").disabled = false;
}

/* ---------- PHONE VERIFICATION BY SMS CODE (owners) ---------- */
function phoneError(code) {
  const t = T[lang];
  const map = {
    "auth/invalid-phone-number": t.pvErrInvalid,
    "auth/missing-phone-number": t.pvErrInvalid,
    "auth/too-many-requests": t.pvErrMany,
    "auth/quota-exceeded": t.pvErrQuota,
    "auth/operation-not-allowed": t.pvErrNA,
    "auth/billing-not-enabled": t.pvErrNA,
    "auth/invalid-verification-code": t.pvErrCode,
    "auth/code-expired": t.pvErrExpired,
    "auth/credential-already-in-use": t.pvErrUsed,
    "auth/account-exists-with-different-credential": t.pvErrUsed,
    "auth/requires-recent-login": t.pvErrRecent,
    "auth/captcha-check-failed": t.pvErrCaptcha,
    "auth/network-request-failed": t.pvErrNet
  };
  return map[code] || (t.errGeneric + " (" + code + ")");
}

function resetRecaptcha() {
  if (recaptcha) { try { recaptcha.clear(); } catch (e) {} recaptcha = null; }
  $("pvCaptcha").innerHTML = "";
}

async function sendOtp() {
  const t = T[lang];
  $("pvMsg").textContent = "";
  $("pvInfo").textContent = "";
  const cc = $("pfCc").value;
  const num = digits($("pfPhone").value);
  if (!/^[0-9]{10}$/.test(num)) { $("pvMsg").textContent = t.pvErrInvalid; return; }
  $("pvSend").disabled = true;
  try {
    if (!recaptcha) recaptcha = new RecaptchaVerifier(auth, "pvCaptcha", { size: "invisible" });
    const provider = new PhoneAuthProvider(auth);
    pvId = await provider.verifyPhoneNumber("+" + cc + num, recaptcha);
    $("pvStep2").style.display = "block";
    $("pvInfo").textContent = t.pvSent;
  } catch (e) {
    $("pvMsg").textContent = phoneError(e.code);
    resetRecaptcha();
  }
  $("pvSend").disabled = false;
}

async function confirmOtp() {
  const t = T[lang];
  $("pvMsg").textContent = "";
  const code = digits($("pvCode").value);
  if (code.length !== 6 || !pvId) { $("pvMsg").textContent = t.pvErrCode; return; }
  $("pvConfirm").disabled = true;
  try {
    const u = auth.currentUser;
    const cred = PhoneAuthProvider.credential(pvId, code);
    if (u.phoneNumber) await updatePhoneNumber(u, cred);
    else await linkWithCredential(u, cred);
    await u.getIdToken(true);
    const cc = $("pfCc").value;
    const num = digits($("pfPhone").value);
    const upd = { phone: num, phoneCc: cc, phoneVerified: true };
    await updateDoc(uref(), upd);
    Object.assign(profile, upd);
    try { await writePublic({}); } catch (e) {}
    if (!profile.hidePhone) await syncRoomsPhone();
    pvId = null;
    resetRecaptcha();
    $("pvStep2").style.display = "none";
    $("pvCode").value = "";
    $("pvInfo").textContent = t.pvDone;
    renderProfileDyn();
    updateNudge();
  } catch (e) {
    $("pvMsg").textContent = phoneError(e.code);
  }
  $("pvConfirm").disabled = false;
}

/* ---------- OWNER PROFILE (public page of another person) ---------- */
async function openOwner(uid) {
  if (currentView !== "owner") ownerBack = currentView;
  ownerUid = uid;
  showView("owner");
  renderOwner(uid);
  try {
    const s = await getDoc(doc(db, "publicProfiles", uid));
    pubCache[uid] = s.exists() ? s.data() : null;
  } catch (e) {}
  if (ownerUid === uid) renderOwner(uid);
}

function renderOwner(uid) {
  const t = T[lang];
  const myUid = auth.currentUser ? auth.currentUser.uid : "";
  const p = pubCache[uid];
  $("ovAvatar").innerHTML = avatarHtml(p && p.photo, p && p.name);
  $("ovName").textContent = (p && p.name) ? p.name : t.ownerProfile;
  let b = "";
  if (verifiedSet.has(uid)) b += '<span class="tag ok">' + esc(t.verified) + '</span>';
  if (p && p.emailVerified) b += '<span class="tag ok">' + esc(t.ovEmail) + '</span>';
  if (p && p.phoneVerified) b += '<span class="tag ok">' + esc(t.ovPhone) + '</span>';
  $("ovBadges").innerHTML = b;

  let body = "";
  if (p) {
    if (p.bio) body += '<div class="card" style="margin:12px 0"><p style="white-space:pre-wrap">' + esc(p.bio) + '</p></div>';
    if (p.country) body += '<p>' + esc(t.ovCountry.replace("{c}", p.country === "NP" ? t.pfNP : t.pfIN)) + '</p>';
    if (p.since && p.since.toDate) body += '<p class="hint" style="padding:0">' + esc(t.ovSince.replace("{d}", p.since.toDate().toLocaleDateString())) + '</p>';
  } else {
    body += '<p class="hint" style="padding:0">' + esc(t.ovNoProfile) + '</p>';
  }
  $("ovBody").innerHTML = body;

  const rooms = roomsData.filter((r) => r.uid === uid && isLive(r));
  let h = "";
  rooms.forEach((r) => {
    h += '<div class="card" style="margin:12px 0">' + cardTop(r, t) +
      (uid === myUid ? '<span class="tag">' + esc(t.yours) + '</span>' : contactBtns(r, t)) + '</div>';
  });
  $("ovRooms").innerHTML = h || '<div class="empty">' + esc(t.ovNone) + '</div>';
}

/* ---------- REPORT (needs a verified email) ---------- */
async function openReport(id) {
  const r = roomsData.find((x) => x.id === id);
  if (!r || !auth.currentUser) return;
  if (needVerify("report")) return;
  try {
    const s = await getDoc(doc(db, "reports", id + "_" + auth.currentUser.uid));
    if (s.exists()) { alert(T[lang].alreadyReported); return; }
  } catch (e) {
    alert(T[lang].errGeneric + " (" + (e.code || e.message) + ")");
    return;
  }
  reportingId = id;
  $("reportReason").value = "";
  $("reportDetails").value = "";
  $("reportModal").classList.add("open");
}

function closeReport() {
  reportingId = null;
  $("reportModal").classList.remove("open");
}

async function sendReport() {
  const t = T[lang];
  const id = reportingId;
  const r = roomsData.find((x) => x.id === id);
  if (!id || !r) { closeReport(); return; }
  const uid = auth.currentUser.uid;
  const reason = $("reportReason").value;
  const details = $("reportDetails").value.trim().slice(0, 1000);

  if (!reason) { alert(t.needReason); return; }
  if (reason === "other" && details.length < 5) { alert(t.needDetails); return; }

  $("reportSendBtn").disabled = true;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, "reports", id + "_" + uid), {
      type: "room", roomId: id, ownerId: r.uid, uid: uid,
      reason: reason, details: details, status: "new", createdAt: serverTimestamp()
    });
    batch.update(doc(db, "rooms", id), { reportCount: (r.reportCount || 0) + 1 });
    await batch.commit();
    logEvent("room_reported", id);
    alert(t.reportRoomDone);
    closeReport();
  } catch (e) {
    alert(t.errGeneric + " (" + (e.code || e.message) + ")");
  }
  $("reportSendBtn").disabled = false;
}

function listClick(e) {
  const g = (n) => e.target.getAttribute && e.target.getAttribute(n);
  if (g("data-del")) deleteRoom(g("data-del"));
  else if (g("data-rep")) openReport(g("data-rep"));
  else if (g("data-rent")) setStatus(g("data-rent"), "rented");
  else if (g("data-avail")) setStatus(g("data-avail"), "available");
  else if (g("data-renew")) renewRoom(g("data-renew"));
  else if (g("data-fav")) toggleFav(g("data-fav"));
  else if (g("data-owner")) openOwner(g("data-owner"));
  else if (g("data-big")) openBig(g("data-big"));
}

/* ---------- EVENTS ---------- */
$("wLogin").addEventListener("click", () => { setTab("login"); show("authScreen"); });
$("wSignup").addEventListener("click", () => { setTab("signup"); show("authScreen"); });
$("aBack").addEventListener("click", () => show("welcomeScreen"));
$("tabLogin").addEventListener("click", () => setTab("login"));
$("tabSignup").addEventListener("click", () => setTab("signup"));
$("aBtn").addEventListener("click", doAuth);
$("gBtn").addEventListener("click", doGoogle);

$("vCheck").addEventListener("click", checkVerified);
$("vResend").addEventListener("click", resendVerify);
$("vBack").addEventListener("click", () => { afterVerify = ""; show("appScreen"); });
$("vLogout").addEventListener("click", doLogout);

document.querySelectorAll("[data-l]").forEach((b) => {
  b.addEventListener("click", () => chooseLang(b.getAttribute("data-l")));
});
$("agreeBox").addEventListener("change", () => { $("agreeBtn").disabled = !$("agreeBox").checked; });
$("agreeBtn").addEventListener("click", acceptPolicy);
$("declineBtn").addEventListener("click", doLogout);

$("menuBtn").addEventListener("click", openMenu);
$("menuOverlay").addEventListener("click", closeMenu);
$("mHome").addEventListener("click", () => showView("home"));
$("mProfile").addEventListener("click", () => showView("profile"));
$("mFavs").addEventListener("click", () => showView("favs"));
$("mNotices").addEventListener("click", () => showView("notices"));
$("mSettings").addEventListener("click", () => { settings.sync(); showView("settings"); });
$("mAdmin").addEventListener("click", () => showView("admin"));
$("mLogout").addEventListener("click", doLogout);
$("rowProfile").addEventListener("click", () => showView("profile"));

$("goFind").addEventListener("click", () => showView("find"));
$("goMine").addEventListener("click", () => {
  if (needVerify("rent")) return;
  if (REQUIRE_PHONE_FOR_OWNERS && !phoneVerifiedNow()) { alert(T[lang].needPhone); showView("profile"); return; }
  showView("mine");
});
$("nudgeBtn").addEventListener("click", () => showView("profile"));
$("backFind").addEventListener("click", () => showView("home"));
$("backFavs").addEventListener("click", () => showView("home"));
$("backNotices").addEventListener("click", () => showView("home"));
$("backMine").addEventListener("click", () => showView("home"));
$("backHome").addEventListener("click", () => showView("home"));
$("backAdmin").addEventListener("click", () => showView("home"));
$("backProfile").addEventListener("click", () => showView("home"));
$("backOwner").addEventListener("click", () => { ownerUid = ""; showView(ownerBack || "home"); });

$("pfPhoto").addEventListener("change", onPfPhoto);
$("pfPhotoDel").addEventListener("click", removePfPhoto);
$("pfSave").addEventListener("click", saveProfile);
$("pfPublic").addEventListener("click", () => { if (auth.currentUser) openOwner(auth.currentUser.uid); });
$("pfVerifyEmail").addEventListener("click", () => { needVerify("report"); });
$("pfCc").addEventListener("change", updatePhoneUI);
$("pfPhone").addEventListener("input", updatePhoneUI);
$("pvSend").addEventListener("click", sendOtp);
$("pvConfirm").addEventListener("click", confirmOtp);
$("pfLang").addEventListener("change", function () { changeLang(this.value); });
$("lang").addEventListener("change", function () { changeLang(this.value); });

$("photos").addEventListener("change", onPhotos);
$("locBtn").addEventListener("click", useMyLocation);
$("locClear").addEventListener("click", clearLocation);
$("bigClose").addEventListener("click", closeBig);
$("bigModal").addEventListener("click", (e) => { if (e.target === $("bigModal")) closeBig(); });

$("country").addEventListener("change", () => {
  const c = $("country").value;
  if (c) $("cc").value = (c === "IN") ? "91" : "977";
  updateCurrencyUI();
});
$("countryFilter").addEventListener("change", () => {
  $("budgetFilter").value = "";
  $("depFilter").value = "";
  buildPriceFilters();
  render();
});

$("addBtn").addEventListener("click", addRoom);
$("reportSendBtn").addEventListener("click", sendReport);
$("reportCancel").addEventListener("click", closeReport);
$("ssSave").addEventListener("click", saveSearch);
$("ssApply").addEventListener("click", applySaved);
$("ssClear").addEventListener("click", clearSearch);
$("list").addEventListener("click", listClick);
$("favList").addEventListener("click", listClick);
$("myList").addEventListener("click", listClick);
$("ovRooms").addEventListener("click", listClick);
$("search").addEventListener("input", render);
["typeFilter", "locFilter", "budgetFilter", "depFilter", "exFilter", "ownFilter"].forEach((id) => {
  $(id).addEventListener("change", render);
});
$("sortBy").addEventListener("change", onSortChange);

setTab("login");