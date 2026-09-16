import { useState } from "react";
import api from "../services/api";

function Assistant() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    try {
      setLoading(true);
      setResponse("");

      const result = await api.post("/api/assistant", {
        message: message,
      });

      setResponse(result.data.response);
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
      <section className="dashboard-card">
        <h1>AI Health Assistant</h1>

        <p>
          Ask the MediConnect AI assistant a healthcare-related question.
        </p>

        <form onSubmit={handleAsk}>
          <div className="form-group">
            <label>Ask your question</label>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="For example: What are the common symptoms of flu?"
              rows="5"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Thinking..." : "Ask AI"}
          </button>
        </form>

        {response && (
          <div>
            <h2>AI Response</h2>
            <p>{response}</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default Assistant;