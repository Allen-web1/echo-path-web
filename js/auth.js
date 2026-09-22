/* =========================================
   Echo Path
   Web Authentication
   GitHub Pages / Android WebView 공용
========================================= */

import {
    supabase
}
from "./supabase.js";


/* =========================================
   Android 앱 브리지
========================================= */

function getAndroidBridge() {

    if (
        typeof window === "undefined"
        ||
        !window.AndroidEchoPath
    ) {
        return null;
    }

    return window.AndroidEchoPath;
}


function createBridgeRequestId() {

    return (
        Date.now().toString(36)
        +
        "-"
        +
        Math.random()
            .toString(36)
            .slice(2)
    );
}


function waitForNativeResult(
    eventName,
    requestId,
    timeoutMs = 20000
) {

    return new Promise(
        (resolve, reject) => {

            let finished = false;

            const cleanup = () => {

                window.removeEventListener(
                    eventName,
                    onResult
                );

                clearTimeout(timer);
            };

            const finish =
                (callback) => {

                    if (finished) {
                        return;
                    }

                    finished = true;
                    cleanup();
                    callback();
                };

            const onResult =
                (event) => {

                    const detail =
                        event?.detail ?? {};

                    if (
                        detail.requestId
                        !==
                        requestId
                    ) {
                        return;
                    }

                    if (
                        detail.success
                        ===
                        true
                    ) {

                        finish(
                            () => resolve()
                        );

                    } else {

                        finish(
                            () => reject(
                                new Error(
                                    detail.message
                                    ||
                                    "Android 연동에 실패했습니다."
                                )
                            )
                        );
                    }
                };

            window.addEventListener(
                eventName,
                onResult
            );

            const timer =
                window.setTimeout(
                    () => {

                        finish(
                            () => reject(
                                new Error(
                                    "Android 연동 시간이 초과되었습니다."
                                )
                            )
                        );

                    },
                    timeoutMs
                );
        }
    );
}


async function syncAndroidLogin(
    email,
    password
) {

    const bridge =
        getAndroidBridge();

    if (
        !bridge
        ||
        typeof bridge.login !== "function"
    ) {
        return;
    }

    const requestId =
        createBridgeRequestId();

    const resultPromise =
        waitForNativeResult(
            "echopath-native-login-result",
            requestId
        );

    try {

        bridge.login(
            email,
            password,
            requestId
        );

    } catch (error) {

        throw new Error(
            "Android 수집기 로그인을 시작하지 못했습니다."
        );
    }

    await resultPromise;
}


async function syncAndroidLogout() {

    const bridge =
        getAndroidBridge();

    if (
        !bridge
        ||
        typeof bridge.logout !== "function"
    ) {
        return;
    }

    const requestId =
        createBridgeRequestId();

    const resultPromise =
        waitForNativeResult(
            "echopath-native-logout-result",
            requestId,
            10000
        );

    bridge.logout(
        requestId
    );

    await resultPromise;
}


function notifyAndroidOfWebUser(
    user
) {

    const bridge =
        getAndroidBridge();

    if (
        !bridge
        ||
        typeof bridge.webSessionReady !== "function"
        ||
        !user
    ) {
        return;
    }

    try {

        bridge.webSessionReady(
            user.email ?? ""
        );

    } catch (error) {

        console.warn(
            "Android 세션 확인 요청 실패:",
            error
        );
    }
}


/*
    웹 세션은 있는데 Android Collector 세션이 없는 경우
    계정 불일치를 막기 위해 이 기기의 웹 세션만 정리합니다.
*/
let handlingNativeSessionMismatch =
    false;


if (
    typeof window !== "undefined"
) {

    window.addEventListener(
        "echopath-native-session-missing",
        async () => {

            if (
                handlingNativeSessionMismatch
            ) {
                return;
            }

            handlingNativeSessionMismatch =
                true;

            try {

                await supabase.auth.signOut({
                    scope: "local"
                });

            } catch (error) {

                console.error(
                    "웹 세션 정리 실패:",
                    error
                );

            } finally {

                window.location.reload();
            }
        }
    );
}


/* =========================================
   현재 로그인 사용자 확인
========================================= */

