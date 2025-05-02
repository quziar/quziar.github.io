import os
from database import get_image_db

def get_image_path_by_question_id(question_id):
    with get_image_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT image_path FROM question_images
            WHERE question_id = ?
        ''', (question_id,))
        result = cursor.fetchone()

        if result:
            return result[0]
        else:
            return None
