import {
  auth, db, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, GoogleAuthProvider,
  updatePassword, deleteUser,
  doc, deleteDoc, collection, addDoc, getDocs, query, where, serverTimestamp
} from "./firebase.js";

export function initSettings(c) {
  const $ = c.$;
  const t = () => c.T();
  const msg = (k) => alert(t()[k]);
  const hasPassword = () => !!auth.currentUser && auth.currentUser.providerData.some((p) => p.providerId === "password");

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

  /* Password accounts type their password again. Google accounts confirm with Google again. */
  async function reauth(pass) {
    const u = auth.currentUser;
    if (hasPassword()) {
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, pass));
    } else {
      await reauthenticateWithPopup(u, new GoogleAuthProvider());
    }
  }

  $("savePass").addEventListener("click", async () => {
    if (!hasPassword()) return;
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
    const pw = hasPassword();
    const pass = $("delPass").value;
    if (pw && !pass) { msg("wrongPass"); return; }
    if (!confirm(t().delConfirm)) return;
    try {
      await reauth(pass);
      const uid = auth.currentUser.uid;
      const docs = await myRooms();
      for (const d of docs) { await deleteDoc(d.ref); }
      try { await deleteDoc(doc(db, "publicProfiles", uid)); } catch (e) {}
      await deleteDoc(doc(db, "users", uid));
      await deleteUser(auth.currentUser);
      $("delPass").value = "";
    } catch (e) {
      if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
      msg(e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" ? "wrongPass" : "errGeneric");
    }
  });

  $("darkBox").addEventListener("change", function () { c.applyTheme(this.checked); });

  $("hideBox").addEventListener("change", async function () {
    const hide = this.checked;
    try {
      await c.applyHide(hide);
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
      $("hideBox").checked = !!p.hidePhone;
      $("darkBox").checked = document.documentElement.getAttribute("data-theme") === "dark";
      $("lang").value = c.getLang();
      const pw = hasPassword();
      const row = document.querySelector('[data-sub="subPass"]');
      if (row) row.style.display = pw ? "" : "none";
      if (!pw) $("subPass").classList.remove("open");
      $("delPass").style.display = pw ? "" : "none";
    }
  };
}