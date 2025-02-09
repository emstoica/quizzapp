import pandas as pd
import json

# Load the Excel file
df = pd.read_excel("Grile.xlsx", dtype={"Correct Answer": str})  # Force "Correct Answer" to be string

# Convert to JSON format
questions = []
for _, row in df.iterrows():
    correct_answers = str(row["Correct Answer"]).split(",")  # Convert to string and split
    questions.append({
        "question": row["Question Text"],
        "answers": {
            "1": row["Option 1"],
            "2": row["Option 2"],
            "3": row["Option 3"]
        },
        "correct": correct_answers
    })

# Save JSON file
with open("questions.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=4, ensure_ascii=False)

print("Conversion complete! JSON file saved as 'questions.json'.")
