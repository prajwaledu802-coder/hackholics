// assets/js/auth.js
import { auth } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.6.1/firebase-auth.js";

// Signup
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const pw = document.getElementById('signup-password').value;
  const msg = document.getElementById('signup-msg');
  msg.textContent = 'Creating...';
  try { await createUserWithEmailAndPassword(auth, email, pw); msg.textContent = 'Created. Redirecting...'; setTimeout(()=>location.href='user-panel.html',700); }
  catch(err){ msg.textContent = 'Error: '+err.message; }
});

// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pw = document.getElementById('login-password').value;
  const msg = document.getElementById('login-msg');
  msg.textContent = 'Signing in...';
  try { await signInWithEmailAndPassword(auth, email, pw); msg.textContent='Signed in. Redirecting...'; setTimeout(()=>location.href='user-panel.html',400); }
  catch(err){ msg.textContent='Error: '+err.message; }
});

// Guard dashboard
onAuthStateChanged(auth, (user)=>{ if(location.pathname.includes('user-panel.html') && !user) location.href='login.html'; });

// Logout
document.getElementById('logout-btn')?.addEventListener('click', async ()=>{ await signOut(auth); location.href='index.html'; });
