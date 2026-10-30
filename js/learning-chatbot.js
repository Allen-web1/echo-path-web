import { supabase } from "./supabase.js";

const FUNCTION_NAME = "learning-chat";
const STORE_PREFIX = "echoPathLearningChat";
const POS_KEY = "echoPathLearningChatPosition";
let userId = "guest", messages = [], sending = false;
let dragging = false, moved = false, sx = 0, sy = 0, sl = 0, st = 0;

const app = document.querySelector("#app");
if (!app) throw new Error("Echo Path #app을 찾을 수 없습니다.");

const root = document.createElement("div");
root.className = "echo-chat-root";
root.innerHTML = `
<button class="echo-chat-launcher" id="echoChatLauncher" type="button" aria-label="Echo 학습 도우미 열기">AI</button>
<section class="echo-chat-panel" id="echoChatPanel" hidden>
  <header class="echo-chat-head">
    <div class="echo-chat-title"><small>LEARNING ASSISTANT</small><strong>Echo 학습 도우미</strong></div>
    <div class="echo-chat-actions">
      <button id="echoChatNew" type="button">새 대화</button>
      <button id="echoChatHide" type="button">숨김</button>
    </div>
  </header>
  <div class="echo-chat-messages" id="echoChatMessages" aria-live="polite"></div>
  <form class="echo-chat-compose" id="echoChatForm">
    <div class="echo-chat-row">
      <textarea class="echo-chat-input" id="echoChatInput" rows="1" placeholder="학습에 대해 무엇이든 질문해 보세요."></textarea>
      <button class="echo-chat-send" id="echoChatSend" type="submit">전송</button>
    </div>
    <p class="echo-chat-hint">Enter 전송 · Shift+Enter 줄바꿈 · 긴 질문 가능</p>
  </form>
</section>`;
app.appendChild(root);

const launcher = root.querySelector("#echoChatLauncher");
const panel = root.querySelector("#echoChatPanel");
const box = root.querySelector("#echoChatMessages");
const form = root.querySelector("#echoChatForm");
const input = root.querySelector("#echoChatInput");
const send = root.querySelector("#echoChatSend");
const hide = root.querySelector("#echoChatHide");
const fresh = root.querySelector("#echoChatNew");

const key = () => `${STORE_PREFIX}_${userId}`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(key()) || "[]");
    messages = Array.isArray(v) ? v.filter(x => x && ["user","assistant"].includes(x.role) && typeof x.content === "string").slice(-160) : [];
  } catch { messages = []; }
}
function save() {
  try { localStorage.setItem(key(), JSON.stringify(messages.slice(-160))); } catch {}
}
function render() {
  box.innerHTML = `<p class="echo-chat-welcome">저는 Echo Path의 학습 전용 AI 도우미입니다. 교과 개념, 문제 풀이, 탐구, 과제, 발표 준비, 공부 방법 등을 질문해 주세요.</p>`;
  for (const m of messages) {
    const el = document.createElement("div");
    el.className = `echo-chat-msg ${m.role}`;
    el.innerHTML = `<span class="echo-chat-label">${m.role === "user" ? "나" : "Echo AI"}</span><div class="echo-chat-bubble">${esc(m.content)}</div>`;
    box.appendChild(el);
  }
  box.scrollTop = box.scrollHeight;
}
function openChat(){ panel.hidden=false; launcher.hidden=true; render(); setTimeout(()=>input.focus(),50); }
function hideChat(){ panel.hidden=true; launcher.hidden=false; }
function resizeInput(){ input.style.height="auto"; input.style.height=Math.min(input.scrollHeight,132)+"px"; }

async function ask() {
  const content = input.value.trim();
  if (!content || sending) return;
  sending = true; send.disabled = true;
  messages.push({role:"user",content}); save(); input.value=""; resizeInput(); render();

  const typing = document.createElement("div");
  typing.className="echo-chat-msg assistant";
  typing.innerHTML=`<span class="echo-chat-label">Echo AI</span><div class="echo-chat-bubble echo-chat-typing">답변을 생각하고 있습니다...</div>`;
  box.appendChild(typing); box.scrollTop=box.scrollHeight;

  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME,{body:{messages}});
    if (error) throw error;
    const reply = String(data?.reply ?? "").trim();
    if (!reply) throw new Error("empty reply");
    messages.push({role:"assistant",content:reply}); save(); render();
  } catch (e) {
    console.error("Echo 학습 도우미:",e);
    typing.remove();
    const err=document.createElement("div");
    err.className="echo-chat-msg assistant";
    err.innerHTML=`<span class="echo-chat-label">Echo AI</span><div class="echo-chat-bubble echo-chat-error">답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>`;
    box.appendChild(err);
  } finally {
    sending=false; send.disabled=false; input.focus();
  }
}

form.addEventListener("submit",e=>{e.preventDefault();void ask();});
input.addEventListener("input",resizeInput);
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();void ask();}});
hide.addEventListener("click",hideChat);
fresh.addEventListener("click",()=>{if(confirm("현재 대화를 지우고 새 대화를 시작할까요?")){messages=[];save();render();input.focus();}});

const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
function savePos(){const r=launcher.getBoundingClientRect();localStorage.setItem(POS_KEY,JSON.stringify({left:r.left,top:r.top}));}
function restorePos(){
  try{
    const p=JSON.parse(localStorage.getItem(POS_KEY)||"null"); if(!p)return;
    launcher.style.right="auto";launcher.style.bottom="auto";
    launcher.style.left=clamp(Number(p.left),8,window.innerWidth-64)+"px";
    launcher.style.top=clamp(Number(p.top),8,window.innerHeight-138)+"px";
  }catch{}
}
launcher.addEventListener("pointerdown",e=>{dragging=true;moved=false;sx=e.clientX;sy=e.clientY;const r=launcher.getBoundingClientRect();sl=r.left;st=r.top;launcher.setPointerCapture(e.pointerId);});
launcher.addEventListener("pointermove",e=>{if(!dragging)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;launcher.style.right="auto";launcher.style.bottom="auto";launcher.style.left=clamp(sl+dx,8,window.innerWidth-64)+"px";launcher.style.top=clamp(st+dy,8,window.innerHeight-138)+"px";});
launcher.addEventListener("pointerup",e=>{if(!dragging)return;dragging=false;try{launcher.releasePointerCapture(e.pointerId)}catch{} if(moved)savePos();else openChat();});
launcher.addEventListener("pointercancel",()=>dragging=false);
window.addEventListener("resize",restorePos);

const { data } = await supabase.auth.getSession();
userId = data?.session?.user?.id || "guest";
load(); render(); restorePos();

supabase.auth.onAuthStateChange((_event,session)=>{userId=session?.user?.id||"guest";load();render();hideChat();});
