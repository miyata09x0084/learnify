# new-branch スキル設計

日付: 2026-08-28
状態: 承認済み

## 目的

新しいgitブランチを規約に沿った名前で安全に作成するグローバルスキル。
Issue駆動の開発フロー(`gh` CLI連携)にも、サッと修正したい時にも対応する。

## 配置と構成

```
~/.claude/skills/new-branch/
└── SKILL.md   (単一ファイル、指示駆動)
```

- **グローバルスキル**: 全プロジェクトで使用。命名規則は各リポジトリの履歴から推測する
- **スクリプトなし**: ブランチ名生成(日本語→英語kebab-case)はLLMの判断が主役のため、
  純Markdownの手順書とする。git操作は3〜4コマンドと少なくスクリプト化の利点が薄い
- frontmatterの`description`に発火条件を記述:
  「ブランチを切って」「新しいブランチ」「new branch」「Issue #Nの作業を始めたい」等

## 入力解釈(4パターン)

| 入力例 | 解釈 |
|--------|------|
| `/new-branch 95` | Issue番号 → `gh issue view 95 --json title,labels` でタイトル取得 → ブランチ名生成 |
| `/new-branch fix ログイン修正` | 型キーワード + 説明 → slug生成 |
| `/new-branch ログイン直したい` | 自由テキスト → 内容から型を推測して生成 |
| `/new-branch`(引数なし) | 「何の作業ですか?(Issue番号 or 内容)」と1問だけ聞く |

`--worktree` フラグはどの形式にも付加可能(明示指定時のみworktree作成)。

## ブランチ名生成

1. **リポジトリ規約の推測**: `git log --oneline --merges -20` からブランチプレフィックスを抽出
2. 検出できなければデフォルト語彙: `feat|fix|refactor|docs|test|chore|perf|ci`
3. 形式: `<type>/<english-kebab-slug>`(slug は2〜5語)。日本語タイトルは簡潔な英語に変換
4. **Issue番号はブランチ名に含めない**。Issue紐付けはPR作成時の `Closes #N` で行う想定
5. 生成名をユーザーに提示し、**確認を取ってから**作成を実行する

## 安全チェックと作成手順

```
① git status --porcelain で未コミット変更を検知
   → あれば「stash / 先にコミット / 中止」の3択を提示(勝手にstashしない)
② git fetch origin でリモート最新化
③ デフォルトブランチ検出: git symbolic-ref refs/remotes/origin/HEAD(失敗時 main)
④ 同名ブランチの存在確認(ローカル+リモート)
   → 既存なら「そのブランチにcheckout / 別名を提案」
⑤ git switch -c <name> origin/<default> で作成
```

設計判断: ⑤で `origin/<default>` から直接切ることで、ローカルmainの状態
(未pushコミット・古いHEAD)に依存せず常にリモート最新から開始する。

## worktree モード(`--worktree` 指定時のみ)

⑤の代わりに以下を実行:

```
git worktree add .claude/worktrees/<slug> -b <name> origin/<default>
```

既存の `.claude/worktrees/` 慣習に合わせる(実装時にgitignore状態を確認する)。

## エラーハンドリング

- `gh` 未認証・GitHubリポジトリでない → Issue連携をスキップし自由テキスト扱いにフォールバック
- Issue番号が存在しない → その旨を伝えて内容を聞き直す
- gitリポジトリ外で呼ばれた → 明示エラーで中止(勝手に `git init` しない)

## 検証方法

実装後、slide-pilotリポジトリで3シナリオを実際に実行して動作確認:

1. Issue番号指定(`gh` 連携)
2. 自由テキスト(型の推測)
3. `--worktree` 指定

作成したブランチ・worktreeは確認後に削除する。

## スコープ外

- PR作成・Issueクローズ(既存の commit-commands 系スキルの領分)
- worktreeの自動提案(明示 `--worktree` のみ)
- ブランチ削除・クリーンアップ(`clean_gone` スキルの領分)
