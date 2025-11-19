// assets/js/admin-panel.js
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js";

const resAddBtn = document.getElementById('res-add');
const resTitle = document.getElementById('res-title');
const resBody = document.getElementById('res-body');
const resMsg = document.getElementById('res-msg');
const resList = document.getElementById('res-list');

async function loadResources(){
  resList.innerHTML = '<div class="text-muted">Loading...</div>';
  try {
    const qsnap = await getDocs(collection(db, 'resources'));
    resList.innerHTML = '';
    qsnap.forEach(docSnap => {
      const d = docSnap.data();
      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `<div style="font-size:13px"><strong>${d.title}</strong><div style="font-size:12px;color:rgba(219,233,255,0.8)">${d.body}</div></div>
        <div><button class="btn" data-id="${docSnap.id}">Delete</button></div>`;
      resList.appendChild(item);
    });
    resList.querySelectorAll('button[data-id]').forEach(b=>{
      b.addEventListener('click', async (e)=>{
        const id = e.target.dataset.id;
        try { await deleteDoc(doc(db, 'resources', id)); loadResources(); } catch(err){ console.error(err) }
      });
    });
  } catch(err){ resList.innerHTML = '<div class="text-muted">Error loading.</div>'; console.error(err) }
}

resAddBtn?.addEventListener('click', async ()=>{
  const title = resTitle.value.trim(), body = resBody.value.trim();
  if(!title || !body){ resMsg.textContent = 'Fill both fields.'; return; }
  resMsg.textContent = 'Saving...';
  try { await addDoc(collection(db, 'resources'), { title, body, createdAt: Date.now() }); resMsg.textContent = 'Saved.'; resTitle.value=''; resBody.value=''; loadResources(); }
  catch(err){ resMsg.textContent = 'Error: ' + err.message }
});

loadResources();
