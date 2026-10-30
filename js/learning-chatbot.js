/* =========================================================
   Echo Path Learning Chatbot - Supabase Conversation History
   기존 Echo Path 기능과 독립 동작
   - 대화목록/메시지: Supabase 계정별 저장
   - learning-chat Edge Function: 기존 그대로 사용
   - 플로팅 아이콘 위치만 localStorage 사용
========================================================= */

import { supabase } from "./supabase.js";

const FUNCTION_NAME = "learning-chat";
const POSITION_STORAGE_KEY = "echoPathLearningChatPosition";

let currentUser = null;
let conversations = [];
let activeConversationId = null;
let activeMessages = [];
let isSending = false;
let isLoadingConversation = false;

let launcherDragging = false;
let launcherMoved = false;
let dragStartX = 0;
let dragStartY = 0;
let launcherStartLeft = 0;
let launcherStartTop = 0;


/* =========================================================
   UI 생성
========================================================= */

function createChatbotUi() {
    const root = document.createElement("div");

    root.className = "echo-chat-root";
    root.id = "echoLearningChatbotRoot";

    root.innerHTML = `
        <button
            class="echo-chat-launcher"
            id="echoChatLauncher"
            type="button"
            aria-label="AI 학습 도우미 열기"
            title="AI 학습 도우미"
        >
            <svg
                class="echo-chat-launcher-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    d="M5 4.75h14A2.25 2.25 0 0 1 21.25 7v8A2.25 2.25 0 0 1 19 17.25h-7.35L7.2 20.6a.75.75 0 0 1-1.2-.6v-2.75H5A2.25 2.25 0 0 1 2.75 15V7A2.25 2.25 0 0 1 5 4.75Z"
                    fill="currentColor"
                />
                <circle cx="8" cy="11" r="1.2" fill="#3867f4"/>
                <circle cx="12" cy="11" r="1.2" fill="#3867f4"/>
                <circle cx="16" cy="11" r="1.2" fill="#3867f4"/>
            </svg>
        </button>

        <section
            class="echo-chat-panel"
            id="echoChatPanel"
            aria-label="AI 학습 도우미"
            hidden
        >
            <header class="echo-chat-head">
                <div class="echo-chat-title">
                    <small>LEARNING ASSISTANT</small>
                    <strong>AI 학습 도우미</strong>
                </div>

                <div class="echo-chat-actions">
                    <button id="echoChatHistory" type="button">대화목록</button>
                    <button id="echoChatNew" type="button">새 대화</button>
                    <button id="echoChatHide" type="button">숨김</button>
                </div>
            </header>

            <div
                class="echo-chat-history-view"
                id="echoChatHistoryView"
                hidden
            >
                <div class="echo-chat-history-top">
                    <div>
                        <small>CONVERSATIONS</small>
                        <strong>대화 기록</strong>
                    </div>

                    <button
                        class="echo-chat-history-close"
                        id="echoChatHistoryClose"
                        type="button"
                    >
                        현재 대화
                    </button>
                </div>

                <div
                    class="echo-chat-history-list"
                    id="echoChatHistoryList"
                ></div>
            </div>

            <div
                class="echo-chat-main-view"
                id="echoChatMainView"
            >
                <div
                    class="echo-chat-messages"
                    id="echoChatMessages"
                    aria-live="polite"
                ></div>

                <form
                    class="echo-chat-compose"
                    id="echoChatForm"
                >
                    <div class="echo-chat-row">
                        <textarea
                            class="echo-chat-input"
                            id="echoChatInput"
                            rows="1"
                            placeholder="학습에 대해 무엇이든 질문해 보세요."
                            aria-label="학습 질문 입력"
                        ></textarea>

                        <button
                            class="echo-chat-send"
                            id="echoChatSend"
                            type="submit"
                        >
                            전송
                        </button>
                    </div>

                    <p class="echo-chat-hint">
                        Enter 전송 · Shift+Enter 줄바꿈 · 긴 질문 가능
                    </p>
                </form>
            </div>
        </section>
    `;

    const app = document.querySelector("#app");

    if (!app) {
        throw new Error("Echo Path #app을 찾을 수 없습니다.");
    }

    app.appendChild(root);

    return root;
}


const root = createChatbotUi();

