import os
import pdfplumber

pdf_path = r"C:\Users\user\Downloads\Programmazione Avanzata\Auction-management-backend-application\others\uid vs id.pdf"
output_path = r"C:\Users\user\Downloads\Programmazione Avanzata\Auction-management-backend-application\scratch\keys_pdf_text.txt"

with pdfplumber.open(pdf_path) as pdf:
    full_text = ""
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        full_text += f"--- Page {i+1} ---\n{text}\n\n"

with open(output_path, "w", encoding="utf-8") as f:
    f.write(full_text)

print(f"Extracted PDF text to: {output_path}")
