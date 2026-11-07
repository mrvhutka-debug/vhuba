import {
  auth, db, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser,
  doc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, where, serverTimestamp, writeBatch
} from "./firebase.js";

export function initSettings(c) {
  const $ = c.$;
  const t = () => c.T();
  const msg = (k) => alert(t()[k]);
  const uref = () => doc(db, "users", auth.currentUser.uid);

  document.querySelectorAll("[data-sub]").forEach((b) => {
    b.addEventListener("click", () => {
      const target = $(b.getAttribute("data-sub"));
      const wasOpen = target.classList.contains("open");
      document.querySelectorAll(".sub").forEach((s) => s.classList.remove("open"));
      if (!wasOpen) target.classList.add("open");
    });
  });

  async function myRooms() {
    const snap = await getDocs(query(collection(db, "rooms"), where("uid", "==", auth.currentUser.uid)));
    return snap.docs;
  }

  async function setRoomsPhone(phone) {
    const docs = await myRooms();
    if (!docs.length) return;
    const batch = writeBatch(db);
    docs.forEach((d) => batch.update(d.ref, { phone: phone }));
    await batch.commit();
  }

  async function reauth(pass) {
    const u = auth.currentUser;
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, pass));
  }

  $("saveName").addEventListener("click", async () => {
    const name = $("newName").value.trim();
    if (!name) { msg("fillAll"); return; }
    try {
      await updateDoc(uref(), { name: name });
      c.getProfile().name = name;
      c.applyLang();
      msg("saved");
    } catch (e) { msg("errGeneric"); }
  });

  $("savePhone").addEventListener("click", async () => {
    const phone = $("newPhone").value.trim();
    if (!/^[0-9]{10}$/.test(phone)) { msg("badPhone"); return; }
    try {
      await updateDoc(uref(), { phone: phone });
      const p = c.getProfile();
      p.phone = phone;
      if (!p.hidePhone) await setRoomsPhone(phone);
      $("phone").value = phone;
      msg("saved");
    } catch (e) { msg("errGeneric"); }
  });

  $("savePass").addEventListener("click", async () => {
    const cur = $("curPass").value;
    const nw = $("newPass").value;
    if (!cur || nw.length < 6) { msg("badPass"); return; }
    try {
      await reauth(cur);
      await updatePassword(auth.currentUser, nw);
      $("curPass").value = "";
      $("newPass").value = "";
      msg("passChanged");
    } catch (e) {
      msg(e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" ? "wrongPass" : "errGeneric");
    }
  });

  $("delBtn").addEventListener("click", async () => {
    const pass = $("delPass").value;
    if (!pass) { msg("wrongPass"); return; }
    if (!confirm(t().delConfirm)) return;
    try {
      await reauth(pass);
      const docs = await myRooms();
      for (const d of docs) { await deleteDoc(d.ref); }
      await deleteDoc(uref());
      await deleteUser(auth.currentUser);
      $("delPass").value = "";
    } catch (e) {
      msg(e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" ? "wrongPass" : "errGeneric");
    }
  });

  $("lang").addEventListener("change", async function () {
    const l = this.value;
    c.setLang(l);
    try {
      await updateDoc(uref(), { lang: l });
      c.getProfile().lang = l;
    } catch (e) {}
    c.applyLang();
  });

  $("darkBox").addEventListener("change", function () { c.applyTheme(this.checked); });

  $("hideBox").addEventListener("change", async function () {
    const hide = this.checked;
    const p = c.getProfile();
    try {
      await updateDoc(uref(), { hidePhone: hide });
      p.hidePhone = hide;
      await setRoomsPhone(hide ? "" : (p.phone || ""));
    } catch (e) {
      this.checked = !hide;
      msg("errGeneric");
    }
  });

  $("sendReport").addEventListener("click", async () => {
    const text = $("reportText").value.trim();
    if (!text) { msg("fillAll"); return; }
    try {
      await addDoc(collection(db, "reports"), {
        type: "problem", text: text.slice(0, 1000), uid: auth.currentUser.uid, createdAt: serverTimestamp()
      });
      $("reportText").value = "";
      msg("reportSent");
    } catch (e) { msg("errGeneric"); }
  });

  $("logoutBtn").addEventListener("click", c.doLogout);

  return {
    sync() {
      const p = c.getProfile();
      $("newName").value = p.name || "";
      $("newPhone").value = p.phone || "";
      $("hideBox").checked = !!p.hidePhone;
      $("darkBox").checked = document.documentElement.getAttribute("data-theme") === "dark";
      $("lang").value = c.getLang();
    }
  };
}