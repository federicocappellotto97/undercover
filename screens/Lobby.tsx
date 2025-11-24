import React, { useState } from "react"
import {
  Users,
  Crown,
  Settings,
  Copy,
  Check,
  Share2,
  HelpCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import Button from "../components/Button"
import { GameState, LANGUAGES } from "../types"
import { generateWordPair } from "../services/geminiService"

interface LobbyProps {
  gameState: GameState
  localPlayerId: string
  onUpdateSettings: (settings: any) => void
  onStartGame: (wordPair: any) => void
  onAddLocalPlayer: (name: string) => void
  onRemoveLocalPlayer: (id: string) => void
  onReorderPlayers: (from: number, to: number) => void
}

const Lobby: React.FC<LobbyProps> = ({
  gameState,
  localPlayerId,
  onUpdateSettings,
  onStartGame,
  onAddLocalPlayer,
  onRemoveLocalPlayer,
  onReorderPlayers,
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")

  const isLeader = gameState.players.find(
    (p) => p.id === localPlayerId
  )?.isLeader
  const playerCount = gameState.players.length
  const isLocalMode = gameState.gameMode === "local"

  const copyCode = () => {
    navigator.clipboard.writeText(gameState.lobbyCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLobby = async () => {
    const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?code=${gameState.lobbyCode}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Undercover Game",
          text: `Join my lobby with code: ${gameState.lobbyCode}`,
          url: url,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStart = async () => {
    setIsGenerating(true)
    try {
      const pair = await generateWordPair(
        gameState.settings.language,
        gameState.settings.wordSimilarity
      )
      onStartGame(pair)
    } catch (e) {
      console.error(e)
      alert("Failed to generate words via Gemini API. Check console.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPlayerName.trim()) {
      onAddLocalPlayer(newPlayerName.trim())
      setNewPlayerName("")
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold text-white mb-1">
            {isLocalMode ? "Pass & Play Lobby" : "Lobby"}
          </h2>

          {!isLocalMode && (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center md:justify-start gap-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={copyCode}
              >
                <span className="text-slate-400 text-sm">Code:</span>
                <span className="text-2xl font-mono font-bold tracking-widest text-indigo-400">
                  {gameState.lobbyCode}
                </span>
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <button
                onClick={shareLobby}
                className="p-3 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20"
                title="Share Link"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {isLeader && playerCount > 2 && (
          <Button
            onClick={handleStart}
            isLoading={isGenerating}
            className="w-full md:w-auto text-lg px-8"
          >
            Start Game
          </Button>
        )}
        {isLeader && playerCount <= 2 && (
          <div className="text-amber-500 text-sm bg-amber-900/20 px-3 py-1 rounded-lg border border-amber-900/50">
            Need 3+ players to start
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Player List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
              <Users className="w-5 h-5" /> Players ({playerCount})
            </h3>
          </div>

          {/* Add Player (Local Only) */}
          {isLocalMode && (
            <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="New player name..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                maxLength={12}
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={!newPlayerName.trim()}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </form>
          )}

          <div className="grid grid-cols-1 gap-3">
            {gameState.players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all bg-slate-800/40 border-slate-700/50`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-slate-200">
                      {player.nickname}
                      {!isLocalMode && player.id === localPlayerId && (
                        <span className="text-xs text-indigo-400 ml-1">
                          (You)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {player.isLeader && (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  )}

                  {isLocalMode && (
                    <>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() =>
                            index > 0 && onReorderPlayers(index, index - 1)
                          }
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20"
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            index < playerCount - 1 &&
                            onReorderPlayers(index, index + 1)
                          }
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20"
                          disabled={index === playerCount - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemoveLocalPlayer(player.id)}
                        className="p-2 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                        title="Remove Player"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 h-fit">
          <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5" /> Settings
          </h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Language</label>
              <select
                value={gameState.settings.language}
                onChange={(e) =>
                  isLeader &&
                  onUpdateSettings({
                    ...gameState.settings,
                    language: e.target.value,
                  })
                }
                disabled={!isLeader}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400 flex justify-between">
                <span>Impostors</span>
                <span className="text-indigo-400 font-bold">
                  {gameState.settings.impostorCount}
                </span>
              </label>
              <input
                type="range"
                min="1"
                max={Math.max(1, playerCount - 2)}
                value={gameState.settings.impostorCount}
                onChange={(e) =>
                  isLeader &&
                  onUpdateSettings({
                    ...gameState.settings,
                    impostorCount: parseInt(e.target.value),
                  })
                }
                disabled={!isLeader || playerCount < 3}
                className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-slate-600">
                Max impostors based on player count (
                {playerCount < 3 ? "1" : Math.max(1, playerCount - 2)}).
              </p>
            </div>

            {/* Impostor Mode */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <label className="text-sm text-slate-400">Impostor Mode</label>
                <div className="group relative">
                  <HelpCircle className="w-3 h-3 text-slate-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-900 text-slate-300 text-xs rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-2 z-10">
                    Different Word: Impostor sees a similar but wrong word.
                    Blind: Impostor knows they are the spy but sees no word.
                  </div>
                </div>
              </div>
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() =>
                    isLeader &&
                    onUpdateSettings({
                      ...gameState.settings,
                      impostorMode: "different_word",
                    })
                  }
                  disabled={!isLeader}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
                    gameState.settings.impostorMode === "different_word"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Diff. Word
                </button>
                <button
                  onClick={() =>
                    isLeader &&
                    onUpdateSettings({
                      ...gameState.settings,
                      impostorMode: "blind",
                    })
                  }
                  disabled={!isLeader}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
                    gameState.settings.impostorMode === "blind"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Blind
                </button>
              </div>
            </div>

            {/* Word Similarity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <label className="text-sm text-slate-400">
                  Word Pair Similarity
                </label>
                <div className="group relative">
                  <HelpCircle className="w-3 h-3 text-slate-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-900 text-slate-300 text-xs rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-2 z-10">
                    Similar: Hard mode. Words are related (e.g., Apple vs Pear).
                    Random: Chaos mode. Words are unrelated (e.g., Apple vs
                    Car).
                  </div>
                </div>
              </div>
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() =>
                    isLeader &&
                    onUpdateSettings({
                      ...gameState.settings,
                      wordSimilarity: "similar",
                    })
                  }
                  disabled={!isLeader}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
                    gameState.settings.wordSimilarity === "similar"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Similar
                </button>
                <button
                  onClick={() =>
                    isLeader &&
                    onUpdateSettings({
                      ...gameState.settings,
                      wordSimilarity: "random",
                    })
                  }
                  disabled={!isLeader}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
                    gameState.settings.wordSimilarity === "random"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Random
                </button>
              </div>
            </div>

            {!isLeader && (
              <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded-lg text-xs text-blue-300">
                Only the lobby leader can change settings.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Lobby
