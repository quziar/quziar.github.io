from fastapi import FastAPI, Request, HTTPException
from transformers import BertTokenizer, BertModel
import torch
import re

app = FastAPI()

# 初始化 BERT 模型
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

def get_embedding(text):
    inputs = tokenizer(text, return_tensors='pt')
    outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1)

def semantic_similarity(text1, text2):
    embedding1 = get_embedding(text1)
    embedding2 = get_embedding(text2)
    return torch.nn.functional.cosine_similarity(embedding1, embedding2).item()

def normalize_text(text):
    text = re.sub(r'[^\w\s]', '', text)  # 移除標點符號
    return text.lower().strip()  # 轉小寫並移除前後空白

@app.post("/api/questions/organize_duplicate_questions/")
async def organize_duplicate_questions(request: Request):
    data = await request.json()
    questions = data.get("questions", [])
    
    duplicates = []

    for i in range(len(questions)):
        for j in range(i + 1, len(questions)):
            question1 = questions[i]
            question2 = questions[j]

            question1_text = normalize_text(question1["question_text"])
            question2_text = normalize_text(question2["question_text"])

            # 計算語義相似度
            semantic_sim = semantic_similarity(question1_text, question2_text)

            # 正規化選項並排序
            options1_sorted = sorted([normalize_text(opt) for opt in question1["options"]])
            options2_sorted = sorted([normalize_text(opt) for opt in question2["options"]])
            
            if semantic_sim > 0.9 and options1_sorted == options2_sorted:
                duplicates.append((question1, question2))

    return {"duplicates": duplicates}
