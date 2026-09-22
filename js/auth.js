/* =========================================
   Echo Path
   Web Authentication
========================================= */

import {
    supabase
}
from "./supabase.js";


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


    return data.user ?? null;

}


/* =========================================
   2. 이메일 / 비밀번호 로그인
========================================= */

export async function signInWithEmail(
    email,
    password
) {

    const {
        data,
        error
    } =
        await supabase.auth.signInWithPassword({

            email:
                email.trim(),

            password:
                password

        });


    if (error) {

        throw error;

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

    const {
        data,
        error
    } =
        await supabase.auth.signUp({

            email:
                email.trim(),

            password:
                password

        });


    if (error) {

        throw error;

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

    const {
        error
    } =
        await supabase.auth.signOut();


    if (error) {

        throw error;

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