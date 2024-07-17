"use client"
import React, { useState, FormEvent } from 'react';

export default function TTSBasic() {
  const [text, setText] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    console.log(data)
    setAudioUrl(data.url);
  };

  return (
    // <>
        <div>
        <h1>Text to Speech</h1>
        <form onSubmit={handleSubmit}>
            <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            cols={50}
            />
            <button type="submit">Convert to Speech</button>
        </form>
        {audioUrl && (
            <div>
            <h2>Audio Output</h2>
            <audio controls key={audioUrl}>
                {/* <source src={audioUrl} type="audio/mp3" /> */}
                <source src={audioUrl} type="audio/mp3" />
            </audio>
            </div>
        )}
        </div>
    // </>
  );
}
