import {
  db, collection, getDocs, getDoc, doc, query, orderBy, limit, updateDoc, deleteDoc, setDoc, writeBatch
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

export function initAdmin(c) {
  const $ = c.$;
  const esc = c.esc;

  async function load() {
    const box = $("adminList");
    box.innerHTML = '<div class="empty">Loading...</div>';
    try {
      const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(50)));
      const rooms = c.getRooms();
      let html = "";
      snap.docs.forEach((d) => {
        const r = d.data();
        const id = esc(d.id);
        const when = (r.createdAt && r.createdAt.toDate) ? r.createdAt.toDate().toLocaleString() : "";
        if (r.type === "room") {
          const room = rooms.find((x) => x.id === r.roomId);
          const title = room ? room.title : "(room not in latest list)";
          const cnt = room ? (room.reportCount || 0) : "?";
          const rid = esc(r.roomId || "");
          html += '<div class="card"><h3>' + esc(title) + '</h3>' +
            '<p>Reason: <b>' + esc(REASONS[r.reason] || r.reason || "") + '</b></p>' +
            (r.details ? '<p>Details: ' + esc(r.details) + '</p>' : '') +
            '<p>Status: <b>' + esc(r.status || "new") + '</b> · Reports on room: ' + esc(String(cnt)) + '</p>' +
            '<p class="mini">When: ' + esc(when) + '</p>' +
            '<p class="mini">Room ID: ' + rid + '</p>' +
            '<p class="mini">Owner ID: ' + esc(r.ownerId || "") + '</p>' +
            '<p class="mini">Reporter ID: ' + esc(r.uid || "") + '</p>' +
            '<button class="act" data-a="restore" data-rid="' + rid + '" data-id="' + id + '">Restore room (clear reports)</button>' +
            '<button class="act" data-a="verify" data-rid="' + rid + '" data-id="' + id + '">Verify this owner</button>' +
            '<button class="del" data-a="delroom" data-rid="' + rid + '" data-id="' + id + '">Delete room</button>' +
            '<button class="act gray" data-a="dismiss" data-id="' + id + '">Dismiss report</button></div>';
        } else {
          html += '<div class="card"><h3>Problem report</h3><p>' + esc(r.text || "") + '</p>' +
            '<p class="mini">When: ' + esc(when) + '</p>' +
            '<p class="mini">User ID: ' + esc(r.uid || "") + '</p>' +
            '<button class="act gray" data-a="dismiss" data-id="' + id + '">Dismiss</button></div>';
        }
      });
      box.innerHTML = html || '<div class="empty">No reports 🎉</div>';
    } catch (e) {
      box.innerHTML = '<div class="empty">Could not load. Check rules and admin setup.</div>';
    }
  }

  $("adminList").addEventListener("click", async (e) => {
    const a = e.target.getAttribute && e.target.getAttribute("data-a");
    if (!a) return;
    const id = e.target.getAttribute("data-id");
    const rid = e.target.getAttribute("data-rid");
    try {
      if (a === "restore") {
        await updateDoc(doc(db, "rooms", rid), { reportCount: 0 });
      } else if (a === "delroom") {
        if (!confirm("Delete this room?")) return;
        await deleteDoc(doc(db, "rooms", rid));
      } else if (a === "verify") {
        const s = await getDoc(doc(db, "rooms", rid));
        if (!s.exists()) { alert("Room not found"); return; }
        await setDoc(doc(db, "verified", s.data().uid), { ok: true });
        alert("Owner verified ✔");
        return;
      } else if (a === "dismiss") {
        await deleteDoc(doc(db, "reports", id));
      }
      load();
    } catch (err) {
      alert("Failed. Are you an admin?");
    }
  });

  $("adminRefresh").addEventListener("click", load);

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