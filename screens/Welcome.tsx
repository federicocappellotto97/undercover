import React, { useState, useEffect } from "react"
import { User, Users, Play, Radio, Smartphone } from "lucide-react"
import Button from "../components/Button"

interface WelcomeProps {
  onCreate: (nickname: string) => void
  onJoin: (code: string, nickname: string) => void
  onCreateLocal: (nickname: string) => void
}

const Welcome: React.FC<WelcomeProps> = ({
  onCreate,
  onJoin,
  onCreateLocal,
}) => {
  const [nickname, setNickname] = useState("")
  const [lobbyCode, setLobbyCode] = useState("")
  const [mode, setMode] = useState<"create" | "join" | "local">("create")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codeParam = params.get("code")
    if (codeParam) {
      setLobbyCode(codeParam.toUpperCase())
      setMode("join")
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return

    if (mode === "create") {
      onCreate(nickname)
    } else if (mode === "join") {
      if (!lobbyCode.trim()) return
      onJoin(lobbyCode, nickname)
    } else if (mode === "local") {
      onCreateLocal(nickname)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 mb-4 tracking-tight">
          Undercover
        </h1>
        <p className="text-slate-400 text-lg">Find the impostor among us.</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl w-full shadow-2xl">
        <div className="flex bg-slate-900/50 p-1 rounded-lg mb-8">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-md transition-all ${
              mode === "create"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Online
          </button>
          <button
            onClick={() => setMode("join")}
            className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-md transition-all ${
              mode === "join"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Join Online
          </button>
          <button
            onClick={() => setMode("local")}
            className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-md transition-all ${
              mode === "local"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pass & Play
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4" /> Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
              maxLength={12}
              required
            />
          </div>

          {mode === "join" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4" /> Lobby Code
              </label>
              <input
                type="text"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                placeholder="Ex: AB12CD"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 uppercase tracking-widest font-mono"
                maxLength={6}
                required
              />
            </div>
          )}

          {mode === "local" && (
            <div className="bg-indigo-900/20 border border-indigo-900/50 p-3 rounded-lg flex items-start gap-2">
              <Smartphone className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-200">
                In this mode, you will pass one device between players. Everyone
                will be able to see their secret word privately.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full">
            {mode === "create" ? (
              <span className="flex items-center gap-2">
                Create Lobby <Radio className="w-4 h-4" />
              </span>
            ) : mode === "join" ? (
              <span className="flex items-center gap-2">
                Join Game <Play className="w-4 h-4" />
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Start Offline Game <Smartphone className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Welcome
