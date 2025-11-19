// assets/js/user-panel.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-auth.js";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js";

// UI refs
const userEmailEl = document.getElementById('user-email');
const speakBtn = document.getElementById('speak-btn');
const botInput = document.getElementById('bot-input');
const botSend = document.getElementById('bot-send');
const botOutput = document.getElementById('bot-output');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const summarizeBtn = document.getElementById('summarize-btn');
const textInput = document.getElementById('text-input');
const summaryOutput = document.getElementById('summary-output');
const processing = document.getElementById('processing');
const fileList = document.getElementById('file-list');
const studyPlan = document.getElementById('study-plan');

let currentUid = null;

// summarizer
function summarizeText(text,maxSent=4){
  if(!text) return 'No text provided.';
  const sents = text.match(/[^.!?]+[.!?]?/g)||[text];
  const words = text.toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/).filter(Boolean);
  const freq={}; words.forEach(w=>freq[w]=(freq[w]||0)+1);
  const scores = sents.map(s=>{ const ws=s.toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/).filter(Boolean); let sc=0; ws.forEach(w=>sc+=(freq[w]||0)); sc+=Math.min(20,s.length/12); return sc; });
  const top = scores.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]).slice(0,maxSent).map(x=>x[1]).sort((a,b)=>a-b);
  return top.map(i=>sents[i].trim()).join(' ');
}

// pdf.js extraction
async function extractTextFromPDF(file){
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data:arrayBuffer}).promise;
  let all=''; for(let p=1;p<=pdf.numPages;p++){ const page = await pdf.getPage(p); const txt = await page.getTextContent(); all+=txt.items.map(i=>i.str).join(' ')+'\n'; }
  return all;
}

// save base64
async function saveFileAsBase64(file, uid){
  const maxBytes = 600*1024;
  if(file.size>maxBytes) throw new Error('File too large for prototype.');
  return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=async ()=>{ try{ const base64 = reader.result.split(',')[1]; await addDoc(collection(db,'uploads'),{uid,name:file.name,type:file.type,base64,createdAt:Date.now()}); resolve(); }catch(e){reject(e);} }; reader.onerror=()=>reject(reader.error); reader.readAsDataURL(file); });
}

// load files
async function loadUserFiles(uid){
  fileList.innerHTML='<div class="text-muted">Loading files...</div>';
  try{
    const q = query(collection(db,'uploads'), where('uid','==',uid));
    const snap = await getDocs(q);
    if(snap.empty){ fileList.innerHTML='<div class="text-muted">No files yet.</div>'; return; }
    fileList.innerHTML='';
    snap.forEach(docSnap=>{ const d=docSnap.data(); const item=document.createElement('div'); item.className='file-item'; item.innerHTML = `<div style="font-size:13px">${d.name}</div><div style="display:flex;gap:8px"><button class="btn small" data-id="${docSnap.id}">View</button><button class="btn small danger" data-del="${docSnap.id}">Delete</button></div>`; fileList.appendChild(item); });
    fileList.querySelectorAll('button[data-id]').forEach(b=>b.addEventListener('click', async (e)=>{ const id = e.target.dataset.id; const snaps = await getDocs(collection(db,'uploads')); const found = snaps.docs.find(x=>x.id===id); if(!found) return; const d=found.data(); const blob = b64toBlob(d.base64, d.type); const url = URL.createObjectURL(blob); window.open(url,'_blank'); }));
    fileList.querySelectorAll('button[data-del]').forEach(b=>b.addEventListener('click', async (e)=>{ const id = e.target.dataset.del; if(!confirm('Delete this file?')) return; await deleteDoc(doc(db,'uploads',id)); loadUserFiles(currentUid); }));
  }catch(err){ console.error(err); fileList.innerHTML='<div class="text-muted">Error loading files.</div>'; }
}
function b64toBlob(b64, type=''){ const byteCharacters=atob(b64); const byteArrays=[]; for(let offset=0; offset<byteCharacters.length; offset+=512){ const slice = byteCharacters.slice(offset, offset+512); const byteNumbers = new Array(slice.length); for(let i=0;i<slice.length;i++) byteNumbers[i]=slice.charCodeAt(i); const byteArray = new Uint8Array(byteNumbers); byteArrays.push(byteArray); } return new Blob(byteArrays,{type}); }

