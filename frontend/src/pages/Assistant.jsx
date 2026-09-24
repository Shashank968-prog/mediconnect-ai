import { useEffect, useState } from "react";
import api from "../services/api";

function Assistant() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [sources, setSources] = useState([]);

  const [chatHistory, setChatHistory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [deletingDocumentId, setDeletingDocumentId] =
    useState(null);
  const [selectedDocument, setSelectedDocument] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [conversationLoading, setConversationLoading] =
    useState(false);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const result = await api.get(
        "/api/conversations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setConversations(result.data || []);
    } catch (error) {
      console.error(
        "Unable to load conversations:",
        error
      );
    }
  };

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const result = await api.get(
        "/api/documents",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDocuments(result.data || []);
    } catch (error) {
      console.error(
        "Unable to load documents:",
        error
      );
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setHistoryLoading(true);

      await loadConversations();
      await loadDocuments();

      setChatHistory([]);
      setSelectedConversation(null);
      setResponse("");
      setSources([]);

      setHistoryLoading(false);
    };

    loadData();
  }, []);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setUploadMessage(
        "Please select a PDF file."
      );
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setUploadMessage(
        "Only PDF files are allowed."
      );
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setUploadMessage(
          "Please login to upload a PDF."
        );
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

      await loadDocuments();
    } catch (error) {
      setUploadMessage(
        error.response?.data?.detail ||
          "Unable to upload and process the PDF."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (
    documentId
  ) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await api.get(
        `/api/documents/${documentId}/view`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const pdfUrl = window.URL.createObjectURL(
        response.data
      );

      window.open(pdfUrl, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 60000);
    } catch (error) {
      setUploadMessage(
        error.response?.data?.detail ||
          "Unable to open the document."
      );
    }
  };

  const handleDeleteDocument = async (
    documentId,
    filename
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${filename}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingDocumentId(documentId);

      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      await api.delete(
        `/api/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadDocuments();

      setUploadMessage(
        `${filename} deleted successfully.`
      );
    } catch (error) {
      setUploadMessage(
        error.response?.data?.detail ||
          "Unable to delete the document."
      );
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handleAsk = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    const userMessage = message.trim();

    try {
      setLoading(true);
      setResponse("");
      setSources([]);

      const token = localStorage.getItem("token");

      if (!token) {
        setResponse(
          "Please login to use the AI assistant."
        );
        return;
      }

      if (selectedDocument) {
        const result = await api.post(
          `/api/documents/${selectedDocument.id}/ask`,
          {
            question: userMessage,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setResponse(result.data.response);
        setSources(result.data.sources || []);

        setChatHistory((previousHistory) => [
          ...previousHistory,
          {
            id: `user-${Date.now()}`,
            role: "user",
            message: userMessage,
          },
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            message: result.data.response,
          },
        ]);

        setMessage("");
        return;
      }

      const result = await api.post(
        "/api/assistant",
        {
          message: userMessage,
          conversation_id:
            selectedConversation?.id || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResponse(result.data.response);
      setSources(result.data.sources || []);

      setChatHistory((previousHistory) => [
        ...previousHistory,
        {
          id: `user-${Date.now()}`,
          role: "user",
          message: userMessage,
          conversation_id:
            result.data.conversation_id,
        },
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          message: result.data.response,
          conversation_id:
            result.data.conversation_id,
        },
      ]);

      setSelectedConversation({
        id: result.data.conversation_id,
      });

      await loadConversations();

      setMessage("");
    } catch (error) {
      setResponse(
        error.response?.data?.detail ||
          "Unable to get a response from the AI assistant."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setSelectedConversation(null);
    setSelectedDocument(null);
    setChatHistory([]);
    setResponse("");
    setSources([]);
    setMessage("");
  };

  const handleAskAboutDocument = (document) => {
    setSelectedDocument(document);
    setSelectedConversation(null);
    setChatHistory([]);
    setResponse("");
    setSources([]);
    setMessage("");
  };

  const handleConversationClick = async (
    conversation
  ) => {
    try {
      setConversationLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const result = await api.get(
        `/api/conversations/${conversation.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedConversation(result.data);
      setSelectedDocument(null);

      setChatHistory(
        result.data.messages || []
      );

      setResponse("");
      setSources([]);
      setMessage("");
    } catch (error) {
      console.error(
        "Unable to load conversation:",
        error
      );
    } finally {
      setConversationLoading(false);
    }
  };

  const handleDeleteConversation = async (
    conversationId
  ) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      await api.delete(
        `/api/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        selectedConversation?.id ===
        conversationId
      ) {
        setSelectedConversation(null);
        setChatHistory([]);
        setResponse("");
        setSources([]);
        setMessage("");
      }

      await loadConversations();
    } catch (error) {
      console.error(
        "Unable to delete conversation:",
        error
      );
    }
  };

  const renderMessage = (text) => {
    if (!text) {
      return null;
    }

    const lines = text.split("\n");

    return (
      <div className="ai-response-content">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();

          if (!trimmedLine) {
            return (
              <div
                key={index}
                className="response-space"
              />
            );
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

  const getConversationGroup = (
    dateString
  ) => {
    const date = new Date(dateString);
    const today = new Date();

    const yesterday = new Date();
    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const isSameDay = (
      first,
      second
    ) => {
      return (
        first.getFullYear() ===
          second.getFullYear() &&
        first.getMonth() ===
          second.getMonth() &&
        first.getDate() ===
          second.getDate()
      );
    };

    if (isSameDay(date, today)) {
      return "Today";
    }

    if (isSameDay(date, yesterday)) {
      return "Yesterday";
    }

    return "Previous";
  };

  const groupedConversations = {
    Today: [],
    Yesterday: [],
    Previous: [],
  };

  conversations.forEach(
    (conversation) => {
      const group =
        getConversationGroup(
          conversation.updated_at
        );

      groupedConversations[
        group
      ].push(conversation);
    }
  );

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

            <h1>
              AI Health Assistant
            </h1>

            <p>
              Your intelligent healthcare
              assistant for medical knowledge,
              documents, doctors, and
              appointments.
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
                <h2>
                  Upload Healthcare
                  Document
                </h2>

                <p>
                  Upload a PDF to add its
                  information to the
                  MediConnect AI knowledge
                  base.
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
                    event.target.files[0] ||
                      null
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

        <section className="assistant-documents-card">

          <div className="assistant-section-header">

            <div>
              <span className="assistant-section-icon">
                📚
              </span>

              <div>
                <h2>
                  My Documents
                </h2>

                <p>
                  Your uploaded healthcare
                  documents
                </p>
              </div>
            </div>

            <span className="document-count">
              {documents.length}{" "}
              {documents.length === 1
                ? "Document"
                : "Documents"}
            </span>

          </div>

          {documents.length === 0 ? (
            <div className="assistant-documents-empty">

              <div className="documents-empty-icon">
                📄
              </div>

              <h3>
                No documents yet
              </h3>

              <p>
                Upload a healthcare PDF to
                start asking questions about it.
              </p>

            </div>
          ) : (
            <div className="assistant-document-list">

              {documents.map((document) => (
                <div
                  className="assistant-document-item"
                  key={document.id}
                >

                  <div className="document-file-icon">
                    PDF
                  </div>

                  <div className="assistant-document-info">

                    <strong>
                      {document.filename}
                    </strong>

                    <div className="document-meta">

                      <span>
                        {document.chunk_count} chunks
                      </span>

                      <span>
                        •
                      </span>

                      <span>
                        Uploaded{" "}
                        {new Date(
                          document.uploaded_at
                        ).toLocaleDateString()}
                      </span>

                    </div>

                  </div>

                  <div className="document-actions">

                    <button
                      type="button"
                      className="ask-document-button"
                      onClick={() =>
                        handleAskAboutDocument(
                          document
                        )
                      }
                      title="Ask about this document"
                    >
                      💬
                    </button>

                    <button
                      type="button"
                      className="view-document-button"
                      onClick={() =>
                        handleViewDocument(
                          document.id
                        )
                      }
                      title="View document"
                    >
                      👁
                    </button>

                    <button
                      type="button"
                      className="delete-document-button"
                      onClick={() =>
                        handleDeleteDocument(
                          document.id,
                          document.filename
                        )
                      }
                      disabled={
                        deletingDocumentId ===
                        document.id
                      }
                      title="Delete document"
                    >
                      {deletingDocumentId ===
                      document.id
                        ? "..."
                        : "🗑"}
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

        <section className="assistant-chat-card">

          <div className="assistant-chat-header">

            <div className="assistant-avatar">
              ✚
            </div>

            <div>
              <h2>
                MediConnect AI
              </h2>

              <p>
                Healthcare knowledge
                assistant
              </p>
            </div>

            <span className="assistant-status">
              ● Online
            </span>

          </div>

          <div className="assistant-layout">

            <aside className="chat-history-sidebar">

              <div className="chat-history-header">

                <h3>
                  CHAT HISTORY
                </h3>

                <button
                  type="button"
                  className="new-chat-button"
                  onClick={handleNewChat}
                >
                  + New Chat
                </button>

              </div>

              {historyLoading ? (
                <p className="chat-history-empty">
                  Loading...
                </p>
              ) : conversations.length ===
                0 ? (
                <p className="chat-history-empty">
                  No conversations yet.
                </p>
              ) : (
                Object.entries(
                  groupedConversations
                ).map(
                  ([
                    group,
                    groupConversations,
                  ]) =>
                    groupConversations.length >
                      0 && (
                      <div
                        className="chat-history-group"
                        key={group}
                      >

                        <h4>
                          {group}
                        </h4>

                        {groupConversations.map(
                          (
                            conversation
                          ) => (
                            <div
                              className={`chat-history-item-wrapper ${
                                selectedConversation?.id ===
                                conversation.id
                                  ? "active"
                                  : ""
                              }`}
                              key={conversation.id}
                            >

                              <button
                                type="button"
                                className="chat-history-item"
                                onClick={() =>
                                  handleConversationClick(
                                    conversation
                                  )
                                }
                                disabled={
                                  conversationLoading
                                }
                              >
                                {conversation.title}
                              </button>

                              <button
                                type="button"
                                className="delete-conversation-button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteConversation(
                                    conversation.id
                                  );
                                }}
                                disabled={
                                  conversationLoading
                                }
                                title="Delete conversation"
                              >
                                🗑
                              </button>

                            </div>
                          )
                        )}

                      </div>
                    )
                )
              )}

            </aside>

            <div className="assistant-chat-main">

              {selectedDocument && (
                <div className="selected-document-banner">
                  <div>
                    <span>
                      📄
                    </span>
                    <div>
                      <strong>
                        Asking about:
                      </strong>
                      <span>
                        {selectedDocument.filename}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDocument(null)
                    }
                    title="Exit document chat"
                  >
                    ✕
                  </button>
                </div>
              )}

              {historyLoading && (
                <div className="assistant-welcome">

                  <div className="assistant-welcome-icon">
                    ⏳
                  </div>

                  <h2>
                    Loading your
                    conversations...
                  </h2>

                  <p>
                    Retrieving your chat
                    history.
                  </p>

                </div>
              )}

              {!historyLoading &&
                conversationLoading && (
                  <div className="assistant-welcome">

                    <div className="assistant-welcome-icon">
                      ⏳
                    </div>

                    <h2>
                      Loading conversation...
                    </h2>

                    <p>
                      Retrieving this
                      conversation.
                    </p>

                  </div>
                )}

              {!historyLoading &&
                !conversationLoading &&
                !selectedConversation &&
                chatHistory.length === 0 &&
                !loading && (
                  <div className="assistant-welcome">

                    <div className="assistant-welcome-icon">
                      ✨
                    </div>

                    <h2>
                      How can I help you?
                    </h2>

                    <p>
                      Select a conversation
                      from the left or start
                      a new conversation.
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
                        What are the common
                        symptoms of diabetes?
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setMessage(
                            "Find general medicine doctors"
                          )
                        }
                      >
                        Find general medicine
                        doctors
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
                        Ask about my uploaded
                        document
                      </button>

                    </div>

                  </div>
                )}

              {!historyLoading &&
                !conversationLoading &&
                chatHistory.length > 0 && (
                  <div className="assistant-conversation">

                    {chatHistory.map(
                      (chat, index) => {

                        if (
                          chat.role ===
                          "user"
                        ) {
                          return (
                            <div
                              className="user-message"
                              key={
                                chat.id ||
                                `user-${index}`
                              }
                            >

                              <div className="user-message-avatar">
                                You
                              </div>

                              <div className="user-message-content">
                                {
                                  chat.message
                                }
                              </div>

                            </div>
                          );
                        }

                        return (
                          <div
                            className="ai-message"
                            key={
                              chat.id ||
                              `assistant-${index}`
                            }
                          >

                            <div className="ai-message-avatar">
                              ✚
                            </div>

                            <div className="ai-message-content">

                              <div className="ai-message-label">
                                MediConnect AI
                              </div>

                              {renderMessage(
                                chat.message
                              )}

                            </div>

                          </div>
                        );
                      }
                    )}

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

                      <p>
                        Thinking...
                      </p>

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
                    setMessage(
                      event.target.value
                    )
                  }
                  placeholder={
                    selectedDocument
                      ? `Ask about ${selectedDocument.filename}...`
                      : "Ask MediConnect AI anything..."
                  }
                  rows="2"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "..."
                    : "➤"}
                </button>

              </form>

              <p className="assistant-disclaimer">
                MediConnect AI provides
                general healthcare
                information and does not
                replace professional
                medical advice.
              </p>

            </div>

          </div>

        </section>

        {sources.length > 0 && (
          <section className="assistant-sources-card">

            <div className="assistant-sources-header">

              <span>
                📚
              </span>

              <div>

                <h2>
                  Knowledge Sources
                </h2>

                <p>
                  Information used to
                  generate this answer
                </p>

              </div>

            </div>

            <div className="assistant-source-list">

              {sources.map(
                (source, index) => (
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
                        Page{" "}
                        {source.page + 1}
                      </p>

                    </div>

                  </div>
                )
              )}

            </div>

          </section>
        )}

      </div>
    </main>
  );
}

export default Assistant;