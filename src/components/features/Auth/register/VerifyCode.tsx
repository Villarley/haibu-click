"use client";

import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/magicui/blur-fade";
import { BorderBeam } from "@/components/magicui/border-beam";
import { SimpleButton } from "@/components/magicui/simple-button";
import useFormSetter from "@/hooks/useFormSetter";
import { useUserStore } from "@/store/user-store";
import { useState, useEffect } from "react";

interface FormState {
  email: string;
  code: string;
  username: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function VerifyCode() {
  const router = useRouter();
  const { email, username, name, surnames, verificationCode, setUserVerificationCode } = useUserStore();

  useEffect(() => {
    if (!verificationCode && typeof window !== "undefined") {
      const storedCode = localStorage.getItem("verificationCode");
      if (storedCode) {
        setUserVerificationCode(storedCode);
      }
    }
  }, [verificationCode, setUserVerificationCode]);

  const [formState, createFormSetter] = useFormSetter<FormState>({
    email: email,
    code: verificationCode || "",
    username: username,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [result, setResult] = useState<{ user?: User } | null>(null);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Sending to /api/verify-code:", {
      email: formState.email,
      code: formState.code,
      username: formState.username,
    });

    setIsLoading(true);
    try {
      const verifyRes = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formState.email.trim(),
          code: formState.code.trim(),
          username: formState.username.trim(),
        }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        setMessage(errorData.error || "Invalid or expired code.");
        return;
      }

      console.log("Code verified successfully.");

      let loginData;
      try {
        const loginRes = await fetch("/_chopin/login");
        console.log("Response from _chopin/login:", loginRes);

        if (loginRes.ok) {
          loginData = await loginRes.json();
          console.log("Login Data:", loginData);
        } else {
          setMessage("Error connecting to Chopin API.");
          return;
        }
      } catch (error) {
        console.error("Chopin login error:", error);
        setMessage("Authentication error.");
        return;
      }

      try {
        const registerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formState.username,
            walletAddress: loginData.address,
            email: formState.email,
            name: name,
            surnames: surnames,
          }),
        });

        if (registerRes.ok) {
          const registerData = await registerRes.json();
          setResult(registerData.user);
          setMessage("");

          setUserVerificationCode('');

          router.push("/");
        } else {
          const errorData = await registerRes.json();
          setMessage(errorData.error || "Error registering user.");
        }
      } catch (error) {
        console.error("User registration error:", error);
        setMessage("Registration error.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setMessage("Verification error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BlurFade className="z-10">
      <div className="relative rounded-lg">
        <BorderBeam className="rounded-lg" />
        <form onSubmit={handleVerifyCode} className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mt-4">
          <h1 className="text-3xl font-bold text-center mb-6">Verify Code</h1>
          <p className="mb-4 text-center">
            A code has been sent to <strong>{formState.email}</strong>
          </p>
          <input
            type="text"
            placeholder="Enter the verification code"
            value={formState.code}
            onChange={(e) => createFormSetter("code")(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-[#ffc530]"
            required
          />
          <div className="flex justify-center">
            <SimpleButton isLoading={isLoading}>
              Verify Code
            </SimpleButton>
          </div>
          {message && <p className="mt-4 text-center text-red-500">{message}</p>}
        </form>
      </div>
    </BlurFade>
  );
}
