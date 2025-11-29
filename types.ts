export interface Player {
  id: string
  nickname: string
  isLeader: boolean
  word?: string // The word they see (undefined if blind impostor)
  role?: "common" | "impostor"
  color: string
}

export type ImpostorMode = "different_word" | "blind"

export interface GameSettings {
  impostorCount: number
  language: string
  impostorMode: ImpostorMode
  wordSimilarity: "similar" | "random"
}

export interface GameState {
  lobbyCode: string
  players: Player[]
  status: "lobby" | "playing" | "revealing"
  gameMode: "online" | "local"
  settings: GameSettings
  startPlayerId?: string // The ID of the player who starts the discussion
  roundCount: number
  distributionIndex: number // For local mode: which player is currently viewing their word (-1 if done)
  usedWords: string[] // History of used words to prevent repeats
}

// Events for BroadcastChannel / PeerJS
export type GameEvent =
  | { type: "JOIN"; payload: Player }
  | { type: "UPDATE_STATE"; payload: GameState }
  | { type: "SYNC_REQUEST"; payload: { fromId: string } } // Request current state from leader
  | { type: "KICK"; payload: { id: string } }

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Chinese",
  "Japanese",
  "Korean",
  "Russian",
]

export const PLAYER_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#84cc16", // Lime
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#d946ef", // Fuchsia
  "#f43f5e", // Rose
]
