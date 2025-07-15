from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
import math

# 載入模型（可改為中文模型）
model_name = "HuggingFaceH4/zephyr-7b-beta"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.float16, device_map="auto")

def evaluate_answer(question: str, reference_answer: str, student_answer: str) -> int:
    prompt = f"""你是一位嚴謹的老師，請根據學生的答案和標準答案評分。

題目：
{question}

標準答案：
{reference_answer}

學生答案：
{student_answer}

請你從 0 到 100 評分學生答案的正確率，只能回覆一個數字（如：70）。"""

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    output_ids = model.generate(
        **inputs,
        max_new_tokens=20,
        temperature=0.3,
        do_sample=False,
        pad_token_id=tokenizer.eos_token_id
    )

    output_text = tokenizer.decode(output_ids[0], skip_special_tokens=True)

    # 擷取模型回傳的最後數字
    import re
    match = re.search(r'(\d{1,3})', output_text)
    if match:
        score = int(match.group(1))
        # 限制在 0~100，並四捨五入為 10% 區間
        score = max(0, min(100, score))
        rounded = int(round(score / 10.0) * 10)
        return rounded
    else:
        return 0  # 無法解析時回傳 0