const launcher = root.querySelector("#echoChatLauncher");
const panel = root.querySelector("#echoChatPanel");
const mainView = root.querySelector("#echoChatMainView");
const historyView = root.querySelector("#echoChatHistoryView");
const historyList = root.querySelector("#echoChatHistoryList");
const historyButton = root.querySelector("#echoChatHistory");
const historyCloseButton = root.querySelector("#echoChatHistoryClose");
const messagesElement = root.querySelector("#echoChatMessages");
const form = root.querySelector("#echoChatForm");
const input = root.querySelector("#echoChatInput");
const sendButton = root.querySelector("#echoChatSend");
const hideButton = root.querySelector("#echoChatHide");
const newButton = root.querySelector("#echoChatNew");


/* =========================================================
   공통 표시 함수
========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function createTitleFromText(text) {
    const cleaned = String(text ?? "")
        .replace(/\s+/g, " ")
        .trim();

    if (!cleaned) return "새 대화";

    return cleaned.length > 28
        ? `${cleaned.slice(0, 28).trim()}…`
        : cleaned;
}

function formatConversationDate(isoString) {
    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const now = new Date();

    const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const target = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    const differenceDays = Math.round(
        (today.getTime() - target.getTime())
        / 86400000
    );

    if (differenceDays === 0) {
        return `오늘 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }

    if (differenceDays === 1) {
        return "어제";
    }

    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function renderMessages() {
    messagesElement.innerHTML = `
        <p class="echo-chat-welcome">
            저는 Echo Path의 학습 전용 AI 도우미입니다.
            교과 개념, 문제 풀이, 탐구, 과제, 발표 준비, 공부 방법 등을 질문해 주세요.
        </p>
    `;

    activeMessages.forEach((item) => {
        const wrapper = document.createElement("div");

        wrapper.className =
            `echo-chat-msg ${item.role}`;

        wrapper.innerHTML = `
            <span class="echo-chat-label">${item.role === "user" ? "나" : "AI"}</span>
            <div class="echo-chat-bubble">${escapeHtml(item.content)}</div>
        `;

        messagesElement.appendChild(wrapper);
    });

    messagesElement.scrollTop =
        messagesElement.scrollHeight;
}

function renderHistory() {
    historyList.innerHTML = "";

    if (conversations.length === 0) {
        historyList.innerHTML =
            `<p class="echo-chat-history-empty">저장된 대화가 없습니다.</p>`;
        return;
    }

    conversations.forEach((conversation) => {
        const item = document.createElement("div");

        item.className =
            "echo-chat-history-item";

        if (conversation.id === activeConversationId) {
            item.classList.add("active");
        }

        item.innerHTML = `
            <button
                type="button"
                class="echo-chat-history-open"
                data-conversation-id="${escapeHtml(conversation.id)}"
            >
                <strong>${escapeHtml(conversation.title || "새 대화")}</strong>
                <span>${escapeHtml(formatConversationDate(conversation.updated_at))}</span>
            </button>

            <button
                type="button"
                class="echo-chat-history-delete"
                data-delete-conversation-id="${escapeHtml(conversation.id)}"
                aria-label="대화 삭제"
                title="대화 삭제"
            >
                ×
            </button>
        `;

        historyList.appendChild(item);
    });
}

function showMainView() {
    historyView.hidden = true;
    mainView.hidden = false;

    renderMessages();

    window.setTimeout(
        () => input.focus(),
        30
    );
}

function showHistoryView() {
    mainView.hidden = true;
    historyView.hidden = false;

    renderHistory();
}

function openChat() {
    panel.hidden = false;
    launcher.hidden = true;

    showMainView();
}

function hideChat() {
    panel.hidden = true;
    launcher.hidden = false;
}

function autoResizeInput() {
    input.style.height = "auto";

    input.style.height =
        `${Math.min(input.scrollHeight, 132)}px`;
}


/* =========================================================
   Supabase 대화 저장
========================================================= */

async function loadConversations() {
    if (!currentUser) {
        conversations = [];
        activeConversationId = null;
        activeMessages = [];
        return;
    }

    const {
        data,
        error
    } =
        await supabase
            .from("learning_chat_conversations")
            .select("id,title,created_at,updated_at")
            .eq("user_id", currentUser.id)
            .order("updated_at", {
                ascending: false
            });

    if (error) {
        throw error;
    }

    conversations =
        data ?? [];
}

