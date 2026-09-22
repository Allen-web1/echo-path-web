/* =========================================
   Echo Path
   Supabase Realtime
========================================= */

import {
    supabase
} from "./supabase.js";

import {
    getCurrentUser
} from "./auth.js";


let realtimeChannel = null;

let reloadTimer = null;


/* =========================================
   변경 감지 후 자동 새로고침
========================================= */

function scheduleReload() {

    /*
        여러 테이블이 거의 동시에 갱신될 수 있으므로
        한 번만 새로고침되도록 잠시 기다립니다.
    */

    if (reloadTimer) {

        clearTimeout(
            reloadTimer
        );

    }


    reloadTimer =
        setTimeout(
            () => {

                console.log(
                    "Supabase 데이터 변경 감지 → 화면 자동 갱신"
                );

                window.location.reload();

            },
            1800
        );

}


/* =========================================
   Realtime 시작
========================================= */

export async function startEchoPathRealtime() {

    const user =
        await getCurrentUser();


    if (!user) {

        console.log(
            "Realtime 대기: 로그인된 사용자가 없습니다."
        );

        return;

    }


    /*
        기존 채널이 있으면 제거
    */

    if (realtimeChannel) {

        await supabase.removeChannel(
            realtimeChannel
        );

        realtimeChannel = null;

    }


    console.log(
        "Echo Path Realtime 시작:",
        user.id
    );


    realtimeChannel =
        supabase
            .channel(
                `echo-path-${user.id}`
            )


            /* =====================================
               daily_metrics
            ===================================== */

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "daily_metrics",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {

                    console.log(
                        "daily_metrics 변경 감지:",
                        payload
                    );

                    scheduleReload();

                }
            )


            /* =====================================
               daily_app_usage
            ===================================== */

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "daily_app_usage",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {

                    console.log(
                        "daily_app_usage 변경 감지:",
                        payload
                    );

                    scheduleReload();

                }
            )


            /* =====================================
               daily_transitions
            ===================================== */

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "daily_transitions",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {

                    console.log(
                        "daily_transitions 변경 감지:",
                        payload
                    );

                    scheduleReload();

                }
            )


            /* =====================================
               daily_repeat_loops
            ===================================== */

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "daily_repeat_loops",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {

                    console.log(
                        "daily_repeat_loops 변경 감지:",
                        payload
                    );

                    scheduleReload();

                }
            )




            /* =====================================
               hourly_metrics
            ===================================== */

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "hourly_metrics",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {

                    console.log(
                        "hourly_metrics 변경 감지:",
                        payload
                    );

                    scheduleReload();

                }
            )


            /* =====================================
               hourly_app_usage
            ===================================== */

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "hourly_app_usage",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {

                    console.log(
                        "hourly_app_usage 변경 감지:",
                        payload
                    );

                    scheduleReload();

                }
            )


            /* =====================================
               구독 시작
            ===================================== */

            .subscribe(
                (status) => {

                    console.log(
                        "Echo Path Realtime 상태:",
                        status
                    );

                }
            );

}


/* =========================================
   Realtime 종료
========================================= */

export async function stopEchoPathRealtime() {

    if (!realtimeChannel) {

        return;

    }


    await supabase.removeChannel(
        realtimeChannel
    );

    realtimeChannel = null;


    console.log(
        "Echo Path Realtime 종료"
    );

}