export async function getCurrentUser() {

    const {
        data,
        error
    } =
        await supabase.auth.getUser();

    if (error) {

        console.error(
            "사용자 확인 실패:",
            error
        );

        return null;
    }

    const user =
        data.user ?? null;

    if (user) {

        notifyAndroidOfWebUser(
            user
        );
    }

    return user;
}


/* =========================================
   이메일 / 비밀번호 로그인
========================================= */

export async function signInWithEmail(
    email,
    password
) {

    const normalizedEmail =
        email.trim();

    const {
        data,
        error
    } =
        await supabase.auth.signInWithPassword({

            email:
                normalizedEmail,

            password:
                password
        });

    if (error) {
        throw error;
    }

    try {

        await syncAndroidLogin(
            normalizedEmail,
            password
        );

    } catch (nativeError) {

        await supabase.auth.signOut({
            scope: "local"
        });

        throw nativeError;
    }

    return data.user;
}


/* =========================================
   이메일 / 비밀번호 회원가입
========================================= */

export async function signUpWithEmail(
    email,
    password
) {

    const normalizedEmail =
        email.trim();

    const {
        data,
        error
    } =
        await supabase.auth.signUp({

            email:
                normalizedEmail,

            password:
                password
        });

    if (error) {
        throw error;
    }


    /*
        Supabase는 이메일 존재 여부 노출을 줄이기 위해
        이미 가입된 계정에 대해 오류 대신 빈 identities를
        반환할 수 있습니다.
    */
    if (
        data.user
        &&
        Array.isArray(
            data.user.identities
        )
        &&
        data.user.identities.length === 0
    ) {

        const alreadyRegisteredError =
            new Error(
                "User already registered"
            );

        alreadyRegisteredError.code =
            "user_already_registered";

        throw alreadyRegisteredError;
    }


    /*
        이메일 인증이 필요한 프로젝트라면 session이 없으므로
        여기서는 네이티브 로그인을 시도하지 않습니다.
        인증 후 실제 로그인할 때 Android Collector가 연결됩니다.
    */
    if (
        !data.session
        ||
        !data.user
    ) {

        return {
            user:
                data.user ?? null,

            session:
                data.session ?? null,

            nativeSyncFailed:
                false
        };
    }


    /*
        이메일 확인 없이 즉시 세션이 발급되는 경우
        Android Collector도 같은 계정으로 연결합니다.

        중요:
        계정 생성 자체가 성공한 뒤 Android 연결만 실패한 경우
        "회원가입 실패"라고 표시하면 사용자가 같은 이메일로
        계속 재가입을 시도하게 됩니다.

        따라서 계정 생성 성공 여부와 네이티브 연결 성공 여부를
        분리해서 반환합니다.
    */
    try {

        await syncAndroidLogin(
            normalizedEmail,
            password
        );

        return {
            user:
                data.user,

            session:
                data.session,

            nativeSyncFailed:
                false
        };

    } catch (nativeError) {

        console.warn(
            "회원가입은 완료됐지만 Android Collector 연결 실패:",
            nativeError
        );

        /*
            웹만 로그인된 상태로 남지 않도록 로컬 웹 세션을 정리합니다.
            계정은 Supabase에 정상 생성된 상태입니다.
            사용자는 로그인 탭에서 한 번 로그인하면 됩니다.
        */
        await supabase.auth.signOut({
            scope: "local"
        });

        return {
            user:
                data.user,

            session:
                null,

            nativeSyncFailed:
                true,

            nativeSyncMessage:
                nativeError?.message
                ??
                "Android Collector 연결 실패"
        };
    }
}


/* =========================================
   로그아웃
========================================= */

export async function signOut() {

    let nativeError =
        null;

    try {

        await syncAndroidLogout();

    } catch (error) {

        nativeError =
            error;

        console.error(
            "Android 로그아웃 연동 실패:",
            error
        );
    }

    const {
        error
    } =
        await supabase.auth.signOut({
            scope: "local"
        });

    if (error) {
        throw error;
    }

    if (nativeError) {

        console.warn(
            "웹 로그아웃은 완료됐지만 Android 세션 정리 중 오류가 있었습니다."
        );
    }
}


/* =========================================
   로그인 여부
========================================= */

export async function isSignedIn() {

    const user =
        await getCurrentUser();

    return Boolean(
        user
    );
}