async function createNewConversation({
    openImmediately = true
} = {}) {
    if (!currentUser) {
        throw new Error("로그인이 필요합니다.");
    }

    const {
        data,
        error
    } =
        await supabase
            .from("learning_chat_conversations")
            .insert({
                user_id: currentUser.id,
                title: "새 대화"
            })
            .select("id,title,created_at,updated_at")
            .single();

    if (error) {
        throw error;
    }

    conversations =
        [
            data,
            ...conversations.filter(
                (item) =>
                    item.id !== data.id
            )
        ];

    activeConversationId =
        data.id;

    activeMessages =
        [];

    if (openImmediately) {
        showMainView();
    }

    return data;
}

async function ensureActiveConversation() {
    if (
        activeConversationId
        &&
        conversations.some(
            (item) =>
                item.id === activeConversationId
        )
    ) {
        return activeConversationId;
    }

    if (conversations.length > 0) {
        activeConversationId =
            conversations[0].id;

        await loadMessages(
            activeConversationId
        );

        return activeConversationId;
    }

    const conversation =
        await createNewConversation({
            openImmediately: false
        });

    return conversation.id;
}

async function loadMessages(conversationId) {
    if (!currentUser || !conversationId) {
        activeMessages = [];
        return;
    }

    isLoadingConversation =
        true;

    try {
        const {
            data,
            error
        } =
            await supabase
                .from("learning_chat_messages")
                .select("id,role,content,created_at")
                .eq(
                    "conversation_id",
                    conversationId
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        activeMessages =
            (data ?? []).map(
                (item) => ({
                    id: item.id,
                    role: item.role,
                    content: item.content,
                    created_at: item.created_at
                })
            );
    }
    finally {
        isLoadingConversation =
            false;
    }
}

async function openConversation(conversationId) {
    if (
        isLoadingConversation
        ||
        !conversationId
    ) {
        return;
    }

    activeConversationId =
        conversationId;

    try {
        await loadMessages(
            conversationId
        );

        showMainView();
    }
    catch (error) {
        console.error(
            "대화 불러오기 실패:",
            error
        );

        window.alert(
            "대화 내용을 불러오지 못했습니다."
        );
    }
}

async function deleteConversation(conversationId) {
    const target =
        conversations.find(
            (item) =>
                item.id === conversationId
        );

    if (!target) {
        return;
    }

    const confirmed =
        window.confirm(
            `"${target.title || "이 대화"}"를 삭제할까요?`
        );

    if (!confirmed) {
        return;
    }

    const {
        error
    } =
        await supabase
            .from("learning_chat_conversations")
            .delete()
            .eq(
                "id",
                conversationId
            )
            .eq(
                "user_id",
                currentUser.id
            );

    if (error) {
        console.error(
            "대화 삭제 실패:",
            error
        );

        window.alert(
            "대화를 삭제하지 못했습니다."
        );

        return;
    }

    conversations =
        conversations.filter(
            (item) =>
                item.id !== conversationId
        );

    if (
        activeConversationId
        ===
        conversationId
    ) {
        activeConversationId =
            null;

        activeMessages =
            [];

        await ensureActiveConversation();
    }

    renderHistory();
}

async function insertMessage({
    conversationId,
    role,
    content
}) {
    const {
        data,
        error
    } =
        await supabase
            .from("learning_chat_messages")
            .insert({
                conversation_id: conversationId,
                user_id: currentUser.id,
                role,
                content
            })
            .select("id,role,content,created_at")
            .single();

    if (error) {
        throw error;
    }

    return data;
}

async function touchConversation(
    conversationId,
    title = null
) {
    const updates = {
        updated_at:
            new Date().toISOString()
    };

    if (title) {
        updates.title =
            title;
    }

    const {
        data,
        error
    } =
        await supabase
            .from("learning_chat_conversations")
            .update(updates)
            .eq(
                "id",
                conversationId
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .select("id,title,created_at,updated_at")
            .single();

    if (error) {
        throw error;
    }

    conversations =
        [
            data,
            ...conversations.filter(
                (item) =>
                    item.id !== data.id
            )
        ];

    return data;
}


/* =========================================================
   AI 요청
========================================================= */

function showTypingIndicator() {
    const wrapper =
        document.createElement("div");

    wrapper.className =
        "echo-chat-msg assistant";

    wrapper.id =
        "echoChatTyping";

    wrapper.innerHTML = `
        <span class="echo-chat-label">AI</span>
        <div class="echo-chat-bubble echo-chat-typing">
            답변을 생각하고 있습니다...
        </div>
    `;

    messagesElement.appendChild(
        wrapper
    );

    messagesElement.scrollTop =
        messagesElement.scrollHeight;
}

function removeTypingIndicator() {
    document.querySelector(
        "#echoChatTyping"
    )?.remove();
}

function showErrorMessage(message) {
    const wrapper =
        document.createElement("div");

    wrapper.className =
        "echo-chat-msg assistant";

    wrapper.innerHTML = `
        <span class="echo-chat-label">AI</span>
        <div class="echo-chat-bubble echo-chat-error">
            ${escapeHtml(message)}
        </div>
    `;

    messagesElement.appendChild(
        wrapper
    );

    messagesElement.scrollTop =
        messagesElement.scrollHeight;
}

async function sendMessage() {
    const content =
        String(
            input.value
            ?? ""
        ).trim();

    if (
        !content
        ||
        isSending
        ||
        !currentUser
    ) {
        return;
    }

    isSending =
        true;

    sendButton.disabled =
        true;

    try {
        await ensureActiveConversation();

        const isFirstUserMessage =
            !activeMessages.some(
                (item) =>
                    item.role === "user"
            );

        const savedUserMessage =
            await insertMessage({
                conversationId:
                    activeConversationId,
                role:
                    "user",
                content
            });

        activeMessages.push({
            id:
                savedUserMessage.id,
            role:
                savedUserMessage.role,
            content:
                savedUserMessage.content,
            created_at:
                savedUserMessage.created_at
        });

        const title =
            isFirstUserMessage
                ? createTitleFromText(
                    content
                )
                : null;

        await touchConversation(
            activeConversationId,
            title
        );

        input.value =
            "";

        autoResizeInput();
        renderMessages();
        showTypingIndicator();

        const payloadMessages =
            activeMessages.map(
                (item) => ({
                    role:
                        item.role,
                    content:
                        item.content
                })
            );

        const {
            data,
            error
        } =
            await supabase
                .functions
                .invoke(
                    FUNCTION_NAME,
                    {
                        body: {
                            messages:
                                payloadMessages
                        }
                    }
                );

        if (error) {
            throw error;
        }

        const reply =
            String(
                data?.reply
                ?? ""
            ).trim();

        if (!reply) {
            throw new Error(
                "AI 답변이 비어 있습니다."
            );
        }

        const savedAssistantMessage =
            await insertMessage({
                conversationId:
                    activeConversationId,
                role:
                    "assistant",
                content:
                    reply
            });

        activeMessages.push({
            id:
                savedAssistantMessage.id,
            role:
                savedAssistantMessage.role,
            content:
                savedAssistantMessage.content,
            created_at:
                savedAssistantMessage.created_at
        });

        await touchConversation(
            activeConversationId
        );

        removeTypingIndicator();
        renderMessages();
    }
    catch (error) {
        removeTypingIndicator();

        console.error(
            "AI 학습 도우미 요청 실패:",
            error
        );

        showErrorMessage(
            "답변을 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요."
        );
    }
    finally {
        isSending =
            false;

        sendButton.disabled =
            false;

        input.focus();
    }
}


/* =========================================================
   이벤트
========================================================= */

form.addEventListener(
    "submit",
    (event) => {
        event.preventDefault();
        void sendMessage();
    }
);

input.addEventListener(
    "input",
    autoResizeInput
);

input.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Enter"
            &&
            !event.shiftKey
            &&
            !event.isComposing
        ) {
            event.preventDefault();
            void sendMessage();
        }
    }
);

