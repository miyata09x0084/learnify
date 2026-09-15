---
status: accepted
date: 2026-09-15
---

# 生成の一時停止はフロントのフラグのみで制御する

LangGraph Cloud の課金停止に伴い動画生成を一時停止するにあたり、停止スイッチは既存の `VITE_GENERATION_ENABLED`（フロント側、GitHub repo variable で切替）だけとし、バックエンドには停止ゲートを持たない。
バックエンドにも `/api/health` で状態を返す「サーバー主導」の案を検討したが、想定利用者（採用担当者・自分）に API 直叩きの懸念はなく、二重フラグは再開時のドリフト源になるため採らなかった。

## Consequences

- `/api/agent/*` は LangGraph 側の生死に従って自然に 503/5xx を返すだけで、意図的な遮断はしない。
- `deploy-backend.yml` の `/api/agent/ok` 後方チェックは警告扱いに格下げする（一時停止中に CI が恒常的に赤くならないようにするため）。
- 再開手順は「repo variable `VITE_GENERATION_ENABLED` を `true` に戻してフロントを再デプロイ」の1手順。バックエンド側の操作は不要。
- バックエンドにも停止フラグを追加したくなったら、本 ADR を superseded にしてから行うこと。
