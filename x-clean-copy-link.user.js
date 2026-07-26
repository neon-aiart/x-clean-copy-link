// ==UserScript==
// @name           X Clean Copy Link
// @author         ねおん
// @namespace      https://bsky.app/profile/neon-ai.art
// @homepage       https://neon-aiart.github.io/
// @icon           data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔗</text></svg>
// @version        1.2
// @description    Automatically removes tracking parameters (e.g., ?s=20, ?t=..., utm_*) when copying links on X (Twitter) to keep your URLs clean.
// @description:ja Xの「リンクをコピー」を押したときに ?s=20 等のトラッキングコードを消す超シンプルなコード
// @match          https://x.com/*
// @match          https://twitter.com/*
// @grant          none
// @license        PolyForm Noncommercial 1.0.0; https://polyformproject.org/licenses/noncommercial/1.0.0/
// ==/UserScript==

(function() {
    'use strict';

    // 削除したいパラメータのリスト
    const trackingParams = ['s', 't', 'ref_src', 'ref_url', 'utm_source', 'utm_medium', 'utm_campaign',];

    document.addEventListener('copy', (e) => {
        // クリップボードにコピーされようとしているテキストを取得
        const text = window.getSelection().toString();

        if (text.includes('x.com/') || text.includes('twitter.com/')) {
            try {
                const url = new URL(text);

                // ツイート（ポスト）の個別ページURLかどうかの判定（例: /username/status/123456...）
                const isStatusUrl = /\/status\/\d+/.test(url.pathname);

                if (isStatusUrl) {
                    // ポストのURLなら、問答無用でパラメータを丸ごと削除
                    url.search = '';
                } else {
                    // 指定したパラメータだけを削除
                    trackingParams.forEach(param => url.searchParams.delete(param));
                }

                // クリップボードの中身を書き換え
                e.clipboardData.setData('text/plain', url.toString());
                e.preventDefault();
            } catch (err) {
                // URLとして解析できなかった場合は何もしない
            }
        }
    });
})();
