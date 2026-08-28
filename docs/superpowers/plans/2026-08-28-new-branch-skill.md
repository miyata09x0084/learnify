# new-branch スキル Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 規約に沿った名前で安全にgitブランチを作成するグローバルスキル `~/.claude/skills/new-branch/SKILL.md` を作る。

**Architecture:** 単一のSKILL.md(指示駆動、スクリプトなし)。ブランチ名生成はLLMの判断、git操作はBashで実行。検証はサブエージェントによるドライラン+実リポジトリでの実実行。

**Tech Stack:** Claude Codeスキル(Markdown + frontmatter)、git、gh CLI

**前提事実(調査済み):**
- `~/.claude` はgitリポジトリではない → SKILL.mdのコミット手順なし
- slide-pilotの `.gitignore` に `.claude/` が含まれる → `.claude/worktrees/` はignore済み
- 検証用の実Issue: miyata09x0084/learnify #27「Phase 0: デプロイ前提条件の整備...」
- 既存グローバルスキルの構造: `~/.claude/skills/<name>/SKILL.md` 単一ファイル(例: prioritize)

**注:** Markdownスキルのため通常のTDDサイクルは適用しない。検証は Task 3-5 のシナリオテストで行う。

---

### Task 1: SKILL.md の作成(型推測ルール以外)

REQUIRED SUB-SKILL: superpowers:writing-skills(frontmatter規約・記述スタイルの確認)

**Files:**
- Create: `~/.claude/skills/new-branch/SKILL.md`

- [ ] **Step 1: SKILL.md を以下の内容で作成する**

「型の推測ルール」セクションのみ TODO(human) とする(Task 2で人間が記入)。

````markdown
---
name: new-branch
description: 新しいgitブランチを規約に沿った名前で安全に作成する。「ブランチを切って」「新しいブランチ」「new branch」「Issue #Nの作業を始めたい」等の文脈、または /new-branch で使用する。
---

# new-branch: 規約に沿ったブランチ作成

新しいgitブランチを、リポジトリの命名規約に沿った名前で `origin/<default>` から安全に作成する。

## 入力の解釈

引数を以下の順で判定する:

1. `--worktree` が含まれる → worktreeモード(後述)。フラグを除いた残りを以下で解釈
2. 数字のみ(例: `95`)→ Issue番号。`gh issue view <N> --json title,labels` でタイトルとラベルを取得
3. 先頭が型キーワード(feat|fix|refactor|docs|test|chore|perf|ci)→ 型+説明として解釈
4. その他のテキスト → 自由テキスト。内容から型を推測(下の推測ルール参照)
5. 引数なし → 「何の作業ですか?(Issue番号 or 内容)」と1問だけ聞く

## ブランチ名の生成

1. リポジトリの規約を推測する: `git log --oneline --merges -20` の出力から
   ブランチプレフィックス(`feat/` 等)を抽出する
2. プレフィックスが検出できなければデフォルト語彙を使う:
   feat|fix|refactor|docs|test|chore|perf|ci
3. 形式: `<type>/<english-kebab-slug>`(slugは2〜5語の簡潔な英語。日本語は英訳する)
4. Issue番号はブランチ名に含めない(Issue紐付けはPR作成時の `Closes #N` で行う)

### 型の推測ルール(自由テキスト・Issueタイトルから型を決める)

TODO(human)

## 安全チェックと作成手順

必ずこの順で実行する:

1. `git rev-parse --is-inside-work-tree` — gitリポジトリ外なら明示エラーで中止する
   (勝手に `git init` しない)
2. `git status --porcelain` — 未コミット変更があれば「stash / 先にコミット / 中止」の
   3択をユーザーに提示する。勝手にstashしない
3. `git fetch origin`
4. デフォルトブランチを検出する: `git symbolic-ref --short refs/remotes/origin/HEAD`
   (失敗時は `origin/main` とみなす)
5. 同名ブランチを確認する: `git branch -a` に候補名が既にあれば
   「そのブランチにcheckout / 別名を提案」をユーザーに提示する
6. **生成したブランチ名をユーザーに提示し、確認を得てから**作成する:
   `git switch -c <name> origin/<default>`

## worktreeモード(`--worktree` 指定時のみ)

手順6の代わりに以下を実行し、作成後にworktreeのパスを案内する:

```bash
git worktree add .claude/worktrees/<slug> -b <name> origin/<default>
```

## エラーハンドリング

- `gh` 未認証 / GitHubリポジトリでない → Issue連携をスキップし、
  内容を聞いて自由テキストとして扱う
- Issue番号が存在しない → その旨を伝えて内容を聞き直す
````