// study plan
function generatePlanFromText(text){ if(!text) return 'No timetable found.'; const lines = text.split('\n').map(l=>l.trim()).filter(Boolean); const dateRe=/\d{4}-\d{2}-\d{2}/; const tasks = lines.map(l=>({line:l,date:(l.match(dateRe)||[])[0]||'no-date'})); if(!tasks.length) return 'No tasks found.'; let out='Quick plan:\n'; tasks.slice(0,8).forEach((t,i)=> out+=`${i+1}. ${t.line}\n`); return out; }

// bot reply
function botReply(text){ const q = text.toLowerCase(); if(/hackholics|hi|hello|hey/.test(q)) return "Hello! I'm Hackholics — your study robot. Ask to summarize notes or upload a PDF."; if(q.includes('summarize')) return 'Paste/upload notes and press Summarize.'; if(q.includes('greedy')||q.includes('algorithm')) return 'Greedy algorithm picks local best choices each step.'; return "I am a study assistant prototype. Try 'summarize my notes'."; }

// speech
const SpeechRecognition = window.SpeechRecognition||window.webkitSpeechRecognition;
let recognition = null;
if(SpeechRecognition){ recognition = new SpeechRecognition(); recognition.lang='en-US'; recognition.interimResults=false; recognition.maxAlternatives=1; }

function speak(text){ if(!window.speechSynthesis){ botOutput.textContent = text; return; } const u=new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=1; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); botOutput.textContent = text; }

// speak button
document.getElementById('speak-btn')?.addEventListener('click', ()=>{ if(!recognition){ botOutput.textContent='Speech recognition not supported.'; return; } botOutput.textContent='Listening...'; recognition.start(); recognition.onresult = (ev)=>{ const txt = ev.results[0][0].transcript; botInput.value = txt; const reply = botReply(txt); speak(reply); }; recognition.onerror = (e)=> botOutput.textContent = 'Speech error: '+e.error; });

// send
document.getElementById('bot-send')?.addEventListener('click', ()=>{ const q = botInput.value.trim(); if(!q) return; const r = botReply(q); speak(r); });

// summarize
document.getElementById('summarize-btn')?.addEventListener('click', ()=>{ processing.textContent='AI thinking...'; setTimeout(()=>{ const s = summarizeText(textInput.value,5); summaryOutput.textContent = s; studyPlan.textContent = generatePlanFromText(textInput.value); processing.textContent=''; },700); });

// upload
document.getElementById('upload-btn')?.addEventListener('click', async ()=>{ const file = fileInput.files[0]; if(!file){ processing.textContent='Pick a file first.'; return; } processing.textContent='Processing...'; try{ if(file.type==='application/pdf'){ const txt = await extractTextFromPDF(file); textInput.value = txt; summaryOutput.textContent = summarizeText(txt,6); studyPlan.textContent = generatePlanFromText(txt); await saveFileAsBase64(file,currentUid); processing.textContent='PDF processed & uploaded.'; loadUserFiles(currentUid); } else if(file.type.startsWith('text')){ const txt = await file.text(); textInput.value = txt; summaryOutput.textContent = summarizeText(txt,6); studyPlan.textContent = generatePlanFromText(txt); await saveFileAsBase64(file,currentUid); processing.textContent='Text uploaded.'; loadUserFiles(currentUid); } else { processing.textContent='Unsupported file type for prototype.'; } }catch(err){ console.error(err); processing.textContent='Error: '+err.message; } });

// auth load
onAuthStateChanged(auth, (user)=>{ if(user){ currentUid = user.uid; userEmailEl.textContent = user.email; loadUserFiles(currentUid); } else { userEmailEl.textContent = 'Not signed in'; } });
