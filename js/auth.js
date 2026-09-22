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
        + "-"
        + Math.random()
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


            const finish = (
                callback
            ) => {

                if (finished) {
                    return;
                }

                finished = true;
                cleanup();
                callback();
            };


            const onResult = (
                event
            ) => {

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
    WebView의 저장된 웹 세션은 살아 있지만
    Android Collector 세션이 없는 예외 상황에서는
    두 계정이 어긋난 채 데이터를 수집하지 않도록
    웹 세션을 로컬에서 정리하고 한 번 다시 로그인한다.
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
   1. 현재 로그인 사용자 확인
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
   2. 이메일 / 비밀번호 로그인
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

        /*
            Android 앱 안에서 로그인한 경우에만 실행된다.
            일반 브라우저에서는 아무 동작도 하지 않는다.
        */
        await syncAndroidLogin(
            normalizedEmail,
            password
        );

    } catch (nativeError) {

        /*
            웹만 로그인되고 Collector가 다른 계정/비로그인 상태가 되는 것을
            방지하기 위해 이 기기의 웹 세션만 되돌린다.
        */
        await supabase.auth.signOut({
            scope: "local"
        });

        throw nativeError;
    }


    return data.user;
}


/* =========================================
   3. 이메일 / 비밀번호 회원가입
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
        이메일 확인 없이 즉시 세션이 발급되는 설정이라면
        Android Collector도 같은 계정으로 연결한다.
        이메일 확인이 필요한 경우에는 이후 실제 로그인 때 연결된다.
    */
    if (
        data.session
        &&
        data.user
    ) {

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
    }


    return {
        user:
            data.user ?? null,

        session:
            data.session ?? null
    };
}


/* =========================================
   4. 로그아웃
========================================= */

export async function signOut() {

    let nativeError = null;


    try {

        /*
            앱 안에서는 Collector를 먼저 중지하고
            Android 세션을 종료한다.
        */
        await syncAndroidLogout();

    } catch (error) {

        nativeError = error;

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


    /*
        Android 쪽은 로그아웃 요청 즉시 수집 중지 플래그를 저장하므로
        네트워크 오류가 있어도 다시 로그인하기 전까지 수집하지 않는다.
    */
    if (nativeError) {
        console.warn(
            "웹 로그아웃은 완료되었지만 Android 세션 정리 중 오류가 있었습니다."
        );
    }
}


/* =========================================
   5. 로그인 여부
========================================= */

export async function isSignedIn() {

    const user =
        await getCurrentUser();


    return Boolean(
        user
    );
}
