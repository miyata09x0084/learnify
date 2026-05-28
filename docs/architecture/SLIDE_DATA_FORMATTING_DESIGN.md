# スライドワークフロー データ整形 設計知見

**作成日**: 2026-05-28
**ステータス**: 設計知見（再利用ガイド）
**対象**: `backend/app/agents/slide_workflow.py`, `backend/app/core/utils.py`, `backend/app/tools/pdf.py`, `backend/app/prompts/slide_prompts.py`

---

## 📋 目次

- [中核思想：整形の役割分担（Prompt vs Python）](#中核思想整形の役割分担prompt-vs-python)
- [整形ロジックは2層に分かれる](#整形ロジックは2層に分かれる)
- [temperature の設計判断](#temperature-の設計判断)
- [再利用可能なパターン](#再利用可能なパターン)
- [既知の技術的負債](#既知の技術的負債設計見直し候補)

---

## 中核思想：整形の役割分担（Prompt vs Python）

このワークフローの最重要な設計判断は **「構造はPythonが機械的に作り、LLMは中身だけ作る」** という分離。

- LLMには `##` 見出し + 本文のみを生成させる（フロントマター・区切り `---` は「出すな」と明示：`slide_prompts.py` SLIDE_PDF_USER）
- スライド区切り・YAMLフロントマターは **Python側で機械的に挿入**（`slide_workflow.py` `write_slides_slidev` の Step1〜6）
- **メリット**: 出力構造が決定的になる／コードブロックを壊さない／LLMのフォーマット逸脱に依存しない

> **設計指針**: LLMに任せるのは「判断・創造が必要な部分」だけ。構造・整形・順序など機械的に保証できるものはコード側に寄せる。

## 整形ロジックは2層に分かれる

| 層 | 目的 | 代表関数 | temp下げても必要か |
|----|------|----------|----------|
| **構造制御層**（by-design） | 役割分担で必ずPythonがやる | `_insert_separators`, frontmatter生成 | **必要**（設計上の責務） |
| **防御層**（safety） | LLM出力の揺らぎ吸収 | `_format_conversation`, `_strip_whole_code_fence`, `_double_separators` | **推奨**（保険として残す） |

`write_slides_slidev` での適用順（Step1〜6）:
1. `_strip_whole_code_fence` — 応答全体を囲むコードフェンス除去
2. 既存フロントマター削除（保険）
3. フロントマター生成（Python制御）
4. `_insert_separators` — `## ` 前に `---` を機械挿入（コードブロック保護つき）
5. `_format_conversation` — 👨‍🏫/🧑‍🎓 会話を `\n\n` で区切る（揺らぎ吸収）
6. `_double_separators` — 連続 `---` を圧縮（安全装置）

## temperature の設計判断

現状: 全ノード共有の単一 `llm`（`llm.py` `temperature=0.2`）。

- temperature は**サンプリングのランダム性**を下げるだけで、**フォーマット遵守は保証しない**（系統的な癖は temp=0 でも出る）→ 整形ヘルパーは消せない
- OpenAI API は temp=0 でも完全な決定性なし
- **temp=0 は評価→リトライループ（最大3回、閾値8.0）と相性が悪い**：再生成がほぼ同一になり、リトライが空振りする

| タスク | 推奨temp | 理由 |
|--------|----------|------|
| JSON生成（TOC）・slug・タイトル抽出 | `0〜0.1` | 構造的・決定的でよい。`_find_json` 成功率も上がる |
| スライド本文・会話・物語生成 | `0.2〜0.4` | 表現の多様性、リトライ探索のため |

> **設計指針**: タスク別に温度を分ける。抽出系は `llm.bind(temperature=0)`、生成系は据え置き。リトライで多様性が欲しいノードは温度を残す。

## 再利用可能なパターン

1. **入力タイプ分岐**（`detect_input_type` → pdf/youtube/text）
   - 各タイプで prompt・評価基準・生成ロジックを切り替え。分岐は1関数に集約し各ノード冒頭で判定

2. **PDFは Map-Reduce**（`generate_key_points`）
   - Map: 各チャンク→最大3点を `llm.batch(max_concurrency=5)` で並列抽出
   - Reduce: 全点→重複除去して正確に5点に凝縮
   - **設計指針**: 長文は「並列抽出→統合」。並列度はバッチで制御

3. **評価→リトライループ**（`route_after_eval_slidev`）
   - score<8.0 で `generate_key_points` から再実行、`attempts>=MAX_ATTEMPTS(3)` で強制終了
   - **品質ゲートを持つなら必ず終了条件（回数上限）をセットで設計**

4. **URLベースのドメイン照合**（`_generate_multi_vendor_slides_integrated`）
   - sources のキー（クエリ文字列）ではなく結果の `url` でベンダー判定 → クエリとドメインのズレに強い
   - **設計指針**: 振り分けキーは「メタデータ（クエリ名）」より「実データ（URL）」を信頼する

5. **トークン経済のための truncate を整形時に集約**
   - title 160字 / content 600字（tavily）, chunk先頭1500字 / 合計15000字上限（slide生成）
   - **マジックナンバーは整形箇所に局在**。設計変更時はここを見る

6. **多層フォールバック**
   - LLM失敗時にタイトル/バレット/スライド全体それぞれにフォールバックを用意
     （`extract_clean_title` の fallback、`_create_llm_summarized_bullets` の except節、`write_slides_slidev` の fallback_md）

## 既知の技術的負債（設計見直し候補）

| 箇所 | 内容 | 影響 |
|------|------|------|
| `utils.py` `_log()` | `state.get("logs")` を参照するが State のフィールドは `log`（単数） | **ログが累積されず毎回上書き**（実質バグ） |
| `llm.py` | 全ノードで単一 temperature(0.2) を共有 | タスク別最適化ができていない |
| `slide_workflow.py` `_insert_after/before_section` | 図解強制挿入の廃止（Issue #25）で実質未使用 | デッドコード候補 |
| `utils.py` `_ensure_marp_header`, `_clean_title` | Marp時代の名残、Slidev移行後は未使用寄り | 整理候補 |
