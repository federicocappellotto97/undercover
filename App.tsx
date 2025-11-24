import React from "react"
import Welcome from "./screens/Welcome"
import Lobby from "./screens/Lobby"
import Game from "./screens/Game"
import { useGameStore } from "./services/gameStore"

const App: React.FC = () => {
  const {
    gameState,
    localPlayerId,
    createLobby,
    joinLobby,
    createLocalGame,
    addLocalPlayer,
    removeLocalPlayer,
    reorderPlayers,
    updateSettings,
    startGame,
    nextDistributionTurn,
    endRound,
    returnToLobby,
  } = useGameStore()

  const renderScreen = () => {
    // If not in a lobby yet (no code and not local mode)
    if (!gameState.lobbyCode && gameState.gameMode !== "local") {
      return (
        <Welcome
          onCreate={createLobby}
          onJoin={joinLobby}
          onCreateLocal={createLocalGame}
        />
      )
    }

    // In lobby waiting for start
    if (gameState.status === "lobby") {
      return (
        <Lobby
          gameState={gameState}
          localPlayerId={localPlayerId}
          onUpdateSettings={updateSettings}
          onStartGame={startGame}
          onAddLocalPlayer={addLocalPlayer}
          onRemoveLocalPlayer={removeLocalPlayer}
          onReorderPlayers={reorderPlayers}
        />
      )
    }

    // In game
    if (gameState.status === "playing" || gameState.status === "revealing") {
      return (
        <Game
          gameState={gameState}
          localPlayerId={localPlayerId}
          onNewRound={startGame}
          onEndRound={endRound}
          onReturnToLobby={returnToLobby}
          onNextDistribution={nextDistributionTurn}
        />
      )
    }

    return <div>Unknown State</div>
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full min-h-screen flex flex-col">
        <header className="p-4 border-b border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/20">
              D
            </div>
            <span className="font-bold text-slate-300 tracking-tight hidden sm:inline">
              Undercover
            </span>
          </div>
          {gameState.gameMode === "online" && gameState.lobbyCode && (
            <div className="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-slate-400">
              Lobby: {gameState.lobbyCode}
            </div>
          )}
          {gameState.gameMode === "local" && (
            <div className="px-3 py-1 bg-indigo-900/30 border border-indigo-500/30 rounded text-xs text-indigo-300">
              Pass & Play
            </div>
          )}
        </header>

        <main className="flex-1 flex flex-col items-center justify-start pt-8 pb-12">
          {renderScreen()}
        </main>
      </div>
    </div>
  )
}

export default App
