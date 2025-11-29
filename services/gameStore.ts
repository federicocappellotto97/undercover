import { useState, useEffect, useCallback, useRef } from "react"
import {
  GameState,
  Player,
  GameEvent,
  GameSettings,
  PLAYER_COLORS,
} from "../types"
import { Peer } from "peerjs"

// Types for PeerJS
type PeerType = any
type ConnectionType = any

const INITIAL_STATE: GameState = {
  lobbyCode: "",
  players: [],
  status: "lobby",
  gameMode: "online",
  settings: {
    impostorCount: 1,
    language: "English",
    impostorMode: "different_word",
    wordSimilarity: "similar",
  },
  roundCount: 0,
  distributionIndex: -1,
  usedWords: [],
}

const getRandomColor = () =>
  PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]

export function useGameStore() {
  const [localPlayerId, setLocalPlayerId] = useState<string>("")
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE)

  // PeerJS Refs
  const peerRef = useRef<PeerType>(null)
  const connectionsRef = useRef<ConnectionType[]>([])
  const hostConnectionRef = useRef<ConnectionType>(null)
  const playerRef = useRef<Player | null>(null)

  const isLeader =
    gameState.players.find((p) => p.id === localPlayerId)?.isLeader ?? false

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy()
      }
    }
  }, [])

  // --- Broadcast Logic ---
  const broadcast = useCallback((event: GameEvent) => {
    if (connectionsRef.current.length > 0) {
      connectionsRef.current.forEach((conn) => {
        if (conn.open) {
          conn.send(event)
        }
      })
    }
    if (hostConnectionRef.current && hostConnectionRef.current.open) {
      hostConnectionRef.current.send(event)
    }
  }, [])

  const broadcastState = (state: GameState) => {
    if (!connectionsRef.current) return
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send({ type: "UPDATE_STATE", payload: state })
      }
    })
  }

  // --- Local Game Actions (Pass & Play) ---
  const createLocalGame = (nickname: string) => {
    const id = crypto.randomUUID()
    setLocalPlayerId(id) // The "device owner" is player 1

    const newPlayer: Player = {
      id,
      nickname,
      isLeader: true,
      color: getRandomColor(),
    }

    const newState: GameState = {
      ...INITIAL_STATE,
      gameMode: "local",
      players: [newPlayer],
    }
    setGameState(newState)
  }

  const addLocalPlayer = (nickname: string) => {
    setGameState((prev) => {
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        nickname,
        isLeader: false,
        color: getRandomColor(),
      }
      return {
        ...prev,
        players: [...prev.players, newPlayer],
      }
    })
  }

  const removeLocalPlayer = (playerId: string) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== playerId),
    }))
  }

  const reorderPlayers = (fromIndex: number, toIndex: number) => {
    setGameState((prev) => {
      const newPlayers = [...prev.players]
      const [moved] = newPlayers.splice(fromIndex, 1)
      newPlayers.splice(toIndex, 0, moved)
      return { ...prev, players: newPlayers }
    })
  }

  const nextDistributionTurn = () => {
    setGameState((prev) => ({
      ...prev,
      distributionIndex: prev.distributionIndex + 1,
    }))
  }

  // --- Online Game Actions ---

  const createLobby = (nickname: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const id = crypto.randomUUID()
    const newPlayer: Player = {
      id,
      nickname,
      isLeader: true,
      color: getRandomColor(),
    }

    const newState: GameState = {
      ...INITIAL_STATE,
      lobbyCode: code,
      gameMode: "online",
      players: [newPlayer],
    }
    setLocalPlayerId(id)
    setGameState(newState)

    const peerId = `deceit-game-${code}`
    const peer = new Peer(peerId)

    peer.on("error", (err: any) => {
      console.error("Peer error:", err)
      if (err.type === "unavailable-id") {
        alert("Lobby code collision. Please try again.")
      }
    })

    peer.on("connection", (conn: ConnectionType) => {
      connectionsRef.current.push(conn)
      conn.on("data", (data: GameEvent) => {
        handleMessageAsLeader(data, conn)
      })
      conn.on("close", () => {
        connectionsRef.current = connectionsRef.current.filter(
          (c) => c !== conn
        )
      })
    })

    peerRef.current = peer
  }

  const joinLobby = (code: string, nickname: string) => {
    const id = crypto.randomUUID()
    setLocalPlayerId(id)
    const newPlayer: Player = {
      id,
      nickname,
      isLeader: false,
      color: getRandomColor(),
    }
    playerRef.current = newPlayer

    const peer = new Peer()

    peer.on("open", () => {
      const hostId = `deceit-game-${code}`
      const conn = peer.connect(hostId, { reliable: true })

      conn.on("open", () => {
        hostConnectionRef.current = conn
        conn.send({ type: "JOIN", payload: newPlayer })
      })

      conn.on("data", (data: GameEvent) => {
        handleMessageAsClient(data)
      })

      conn.on("error", (err: any) => {
        alert("Could not connect to lobby. Check the code.")
      })
    })

    peerRef.current = peer
  }

  // --- Message Handlers ---

  const handleMessageAsLeader = (
    event: GameEvent,
    senderConn: ConnectionType
  ) => {
    setGameState((prevState) => {
      let newState = prevState
      if (event.type === "JOIN") {
        if (!prevState.players.some((p) => p.id === event.payload.id)) {
          newState = {
            ...prevState,
            players: [...prevState.players, event.payload],
          }
        }
      }
      setTimeout(() => broadcastState(newState), 0)
      return newState
    })
  }

  const handleMessageAsClient = (event: GameEvent) => {
    if (event.type === "UPDATE_STATE") {
      setGameState(event.payload)
    }
  }

  // --- Shared Actions ---

  const updateSettings = (settings: GameSettings) => {
    setGameState((prev) => {
      const newState = { ...prev, settings }
      if (prev.gameMode === "online") broadcastState(newState)
      return newState
    })
  }

  const startGame = (wordPair: { common: string; impostor: string }) => {
    setGameState((prev) => {
      const { players, settings } = prev
      const totalPlayers = players.length
      const impostorCount = Math.max(
        1,
        Math.min(settings.impostorCount, totalPlayers - 1)
      )

      const shuffledIds = [...players]
        .map((p) => p.id)
        .sort(() => Math.random() - 0.5)
      const impostorIds = new Set(shuffledIds.slice(0, impostorCount))

      const newPlayers = players.map((p) => {
        const isImpostor = impostorIds.has(p.id)
        let word: string | undefined

        if (isImpostor) {
          word =
            settings.impostorMode === "blind" ? undefined : wordPair.impostor
        } else {
          word = wordPair.common
        }

        return {
          ...p,
          role: isImpostor ? "impostor" : ("common" as "impostor" | "common"),
          word: word,
        }
      })

      const startPlayerId =
        players[Math.floor(Math.random() * players.length)].id

      // In Local mode, we start at distributionIndex 0.
      // In Online mode, everyone sees their screen immediately (-1).
      const initialDistIndex = prev.gameMode === "local" ? 0 : -1

      // Update history, keeping only last 100 words to avoid hitting prompt limits
      const newUsedWords = [
        ...prev.usedWords,
        wordPair.common,
        wordPair.impostor,
      ].slice(-100)

      const newState: GameState = {
        ...prev,
        players: newPlayers,
        status: "playing",
        startPlayerId,
        roundCount: prev.roundCount + 1,
        distributionIndex: initialDistIndex,
        usedWords: newUsedWords,
      }

      if (prev.gameMode === "online") broadcastState(newState)
      return newState
    })
  }

  const endRound = () => {
    setGameState((prev) => {
      const newState: GameState = {
        ...prev,
        status: "revealing",
        distributionIndex: -1,
      }
      if (prev.gameMode === "online") broadcastState(newState)
      return newState
    })
  }

  const returnToLobby = () => {
    setGameState((prev) => {
      const newState: GameState = {
        ...prev,
        status: "lobby",
        startPlayerId: undefined,
        distributionIndex: -1,
        players: prev.players.map((p) => ({
          ...p,
          role: undefined,
          word: undefined,
        })),
      }
      if (prev.gameMode === "online") broadcastState(newState)
      return newState
    })
  }

  return {
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
  }
}