- [ ] **Step 2: ファイルが正しく配置されたことを確認する**

Run: `head -5 ~/.claude/skills/new-branch/SKILL.md`
Expected: frontmatterの `---` と `name: new-branch` が表示される

---

### Task 2: 型の推測ルールの記入(Learn by Doing)

**Files:**
- Modify: `~/.claude/skills/new-branch/SKILL.md`(TODO(human) セクション)

- [ ] **Step 1: 人間に型推測ルールの記入を依頼する**

Learn by Doing リクエストを出し、ユーザーが TODO(human) を5〜10行のルールで置き換えるのを待つ。
記入例の形式(内容はユーザーが決める):

```markdown
- バグ・エラー・不具合・「直す」→ fix
- 新機能・「追加」「作る」→ feat
- 整理・リネーム・依存更新 → chore
- 速度・コスト改善 → perf
- 迷ったらユーザーに型を確認する
```

- [ ] **Step 2: TODO(human) が残っていないことを確認する**

Run: `grep -c "TODO(human)" ~/.claude/skills/new-branch/SKILL.md; true`
Expected: `0`

---

### Task 3: 検証シナリオ1 — 入力解釈のドライラン(サブエージェント)

**Files:** なし(検証のみ)

- [ ] **Step 1: サブエージェントにSKILL.mdを読ませ、3入力の解釈をドライランさせる**

サブエージェント(general-purpose)に以下を依頼する:
「`~/.claude/skills/new-branch/SKILL.md` を読み、次の3入力それぞれについて
(a) 判定された入力パターン (b) 生成するブランチ名 (c) 実行予定のコマンド列 を
**実行せずに**報告せよ。対象リポジトリは /Users/miyata_ryo/projects/slide-pilot。
入力1: `27` / 入力2: `ログインエラーを直したい` / 入力3: `perf 起動高速化 --worktree`」

Expected:
- 入力1 → Issue番号パターン、`gh issue view 27` を計画、`feat/` 等 + 英語slug
- 入力2 → 自由テキストパターン、型=fix、`fix/<login系slug>`
- 入力3 → 型+説明+worktreeモード、`perf/<startup系slug>`、`git worktree add .claude/worktrees/...`

- [ ] **Step 2: 解釈違いがあればSKILL.mdの指示文を修正し、再度ドライランする**

修正が不要ならスキップ。修正した場合は同じプロンプトで再実行し、3入力すべて期待通りになるまで繰り返す。

---

### Task 4: 検証シナリオ2 — 実実行(通常ブランチ)

**Files:** なし(検証のみ。作成物は削除する)

- [ ] **Step 1: gh連携を実実行する(Issue番号パターン)**

```bash
gh issue view 27 --json title,labels      # Expected: title に「Phase 0: デプロイ前提条件の整備...」
```

取得したタイトルからブランチ名を生成できることを確認する(作成はStep 2の自由テキスト分のみ)。

- [ ] **Step 2: SKILL.mdの手順に従い、自由テキスト入力で実際にブランチを作成する**

slide-pilotで手順1〜6を順に実行する:

```bash
git rev-parse --is-inside-work-tree      # Expected: true
git status --porcelain                    # 変更があれば3択提示の動作を確認
git fetch origin
git symbolic-ref --short refs/remotes/origin/HEAD   # Expected: origin/main
git switch -c fix/login-error-test origin/main
git branch --show-current                 # Expected: fix/login-error-test
```

- [ ] **Step 3: クリーンアップする**

```bash
git switch main
git branch -D fix/login-error-test        # Expected: Deleted branch fix/login-error-test
```

---

### Task 5: 検証シナリオ3 — 実実行(worktreeモード)

**Files:** なし(検証のみ。作成物は削除する)

- [ ] **Step 1: worktreeモードで実際に作成する**

```bash
git worktree add .claude/worktrees/perf-startup-test -b perf/startup-test origin/main
git worktree list                         # Expected: perf-startup-test が一覧に出る
```

- [ ] **Step 2: クリーンアップする**

```bash
git worktree remove .claude/worktrees/perf-startup-test
git branch -D perf/startup-test           # Expected: Deleted branch perf/startup-test
git worktree list                         # Expected: perf-startup-test が消えている
```

---

### Task 6: 計画のチェックボックス更新とコミット

**Files:**
- Modify: `docs/superpowers/plans/2026-08-28-new-branch-skill.md`

- [ ] **Step 1: 完了した全ステップのチェックボックスを `[x]` に更新する**

- [ ] **Step 2: コミットする**

```bash
git add docs/superpowers/plans/2026-08-28-new-branch-skill.md
git commit -m "docs: new-branchスキル実装計画を完了状態に更新"
```