hideButton.addEventListener(
    "click",
    hideChat
);

newButton.addEventListener(
    "click",
    async () => {
        if (!currentUser || isSending) {
            return;
        }

        try {
            await createNewConversation();
        }
        catch (error) {
            console.error(
                "새 대화 생성 실패:",
                error
            );

            window.alert(
                "새 대화를 만들지 못했습니다."
            );
        }
    }
);

historyButton.addEventListener(
    "click",
    async () => {
        try {
            await loadConversations();
            showHistoryView();
        }
        catch (error) {
            console.error(
                "대화목록 불러오기 실패:",
                error
            );

            window.alert(
                "대화목록을 불러오지 못했습니다."
            );
        }
    }
);

historyCloseButton.addEventListener(
    "click",
    showMainView
);

historyList.addEventListener(
    "click",
    (event) => {
        const openButton =
            event.target.closest(
                "[data-conversation-id]"
            );

        if (openButton) {
            void openConversation(
                openButton.dataset.conversationId
            );

            return;
        }

        const deleteButton =
            event.target.closest(
                "[data-delete-conversation-id]"
            );

        if (deleteButton) {
            void deleteConversation(
                deleteButton.dataset.deleteConversationId
            );
        }
    }
);


/* =========================================================
   플로팅 아이콘 위치
========================================================= */

