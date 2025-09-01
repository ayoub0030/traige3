import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useTriviaGame } from "./lib/stores/useTriviaGame";
import { useLanguage } from "./lib/stores/useLanguage";
import { useAuth } from "./lib/stores/useAuth";
import "@fontsource/inter";

import GameScene from "./components/game/GameScene";
import GameUI from "./components/game/GameUI";
import MainMenu from "./components/game/MainMenu";
import TriviaQuestion from "./components/game/TriviaQuestion";
import GameResults from "./components/game/GameResults";
import MultiplayerLobby from "./components/game/MultiplayerLobby";
import MultiplayerGame from "./components/game/MultiplayerGame";
import PaymentMock from "./components/game/PaymentMock";
import { useMultiplayer } from "./lib/stores/useMultiplayer";

// New page components
import HomePage from "./components/pages/HomePage";
import QuizZone from "./components/pages/QuizZone";
import LeaderboardPage from "./components/pages/LeaderboardPage";
import QuestionScreen from "./components/pages/QuestionScreen";
import ProfilePage from "./components/pages/ProfilePage";
import CoinStore from "./components/pages/CoinStore";
import PrivacyPolicy from "./components/pages/PrivacyPolicy";
import TermsOfService from "./components/pages/TermsOfService";
import FriendsList from "./components/pages/FriendsList";
import BottomNavigation from "./components/ui/BottomNavigation";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ConnectionStatus from "./components/ConnectionStatus";
import GameLobby from "./components/GameLobby";
import MultiplayerGameUI from "./components/multiplayer/MultiplayerGameUI";

// Define control keys for the game
const controls = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
  { name: "select", keys: ["Enter", "Space"] },
  { name: "back", keys: ["Escape"] },
];

// Main App component
function App() {
  const { gameState } = useTriviaGame();
  const { language } = useLanguage();
  const { currentRoom, gameStarted } = useMultiplayer();
  const { getCurrentUser } = useAuth();
  const [showCanvas, setShowCanvas] = useState(false);

  // Initialize authentication and show canvas
  useEffect(() => {
    // Check if user is already logged in
    getCurrentUser();
    setShowCanvas(true);
  }, [getCurrentUser]);

  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <ConnectionStatus />
        {showCanvas && (
        <KeyboardControls map={controls}>
          {/* Always show the 3D canvas */}
          <Canvas
            shadows
            camera={{
              position: [0, 5, 10],
              fov: 60,
              near: 0.1,
              far: 1000
            }}
            gl={{
              antialias: true,
              powerPreference: "default"
            }}
          >
            <color attach="background" args={["#0a0a0a"]} />
            
            <Suspense fallback={null}>
              <GameScene />
            </Suspense>
          </Canvas>

          {/* Game UI Overlay */}
          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-full">
              {gameState === 'home' && <HomePage />}
              {gameState === 'quiz-zone' && <QuizZone />}
              {gameState === 'question' && <QuestionScreen />}
              {gameState === 'leaderboard' && <LeaderboardPage />}
              {gameState === 'profile' && <ProfilePage />}
              {gameState === 'coin-store' && <CoinStore />}
              {gameState === 'privacy' && <PrivacyPolicy />}
              {gameState === 'terms' && <TermsOfService />}
              {gameState === 'menu' && <MainMenu />}
              {gameState === 'playing' && currentRoom && gameStarted && <MultiplayerGame />}
              {gameState === 'playing' && !currentRoom && (
                <>
                  <TriviaQuestion />
                  <GameUI />
                </>
              )}
              {gameState === 'results' && <GameResults />}
              {gameState === 'lobby' && <GameLobby />}
              {gameState === 'multiplayer' && <MultiplayerGameUI />}
              {gameState === 'multiplayer-lobby' && <MultiplayerLobby />}
              {gameState === 'payment' && <PaymentMock />}
              {gameState === 'friends' && <FriendsList />}
            </div>
          </div>

          {/* Bottom Navigation */}
          <BottomNavigation />
        </KeyboardControls>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
