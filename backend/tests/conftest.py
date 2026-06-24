"""pytest 共通設定。

app.agents.slide_workflow は import 時に app.core.llm が ChatOpenAI を
インスタンス化するため OPENAI_API_KEY を要求する。テストでは実APIを叩かない
（ルーティング等のピュア関数を検証する）ため、未設定環境でも import できるよう
ダミーキーを注入する。

恒久対応は llm.py の lazy initialization 化（import と外部依存の分離）。
アーキ改善バックログ🆕参照。
"""
import os

# 実APIは叩かない。import を通すためだけのダミー。
os.environ.setdefault("OPENAI_API_KEY", "sk-test-dummy")
