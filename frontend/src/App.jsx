import { useEffect, useRef, useState } from "react";
import connectWs from "./ws";
import toast from "react-hot-toast";

export default function App() {
  const socket = useRef(null);
  const bottomRef = useRef(null);
  const timer = useRef(null);
  const [userName, setUserName] = useState("");
  const [showNamePopup, setShowNamePopup] = useState(true);
  const [inputName, setInputName] = useState("");
  const [typers, setTypers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (socket.current) return;
    socket.current = connectWs();

    socket.current.on("connect", () => {
      toast.success("You are connected to the real-time chat app");

      socket.current.on("roomNotice", (userName) => {
        toast.success(`${userName} joined the group`);
      });

      socket.current.on("chatNotice", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
      socket.current.on("typing", (userName) => {
        if (userName) {
          const name = userName.trim();

          setTypers((pre) => {
            const isExist = pre.find((name) => name === userName);
            if (!isExist) {
              return [...pre, userName];
            }
            return pre;
          });
        }
      });
      socket.current.on("stopTyping", (userName) => {
        setTypers((pre) => pre.filter((name) => name !== userName));
      });
    });
    return () => {};
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (text) {
      socket.current.emit("typing", userName);
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      socket.current.emit("stopTyping", userName);
    }, 3000);
    return () => {};
  }, [userName, text]);

  function formatTime(ts) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  }

  function handleNameSubmit(e) {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) return;

    setUserName(trimmed);
    socket.current.emit("joinRoom", trimmed);
    setShowNamePopup(false);
  }

  function sendMessage() {
    const t = text.trim();
    if (!t) return;

    const msg = {
      id: Date.now().toString(),
      sender: userName,
      text: t,
      ts: Date.now(),
    };
    setMessages((m) => [...m, msg]);
    socket.current.emit("chat", msg);
    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleBack() {
    setUserName("");
    setShowNamePopup(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-inter text-gray-100 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:104px_204px] opacity-60"></div>
      <div className="absolute left-0 right-0 top-[50%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)] animate-spin opacity-20"></div>
      {/* NAME POPUP */}
      {showNamePopup && (
        <div className="fixed inset-0 flex items-center justify-center z-40 backdrop-blur-md bg-black/50 px-3">
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-xl max-w-md p-6">
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
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/20 bg-zinc-900/80 backdrop-blur-sm">
            <button
              onClick={handleBack}
              className="text-sm text-gray-100 hover:text-white mr-2 bg-gray-200/10 hover:bg-gray-200/15 backdrop-blur-md border border-gray-200/10 rounded-2xl size-8 cursor-pointer"
            >
              ←
            </button>
            <div className="h-10 w-10 rounded-full bg-green-700 flex items-center justify-center text-white font-semibold">
              R
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-100">
                Realtime group chat
              </div>
              {typers.length ? (
                <div className="text-xs text-gray-400/50 animate-pulse mt-1">
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

          <div className="scrollbar flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-900/5 backdrop-blur-sm relative">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            {messages.map((m) => {
              const mine = m.sender === userName;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] p-3 my-2 rounded-[10px] text-sm leading-5 shadow-md border ${
                      mine
                        ? "bg-green-600/20 backdrop-blur-md text-white rounded-br-xl border-green-700/50"
                        : "bg-zinc-800/30 backdrop-blur-md text-gray-100 rounded-bl-xl border-zinc-700"
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
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="px-4 py-4 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 border border-zinc-700 bg-zinc-800/60 backdrop-blur-md rounded-lg">
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full resize-none p-4 text-sm bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 mr-2 rounded-lg text-sm font-medium shadow-md"
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
