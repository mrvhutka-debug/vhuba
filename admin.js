import {
  auth, db, collection, getDocs, getDoc, doc, query, orderBy, limit, where, updateDoc, setDoc, deleteDoc,
  writeBatch, serverTimestamp, getCountFromServer, sendPasswordResetEmail
} from "./firebase.js";

const REASONS = {
  fake_room: "Fake room or property",
  wrong_info: "Incorrect information",
  fake_photos: "Fake photos",
  wrong_contact: "Incorrect contact details",
  suspicious: "Suspicious activity",
  other: "Other",
  fake: "Fake or scam (old report)",
  rented: "Already rented (old report)",
  price: "Wrong price or hidden charges (old report)"
};
const TYPE_L = { single: "Single room", shared: "Shared room", bhk: "1 BHK" };
const LOC_L = { highway: "Near highway", gali: "Inside lane" };
const AP_L = { pending: "Pending", approved: "Approved", needs_review: "Needs review", rejected: "Rejected", none: "No status (old room)" };
const AP_C = { pending: "", approved: "ok", needs_review: "new", rejected: "bad", none: "" };
const NOTICE_KIND = { approve: "approved", review: "needs_review", reject: "rejected", hide: "hidden", restore: "restored", remove: "removed" };
const ACT_L = { approve: "Approve", review: "Needs review", reject: "Reject", hide: "Hide", restore: "Restore", remove: "Remove" };
const TAB_IDS = ["overview", "reports", "rooms", "users", "approval", "security", "profile", "activity"];
const PHOTO_OK = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;
const LINE = "border-top:1px solid var(--border);margin-top:8px;padding-top:8px";

