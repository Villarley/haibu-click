"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAddress } from "@chopinframework/react";
import { useUserStore } from "@/store/user-store";
import Hexagons from "@/components/Hexagons";
import Bee from "@/components/Bee";
import HoneyJar from "@/components/HoneyJar";
import ScoreBoard from "@/components/ScoreBoard";
import Leaderboard from "@/components/Leaderboard";
import Modal from "@/components/Modal";
import { useClickGame } from "@/hooks/useClickGame";
import { useLeaderboard } from "@/hooks/useLeaderboard";

export default function Home() {
  const { address, isLoading: addressLoading } = useAddress();
  const router = useRouter();
  const { setUser, name, surnames, username, email } = useUserStore();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!address || addressLoading) return;

    async function checkRegistration() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/exists/${address}`
        );

        if (res.ok) {
          setIsRegistered(true);
          localStorage.setItem("isRegistered", JSON.stringify(true));
        } else {
          setIsRegistered(false);
          localStorage.setItem("isRegistered", JSON.stringify(false));
        }
      } catch (error) {
        console.error("Error checking registration:", error);
        setIsRegistered(false);
      }
    }

    checkRegistration();
  }, [address, addressLoading]);

  useEffect(() => {
    async function handleAuth() {
      if (!address || addressLoading || isLoggingIn || isRegistered === null) return;
      setIsLoggingIn(true);

      try {
        if (!isRegistered) {
          if (!name || !surnames || !username || !email) {
            console.warn("Datos del usuario incompletos para el registro.");
            return;
          }

          const registerRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name,
                surnames,
                email,
                username,
                walletAddress: address,
              }),
            }
          );

          if (!registerRes.ok) {
            console.error("Registration failed.");
            return;
          }

          setIsRegistered(true);
          localStorage.setItem("isRegistered", JSON.stringify(true));
        }

        // Solo hacer login si el usuario ya está registrado
        const loginRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }
        );

        if (!loginRes.ok) {
          console.error("Login failed.");
          return;
        }

        const loginData = await loginRes.json();
        setUser({
          name: loginData.user?.name,
          surnames: loginData.user?.surnames,
          username: loginData.user?.username,
          email: loginData.user?.email,
        });

      } catch (error) {
        console.error("Authentication error:", error);
      } finally {
        setIsLoggingIn(false);
      }
    }

    handleAuth();
  }, [address, addressLoading, isRegistered, router, setUser, isLoggingIn, name, surnames, username, email]);

  if (addressLoading || isRegistered === null) {
    return <div>Loading...</div>;
  }

  return <GameScreen />;
}

function GameScreen() {
  const router = useRouter();
  const [frame, setFrame] = useState(0);
  const [jars, setJars] = useState<number[]>([]);
  const [beeLift, setBeeLift] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [beeKey, setBeeKey] = useState(0);
  const { email } = useUserStore();

  const { score, sendClick } = useClickGame(email);
  const { leaderboard, loading } = useLeaderboard();

  const handleClick = () => {
    if (isPaused) return;
    setFrame((prevFrame) => prevFrame + 1);
    sendClick(false);
    setBeeLift(true);
  };

  const handleCatch = (id: number) => {
    sendClick(true);
    setJars((prevJars) => prevJars.filter((jarId) => jarId !== id));
  };

  const handleBeeFall = () => {
    setIsPaused(true);
    setTimeout(() => {
      setShowModal(true);
    }, 500);
  };

  const handleContinue = () => {
    setShowModal(false);
    setIsPaused(false);
    setBeeKey((prevKey) => prevKey + 1);
    setBeeLift(true);
  };

  if (!email) {
    router.push("/auth/login");
  }

  useEffect(() => {
    const jarInterval = setInterval(() => {
      if (!isPaused) {
        setJars((prevJars) => [...prevJars, Date.now()]);
      }
    }, 3000); // Add a new jar every 3 seconds

    return () => clearInterval(jarInterval);
  }, [isPaused]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden select-none"
      onMouseDown={handleClick}
    >
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
      <Leaderboard scores={loading ? [] : leaderboard} />
      <Modal
        show={showModal}
        onContinue={handleContinue}
      />
    </div>
  );
}
