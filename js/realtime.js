/* =========================================
   Echo Path
   Supabase Realtime
   - 전체 페이지 reload 없이 데이터만 갱신
========================================= */

import {
    supabase
} from "./supabase.js";

import {
    getCurrentUser
} from "./auth.js";


let realtimeChannel = null;
let aiRealtimeChannel = null;
let refreshTimer = null;
let pendingChange = null;


/* =========================================
   변경 감지 후 화면 데이터만 갱신
========================================= */

function scheduleRefresh(
    onChange,
    changeInfo
) {

    /*
        Android가 한 번 동기화할 때 여러 테이블을
        거의 동시에 갱신하므로 마지막 이벤트 기준으로
        한 번만 데이터 재조회하도록 debounce 합니다.
    */

    pendingChange =
        changeInfo;


    if (refreshTimer) {

        clearTimeout(
            refreshTimer
        );
    }


    refreshTimer =
        window.setTimeout(
            async () => {

                refreshTimer =
                    null;


                const latestChange =
                    pendingChange;

                pendingChange =
                    null;


                if (
                    typeof onChange
                    !==
                    "function"
                ) {

                    console.warn(
                        "Realtime 변경 감지는 되었지만 갱신 콜백이 없습니다.",
                        latestChange
                    );

                    return;
                }


                try {

                    await onChange(
                        latestChange
                    );

                } catch (error) {

                    console.error(
                        "Echo Path Realtime 화면 갱신 실패:",
                        error
                    );
                }

            },
            350
        );
}


/* =========================================
   Realtime 시작
========================================= */

export async function startEchoPathRealtime(
    onChange
) {

    const user =
        await getCurrentUser();


    if (!user) {

        console.log(
            "Realtime 대기: 로그인된 사용자가 없습니다."
        );

        return;
    }


    if (realtimeChannel) {

        await supabase.removeChannel(
            realtimeChannel
        );

        realtimeChannel =
            null;
    }


    if (aiRealtimeChannel) {

        await supabase.removeChannel(
            aiRealtimeChannel
        );

        aiRealtimeChannel =
            null;
    }


    console.log(
        "Echo Path Realtime 시작:",
        user.id
    );


    const handleChange =
        (
            table,
            payload
        ) => {

            console.log(
                `${table} 변경 감지:`,
                payload
            );


            scheduleRefresh(
                onChange,
                {
                    source:
                        "supabase-realtime",

                    table:
                        table,

                    eventType:
                        payload?.eventType
                        ?? null
                }
            );
        };


    realtimeChannel =
        supabase
            .channel(
                `echo-path-${user.id}`
            )


            /* 일간 핵심 지표 */
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "daily_metrics",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) =>
                    handleChange(
                        "daily_metrics",
                        payload
                    )
            )


            /* 일간 앱 사용시간 */
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "daily_app_usage",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) =>
                    handleChange(
                        "daily_app_usage",
                        payload
                    )
            )


            /* 일간 앱 전환 */
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "daily_transitions",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) =>
                    handleChange(
                        "daily_transitions",
                        payload
                    )
            )


            /* 일간 반복 루프 */
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "daily_repeat_loops",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) =>
                    handleChange(
                        "daily_repeat_loops",
                        payload
                    )
            )


            /* 시간대별 핵심 지표 */
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "hourly_metrics",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) =>
                    handleChange(
                        "hourly_metrics",
                        payload
                    )
            )


            /* 시간대별 앱 사용시간 */
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "hourly_app_usage",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) =>
                    handleChange(
                        "hourly_app_usage",
                        payload
                    )
            )


            .subscribe(
                (status) => {

                    console.log(
                        "Echo Path Realtime 상태:",
                        status
                    );
                }
            );


    /*
        AI 관련 Realtime은 핵심 사용 데이터 채널과 분리합니다.

        Supabase Dashboard에서 AI 테이블의 Realtime publication이
        아직 켜져 있지 않아도 daily/hourly 핵심 Realtime 채널에는
        영향을 주지 않습니다.
    */

    aiRealtimeChannel =
        supabase
            .channel(
                `echo-path-ai-${user.id}`
            )


            /* Gemini AI 분석 결과 */
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "ai_analysis",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) =>
                    handleChange(
                        "ai_analysis",
                        payload
                    )
            )


            /* Gemini가 생성한 AI Challenge */
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "ai_challenges",
                    filter: `user_id=eq.${user.id}`
                },
                (payload) =>
                    handleChange(
                        "ai_challenges",
                        payload
                    )
            )


            .subscribe(
                (status) => {

                    if (
                        status === "SUBSCRIBED"
                    ) {

                        console.log(
                            "Echo Path AI Realtime 상태:",
                            status
                        );

                    }

                    else {

                        console.warn(
                            "Echo Path AI Realtime 상태:",
                            status
                        );

                    }

                }
            );
}


/* =========================================
   Realtime 종료
========================================= */

export async function stopEchoPathRealtime() {

    if (refreshTimer) {

        clearTimeout(
            refreshTimer
        );

        refreshTimer =
            null;
    }


    pendingChange =
        null;


    if (realtimeChannel) {

        await supabase.removeChannel(
            realtimeChannel
        );

        realtimeChannel =
            null;

    }


    if (aiRealtimeChannel) {

        await supabase.removeChannel(
            aiRealtimeChannel
        );

        aiRealtimeChannel =
            null;

    }


    console.log(
        "Echo Path Realtime 종료"
    );
}
