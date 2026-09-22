/* =========================================
   Echo Path
   Digital Distance Calculation
========================================= */


/* =========================================
   1. DDI 계산
========================================= */

export function calculateDDI({
    totalUsageHours,
    appSwitchCount,
    categorySwitchCount,
    repeatLoopCount
}) {

    const T =
        totalUsageHours;

    const N =
        appSwitchCount;

    const C =
        categorySwitchCount;

    const R =
        repeatLoopCount;



    /* =====================================
       각 변수의 DDI 기여값
    ===================================== */

    const tContribution =
        5 * T;

    const nContribution =
        0.2 * N;

    const cContribution =
        1.0 * C;

    const rContribution =
        2.0 * R;



    /* =====================================
       전체 DDI
    ===================================== */

    const ddi =
        tContribution
        +
        nContribution
        +
        cContribution
        +
        rContribution;



    /* =====================================
       비율 계산 함수
    ===================================== */

    function calculatePercent(
        contribution
    ) {

        if (ddi === 0) {

            return 0;

        }


        return Number(
            (
                contribution
                / ddi
                * 100
            ).toFixed(1)
        );

    }



    /* =====================================
       계산 결과 반환
    ===================================== */

    return {

        T,
        N,
        C,
        R,


        ddi:
            Number(
                ddi.toFixed(1)
            ),


        contributions: {

            T: {
                value:
                    Number(
                        tContribution
                            .toFixed(1)
                    ),

                percent:
                    calculatePercent(
                        tContribution
                    )
            },


            N: {
                value:
                    Number(
                        nContribution
                            .toFixed(1)
                    ),

                percent:
                    calculatePercent(
                        nContribution
                    )
            },


            C: {
                value:
                    Number(
                        cContribution
                            .toFixed(1)
                    ),

                percent:
                    calculatePercent(
                        cContribution
                    )
            },


            R: {
                value:
                    Number(
                        rContribution
                            .toFixed(1)
                    ),

                percent:
                    calculatePercent(
                        rContribution
                    )
            }

        }

    };

}