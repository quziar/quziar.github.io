import os
from database import get_image_db

def save_image_and_insert_path(question_id, image_file):
    """儲存圖片並在資料庫用 INSERT OR REPLACE 更新"""
    
    upload_folder = os.path.join(os.path.dirname(__file__), '..', 'database', 'pictures')
    os.makedirs(upload_folder, exist_ok=True)

    image_filename = f"{question_id}.jpg"
    full_image_path = os.path.join(upload_folder, image_filename)

    with open(full_image_path, "wb") as buffer:
        buffer.write(image_file.file.read())

    relative_path = f"/database/pictures/{image_filename}"

    with get_image_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO question_images (question_id, image_path)
            VALUES (?, ?)
        ''', (question_id, relative_path))
        conn.commit()

    return relative_path
