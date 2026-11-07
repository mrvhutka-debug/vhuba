import {
  db, collection, getDocs, getDoc, doc, query, orderBy, limit, updateDoc, setDoc, writeBatch, serverTimestamp
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
const PHOTO_OK = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;
const LINE = "border-top:1px solid var(--border);margin-top:8px;padding-top:8px";

export function initAdmin(c) {
  const $ = c.$;
  const esc = c.esc;
  let uc = {};
  let rc = {};

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

  const stOf = (r) => r.status || "new";
  const when = (ts) => (ts && ts.toDate) ? ts.toDate().toLocaleString() : "";

  function stTag(s) {
    const cls = s === "resolved" ? "tag ok" : s === "rejected" ? "tag bad" : s === "reviewed" ? "tag" : "tag new";
    return '<span class="' + cls + '">' + esc(s) + '</span>';
  }

  function roomBlock(room, rep) {
    if (!room) {
      const s = rep.roomSnapshot;
      let h = '<div style="' + LINE + '"><b>Room</b> <span class="tag bad">removed or deleted</span>';
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
    const ph = Array.isArray(room.photos) ? room.photos : [];
    let photos = "";
    ph.forEach((p) => { if (typeof p === "string" && PHOTO_OK.test(p)) photos += '<img class="ph" src="' + p + '" alt="">'; });
    const hasLoc = typeof room.lat === "number" && typeof room.lng === "number";
    const ctry = c.country(room) === "NP" ? "Nepal" : "India";
    return '<div style="' + LINE + '"><b>Room</b>' +
      (room.hidden ? ' <span class="tag bad">hidden by admin</span>' : '') +
      (Number(room.reportCount || 0) >= 3 ? ' <span class="tag bad">auto-hidden (3+ reports)</span>' : '') +
      '<p>Title: ' + esc(room.title || "") + '</p>' +
      '<p>Type: ' + esc(TYPE_L[room.type] || room.type || "") + '</p>' +
      '<p>Location: ' + esc(room.area || "") + ' · ' + esc(LOC_L[room.loc] || "") + ' · ' + esc(ctry) + '</p>' +
      (hasLoc ? '<p><a href="https://www.google.com/maps?q=' + room.lat + ',' + room.lng + '" target="_blank" rel="noopener">📍 Open pin in Maps</a></p>' : '') +
      '<p>Price: ' + esc(c.fmt(room)) + ' / month · Deposit: ' + esc(c.fmtDep(room)) + '</p>' +
      '<p>Description: ' + (room.description ? esc(room.description) : '<span class="mini">not given</span>') + '</p>' +
      (photos ? '<div class="phs">' + photos + '</div>' : '<p class="mini">No photos.</p>') +
      '<p class="mini">Room ID: ' + esc(rep.roomId || "") + '</p></div>';
  }

  function ownerBlock(o, ownerId, room) {
    if (!ownerId) return "";
    let h = '<div style="' + LINE + '"><b>Room owner</b>';
    if (o) {
      h += '<p>Name: ' + esc(o.name || "-") + '</p>' +
        '<p>Profile phone: ' + esc(o.phone || "-") + ' <span class="tag">self-entered, not verified</span></p>' +
        (room ? '<p>Phone on the room: ' + esc(room.phone ? ("+" + (room.cc || "") + " " + room.phone) : "hidden by owner") + '</p>' : '') +
        '<p>Email: ' + (o.email ? esc(o.email) : '<span class="mini">not saved yet (owner has not logged in since this update)</span>') + '</p>' +
        '<p>Email verified: ' + (o.emailVerified === true ? '<span class="tag ok">Yes</span>'
          : o.emailVerified === false ? '<span class="tag bad">No</span>' : '<span class="mini">unknown</span>') + '</p>';
    } else {
      h += '<p class="mini">Owner profile not found (account may be deleted).</p>';
    }
    h += '<p>Phone verification: <span class="tag">not available yet</span></p>' +
      '<p class="mini">Owner ID: ' + esc(ownerId) + '</p></div>';
    return h;
  }

  function actions(rep, room) {
    const s = stOf(rep);
    const id = esc(rep.id);
    const rid = esc(rep.roomId || "");
    const oid = esc(rep.ownerId || "");
    const b = (cls, a, label) =>
      '<button class="' + cls + '" data-a="' + a + '" data-id="' + id + '" data-rid="' + rid + '" data-oid="' + oid + '">' + label + '</button>';
    let h = '<div style="' + LINE + '">';
    if (s !== "reviewed") h += b("act", "reviewed", "Mark reviewed");
    if (s !== "resolved") h += b("act", "resolved", "Mark resolved");
    if (s !== "rejected") h += b("act gray", "rejected", "Reject report (invalid)");
    if (rep.type === "room" && room) {
      h += room.hidden ? b("act", "unhide", "Unhide room") : b("act", "hide", "Hide room");
      if (rep.ownerId) h += b("act", "verify", "Verify this owner");
      h += b("del", "remove", "Remove room");
    }
    return h + '</div>';
  }

  async function load() {
    const box = $("adminList");
    box.innerHTML = '<div class="empty">Loading...</div>';
    uc = {};
    rc = {};
    try {
      const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100)));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const n = { new: 0, reviewed: 0, resolved: 0, rejected: 0 };
      all.forEach((r) => { const s = stOf(r); if (s in n) n[s]++; });
      $("adminSummary").textContent = "New " + n.new + " · Reviewed " + n.reviewed +
        " · Resolved " + n.resolved + " · Rejected " + n.rejected + " (latest 100 reports)";
      const f = $("adminStatus").value;
      const list = all.filter((r) => f === "all" || stOf(r) === f);

      await Promise.all(list.map(async (r) => {
        await getUser(r.uid);
        if (r.type === "room") {
          await getRoom(r.roomId);
          await getUser(r.ownerId);
        }
      }));

      let html = "";
      list.forEach((rep) => {
        const reporter = uc[rep.uid];
        const when1 = when(rep.createdAt);
        let head = '<p>Status: ' + stTag(stOf(rep)) + '</p>';
        if (rep.type === "room") {
          head = '<p>Reason: <b>' + esc(REASONS[rep.reason] || rep.reason || "") + '</b> ' + stTag(stOf(rep)) + '</p>';
        } else {
          head = '<p>Problem report ' + stTag(stOf(rep)) + '</p><p>' + esc(rep.text || "") + '</p>';
        }
        const room = rep.type === "room" ? rc[rep.roomId] : null;
        html += '<div class="card">' + head +
          (rep.type === "room"
            ? (rep.details ? '<p>Details: ' + esc(rep.details) + '</p>' : '<p class="mini">No written explanation.</p>')
            : '') +
          '<p>Reported by: ' + esc(reporter ? (reporter.name || "-") : "(profile not found)") + '</p>' +
          '<p class="mini">Reporter ID: ' + esc(rep.uid || "") + '</p>' +
          '<p class="mini">When: ' + esc(when1) + '</p>' +
          (rep.reviewedBy ? '<p class="mini">Last reviewed: ' + esc(when(rep.reviewedAt)) + ' by admin ' + esc(rep.reviewedBy) +
            (rep.lastAction ? ' (' + esc(rep.lastAction) + ')' : '') + '</p>' : '') +
          (rep.type === "room" ? roomBlock(room, rep) + ownerBlock(uc[rep.ownerId], rep.ownerId, room) : '') +
          actions(rep, room) + '</div>';
      });
      box.innerHTML = html || '<div class="empty">No reports here 🎉</div>';
    } catch (e) {
      box.innerHTML = '<div class="empty">Could not load. Check rules and admin setup.</div>';
    }
  }

  /* Change report status. Rejecting removes the report from the room's count; undoing a reject adds it back. */
  async function setStatus(reportId, newStatus, extra) {
    const rs = await getDoc(doc(db, "reports", reportId));
    if (!rs.exists()) throw new Error("report not found");
    const r = rs.data();
    const old = r.status || "new";
    const batch = writeBatch(db);
    const upd = Object.assign({ status: newStatus, reviewedBy: c.getUid(), reviewedAt: serverTimestamp() }, extra || {});
    batch.update(doc(db, "reports", reportId), upd);
    if (r.type === "room" && r.roomId && ((old === "rejected") !== (newStatus === "rejected"))) {
      const rm = await getDoc(doc(db, "rooms", r.roomId));
      if (rm.exists()) {
        const cnt = Number(rm.data().reportCount || 0);
        batch.update(doc(db, "rooms", r.roomId), { reportCount: newStatus === "rejected" ? Math.max(0, cnt - 1) : cnt + 1 });
      }
    }
    await batch.commit();
  }

  async function hideRoom(reportId, rid, hide) {
    const rs = await getDoc(doc(db, "reports", reportId));
    const old = rs.exists() ? (rs.data().status || "new") : "new";
    const batch = writeBatch(db);
    batch.update(doc(db, "rooms", rid), { hidden: hide });
    const upd = { lastAction: hide ? "hide_room" : "unhide_room", reviewedBy: c.getUid(), reviewedAt: serverTimestamp() };
    if (old === "new") upd.status = "reviewed";
    batch.update(doc(db, "reports", reportId), upd);
    await batch.commit();
  }

  async function removeRoom(reportId, rid) {
    const rm = await getDoc(doc(db, "rooms", rid));
    const batch = writeBatch(db);
    const upd = { status: "resolved", lastAction: "remove_room", reviewedBy: c.getUid(), reviewedAt: serverTimestamp() };
    if (rm.exists()) {
      const d = rm.data();
      upd.roomSnapshot = {
        title: d.title || "", type: d.type || "", loc: d.loc || "", area: d.area || "",
        price: d.price === undefined ? null : d.price, currency: d.currency || "", country: d.country || "",
        ownerId: d.uid || ""
      };
      batch.delete(doc(db, "rooms", rid));
    }
    batch.update(doc(db, "reports", reportId), upd);
    await batch.commit();
  }

  $("adminList").addEventListener("click", async (e) => {
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
    const id = el.getAttribute("data-id");
    const rid = el.getAttribute("data-rid");
    const oid = el.getAttribute("data-oid");

    if (a === "remove" && !confirm("Delete this room permanently? A short copy is kept in the report.")) return;
    if (a === "rejected" && !confirm("Reject this report as invalid?")) return;

    el.disabled = true;
    try {
      if (a === "reviewed" || a === "resolved" || a === "rejected") {
        await setStatus(id, a);
      } else if (a === "hide" || a === "unhide") {
        await hideRoom(id, rid, a === "hide");
      } else if (a === "remove") {
        await removeRoom(id, rid);
      } else if (a === "verify") {
        await setDoc(doc(db, "verified", oid), { ok: true });
        alert("Owner verified ✔");
        el.disabled = false;
        return;
      }
    } catch (err) {
      alert("Failed (" + (err.code || err.message) + "). Are you an admin?");
    }
    load();
  });

  $("adminRefresh").addEventListener("click", load);
  $("adminStatus").addEventListener("change", load);

  $("adminFix").addEventListener("click", async () => {
    const upd = {};
    c.getRooms().forEach((r) => {
      const u = {};
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
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => batch.update(doc(db, "rooms", id), upd[id]));
      await batch.commit();
      alert("Done. " + ids.length + " rooms updated.");
    } catch (err) {
      alert("Failed. Are you an admin?");
    }
  });

  return { load };
}