/* =========================================
   Echo Path
   Login / Signup UI
========================================= */

import {
    getCurrentUser,
    signInWithEmail,
    signUpWithEmail,
    signOut
}
from "./auth.js";


const authGate =
    document.querySelector("#authGate");

const appRoot =
    document.querySelector("#app");

const loginForm =
    document.querySelector("#loginForm");

const signupForm =
    document.querySelector("#signupForm");

const showLoginButton =
    document.querySelector("#showLoginButton");

const showSignupButton =
    document.querySelector("#showSignupButton");

const loginEmail =
    document.querySelector("#loginEmail");

const loginPassword =
    document.querySelector("#loginPassword");

const signupEmail =
    document.querySelector("#signupEmail");

const signupPassword =
    document.querySelector("#signupPassword");

const signupPasswordConfirm =
    document.querySelector("#signupPasswordConfirm");

const loginButton =
    document.querySelector("#loginButton");

const signupButton =
    document.querySelector("#signupButton");

const loginStatus =
    document.querySelector("#loginStatus");

const currentAccountEmail =
    document.querySelector(
        "#currentAccountEmail"
    );

/* =========================================
   상태 메시지
========================================= */

function setAuthStatus(
    message,
    isError = false
) {

    if (!loginStatus) {
        return;
    }

    loginStatus.textContent =
        message ?? "";

    loginStatus.dataset.state =
        isError
            ? "error"
            : "info";
}


/* =========================================
   앱 / 로그인 화면 전환
========================================= */

async function showAuthenticatedApp() {

    if (authGate) {
        authGate.hidden = true;
    }

    if (appRoot) {
        appRoot.hidden = false;
    }


    /* 현재 로그인 이메일 표시 */

    try {

        const user =
            await getCurrentUser();


        if (
            currentAccountEmail
            &&
            user?.email
        ) {

            currentAccountEmail.textContent =
                user.email;
        }

    } catch (error) {

        console.error(
            "로그인 계정 표시 실패:",
            error
        );


        if (currentAccountEmail) {

            currentAccountEmail.textContent =
                "계정 정보를 불러올 수 없습니다.";
        }
    }
}


function showLoginGate() {

    if (authGate) {
        authGate.hidden = false;
    }

    if (appRoot) {
        appRoot.hidden = true;
    }
}


/* =========================================
   로그인 / 회원가입 탭
========================================= */

function showLoginMode() {

    if (loginForm) {
        loginForm.hidden = false;
    }

    if (signupForm) {
        signupForm.hidden = true;
    }

    if (showLoginButton) {
        showLoginButton.classList.add(
            "active"
        );
    }

    if (showSignupButton) {
        showSignupButton.classList.remove(
            "active"
        );
    }

    setAuthStatus("");
}


function showSignupMode() {

    if (loginForm) {
        loginForm.hidden = true;
    }

    if (signupForm) {
        signupForm.hidden = false;
    }

    if (showLoginButton) {
        showLoginButton.classList.remove(
            "active"
        );
    }

    if (showSignupButton) {
        showSignupButton.classList.add(
            "active"
        );
    }

    setAuthStatus("");
}


/* =========================================
   처음 접속했을 때 로그인 상태 확인
========================================= */

async function initializeAuthentication() {

    try {

        const user =
            await getCurrentUser();

        if (user) {

            showAuthenticatedApp();

        } else {

            showLoginGate();

            showLoginMode();
        }

    } catch (error) {

        console.error(
            "로그인 상태 확인 실패:",
            error
        );

        showLoginGate();

        showLoginMode();
    }
}


/* =========================================
   탭 버튼
========================================= */

if (showLoginButton) {

    showLoginButton.addEventListener(
        "click",
        showLoginMode
    );
}


if (showSignupButton) {

    showSignupButton.addEventListener(
        "click",
        showSignupMode
    );
}


/* =========================================
   로그인
========================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (
                !loginEmail
                ||
                !loginPassword
            ) {
                return;
            }


            if (loginButton) {

                loginButton.disabled =
                    true;
            }


            setAuthStatus(
                "로그인 중..."
            );


            try {

                await signInWithEmail(
                    loginEmail.value,
                    loginPassword.value
                );


                setAuthStatus("");


                window.location.reload();

            } catch (error) {

                console.error(
                    "로그인 실패:",
                    error
                );


                setAuthStatus(
                    "이메일 또는 비밀번호를 확인하세요.",
                    true
                );

            } finally {

                if (loginButton) {

                    loginButton.disabled =
                        false;
                }
            }
        }
    );
}


/* =========================================
   회원가입
========================================= */

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (
                !signupEmail
                ||
                !signupPassword
                ||
                !signupPasswordConfirm
            ) {
                return;
            }


            /* 비밀번호 일치 확인 */

            if (
                signupPassword.value
                !==
                signupPasswordConfirm.value
            ) {

                setAuthStatus(
                    "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
                    true
                );

                return;
            }


            if (signupButton) {

                signupButton.disabled =
                    true;
            }


            setAuthStatus(
                "계정을 만드는 중..."
            );


            try {

                const result =
                    await signUpWithEmail(
                        signupEmail.value,
                        signupPassword.value
                    );


                /*
                    이메일 인증이 꺼져 있으면
                    즉시 session이 생성됨
                */

                if (result.session) {

                    setAuthStatus("");

                    window.location.reload();
                } else {

                if (loginEmail) {

                     loginEmail.value =
                         signupEmail.value.trim();
                }


                alert(
                    "회원가입이 완료되었습니다!\n\n" +
                    "📧 가입한 이메일의 받은편지함으로 이동해 주세요.\n\n" +
                    "Supabase에서 보낸 인증 메일을 열고\n" +
                    "이메일 인증 링크를 반드시 눌러야 합니다.\n\n" +
                    "✅ 이메일 인증 완료 후 Echo Path로 돌아와 로그인해 주세요."
                );


                showLoginMode();


                setAuthStatus(
                    "📧 이메일 인증이 필요합니다. 받은편지함에서 인증 메일을 확인한 후 로그인해 주세요."
                );
            }

            } catch (error) {

                console.error(
                    "회원가입 실패:",
                    error
                );


                const rawMessage =
                    String(
                        error?.message
                        ?? ""
                    )
                    .toLowerCase();


                if (
                    rawMessage.includes(
                        "already registered"
                    )
                    ||
                    rawMessage.includes(
                        "user already registered"
                    )
                ) {

                    setAuthStatus(
                        "이미 가입된 이메일입니다. 로그인해 주세요.",
                        true
                    );

                } else {

                    setAuthStatus(
                        "회원가입에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.",
                        true
                    );
                }

            } finally {

                if (signupButton) {

                    signupButton.disabled =
                        false;
                }
            }
        }
    );
}

/* =========================================
   로그아웃
========================================= */

const logoutButton =
    document.querySelector(
        "#logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut();

                window.location.reload(); 

            } catch (error) {

                console.error(
                    "로그아웃 실패:",
                    error
                );

                alert(
                    "로그아웃 중 오류가 발생했습니다."
                );
            }

        }
    );
}

/* =========================================
   실행
========================================= */

initializeAuthentication();