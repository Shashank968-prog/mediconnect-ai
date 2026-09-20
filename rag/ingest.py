import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from rag.rag_service import ingest_pdf


documents_path = Path("rag/documents")
processed_path = Path("rag/processed")

processed_path.mkdir(exist_ok=True)

pdf_files = list(documents_path.glob("*.pdf"))

for pdf_file in pdf_files:
    marker_file = processed_path / f"{pdf_file.stem}.done"

    if marker_file.exists():
        print(f"Skipping already processed PDF: {pdf_file.name}")
        continue

    try:
        chunk_count = ingest_pdf(str(pdf_file))

        marker_file.write_text("processed")

        print(f"PDF ingested successfully: {pdf_file.name}")
        print(f"Total chunks added: {chunk_count}")

    except Exception as error:
        print(f"Failed to ingest: {pdf_file.name}")
        print(f"Error: {error}")