export function initAdmin(c) {
  const $ = c.$;
  const esc = c.esc;
  let uc = {};
  let rc = {};
  let current = "overview";
  let rpFilter = "new";
  let rFilter = "pending";
  let rQuery = "";
  let uQuery = "";
  let usersAll = [];
  try { current = localStorage.getItem("vhubaAdminTab") || "overview"; } catch (e) {}
  if (TAB_IDS.indexOf(current) === -1) current = "overview";

  const body = () => $("adminBody");
  const fts = (ts) => (ts && ts.toDate) ? ts.toDate().toLocaleString() : "";
  const ms = (ts) => (ts && ts.toMillis) ? ts.toMillis() : 0;
  const apOf = (r) => r.approval || "none";
  const stOf = (r) => r.status || "new";
  const tag = (txt, cls) => '<span class="tag ' + (cls || "") + '">' + esc(txt) + '</span>';
  const logDoc = (extra) => Object.assign({
    adminId: c.getUid(),
    adminEmail: (auth.currentUser && auth.currentUser.email) || "",
    createdAt: serverTimestamp()
  }, extra);

  async function getUser(uid) {
    if (!uid) return null;
    if (!(uid in uc)) {
      try {
        const s = await getDoc(doc(db, "users", uid));
        uc[uid] = s.exists() ? s.data() : null;
      } catch (e) { uc[uid] = null; }
    }
    return uc[uid];
  }

  async function getRoom(id) {
    if (!id) return null;
    if (!(id in rc)) {
      try {
        const s = await getDoc(doc(db, "rooms", id));
        rc[id] = s.exists() ? s.data() : null;
      } catch (e) { rc[id] = null; }
    }
    return rc[id];
  }

  function photosOf(r) {
    const ph = Array.isArray(r.photos) ? r.photos : [];
    let h = "";
    ph.forEach((p) => { if (typeof p === "string" && PHOTO_OK.test(p)) h += '<img class="ph" src="' + p + '" alt="">'; });
    return h ? '<div class="phs">' + h + '</div>' : '<p class="mini">No photos.</p>';
  }

  /* ---------- SHARED ROOM PIECES ---------- */
  function checksHtml(r, owner) {
    const photo = Array.isArray(r.photos) && r.photos.length > 0;
    const email = owner ? (owner.emailVerified === true) : null;
    const name = !!(owner && String(owner.name || "").trim().length >= 2);
    const mark = (ok, txt) => '<p class="mini">' + (ok === null ? "❔" : ok ? "✔" : "✘") + " " + esc(txt) + '</p>';
    return '<div style="' + LINE + '"><b>Checks</b>' +
      mark(photo, "Room photo uploaded (" + (Array.isArray(r.photos) ? r.photos.length : 0) + ")") +
      mark(email, "Owner email verified" + (email === null ? " (unknown)" : "")) +
      mark(name, "Owner name given") +
      '<p class="mini">⛔ Phone OTP: not available yet</p>' +
      '<p class="mini">Photos are not checked for authenticity. Please look at them yourself.</p></div>';
  }

  function roomButtons(r, repId) {
    const ap = apOf(r);
    const b = (cls, act, label) => '<button class="' + cls + '" data-a="raction" data-act="' + act +
      '" data-rid="' + esc(r.id) + '" data-id="' + esc(repId || "") + '">' + label + '</button>';
    let h = '<div style="' + LINE + '">';
    if (ap !== "approved") h += b("act", "approve", "Approve");
    if (ap !== "needs_review") h += b("act gray", "review", "Needs review");
    if (ap !== "rejected") h += b("act gray", "reject", "Reject room");
    h += r.hidden ? b("act", "restore", "Restore (unhide)") : b("act gray", "hide", "Hide room");
    h += b("del", "remove", "Remove room");
    return h + '</div>';
  }

  function roomCard(r, owner) {
    const ap = apOf(r);
    return '<div class="card" style="margin:12px 0"><h3 style="padding-right:0">' + esc(r.title || "") + '</h3>' +
      tag(AP_L[ap], AP_C[ap]) +
      (r.hidden ? tag("hidden by admin", "bad") : "") +
      (Number(r.reportCount || 0) >= 3 ? tag("auto-hidden (3+ reports)", "bad") : "") +
      (r.status === "rented" ? tag("rented") : "") +
      '<p>' + esc(c.fmt(r)) + ' / month · ' + esc(r.area || "") + ' · ' + esc(TYPE_L[r.type] || "") + '</p>' +
      '<p class="mini">Owner: ' + esc(owner ? (owner.name || "-") : "(profile not found)") +
      (owner && owner.email ? " · " + esc(owner.email) : "") + '</p>' +
      (r.approvalReason ? '<p class="mini">Last decision reason: ' + esc(r.approvalReason) + '</p>' : '') +
      (r.hiddenReason ? '<p class="mini">Hide reason: ' + esc(r.hiddenReason) + '</p>' : '') +
      (r.description ? '<p>' + esc(r.description) + '</p>' : '') +
      photosOf(r) + checksHtml(r, owner) +
      '<p class="mini">Room ID: ' + esc(r.id) + '</p><p class="mini">Owner ID: ' + esc(r.uid || "") + '</p>' +
      roomButtons(r, "") + '</div>';
  }
/* One function does every room decision, so the room, the activity log, the owner notice
     and (optionally) the report are always saved together. */
  async function roomAction(rid, action, reportId) {
    const needReason = action !== "approve" && action !== "restore";
    if (action === "remove" && !confirm("Delete this room permanently? A short copy is kept in the activity log.")) return false;
    const ans = prompt(ACT_L[action] + " - reason" + (needReason ? " (required, the owner will see it):" : " (optional):"), "");
    if (ans === null) return false;
    const reason = ans.trim().slice(0, 500);
    if (needReason && reason.length < 3) { alert("Please write a reason."); return false; }

    const rs = await getDoc(doc(db, "rooms", rid));
    if (!rs.exists()) { alert("Room not found."); return false; }
    const r = rs.data();
    const uid = c.getUid();
    const rref = doc(db, "rooms", rid);
    const batch = writeBatch(db);

    if (action === "approve" || action === "review" || action === "reject") {
      batch.update(rref, {
        approval: action === "approve" ? "approved" : action === "review" ? "needs_review" : "rejected",
        approvalBy: uid, approvalAt: serverTimestamp(), approvalReason: reason
      });
    } else if (action === "hide") {
      batch.update(rref, { hidden: true, hiddenReason: reason });
    } else if (action === "restore") {
      batch.update(rref, { hidden: false, hiddenReason: "" });
    } else if (action === "remove") {
      batch.delete(rref);
    }

    const snap = {
      title: r.title || "", type: r.type || "", loc: r.loc || "", area: r.area || "",
      price: r.price === undefined ? null : r.price, currency: r.currency || "", country: r.country || "", ownerId: r.uid || ""
    };
    batch.set(doc(collection(db, "adminLogs")), logDoc({
      action: "room_" + action, targetType: "room", targetId: rid, ownerId: r.uid || "", reason: reason, snapshot: snap
    }));
    if (r.uid) {
      batch.set(doc(collection(db, "notices")), {
        toUid: r.uid, kind: NOTICE_KIND[action], roomId: rid, roomTitle: String(r.title || "").slice(0, 120),
        reason: reason, read: false, createdAt: serverTimestamp()
      });
    }
    if (reportId) {
      const rep = await getDoc(doc(db, "reports", reportId));
      const old = rep.exists() ? (rep.data().status || "new") : "new";
      const u = { lastAction: "room_" + action, reviewedBy: uid, reviewedAt: serverTimestamp() };
      if (action === "remove") { u.status = "resolved"; u.roomSnapshot = snap; }
      else if (old === "new") u.status = "reviewed";
      batch.update(doc(db, "reports", reportId), u);
    }
    await batch.commit();
    return true;
  }

  async function verifyUser(uid, on) {
    const batch = writeBatch(db);
    if (on) batch.set(doc(db, "verified", uid), { ok: true });
    else batch.delete(doc(db, "verified", uid));
    batch.set(doc(collection(db, "adminLogs")), logDoc({
      action: on ? "verify_owner" : "unverify_owner", targetType: "user", targetId: uid, reason: ""
    }));
    await batch.commit();
  }

  /* ---------- OVERVIEW AND ANALYTICS ---------- */
  async function cnt(q) {
    try { return (await getCountFromServer(q)).data().count; } catch (e) { return "?"; }
  }

  const stat = (label, val, hint) =>
    '<div class="card" style="margin:0;padding:10px"><div style="font-size:24px;font-weight:bold">' + esc(String(val)) +
    '</div><div>' + esc(label) + '</div>' + (hint ? '<div class="mini">' + esc(hint) + '</div>' : '') + '</div>';
  const grid = (arr) => '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">' + arr.join("") + '</div>';

  async function overview() {
    const now = Date.now();
    const day0 = new Date();
    day0.setHours(0, 0, 0, 0);
    const U = collection(db, "users");
    const E = collection(db, "events");
    const R = collection(db, "rooms");
    const v = await Promise.all([
      cnt(query(U)),
      cnt(query(U, where("createdAt", ">=", day0))),
      cnt(query(U, where("createdAt", ">=", new Date(now - 7 * 86400000)))),
      cnt(query(U, where("lastActive", ">=", new Date(now - 5 * 60000)))),
      cnt(query(E, where("type", "==", "login"))),
      cnt(query(E, where("type", "==", "logout"))),
      cnt(query(R)),
      cnt(query(R, where("approval", "==", "pending"))),
      cnt(query(R, where("approval", "==", "approved"))),
      cnt(query(R, where("approval", "==", "needs_review"))),
      cnt(query(R, where("approval", "==", "rejected"))),
      cnt(query(R, where("reportCount", ">=", 1)))
    ]);
    let l24 = 0, o24 = 0;
    try {
      const s = await getDocs(query(E, where("createdAt", ">=", new Date(now - 86400000)), orderBy("createdAt", "desc"), limit(500)));
      s.docs.forEach((d) => { const t = d.data().type; if (t === "login") l24++; if (t === "logout") o24++; });
    } catch (e) { l24 = "?"; o24 = "?"; }

    let feed = [];
    try {
      const fs = await getDocs(query(E, orderBy("createdAt", "desc"), limit(80)));
      feed = fs.docs.map((d) => d.data()).filter((e) => e.type === "signup" || e.type === "room_added" || e.type === "room_reported").slice(0, 20);
    } catch (e) {}
    await Promise.all(feed.map(async (e) => { await getUser(e.uid); if (e.roomId) await getRoom(e.roomId); }));

    const total = v[6], sum = [v[7], v[8], v[9], v[10]].every((x) => typeof x === "number") ? v[7] + v[8] + v[9] + v[10] : null;
    const legacy = (typeof total === "number" && sum !== null) ? total - sum : 0;

    let fh = "";
    feed.forEach((e) => {
      const u = uc[e.uid];
      const nm = u ? (u.name || "-") : "someone";
      const room = e.roomId ? rc[e.roomId] : null;
      const rt = room ? room.title : "(room deleted)";
      const txt = e.type === "signup" ? "🆕 New registration: " + nm
        : e.type === "room_added" ? "🏠 New room submitted: " + rt + " (by " + nm + ")"
        : "🚩 Room reported: " + rt + " (by " + nm + ")";
      fh += '<p style="margin:6px 0">' + esc(txt) + '<br><span class="mini">' + esc(fts(e.createdAt)) + '</span></p>';
    });

    body().innerHTML =
      '<h3 class="title">Users</h3>' +
      grid([
        stat("Registered users", v[0], "accounts in Firebase"),
        stat("Active now", v[3], "used the app in the last 5 minutes"),
        stat("New today", v[1]),
        stat("New this week", v[2], "last 7 days")
      ]) +
      '<h3 class="title">Login and logout events</h3>' +
      grid([
        stat("Login events", v[4], "all time"),
        stat("Logout events", v[5], "all time"),
        stat("Logins, last 24h", l24, "latest 500 events"),
        stat("Logouts, last 24h", o24, "latest 500 events")
      ]) +
      '<p class="mini">Login and logout events are counted when a person presses login or logout in the app. A logout is not an uninstall. Firebase does not tell us about uninstalls, so no uninstall number is shown.</p>' +
      '<h3 class="title">Rooms</h3>' +
      grid([
        stat("Total rooms published", v[6]),
        stat("Pending", v[7]),
        stat("Approved", v[8]),
        stat("Needs review", v[9]),
        stat("Rejected", v[10]),
        stat("Reported rooms", v[11], "at least one report")
      ]) +
      (legacy > 0 ? '<p class="mini">⚠ ' + legacy + ' old rooms have no approval status. Open Room Approval Settings and press "Fix old rooms".</p>' : '') +
      '<div><button class="act" data-a="goto" data-tab="rooms" data-filter="pending">Open pending rooms</button>' +
      '<button class="act gray" data-a="goto" data-tab="reports">Open new reports</button></div>' +
      '<h3 class="title" style="margin-top:16px">Notifications</h3>' +
      '<div class="card" style="margin:0">' + (fh || '<p class="mini">Nothing new yet.</p>') + '</div>';
  }

  /* ---------- REPORT MANAGEMENT ---------- */
  function stTag(s) {
    const cls = s === "resolved" ? "ok" : s === "rejected" ? "bad" : s === "reviewed" ? "" : "new";
    return tag(s, cls);
  }

  function roomBlock(room, rep) {
    if (!room) {
      const s = rep.roomSnapshot;
      let h = '<div style="' + LINE + '"><b>Room</b> ' + tag("removed or deleted", "bad");
      if (s) {
        h += '<p>Title: ' + esc(s.title || "") + '</p>' +
          '<p>Type: ' + esc(TYPE_L[s.type] || s.type || "") + ' · ' + esc(LOC_L[s.loc] || s.loc || "") + '</p>' +
          '<p>Area: ' + esc(s.area || "") + '</p>' +
          '<p>Price: ' + esc(s.price == null ? "" : String(s.price) + " " + (s.currency || "")) + '</p>';
      } else {
        h += '<p class="mini">No copy of this room was saved.</p>';
      }
      return h + '<p class="mini">Room ID: ' + esc(rep.roomId || "") + '</p></div>';
    }
    const hasLoc = typeof room.lat === "number" && typeof room.lng === "number";
    const ctry = c.country(room) === "NP" ? "Nepal" : "India";
    return '<div style="' + LINE + '"><b>Room</b> ' + tag(AP_L[apOf(room)], AP_C[apOf(room)]) +
      (room.hidden ? ' ' + tag("hidden by admin", "bad") : '') +
      (Number(room.reportCount || 0) >= 3 ? ' ' + tag("auto-hidden (3+ reports)", "bad") : '') +
      '<p>Title: ' + esc(room.title || "") + '</p>' +
      '<p>Type: ' + esc(TYPE_L[room.type] || room.type || "") + '</p>' +
      '<p>Location: ' + esc(room.area || "") + ' · ' + esc(LOC_L[room.loc] || "") + ' · ' + esc(ctry) + '</p>' +
      (hasLoc ? '<p><a href="https://www.google.com/maps?q=' + room.lat + ',' + room.lng + '" target="_blank" rel="noopener">📍 Open pin in Maps</a></p>' : '') +
      '<p>Price: ' + esc(c.fmt(room)) + ' / month · Deposit: ' + esc(c.fmtDep(room)) + '</p>' +
      '<p>Description: ' + (room.description ? esc(room.description) : '<span class="mini">not given</span>') + '</p>' +
      photosOf(room) +
      '<p class="mini">Room ID: ' + esc(rep.roomId || "") + '</p></div>';
  }

  function ownerBlock(o, ownerId, room) {
    if (!ownerId) return "";
    let h = '<div style="' + LINE + '"><b>Room owner</b>';
    if (o) {
      h += '<p>Name: ' + esc(o.name || "-") + '</p>' +
        '<p>Profile phone: ' + esc(o.phone || "-") + ' ' + tag("self-entered, not verified") + '</p>' +
        (room ? '<p>Phone on the room: ' + esc(room.phone ? ("+" + (room.cc || "") + " " + room.phone) : "hidden by owner") + '</p>' : '') +
        '<p>Email: ' + (o.email ? esc(o.email) : '<span class="mini">not saved yet (owner has not logged in since the update)</span>') + '</p>' +
        '<p>Email verified: ' + (o.emailVerified === true ? tag("Yes", "ok") : o.emailVerified === false ? tag("No", "bad") : '<span class="mini">unknown</span>') + '</p>';
    } else {
      h += '<p class="mini">Owner profile not found (account may be deleted).</p>';
    }
    return h + '<p>Phone verification: ' + tag("not available yet") + '</p><p class="mini">Owner ID: ' + esc(ownerId) + '</p></div>';
  }

  function repButtons(rep, room) {
    const s = stOf(rep);
    const id = esc(rep.id);
    const sb = (cls, st, label) => '<button class="' + cls + '" data-a="rstatus" data-s="' + st + '" data-id="' + id + '">' + label + '</button>';
    let h = '<div style="' + LINE + '">';
    if (s !== "reviewed") h += sb("act", "reviewed", "Mark reviewed");
    if (s !== "resolved") h += sb("act", "resolved", "Mark resolved");
    if (s !== "rejected") h += sb("act gray", "rejected", "Reject report (invalid)");
    h += '</div>';
    if (rep.type === "room" && room) {
      h += roomButtons(Object.assign({ id: rep.roomId }, room), rep.id);
      if (rep.ownerId) h += '<div style="' + LINE + '"><button class="act" data-a="uver" data-uid="' + esc(rep.ownerId) + '">Verify this owner</button></div>';
    }
    return h;
  }

  async function reportsTab() {
    body().innerHTML = '<select id="rpStatus">' +
      '<option value="new">New reports</option><option value="reviewed">Reviewed</option>' +
      '<option value="resolved">Resolved</option><option value="rejected">Rejected</option><option value="all">All reports</option></select>' +
      '<p id="rpSummary" class="mini"></p><div id="rpList"></div>';
    $("rpStatus").value = rpFilter;
    $("rpStatus").addEventListener("change", () => { rpFilter = $("rpStatus").value; loadReports(); });
    await loadReports();
  }

  async function loadReports() {
    const box = $("rpList");
    if (!box) return;
    box.innerHTML = '<div class="empty">Loading...</div>';
    uc = {};
    rc = {};
    try {
      const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100)));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const n = { new: 0, reviewed: 0, resolved: 0, rejected: 0 };
      all.forEach((r) => { const s = stOf(r); if (s in n) n[s]++; });
      $("rpSummary").textContent = "New " + n.new + " · Reviewed " + n.reviewed + " · Resolved " + n.resolved + " · Rejected " + n.rejected + " (latest 100)";
      const list = all.filter((r) => rpFilter === "all" || stOf(r) === rpFilter);
      await Promise.all(list.map(async (r) => {
        await getUser(r.uid);
        if (r.type === "room") { await getRoom(r.roomId); await getUser(r.ownerId); }
      }));
      let html = "";
      list.forEach((rep) => {
        const reporter = uc[rep.uid];
        const room = rep.type === "room" ? rc[rep.roomId] : null;
        const head = rep.type === "room"
          ? '<p>Reason: <b>' + esc(REASONS[rep.reason] || rep.reason || "") + '</b> ' + stTag(stOf(rep)) + '</p>' +
            (rep.details ? '<p>Details: ' + esc(rep.details) + '</p>' : '<p class="mini">No written explanation.</p>')
          : '<p>Problem report ' + stTag(stOf(rep)) + '</p><p>' + esc(rep.text || "") + '</p>';
        html += '<div class="card" style="margin:12px 0">' + head +
          '<p>Reported by: ' + esc(reporter ? (reporter.name || "-") : "(profile not found)") + '</p>' +
          '<p class="mini">Reporter ID: ' + esc(rep.uid || "") + '</p>' +
          '<p class="mini">When: ' + esc(fts(rep.createdAt)) + '</p>' +
          (rep.reviewedBy ? '<p class="mini">Last reviewed: ' + esc(fts(rep.reviewedAt)) + ' by admin ' + esc(rep.reviewedBy) +
            (rep.lastAction ? ' (' + esc(rep.lastAction) + ')' : '') + '</p>' : '') +
          (rep.type === "room" ? roomBlock(room, rep) + ownerBlock(uc[rep.ownerId], rep.ownerId, room) : '') +
          repButtons(rep, room) + '</div>';
      });
      box.innerHTML = html || '<div class="empty">No reports here 🎉</div>';
    } catch (e) {
      box.innerHTML = '<div class="empty">Could not load. Check rules and admin setup.</div>';
    }
  }

  /* Rejecting a report removes it from the room's report count; undoing a reject adds it back. */
  async function setReportStatus(reportId, newStatus) {
    const rs = await getDoc(doc(db, "reports", reportId));
    if (!rs.exists()) throw new Error("report not found");
    const r = rs.data();
    const old = r.status || "new";
    const batch = writeBatch(db);
    batch.update(doc(db, "reports", reportId), { status: newStatus, reviewedBy: c.getUid(), reviewedAt: serverTimestamp() });
    if (r.type === "room" && r.roomId && ((old === "rejected") !== (newStatus === "rejected"))) {
      const rm = await getDoc(doc(db, "rooms", r.roomId));
      if (rm.exists()) {
        const n = Number(rm.data().reportCount || 0);
        batch.update(doc(db, "rooms", r.roomId), { reportCount: newStatus === "rejected" ? Math.max(0, n - 1) : n + 1 });
      }
    }
    batch.set(doc(collection(db, "adminLogs")), logDoc({
      action: "report_" + newStatus, targetType: "report", targetId: reportId, reason: ""
    }));
    await batch.commit();
  }

  /* ---------- ROOM MANAGEMENT ---------- */
  async function roomsTab() {
    body().innerHTML = '<input id="rSearch" placeholder="Search title, owner name or email, area, room ID, owner ID">' +
      '<select id="rFilter"><option value="pending">Pending</option><option value="needs_review">Needs review</option>' +
      '<option value="approved">Approved</option><option value="rejected">Rejected</option>' +
      '<option value="hidden">Hidden by admin</option><option value="none">Old rooms (no status)</option><option value="all">All rooms</option></select>' +
      '<p id="rCount" class="mini"></p><div id="rList"></div>';
    $("rSearch").value = rQuery;
    $("rFilter").value = rFilter;
    let t = null;
    $("rSearch").addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { rQuery = $("rSearch").value; renderRoomsList(); }, 300);
    });
    $("rFilter").addEventListener("change", () => { rFilter = $("rFilter").value; renderRoomsList(); });
    await renderRoomsList();
  }

  async function renderRoomsList() {
    const box = $("rList");
    if (!box) return;
    let list = c.getRooms().slice();
    list.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
    list = list.filter((r) => rFilter === "all" || (rFilter === "hidden" ? !!r.hidden : apOf(r) === rFilter));
    const uids = Array.from(new Set(list.map((r) => r.uid))).filter((u) => u && !(u in uc)).slice(0, 80);
    await Promise.all(uids.map(getUser));
    if (!$("rList")) return;
    const q = rQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const o = uc[r.uid] || {};
        return [r.title, r.area, r.id, r.uid, o.name, o.email].some((x) => String(x || "").toLowerCase().indexOf(q) !== -1);
      });
    }
    $("rCount").textContent = list.length + " rooms" + (list.length > 60 ? " (showing 60)" : "");
    $("rList").innerHTML = list.slice(0, 60).map((r) => roomCard(r, uc[r.uid])).join("") || '<div class="empty">No rooms found.</div>';
  }

  function onRooms() {
    if (current === "rooms" && $("rList")) renderRoomsList();
  }

  /* ---------- USER MANAGEMENT ---------- */
  async function usersTab() {
    body().innerHTML = '<input id="uSearch" placeholder="Search name, email, phone or user ID">' +
      '<p id="uCount" class="mini"></p><div id="uList"><div class="empty">Loading...</div></div>';
    $("uSearch").value = uQuery;
    let t = null;
    $("uSearch").addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { uQuery = $("uSearch").value; renderUsers(); }, 300);
    });
    try {
      const s = await getDocs(query(collection(db, "users"), limit(300)));
      usersAll = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      usersAll.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
    } catch (e) {
      $("uList").innerHTML = '<div class="empty">Could not load users.</div>';
      return;
    }
    renderUsers();
  }

  function renderUsers() {
    const box = $("uList");
    if (!box) return;
    const q = uQuery.trim().toLowerCase();
    const list = usersAll.filter((u) => !q || [u.name, u.email, u.phone, u.id].some((x) => String(x || "").toLowerCase().indexOf(q) !== -1));
    const ver = c.getVerified();
    const rooms = c.getRooms();
    $("uCount").textContent = list.length + " users" + (list.length > 50 ? " (showing 50)" : "") + ". Admins cannot delete accounts from the app; Firebase does not allow it from here.";
    box.innerHTML = list.slice(0, 50).map((u) => {
      const isV = ver.has(u.id);
      const nRooms = rooms.filter((r) => r.uid === u.id).length;
      return '<div class="card" style="margin:12px 0"><h3 style="padding-right:0">' + esc(u.name || "-") + '</h3>' +
        (isV ? tag("✔ Verified owner badge", "ok") : "") +
        (u.emailVerified === true ? tag("email verified", "ok") : u.emailVerified === false ? tag("email NOT verified", "bad") : tag("email status unknown")) +
        '<p>Email: ' + (u.email ? esc(u.email) : '<span class="mini">not saved yet</span>') + '</p>' +
        '<p>Phone (self-entered): ' + esc(u.phone || "-") + '</p>' +
        '<p class="mini">Joined: ' + esc(fts(u.createdAt) || "before tracking started") + '</p>' +
        '<p class="mini">Last active: ' + esc(fts(u.lastActive) || "unknown") + '</p>' +
        '<p class="mini">Rooms (in latest list): ' + nRooms + '</p>' +
        '<p class="mini">User ID: ' + esc(u.id) + '</p>' +
        '<div style="' + LINE + '">' +
        (isV ? '<button class="act gray" data-a="uunver" data-uid="' + esc(u.id) + '">Remove verified badge</button>'
             : '<button class="act" data-a="uver" data-uid="' + esc(u.id) + '">Give verified badge</button>') +
        '<button class="act gray" data-a="uview" data-uid="' + esc(u.id) + '">View this user\'s rooms</button></div></div>';
    }).join("") || '<div class="empty">No users found.</div>';
  }

  /* ---------- ROOM APPROVAL SETTINGS ---------- */
  async function approvalTab() {
    const R = collection(db, "rooms");
    const v = await Promise.all([
      cnt(query(R, where("approval", "==", "pending"))),
      cnt(query(R, where("approval", "==", "needs_review"))),
      cnt(query(R, where("approval", "==", "approved"))),
      cnt(query(R, where("approval", "==", "rejected")))
    ]);
    body().innerHTML =
      grid([stat("Pending", v[0]), stat("Needs review", v[1]), stat("Approved", v[2]), stat("Rejected", v[3])]) +
      '<div class="card" style="margin:0 0 12px 0"><h3>How approval works</h3>' +
      '<p>Every new room starts as <b>Pending</b> and is hidden from other users.</p>' +
      '<p>A room can be approved automatically only if ALL of these are true, and the database rules (not the app) decide it:</p>' +
      '<p class="mini">1. Email verified through Firebase<br>2. At least one photo uploaded<br>3. Owner name given<br>4. Phone verified by OTP</p>' +
      '<p>Status of check 4: <b>' + tag("not available yet", "bad") + '</b>. Until phone OTP login is added, no room can be approved automatically, so <b>an admin approves every room</b> in Room Management.</p>' +
      '<p class="mini">Even when all checks pass, Vhuba does not claim the photos, phone or identity are genuine. The green tick only means the listed checks passed or an admin approved the room.</p>' +
      '<p class="mini">Fixed limits (set in code): 5 rooms per user, listing life 30 days, a room hides after 3 reports.</p>' +
      '<button class="act" data-a="goto" data-tab="rooms" data-filter="pending">Open pending rooms</button></div>' +
      '<div class="card" style="margin:0"><h3>Fix old rooms</h3>' +
      '<p class="mini">Gives rooms made before this update an approval status (so other users can see them), adds missing country and currency, and clears old private report data.</p>' +
      '<button class="act" data-a="fixold">Fix old rooms</button></div>';
  }

  async function fixOld() {
    const upd = {};
    c.getRooms().forEach((r) => {
      const u = {};
      if (!r.approval) { u.approval = "approved"; u.approvalBy = "legacy"; }
      if (!(r.country === "IN" || r.country === "NP") || !r.currency) {
        const country = String(r.cc || "").replace(/\D/g, "") === "977" ? "NP" : "IN";
        u.country = country;
        u.currency = country === "IN" ? "INR" : "NPR";
      }
      if (Array.isArray(r.reportedBy) && r.reportedBy.length) u.reportedBy = [];
      if (Object.keys(u).length) upd[r.id] = u;
    });
    const ids = Object.keys(upd);
    if (!ids.length) { alert("All rooms are already up to date."); return; }
    if (!confirm("Update " + ids.length + " old rooms?")) return;
    for (let i = 0; i < ids.length; i += 400) {
      const batch = writeBatch(db);
      ids.slice(i, i + 400).forEach((id) => batch.update(doc(db, "rooms", id), upd[id]));
      await batch.commit();
    }
    await setDoc(doc(collection(db, "adminLogs")), logDoc({ action: "fix_old_rooms", targetType: "rooms", targetId: String(ids.length), reason: "" }));
    alert("Done. " + ids.length + " rooms updated.");
  }

  /* ---------- SECURITY SETTINGS ---------- */
  function securityTab() {
    const u = auth.currentUser;
    body().innerHTML =
      '<div class="card" style="margin:0 0 12px 0"><h3>Your admin sign-in</h3>' +
      '<p>Email: ' + esc(u ? u.email : "") + '</p>' +
      '<p>Email verified: ' + (u && u.emailVerified ? tag("Yes", "ok") : tag("No", "bad")) + '</p>' +
      '<p class="mini">UID: ' + esc(u ? u.uid : "") + '</p>' +
      '<button class="act" data-a="resetpw">Send password reset email to myself</button>' +
      '<button class="act gray" data-a="signout">Sign out</button></div>' +
      '<div class="card" style="margin:0"><h3>How admin access is protected</h3>' +
      '<p>Admin power is checked by the Firestore database rules on every request, using your verified login email. Hiding a button is not what protects the data.</p>' +
      '<p>A normal user cannot become admin by editing the page, the browser storage or the link. The database refuses admin actions and admin data for them.</p>' +
      '<p class="mini">To add another admin, the rules file must be edited in the Firebase console. Use a strong, unique password for this email and keep its mailbox secure, because anyone who controls this mailbox controls admin.</p></div>';
  }

  /* ---------- ADMIN PROFILE AND PREFERENCES ---------- */
  function profileTab() {
    const p = c.getProfile() || {};
    const u = auth.currentUser;
    body().innerHTML =
      '<div class="card" style="margin:0 0 12px 0"><h3>Admin profile</h3>' +
      '<p>Name: ' + esc(p.name || "-") + '</p><p>Email: ' + esc(u ? u.email : "") + '</p>' +
      '<p class="mini">To change your name, use normal Settings.</p></div>' +
      '<div class="card" style="margin:0"><h3>Preferences</h3>' +
      '<p class="mini">Open this section first when I open Admin (saved on this phone only).</p>' +
      '<select id="pfTab">' +
      '<option value="overview">Overview and Analytics</option><option value="reports">Report Management</option>' +
      '<option value="rooms">Room Management</option><option value="users">User Management</option>' +
      '<option value="approval">Room Approval Settings</option><option value="security">Security Settings</option>' +
      '<option value="profile">Admin Profile and Preferences</option><option value="activity">Admin Activity History</option></select></div>';
    let saved = "overview";
    try { saved = localStorage.getItem("vhubaAdminTab") || "overview"; } catch (e) {}
    $("pfTab").value = saved;
    $("pfTab").addEventListener("change", () => {
      try { localStorage.setItem("vhubaAdminTab", $("pfTab").value); } catch (e) {}
    });
  }

  /* ---------- ADMIN ACTIVITY HISTORY ---------- */
  async function activityTab() {
    const snap = await getDocs(query(collection(db, "adminLogs"), orderBy("createdAt", "desc"), limit(100)));
    let h = "";
    snap.docs.forEach((d) => {
      const x = d.data();
      h += '<div class="card" style="margin:12px 0"><p><b>' + esc(x.action || "") + '</b> ' + esc(x.targetType || "") + '</p>' +
        (x.snapshot && x.snapshot.title ? '<p>' + esc(x.snapshot.title) + '</p>' : '') +
        (x.reason ? '<p>Reason: ' + esc(x.reason) + '</p>' : '') +
        '<p class="mini">By: ' + esc(x.adminEmail || x.adminId || "") + '</p>' +
        '<p class="mini">When: ' + esc(fts(x.createdAt)) + '</p>' +
        '<p class="mini">Target ID: ' + esc(x.targetId || "") + '</p></div>';
    });
    body().innerHTML = h || '<div class="empty">No admin actions yet.</div>';
  }

  /* ---------- TABS ---------- */
  const TABS = {
    overview: overview, reports: reportsTab, rooms: roomsTab, users: usersTab,
    approval: approvalTab, security: securityTab, profile: profileTab, activity: activityTab
  };

  async function load() {
    if (!c.isAdmin()) return;
    $("adminTab").value = current;
    body().innerHTML = '<div class="empty">Loading...</div>';
    try {
      await TABS[current]();
    } catch (e) {
      body().innerHTML = '<div class="empty">Could not load. Check rules and admin setup.</div>';
    }
  }

  function selectTab(t) {
    current = t;
    try { localStorage.setItem("vhubaAdminTab", t); } catch (e) {}
    return load();
  }

  $("adminTab").addEventListener("change", () => selectTab($("adminTab").value));

  body().addEventListener("click", async (e) => {
    const el = e.target;
    if (el.tagName === "IMG") {
      const src = el.getAttribute("src");
      if (src && PHOTO_OK.test(src)) {
        $("bigImg").src = src;
        $("bigModal").classList.add("open");
      }
      return;
    }
    const a = el.getAttribute && el.getAttribute("data-a");
    if (!a) return;
    el.disabled = true;
    try {
      if (a === "goto") {
        const f = el.getAttribute("data-filter");
        if (f) rFilter = f;
        await selectTab(el.getAttribute("data-tab"));
        return;
      } else if (a === "raction") {
        const ok = await roomAction(el.getAttribute("data-rid"), el.getAttribute("data-act"), el.getAttribute("data-id") || "");
        if (ok && current === "reports") await loadReports();
      } else if (a === "rstatus") {
        if (el.getAttribute("data-s") === "rejected" && !confirm("Reject this report as invalid?")) { el.disabled = false; return; }
        await setReportStatus(el.getAttribute("data-id"), el.getAttribute("data-s"));
        await loadReports();
      } else if (a === "uver" || a === "uunver") {
        await verifyUser(el.getAttribute("data-uid"), a === "uver");
        if (current === "users") renderUsers(); else alert("Done.");
      } else if (a === "uview") {
        rFilter = "all";
        rQuery = el.getAttribute("data-uid");
        await selectTab("rooms");
        return;
      } else if (a === "fixold") {
        await fixOld();
      } else if (a === "resetpw") {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
        alert("Password reset email sent to " + auth.currentUser.email + ". Check Inbox and Spam.");
      } else if (a === "signout") {
        c.logout();
        return;
      }
    } catch (err) {
      alert("Failed (" + (err.code || err.message) + "). Are you an admin?");
    }
    el.disabled = false;
  });

  return { load: load, onRooms: onRooms };
}