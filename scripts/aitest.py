from google import genai
import os

# 如果你不想用環境變數，直接寫 api_key 也可以這樣：
API_KEY = "AIzaSyAlyVuLvU3JXXezcSM8tgVxOKwIalDpuYw"

client = genai.Client(api_key=API_KEY)  # ← 這裡要建立 Client 物件

def evaluate_answer(question: str, rubric: str, student_answer: str) -> int:
    def round_to_nearest_10(score):
        return int(round(score / 10.0) * 10)

    prompt = f"""
你是一位老師，負責根據評分標準對學生的答案進行評分。
請只輸出一個整數百分比，四捨五入到最接近的 10%（0~100）。
評分時要完全依據題目和評分標準。

題目：
{question}

評分標準：
{rubric}

學生答案：
{student_answer}
"""

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )

    try:
        score_text = response.text.strip()
        score = int(score_text)
        score = max(0, min(100, score))
        return round_to_nearest_10(score)
    except ValueError:
        raise ValueError(f"AI 輸出無法解析: {response.text}")