function clamp(value, min, max) {
    return Math.min(
        Math.max(
            value,
            min
        ),
        max
    );
}

function saveLauncherPosition() {
    try {
        const rect =
            launcher.getBoundingClientRect();

        localStorage.setItem(
            POSITION_STORAGE_KEY,
            JSON.stringify({
                left:
                    rect.left,
                top:
                    rect.top
            })
        );
    }
    catch {}
}

function restoreLauncherPosition() {
    try {
        const raw =
            localStorage.getItem(
                POSITION_STORAGE_KEY
            );

        if (!raw) {
            return;
        }

        const position =
            JSON.parse(
                raw
            );

        const left =
            Number(
                position?.left
            );

        const top =
            Number(
                position?.top
            );

        if (
            !Number.isFinite(left)
            ||
            !Number.isFinite(top)
        ) {
            return;
        }

        const width =
            launcher.offsetWidth
            || 56;

        const height =
            launcher.offsetHeight
            || 56;

        launcher.style.right =
            "auto";

        launcher.style.bottom =
            "auto";

        launcher.style.left =
            `${clamp(
                left,
                8,
                Math.max(
                    8,
                    window.innerWidth
                    -
                    width
                    -
                    8
                )
            )}px`;

        launcher.style.top =
            `${clamp(
                top,
                8,
                Math.max(
                    8,
                    window.innerHeight
                    -
                    height
                    -
                    82
                )
            )}px`;
    }
    catch {}
}

launcher.addEventListener(
    "pointerdown",
    (event) => {
        launcherDragging =
            true;

        launcherMoved =
            false;

        dragStartX =
            event.clientX;

        dragStartY =
            event.clientY;

        const rect =
            launcher.getBoundingClientRect();

        launcherStartLeft =
            rect.left;

        launcherStartTop =
            rect.top;

        launcher.setPointerCapture(
            event.pointerId
        );
    }
);

launcher.addEventListener(
    "pointermove",
    (event) => {
        if (!launcherDragging) {
            return;
        }

        const dx =
            event.clientX
            -
            dragStartX;

        const dy =
            event.clientY
            -
            dragStartY;

        if (
            Math.abs(dx)
            +
            Math.abs(dy)
            >
            5
        ) {
            launcherMoved =
                true;
        }

        const width =
            launcher.offsetWidth
            || 56;

        const height =
            launcher.offsetHeight
            || 56;

        launcher.style.right =
            "auto";

        launcher.style.bottom =
            "auto";

        launcher.style.left =
            `${clamp(
                launcherStartLeft
                +
                dx,
                8,
                Math.max(
                    8,
                    window.innerWidth
                    -
                    width
                    -
                    8
                )
            )}px`;

        launcher.style.top =
            `${clamp(
                launcherStartTop
                +
                dy,
                8,
                Math.max(
                    8,
                    window.innerHeight
                    -
                    height
                    -
                    82
                )
            )}px`;
    }
);

launcher.addEventListener(
    "pointerup",
    (event) => {
        if (!launcherDragging) {
            return;
        }

        launcherDragging =
            false;

        try {
            launcher.releasePointerCapture(
                event.pointerId
            );
        }
        catch {}

        if (launcherMoved) {
            saveLauncherPosition();
        }
        else {
            openChat();
        }
    }
);

launcher.addEventListener(
    "pointercancel",
    () => {
        launcherDragging =
            false;
    }
);

window.addEventListener(
    "resize",
    restoreLauncherPosition
);


/* =========================================================
   로그인 사용자 초기화
========================================================= */

async function initializeForSession(session) {
    currentUser =
        session?.user
        ?? null;

    conversations =
        [];

    activeConversationId =
        null;

    activeMessages =
        [];

    if (!currentUser) {
        renderMessages();
        hideChat();
        return;
    }

    try {
        await loadConversations();

        await ensureActiveConversation();

        if (activeConversationId) {
            await loadMessages(
                activeConversationId
            );
        }

        renderMessages();
        restoreLauncherPosition();
    }
    catch (error) {
        console.error(
            "AI 학습 도우미 초기화 실패:",
            error
        );
    }
}


const {
    data: sessionData
} =
    await supabase.auth.getSession();

await initializeForSession(
    sessionData?.session
    ?? null
);


supabase.auth.onAuthStateChange(
    (_event, session) => {
        void initializeForSession(
            session
        );
    }
);
