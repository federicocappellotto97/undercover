import React, { useState } from "react"
import {
  Eye,
  EyeOff,
  RotateCcw,
  PlayCircle,
  Fingerprint,
  Skull,
  Shield,
  Check,
  User,
  Smartphone,
  ArrowRight,
} from "lucide-react"
import Button from "../components/Button"
import { GameState } from "../types"
import { generateWordPair } from "../services/geminiService"

interface GameProps {
  gameState: GameState
  localPlayerId: string
  onNewRound: (wordPair: any) => void
  onEndRound: () => void
  onReturnToLobby: () => void
  onNextDistribution: () => void
}

const Game: React.FC<GameProps> = ({
  gameState,
  localPlayerId,
  onNewRound,
  onEndRound,
  onReturnToLobby,
  onNextDistribution,
}) => {
  const [revealed, setRevealed] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Local Pass & Play Distribution Logic
  const isLocalMode = gameState.gameMode === "local"
  const distributionIndex = gameState.distributionIndex

  // Handlers for "Hold to Reveal"
  const handlePointerDown = () => setRevealed(true)
  const handlePointerUp = () => setRevealed(false)

  const localPlayer = gameState.players.find((p) => p.id === localPlayerId)
  const isLeader = localPlayer?.isLeader || isLocalMode // In local mode, controls are always visible (conceptually leader)
  const startPlayer = gameState.players.find(
    (p) => p.id === gameState.startPlayerId
  )

  const commonWord =
    gameState.players.find((p) => p.role === "common")?.word || "Unknown"

  let impostorWordDisplay = "None (Blind Mode)"
  if (gameState.settings.impostorMode === "different_word") {
    const impostor = gameState.players.find((p) => p.role === "impostor")
    impostorWordDisplay = impostor?.word || "Unknown"
  }

  const handleNextRound = async () => {
    setIsGenerating(true)
    setRevealed(false)
    try {
      const pair = await generateWordPair(
        gameState.settings.language,
        gameState.settings.wordSimilarity
      )
      onNewRound(pair)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  // --------------------------------------------------------------------------
  // DISTRIBUTION PHASE (LOCAL MODE ONLY)
  // --------------------------------------------------------------------------
  if (
    isLocalMode &&
    distributionIndex !== -1 &&
    distributionIndex < gameState.players.length
  ) {
    const currentPlayer = gameState.players[distributionIndex]
    const isBlindImpostor =
      currentPlayer.role === "impostor" &&
      gameState.settings.impostorMode === "blind"
    const displayWord = isBlindImpostor
      ? "YOU ARE THE IMPOSTOR"
      : currentPlayer.word

    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center h-[80vh] justify-center">
        <div className="text-center mb-8">
          <Smartphone className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Pass the device to
          </h2>
          <div className="flex gap-4 justify-center items-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm"
              style={{ backgroundColor: currentPlayer.color }}
            >
              {currentPlayer.nickname.charAt(0).toUpperCase()}
            </div>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              {currentPlayer.nickname}
            </p>
          </div>
        </div>

        {/* Hold to Reveal Card */}
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
          className="group w-full max-w-xs h-80 cursor-pointer mb-8 relative select-none touch-none"
        >
          {/* Card Container */}
          <div className="relative w-full h-full">
            {/* Front (Hidden) */}
            <div
              className={`absolute inset-0 w-full h-full bg-slate-800 rounded-2xl border-2 border-slate-600 shadow-2xl flex flex-col items-center justify-center p-8 transition-opacity duration-200 ${
                revealed ? "opacity-0" : "opacity-100"
              }`}
            >
              <Fingerprint className="w-20 h-20 text-slate-600 mb-6" />
              <h3 className="text-xl font-bold text-slate-200 mb-2">
                Hold to Reveal
              </h3>
              <p className="text-sm text-slate-500 text-center">
                Press and hold the card to see your secret word.
              </p>
            </div>

            {/* Back (Revealed) */}
            <div
              className={`absolute inset-0 w-full h-full rounded-2xl border-2 shadow-[0_0_40px_rgba(99,102,241,0.3)] flex flex-col items-center justify-center p-8 transition-opacity duration-200 ${
                revealed ? "opacity-100" : "opacity-0"
              } ${
                isBlindImpostor
                  ? "bg-red-900 border-red-500"
                  : "bg-indigo-900 border-indigo-500"
              }`}
            >
              <p
                className={`text-sm uppercase tracking-widest font-bold mb-4 ${
                  isBlindImpostor ? "text-red-300" : "text-indigo-300"
                }`}
              >
                {isBlindImpostor ? "SECRET ROLE" : "YOUR WORD"}
              </p>
              <h2 className="text-4xl font-black text-white text-center leading-tight mb-4">
                {displayWord}
              </h2>
              {isBlindImpostor && (
                <p className="text-red-200 text-xs text-center">Blend in!</p>
              )}
            </div>
          </div>
        </div>

        <Button onClick={onNextDistribution} className="w-full">
          I have seen my word <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // REVEAL PHASE (END OF ROUND)
  // --------------------------------------------------------------------------
  if (gameState.status === "revealing") {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
        <h2 className="text-3xl font-black text-white mb-8 tracking-tight uppercase">
          Round Results
        </h2>

        <div className="flex gap-4 w-full mb-8">
          <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">
              Civilian Word
            </div>
            <div className="text-2xl font-bold text-blue-400">{commonWord}</div>
          </div>
          <div className="flex-1 bg-red-900/20 border border-red-900/50 rounded-xl p-4 text-center">
            <div className="text-red-300/70 text-xs uppercase tracking-widest mb-1">
              Impostor Word
            </div>
            <div className="text-2xl font-bold text-red-500">
              {impostorWordDisplay}
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                player.role === "impostor"
                  ? "bg-red-900/10 border-red-500/50"
                  : "bg-slate-800/40 border-slate-700/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm"
                  style={{
                    backgroundColor:
                      player.role === "impostor" ? "#dc2626" : player.color,
                  }}
                >
                  {player.role === "impostor" ? (
                    <Skull className="w-5 h-5" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-200">
                    {player.nickname}
                    {!isLocalMode && player.id === localPlayerId && (
                      <span className="text-xs text-slate-500 ml-2">(You)</span>
                    )}
                  </div>
                  <div
                    className={`text-xs uppercase font-bold ${
                      player.role === "impostor"
                        ? "text-red-400"
                        : "text-blue-400"
                    }`}
                  >
                    {player.role}
                  </div>
                </div>
              </div>
              <div className="text-slate-400 font-mono text-sm">
                {player.word ||
                  (player.role === "impostor" ? "---" : player.word)}
              </div>
            </div>
          ))}
        </div>

        {isLeader ? (
          <div className="flex gap-4 w-full">
            <Button
              variant="secondary"
              onClick={onReturnToLobby}
              className="flex-1"
            >
              Back to Lobby
            </Button>
            <Button
              onClick={handleNextRound}
              isLoading={isGenerating}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Start Next Round
            </Button>
          </div>
        ) : (
          <p className="text-slate-500 animate-pulse">
            Waiting for leader to start next round...
          </p>
        )}
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // PLAYING PHASE (ACTIVE GAME)
  // --------------------------------------------------------------------------

  // Logic for "Online Mode" secret card.
  // In Local Mode, the card is hidden during discussion to prevent accidents.
  const isBlindImpostor =
    localPlayer &&
    localPlayer.role === "impostor" &&
    gameState.settings.impostorMode === "blind"
  const displayWord = localPlayer
    ? isBlindImpostor
      ? "YOU ARE THE IMPOSTOR"
      : localPlayer.word
    : ""

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center mb-8 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Round #{gameState.roundCount}
          </h2>
          <div className="flex items-center gap-2">
            {!isLocalMode && (
              <>
                <User className="w-4 h-4 text-indigo-400" />
                <span className="text-lg font-bold text-white">
                  {localPlayer?.nickname}
                </span>
              </>
            )}
            {isLocalMode && (
              <span className="text-lg font-bold text-white">
                Discussion Phase
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Players
          </h2>
          <span className="text-lg font-mono text-white">
            {gameState.players.length}
          </span>
        </div>
      </div>

      {/* Secret Card (Online Mode Only) */}
      {!isLocalMode && localPlayer && (
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
          className="group w-full max-w-sm h-64 cursor-pointer mb-12 relative select-none touch-none perspective-1000"
        >
          {/* Front of Card (Hidden) */}
          <div
            className={`absolute w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center justify-center p-8 transition-opacity duration-200 ${
              revealed ? "opacity-0" : "opacity-100"
            }`}
          >
            <Fingerprint className="w-16 h-16 text-slate-600 mb-4 group-hover:text-indigo-500 transition-colors" />
            <h3 className="text-xl font-bold text-slate-200 mb-2">
              Hold to Reveal
            </h3>
            <p className="text-sm text-slate-500 text-center">
              Keep screen hidden!
            </p>
          </div>

          {/* Back of Card (Revealed) */}
          <div
            className={`absolute w-full h-full rounded-2xl border shadow-[0_0_30px_rgba(99,102,241,0.3)] flex flex-col items-center justify-center p-8 transition-opacity duration-200 ${
              revealed ? "opacity-100" : "opacity-0"
            } ${
              isBlindImpostor
                ? "bg-gradient-to-br from-red-900 to-slate-900 border-red-500"
                : "bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500"
            }`}
          >
            <p
              className={`text-sm uppercase tracking-widest font-bold mb-2 ${
                isBlindImpostor ? "text-red-400" : "text-indigo-300"
              }`}
            >
              {isBlindImpostor ? "SECRET ROLE" : "YOUR SECRET WORD"}
            </p>

            <h2
              className={`text-4xl md:text-5xl font-black text-center break-words leading-tight mb-4 ${
                isBlindImpostor ? "text-red-500" : "text-white"
              }`}
            >
              {displayWord}
            </h2>
          </div>
        </div>
      )}

      {/* Start Player Indicator */}
      <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-8 text-center animate-pulse-slow">
        <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">
          Starting Player
        </p>
        <div className="flex items-center justify-center gap-3">
          <PlayCircle className="w-6 h-6 text-green-500" />
          <span className="text-2xl font-bold text-white">
            {startPlayer ? startPlayer.nickname : "Randomizing..."}
          </span>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          This player starts describing their word first.
        </p>
      </div>

      {/* Controls */}
      {isLeader && (
        <div className="flex gap-4 w-full">
          <Button
            variant="danger"
            onClick={onEndRound}
            className="w-full shadow-red-900/20"
          >
            <Check className="w-4 h-4 mr-2" />
            Reveal Results & End Round
          </Button>
        </div>
      )}

      {!isLeader && (
        <p className="text-slate-500 text-sm animate-pulse">
          Game in progress. Discuss!
        </p>
      )}
    </div>
  )
}

export default Game
