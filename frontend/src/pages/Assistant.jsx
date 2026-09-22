import { useState } from "react";
import api from "../services/api";

function Assistant() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <section className="dashboard-card">
          <p className="dashboard-tag">MEDICONNECT AI</p>

          <h1>AI Health Assistant</h1>

          <p>
            Ask healthcare questions, search for doctors, manage
            appointments, or get information from the healthcare
            knowledge base.
          </p>

          <form className="auth-form" onSubmit={handleAsk}>
            <div className="form-group">
              <label htmlFor="assistant-message">
                Ask your question
              </label>

              <textarea
                id="assistant-message"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="For example: What are the common symptoms of diabetes?"
                rows="5"
                required
              />
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Thinking..." : "Ask AI"}
            </button>
          </form>

          {response && (
            <section className="assistant-result">
              <h2>AI Response</h2>

              <div className="assistant-response">
                {response.split("\n").map((line, index) => (
                  <p key={index}>
                    {line || "\u00A0"}
                  </p>
                ))}
              </div>
            </section>
          )}

          {sources.length > 0 && (
            <section className="assistant-sources">
              <h2>Sources</h2>

              {sources.map((source, index) => (
                <div
                  className="assistant-source"
                  key={`${source.source}-${source.page}-${index}`}
                >
                  <p>
                    📄 <strong>Document:</strong>{" "}
                    {source.source}
                  </p>

                  <p>
                    <strong>Page:</strong>{" "}
                    {source.page + 1}
                  </p>
                </div>
              ))}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

export default Assistant;