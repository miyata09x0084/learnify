"""LLM クライアント初期化（tier別モデル選択）

ノードの品質感度・頻度・決定性要求に応じて3つのティアを使い分ける:
- quality: スライド本文生成・目次・タイトル・react判定など品質直結ノード（フロンティアモデル）
- fast:    Map抽出・ナレーション・slug など高頻度/補助ノード（安価なminiモデル）
- eval:    品質評価ノード。決定的な採点＋安定JSONのため temperature 対応モデルを使う

モデル名は env 化済み。デフォルトのまま動作し、prod では .env.schema.yml 経由で上書き可能。
"""

import logging
import os

from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)

# モデル名は env で上書き可（未設定でも以下のデフォルトで即動作）
# quality は現行世代の gpt-5.4（旧既定 gpt-5.1 は 5.2 で非推奨化したため引き上げ）
QUALITY_MODEL = os.getenv("LLM_QUALITY_MODEL", "gpt-5.4")
FAST_MODEL = os.getenv("LLM_FAST_MODEL", "gpt-5.4-mini")
# 評価専用ティア: 決定的な採点と安定したJSON出力が必要なため、temperature 対応の
# gpt-4.1 を既定にする（GPT-5系は temperature=1.0 固定で採点がブレ、稀に壊れたJSONを出すため）。
EVAL_MODEL = os.getenv("LLM_EVAL_MODEL", "gpt-4.1")

_TIER_MODELS = {"quality": QUALITY_MODEL, "fast": FAST_MODEL, "eval": EVAL_MODEL}


def _supports_temperature(model: str) -> bool:
  """このモデルが任意の temperature 値を受け付けるか判定する。

  GPT-5 / o 系（推論モデル）は temperature=1（既定値）しか受け付けず、0.2 や 0 を
  渡すと API エラーになる。一方 gpt-4 系は任意の temperature を受け付け、評価ノード(E)
  や react エージェントの判定安定性に活かせる。get_llm() はこの戻り値で「要求温度を
  渡す」か「安全値 1.0 に固定する」かを切り替える。

  Returns:
    True なら任意の temperature を渡してよい（gpt-4 / gpt-3.5 系）。
    False なら get_llm() は temperature=1.0 に固定する（GPT-5 / o / 未知モデル）。
  """
  name = (model or "").lower()
  return name.startswith(("gpt-3.5", "gpt-4"))


def get_llm(tier: str = "quality", *, temperature: float = 0.2) -> ChatOpenAI:
  """ティア指定で ChatOpenAI クライアントを生成する。

  Args:
    tier: "quality"（既定）/ "fast" / "eval"。
    temperature: 生成のばらつき。任意温度に対応しないモデルでは 1.0 に固定される。
  """
  model = _TIER_MODELS.get(tier, QUALITY_MODEL)
  # langchain は temperature を必ず API に送る（未指定でも既定 0.7 を載せる）実装のため、
  # 非対応モデルには唯一全モデルで受理される 1.0 を明示送信してエラーを防ぐ。
  temp = temperature if _supports_temperature(model) else 1.0
  return ChatOpenAI(model=model, temperature=temp, max_retries=2)


# 後方互換: 既存の `from app.core.llm import llm` を壊さない
# 既定 llm を品質ティアにすることで、未変更の import 先は自動で品質モデル化される。
llm = get_llm("quality")              # 品質ティア（デフォルト）
llm_fast = get_llm("fast")            # 高頻度/補助ティア
llm_eval = get_llm("eval", temperature=0.0)  # 評価専用: 決定的採点＋安定JSON


def _log_resolved_tiers() -> None:
  """起動時に各ティアが解決したモデル名をログ出力する（設定ドリフト検知）。

  本タスクの発端は「品質ティアが非推奨の gpt-5.1 のまま気付かれず放置されていた」こと。
  起動ログに解決済みモデルを一度出しておけば、LangSmith / Cloud Run のログ一見で
  『なぜ quality が古いモデル？』と気付ける（再発防止の安価なガード）。
  参照可能: logger（logging.getLogger）, _TIER_MODELS（{"quality":..,"fast":..,"eval":..}）。
  """
  logger.info("LLM tiers resolved: %s", _TIER_MODELS)


_log_resolved_tiers()
