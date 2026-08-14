// ==UserScript==
// @name            X Clean Copy Link
// @version         1.7
// @icon            data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔗</text></svg>
// @description     Automatically removes tracking parameters (e.g., ?s=20, ?t=..., utm_*) when copying links on X (Twitter) to keep your URLs clean.
// @description:ja  Xの「リンクをコピー」を押したときに ?s=20 等のトラッキングコードを消す超シンプルなコード
// @author          ねおん
// @namespace       https://bsky.app/profile/neon-ai.art
// @homepage        https://neon-aiart.github.io/
// @match           https://x.com/*
// @match           https://twitter.com/*
// @match           https://pbs.twimg.com/media/*
// @grant           none
// @license         PolyForm Noncommercial 1.0.0; https://polyformproject.org/licenses/noncommercial/1.0.0/
// ==/UserScript==

/**
 * ==============================================================================
 * IMPORTANT NOTICE / 重要事項
 * ==============================================================================
 * Copyright (c) 2026 ねおん (Neon)
 * Licensed under the PolyForm Noncommercial License 1.0.0.
 *   [JP] 本スクリプトは個人利用・非営利目的でのみ使用・改変が許可されます。
 * 無断転載、作者名の書き換え、およびクレジットの削除は固く禁じます。
 * 本スクリプトを改変・配布（フォーク）する場合は、必ず元の作者名（ねおん）
 * およびこのクレジット表記を維持してください。
 *   [EN] This script is licensed for personal and non-commercial use only.
 * Unauthorized re-uploading, modification of authorship, or removal of
 * author credits is strictly prohibited. If you fork this project, you MUST
 * retain the original credits and authorship.
 * ==============================================================================
 */

(function() {
    'use strict';

    const SCRIPT_VERSION = '1.7';
    const DEBUG = true;

    // 削除したいパラメータのリスト
    const trackingParams = ['s', 't', 'ref_src', 'ref_url', 'utm_source', 'utm_medium', 'utm_campaign',
        'name',
    ];

    // 置換したいパラメータのリスト ({ key, from, to })
    const replaceParams = [
        { key: 'name', from: 'large', to: 'orig' },
    ];

    // 削除から除外・保持したいパラメータのリスト（ホワイトリスト）
    // 文字列指定なら無条件保持、オブジェクト指定なら特定の value のときだけ保持
    const whiteParams = [
        'format',
        { key: 'name', value: 'orig' },
    ];

    console.log(`[DEBUG] X-Clean: Start`);

    /**
     * URL文字列を受け取り、クリーンアップして文字列で返す共通関数
     * @param {string} urlString
     * @returns {string} Cleaned URL
     */
    function cleanUrl(urlString) {
        try {
            const url = new URL(urlString);

            // ツイート（ポスト）の個別ページURLかどうかの判定（例: /username/status/123456...）
            const isStatusUrl = /\/status\/\d+/.test(url.pathname);

            if (isStatusUrl) {
                // ポストのURLなら、問答無用でパラメータを丸ごと削除
                url.search = '';
            } else {
                // 1. パラメータの置換処理
                replaceParams.forEach(({ key, from, to }) => {
                    if (url.searchParams.get(key) === from) {
                        url.searchParams.set(key, to);
                    }
                });

                // 2. 指定したパラメータの削除処理 (whiteParams の条件に一致するものは削除しない)
                trackingParams.forEach((param) => {
                    const currentValue = url.searchParams.get(param);

                    // whiteParams に合致するか判定
                    const isWhitelisted = whiteParams.some((white) => {
                        if (typeof white === 'string') {
                            return white === param;
                        }
                        if (typeof white === 'object' && white.key === param) {
                            return white.value === undefined || white.value === currentValue;
                        }
                        return false;
                    });

                    // ホワイトリストに含まれない場合はパラメータを削除
                    if (!isWhitelisted) {
                        url.searchParams.delete(param);
                    }
                });
            }

            return url.toString();
        } catch (err) {
            return urlString;
        }
    }

    // 1. シェアボタンやテキストコピー時のイベント（copy）
    document.addEventListener('copy', (e) => {
        const text = window.getSelection().toString();
        if (DEBUG){
            console.log(`[DEBUG] X-Clean: Copy Text`, text);
        }

        if (text.includes('x.com/') || text.includes('twitter.com/') || text.includes('twimg.com/')) {
            const cleaned = cleanUrl(text);
            e.clipboardData.setData('text/plain', cleaned);
            e.preventDefault();
            if (DEBUG){
                console.log(`[DEBUG] X-Clean: Result (Copy)`, cleaned);
            }
        }
    });

    // 2. 右クリックメニューを開いた時のイベント（contextmenu）
    document.addEventListener('contextmenu', (e) => {
        // 右クリックされた要素が画像（または親要素に画像がある場合）
        const img = e.target.closest('img');
        if (img && img.src && img.src.includes('twimg.com/')) {
            const originalSrc = img.src;
            const cleaned = cleanUrl(originalSrc);

            if (originalSrc !== cleaned) {
                // 右クリックされた瞬間に一時的に綺麗にしたURLへ差し替え
                img.src = cleaned;
                if (DEBUG){
                    console.log(`[DEBUG] X-Clean: Temp img.src`, cleaned);
                }

                // メニュー構築完了直後（0ms後のマクロタスク）で即座に復元
                setTimeout(() => {
                    img.src = originalSrc;
                    if (DEBUG){
                        console.log(`[DEBUG] X-Clean: Restored Original`, originalSrc);
                    }
                }, 0);
            }
        }
    });
})();