import { useState } from "react";

export default function InputBox({ onSubmit }) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim()) return;
    onSubmit(value);
    setValue("");
  };

  return (
    <div className="input-box">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type something..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
