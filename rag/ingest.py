import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from rag.rag_service import ingest_pdf


documents_path = Path("rag/documents")
processed_path = Path("rag/processed")

processed_path.mkdir(exist_ok=True)


for pdf_file in documents_path.glob("*.pdf"):
    marker_file = processed_path / f"{pdf_file.stem}.done"

    if marker_file.exists():
        print(f"Skipping already processed PDF: {pdf_file.name}")
        continue

    try:
        chunk_count = ingest_pdf(
            str(pdf_file),
            document_type="global"
        )

        marker_file.write_text("processed")

        print(f"Global PDF ingested: {pdf_file.name}")
        print(f"Total chunks added: {chunk_count}")

    except Exception as error:
        print(f"Failed to ingest: {pdf_file.name}")
        print(f"Error: {error}")


for user_directory in documents_path.glob("user_*"):
    if not user_directory.is_dir():
        continue

    try:
        user_id = int(user_directory.name.replace("user_", ""))
    except ValueError:
        continue

    for pdf_file in user_directory.glob("*.pdf"):
        marker_file = (
            processed_path /
            f"user_{user_id}_{pdf_file.stem}.done"
        )

        if marker_file.exists():
            print(
                f"Skipping already processed private PDF: "
                f"{pdf_file.name}"
            )
            continue

        try:
            chunk_count = ingest_pdf(
                str(pdf_file),
                user_id=user_id,
                document_type="private"
            )

            marker_file.write_text("processed")

            print(
                f"Private PDF ingested: "
                f"{pdf_file.name} for user {user_id}"
            )

            print(f"Total chunks added: {chunk_count}")

        except Exception as error:
            print(
                f"Failed to ingest private PDF: "
                f"{pdf_file.name}"
            )
            print(f"Error: {error}")