from google import genai
import os
import json
import re

API_KEY = "AIzaSyAlyVuLvU3JXXezcSM8tgVxOKwIalDpuYw"  #禁止外傳

client = genai.Client(api_key=API_KEY)

def evaluate_answer(question: str, rubric: str, student_answer: str):
    def round_to_nearest_10(score: int) -> int:
        return int(round(score / 10.0) * 10)

    prompt = f"""
你是一位老師，負責根據評分標準對學生的答案進行評分。
請輸出 JSON 格式，包含：
- score: 一個整數百分比，四捨五入到最接近的 10%（0~100）
- explanation: 解釋為什麼給這個分數
⚠️ 請直接輸出 JSON，不要使用 ``` 包裹。
題目：
{question}

評分標準：
{rubric}

學生答案：
{student_answer}
"""

    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=prompt
    )

    try:
        text = response.text.strip()
        # 移除可能出現的 ```json ... ``` 區塊
        text = re.sub(r"^```[a-zA-Z]*\n?|```$", "", text)
        result = json.loads(text)

        score = int(result.get("score", 0))
        result["score"] = round_to_nearest_10(max(0, min(100, score)))
        return result
    except Exception:
        raise ValueError(f"AI 輸出無法解析: {response.text}")