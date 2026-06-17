import { auth, db } from "./firebase.js";

import {
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export async function saveProject(projectData) {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("로그인이 필요합니다.");
    }

    if (!user.uid) {
        throw new Error("Auth not ready");
    }

    return await addDoc(collection(db, "projects"), {
            uid: user.uid,
            email: user.email ?? "",
            ...projectData,
            createdAt: serverTimestamp()
        }
    );
}