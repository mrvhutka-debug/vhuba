import {
  db, collection, getDocs, getDoc, doc, query, orderBy, limit, updateDoc, deleteDoc, setDoc
} from "./firebase.js";

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
        if (r.type === "room") {
          const room = rooms.find((x) => x.id === r.roomId);
          const title = room ? room.title : "(room not in latest list)";
          const cnt = room ? (room.reportCount || 0) : "?";
          const rid = esc(r.roomId || "");
          html += '<div class="card"><h3>' + esc(title) + '</h3>' +
            '<p>Reason: <b>' + esc(r.reason || "") + '</b> · Reports on room: ' + esc(String(cnt)) + '</p>' +
            '<p class="mini">Room ID: ' + rid + '</p>' +
            '<button class="act" data-a="restore" data-rid="' + rid + '" data-id="' + id + '">Restore room (clear reports)</button>' +
            '<button class="act" data-a="verify" data-rid="' + rid + '" data-id="' + id + '">Verify this owner</button>' +
            '<button class="del" data-a="delroom" data-rid="' + rid + '" data-id="' + id + '">Delete room</button>' +
            '<button class="act gray" data-a="dismiss" data-id="' + id + '">Dismiss report</button></div>';
        } else {
          html += '<div class="card"><h3>Problem report</h3><p>' + esc(r.text || "") + '</p>' +
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
        await updateDoc(doc(db, "rooms", rid), { reportCount: 0, reportedBy: [] });
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

  return { load };
}