"use client";
import { useState, useEffect, useCallback } from "react";
import Hexagons from "../components/Hexagons";
import Bee from "../components/Bee";
import HoneyJar from "../components/HoneyJar";
import ScoreBoard from "../components/ScoreBoard";
import Leaderboard from "../components/Leaderboard";
import Modal from "../components/Modal";

const mockScores = [
  { name: "Player1", score: 150 },
  { name: "Player2", score: 120 },
  { name: "Player3", score: 100 },
  { name: "Player4", score: 80 },
  { name: "Player5", score: 60 },
];

export default function Home() {
  const [frame, setFrame] = useState(0);
  const [score, setScore] = useState(0);
  const [jars, setJars] = useState<number[]>([]);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [beeLift, setBeeLift] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [beeKey, setBeeKey] = useState(0);

  const handleClick = () => {
    if (isPaused) return; 
    setFrame((prevFrame) => prevFrame + 1);
    setScore((prevScore) => prevScore + 1);
    setBeeLift(true);
  };

  const handleCatch = (id: number) => {
    setScore((prevScore) => prevScore + 10);
    setJars((prevJars) => prevJars.filter((jarId) => jarId !== id));
  };

  const handleBeeFall = () => {
    requestAnimationFrame(() => {
      setIsPaused(true);
      setTimeout(() => {
        setShowModal(true);
      }, 500);
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsPaused(false);
    setScore(0); 
    setBeeKey((prevKey) => prevKey + 1); 
    setBeeLift(true);
  };

  const handleContinue = () => {
    setShowModal(false);
    setIsPaused(false);
    setBeeKey((prevKey) => prevKey + 1); 
    setBeeLift(true);
  };

  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    if (!isWindowFocused || isPaused) return;

    const interval = setInterval(() => {
      setJars((prevJars) => [...prevJars, Date.now()]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isWindowFocused, isPaused]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none" onMouseDown={handleClick}>
      <div className="relative w-full h-full">
        <ScoreBoard score={score} />
        <Hexagons />
        {!isPaused && (
          <Bee
            key={beeKey}
            frame={frame}
            lift={beeLift}
            setLift={setBeeLift}
            onFall={handleBeeFall}
            isPaused={isPaused}
          />
        )}
        {jars.map((id) => (
          <HoneyJar key={id} id={id} onCatch={handleCatch} />
        ))}
        <Leaderboard scores={mockScores} />
      </div>
      <Modal show={showModal} onClose={handleCloseModal} onContinue={handleContinue} />
    </div>
  );
}