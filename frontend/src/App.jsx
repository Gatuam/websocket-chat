import { useEffect, useRef, useState } from "react";
import { connectWS } from "./ws";

export default function App() {
  const timer = useRef(null);
  const socket = useRef(null);
  const [userName, setUserName] = useState("");
  const [showNamePopup, setShowNamePopup] = useState(true);
  const [inputName, setInputName] = useState("");
  const [typers, setTypers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.current = connectWS();

    socket.current.on("connect", () => {
      socket.current.on("roomNotice", (userName) => {
        console.log(`${userName} joined to group!`);
      });

      socket.current.on("chatMessage", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.current.on("typing", (userName) => {
        setTypers((prev) => {
          const isExist = prev.find((typer) => typer === userName);
          if (!isExist) return [...prev, userName];
          return prev;
        });
      });

      socket.current.on("stopTyping", (userName) => {
        setTypers((prev) => prev.filter((typer) => typer !== userName));
      });
    });

    return () => {
      socket.current.off("roomNotice");
      socket.current.off("chatMessage");
      socket.current.off("typing");
      socket.current.off("stopTyping");
    };
  }, []);

  useEffect(() => {
    if (text) {
      socket.current.emit("typing", userName);
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      socket.current.emit("stopTyping", userName);
    }, 1000);

    return () => {
      clearTimeout(timer.current);
    };
  }, [text, userName]);

  function formatTime(ts) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function handleNameSubmit(e) {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) return;

    socket.current.emit("joinRoom", trimmed);

    setUserName(trimmed);
    setShowNamePopup(false);
  }

  function sendMessage() {
    const t = text.trim();
    if (!t) return;

    const msg = {
      id: Date.now(),
      sender: userName,
      text: t,
      ts: Date.now(),
    };
    setMessages((m) => [...m, msg]);

    socket.current.emit("chatMessage", msg);

    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-inter text-gray-100">
      {/* NAME POPUP */}
      {showNamePopup && (
        <div className="fixed inset-0 flex items-center justify-center z-40 backdrop-blur-md bg-black/50">
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-xl  max-w-md p-6">
            <h1 className="text-xl font-semibold text-white">
              Enter your name
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Enter your name to start chatting. This will be used to identify
              you.
            </p>
            <form onSubmit={handleNameSubmit} className="mt-4">
              <input
                autoFocus
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-700 rounded-md px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your name (e.g. John Doe)"
              />
              <button
                type="submit"
                className="block ml-auto mt-3 px-4 py-1.5 rounded-full bg-green-600 hover:bg-green-500 text-white font-medium shadow-md"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHAT WINDOW */}
      {!showNamePopup && (
        <div className="w-full max-w-2xl h-[90vh] bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* HEADER */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-full bg-green-700 flex items-center justify-center text-white font-semibold">
              R
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-100">
                Realtime group chat
              </div>
              {typers.length ? (
                <div className="text-xs text-gray-400 animate-pulse">
                  {typers.join(", ")} is typing...
                </div>
              ) : (
                ""
              )}
            </div>
            <div className="text-sm text-gray-400">
              Signed in as{" "}
              <span className="font-medium text-gray-200 capitalize">
                {userName}
              </span>
            </div>
          </div>

          {/* MESSAGE LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-zinc-950 to-zinc-900">
            {messages.map((m) => {
              const mine = m.sender === userName;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] p-3 my-2 rounded-[18px] text-sm leading-5 shadow-md border ${
                      mine
                        ? "bg-green-600/90 text-white rounded-br-2xl border-green-700"
                        : "bg-zinc-800/80 text-gray-100 rounded-bl-2xl border-zinc-700"
                    }`}
                  >
                    <div className="break-words whitespace-pre-wrap">
                      {m.text}
                    </div>
                    <div className="flex justify-between items-center mt-1 gap-16">
                      <div className="text-[11px] font-bold opacity-80">
                        {m.sender}
                      </div>
                      <div className="text-[11px] text-gray-400 text-right">
                        {formatTime(m.ts)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* INPUT */}
          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 border border-zinc-700 bg-zinc-800/60 backdrop-blur-md rounded-full">
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full resize-none px-4 py-3 text-sm bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 mr-2 rounded-full text-sm font-medium shadow-md"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
