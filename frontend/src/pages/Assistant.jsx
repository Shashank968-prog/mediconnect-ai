import { useState } from "react";
import api from "../services/api";

function Assistant() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [sources, setSources] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setUploadMessage("Please select a PDF file.");
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setUploadMessage("Only PDF files are allowed.");
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setUploadMessage("Please login to upload a PDF.");
        return;
      }

      const formData = new FormData();
      formData.append("file", selectedFile);

      const result = await api.post(
        "/api/upload-pdf",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUploadMessage(
        `${result.data.filename} uploaded successfully. ${result.data.chunks} chunks processed.`
      );

      setSelectedFile(null);
      event.target.reset();
    } catch (error) {
      setUploadMessage(
        error.response?.data?.detail ||
          "Unable to upload and process the PDF."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    try {
      setLoading(true);
      setResponse("");
      setSources([]);

      const token = localStorage.getItem("token");

      if (!token) {
        setResponse("Please login to use the AI assistant.");
        return;
      }

      const result = await api.post(
        "/api/assistant",
        {
          message: message.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResponse(result.data.response);
      setSources(result.data.sources || []);
    } catch (error) {
      setResponse(
        error.response?.data?.detail ||
          "Unable to get a response from the AI assistant."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderResponse = () => {
    if (!response) {
      return null;
    }

    const lines = response.split("\n");

    return (
      <div className="ai-response-content">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();

          if (!trimmedLine) {
            return <div key={index} className="response-space" />;
          }

          if (
            trimmedLine.startsWith("* ") ||
            trimmedLine.startsWith("- ")
          ) {
            return (
              <div
                key={index}
                className="response-bullet"
              >
                <span>•</span>
                <p>
                  {trimmedLine.substring(2)}
                </p>
              </div>
            );
          }

          return (
            <p
              key={index}
              className="response-line"
            >
              {trimmedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <main className="dashboard-page">
      <div className="assistant-container">

        <section className="assistant-hero">
          <div className="assistant-icon">
            ✚
          </div>

          <div>
            <p className="dashboard-tag">
              MEDICONNECT AI
            </p>

            <h1>AI Health Assistant</h1>

            <p>
              Your intelligent healthcare assistant for
              medical knowledge, documents, doctors,
              and appointments.
            </p>
          </div>
        </section>

        <section className="assistant-upload-card">
          <div className="assistant-section-header">
            <div>
              <span className="assistant-section-icon">
                📄
              </span>

              <div>
                <h2>Upload Healthcare Document</h2>

                <p>
                  Upload a PDF to add its information
                  to the MediConnect AI knowledge base.
                </p>
              </div>
            </div>
          </div>

          <form
            className="assistant-upload-form"
            onSubmit={handleUpload}
          >
            <div className="assistant-file-input">
              <input
                id="pdf-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) =>
                  setSelectedFile(
                    event.target.files[0] || null
                  )
                }
              />
            </div>

            <button
              className="assistant-upload-button"
              type="submit"
              disabled={uploading}
            >
              {uploading
                ? "Processing PDF..."
                : "Upload PDF"}
            </button>
          </form>

          {uploadMessage && (
            <div className="assistant-upload-message">
              ✓ {uploadMessage}
            </div>
          )}
        </section>

        <section className="assistant-chat-card">

          <div className="assistant-chat-header">
            <div className="assistant-avatar">
              ✚
            </div>

            <div>
              <h2>MediConnect AI</h2>
              <p>
                Healthcare knowledge assistant
              </p>
            </div>

            <span className="assistant-status">
              ● Online
            </span>
          </div>

          {!response && !loading && (
            <div className="assistant-welcome">
              <div className="assistant-welcome-icon">
                ✨
              </div>

              <h2>
                How can I help you?
              </h2>

              <p>
                Ask me about healthcare information,
                your uploaded documents, doctors, or
                appointments.
              </p>

              <div className="assistant-example-grid">
                <button
                  type="button"
                  onClick={() =>
                    setMessage(
                      "What are the common symptoms of diabetes?"
                    )
                  }
                >
                  What are the common symptoms of diabetes?
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMessage(
                      "Find general medicine doctors"
                    )
                  }
                >
                  Find general medicine doctors
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMessage(
                      "Show my appointments"
                    )
                  }
                >
                  Show my appointments
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMessage(
                      "What does my uploaded document say about diabetes?"
                    )
                  }
                >
                  Ask about my uploaded document
                </button>
              </div>
            </div>
          )}

          {response && (
            <div className="assistant-conversation">
              <div className="user-message">
                <div className="user-message-avatar">
                  You
                </div>

                <div className="user-message-content">
                  {message}
                </div>
              </div>

              <div className="ai-message">
                <div className="ai-message-avatar">
                  ✚
                </div>

                <div className="ai-message-content">
                  <div className="ai-message-label">
                    MediConnect AI
                  </div>

                  {renderResponse()}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="ai-message">
              <div className="ai-message-avatar">
                ✚
              </div>

              <div className="ai-message-content">
                <div className="ai-message-label">
                  MediConnect AI
                </div>

                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                  <p>Thinking...</p>
                </div>
              </div>
            </div>
          )}

          <form
            className="assistant-chat-input"
            onSubmit={handleAsk}
          >
            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Ask MediConnect AI anything..."
              rows="2"
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading ? "..." : "➤"}
            </button>
          </form>

          <p className="assistant-disclaimer">
            MediConnect AI provides general healthcare
            information and does not replace professional
            medical advice.
          </p>
        </section>

        {sources.length > 0 && (
          <section className="assistant-sources-card">
            <div className="assistant-sources-header">
              <span>📚</span>

              <div>
                <h2>Knowledge Sources</h2>
                <p>
                  Information used to generate this answer
                </p>
              </div>
            </div>

            <div className="assistant-source-list">
              {sources.map((source, index) => (
                <div
                  className="assistant-source-item"
                  key={`${source.source}-${source.page}-${index}`}
                >
                  <div className="source-file-icon">
                    📄
                  </div>

                  <div>
                    <strong>
                      {source.source}
                    </strong>

                    <p>
                      Page {source.page + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}

export default Assistant;