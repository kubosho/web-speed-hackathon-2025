/**
 * Lighthouse ベンチマークスクリプト
 *
 * 指定されたURLのLighthouseスコアを測定し、
 * 「ページの表示」の得点計算方法に基づいてスコアを算出します。
 *
 * 使い方:
 * node lighthouse-benchmark.mjs <URL>
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { URL } from 'url';

// メインの実行関数
async function main() {
  // コマンドライン引数からURLを取得
  const url = process.argv[2];

  if (!url) {
    console.error('URLが指定されていません。使用法: node lighthouse-benchmark.mjs <URL>');
    process.exit(1);
  }

  try {
    // URLの検証
    new URL(url);
  } catch (error) {
    console.error('無効なURLです:', error.message);
    process.exit(1);
  }

  console.log(`🚀 ${url} のベンチマークを開始します...`);

  let chrome;
  try {
    // Chromeを起動 - 追加のフラグを設定
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        // ヘッドレスモードを使用しない（ブラウザウィンドウが表示される）
        '--disable-cache',  // ブラウザキャッシュを無効化
        '--disk-cache-size=1',  // ディスクキャッシュをほぼ無効化
        '--window-size=1200,800'  // ウィンドウサイズを設定
      ]
    });

    // Lighthouseの設定
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
      // 待機時間を長くする
      maxWaitForLoad: 60000, // 1分間待機
      // モバイルエミュレーションを無効化
      formFactor: 'desktop',
      screenEmulation: {
        disabled: true
      },
      // ネットワークスロットリングの設定を変更
      throttlingMethod: 'provided', // 'provided'はスロットリングを行わない
      throttling: {
        rttMs: 0,
        throughputKbps: 0,
        cpuSlowdownMultiplier: 1
      },
      // スクロール設定を追加
      skipAboutBlank: true,
      extraHeaders: {
        'Cache-Control': 'no-cache'
      }
    };

    // Lighthouseの実行
    console.log('📊 Lighthouseを実行中...');
    const runnerResult = await lighthouse(url, options);

    // 結果の取得
    const lhr = runnerResult.lhr;

    // パフォーマンスメトリクスの取得
    const fcp = lhr.audits['first-contentful-paint'].score || 0;
    const si = lhr.audits['speed-index'].score || 0;
    const lcp = lhr.audits['largest-contentful-paint'].score || 0;
    const tbt = lhr.audits['total-blocking-time'].score || 0;
    const cls = lhr.audits['cumulative-layout-shift'].score || 0;

    // 「ページの表示」スコアの計算
    // スコアリングドキュメントに基づいて計算
    // First Contentful Paint のスコア × 10 (0-10 点)
    // Speed Index のスコア × 10 (0-10 点)
    // Largest Contentful Paint のスコア × 25 (0-25 点)
    // Total Blocking Time のスコア × 30 (0-30 点)
    // Cumulative Layout Shift のスコア × 25 (0-25 点)
    const fcpScore = fcp * 10;
    const siScore = si * 10;
    const lcpScore = lcp * 25;
    const tbtScore = tbt * 30;
    const clsScore = cls * 25;

    const totalScore = fcpScore + siScore + lcpScore + tbtScore + clsScore;

    // 結果の表示
    console.log('\n📈 ベンチマーク結果:');
    console.log('--------------------------------------');
    console.log(`URL: ${url}`);
    console.log('--------------------------------------');
    console.log(`First Contentful Paint:    ${(fcp * 100).toFixed(1)}% (${fcpScore.toFixed(1)}点)`);
    console.log(`Speed Index:               ${(si * 100).toFixed(1)}% (${siScore.toFixed(1)}点)`);
    console.log(`Largest Contentful Paint:  ${(lcp * 100).toFixed(1)}% (${lcpScore.toFixed(1)}点)`);
    console.log(`Total Blocking Time:       ${(tbt * 100).toFixed(1)}% (${tbtScore.toFixed(1)}点)`);
    console.log(`Cumulative Layout Shift:   ${(cls * 100).toFixed(1)}% (${clsScore.toFixed(1)}点)`);
    console.log('--------------------------------------');
    console.log(`総合スコア:               ${totalScore.toFixed(1)}/100点`);
    console.log('--------------------------------------');

    // 各メトリクスの実際の値も表示
    console.log('\n📊 メトリクスの実際の値:');
    console.log('--------------------------------------');
    console.log(`First Contentful Paint:    ${lhr.audits['first-contentful-paint'].displayValue}`);
    console.log(`Speed Index:               ${lhr.audits['speed-index'].displayValue}`);
    console.log(`Largest Contentful Paint:  ${lhr.audits['largest-contentful-paint'].displayValue}`);
    console.log(`Total Blocking Time:       ${lhr.audits['total-blocking-time'].displayValue}`);
    console.log(`Cumulative Layout Shift:   ${lhr.audits['cumulative-layout-shift'].displayValue}`);
    console.log('--------------------------------------');

    // 改善のためのアドバイスがあれば表示
    if (totalScore < 90) {
      console.log('\n💡 改善のためのアドバイス:');
      const opportunities = lhr.audits.opportunities;
      if (opportunities) {
        for (const key in opportunities) {
          if (opportunities[key].score < 1) {
            console.log(`- ${opportunities[key].title}: ${opportunities[key].description}`);
          }
        }
      }
    }

    // 終了
    console.log('\n✅ ベンチマークが完了しました。');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  } finally {
    // 確実にChromeを閉じる
    if (chrome) {
      await chrome.kill();
    }
  }
}

// スクリプトの実行
main();
