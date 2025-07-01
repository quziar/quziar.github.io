from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# 載入 Mixtral 模型與 tokenizer（第一次執行會下載模型）
model_id = "mistralai/Mixtral-8x7B-Instruct-v0.1"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id, 
    torch_dtype=torch.float16, 
    device_map="auto"
)

def evaluate_answer(correct_answer: str, student_answer: str) -> float:
    prompt = f"""
你是一位老師，請根據以下資訊評分學生的答案。
請根據「答案內容的相似度與正確性」給一個從 0 到 100 的正確率（整數百分比）。
直接回答數字即可，無需解釋。

正確答案：{correct_answer}
學生答案：{student_answer}

正確率：
"""

    try:
        inputs = tokenizer(prompt.strip(), return_tensors="pt").to(model.device)
        outputs = model.generate(
            **inputs,
            max_new_tokens=10,
            do_sample=False,
            temperature=0.3
        )
        result = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # 抽出數字（可能有前綴、斷行等情況）
        import re
        numbers = re.findall(r"\b\d{1,3}\b", result)
        if numbers:
            score = int(numbers[-1])
            return max(0, min(score, 100))
        else:
            raise ValueError("找不到分數")
    except Exception as e:
        print("評分過程中發生錯誤:", e)
        return -1
