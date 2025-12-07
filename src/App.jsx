import { useState } from "react";
import InputBox from "./components/InputBox";
import { askGemini } from "./api";

export default function App() {
  const [response, setResponse] = useState("");

  const handleSubmit = async (userInput) => {
    const reply = await askGemini(userInput);
    setResponse(reply);
  };

  return (
    <div className="container">
      <h1>Gemini React App</h1>

      <InputBox onSubmit={handleSubmit} />

      {response && (
        <div className="response-box">
          <strong>Gemini Response:</strong>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
