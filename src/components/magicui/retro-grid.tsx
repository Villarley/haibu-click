import { cn } from "@/lib/utils";
import Image from "next/image";
import HoneyJar from "../../assets/Honey-Jar.png";
import { useEffect, useState } from "react";

interface RetroGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS classes to apply to the grid container
   */
  className?: string;
  /**
   * Rotation angle of the grid in degrees
   * @default 65
   */
  angle?: number;
  /**
   * Grid cell size in pixels
   * @default 60
   */
  cellSize?: number;
  /**
   * Grid opacity value between 0 and 1
   * @default 0.5
   */
  opacity?: number;
  /**
   * Grid line color in light mode
   * @default "gray"
   */
  lightLineColor?: string;
  /**
   * Grid line color in dark mode
   * @default "gray"
   */
  darkLineColor?: string;
}

export function RetroGrid({
  className,
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
  ...props
}: RetroGridProps) {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  } as React.CSSProperties;

  const [jars, setJars] = useState<{ id: number; top: number; left: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setJars((prevJars) => {
        const newJars = prevJars.map((jar) => ({
          ...jar,
          top: jar.top + 1,
        })).filter(jar => jar.top < 100);
        return newJars;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setJars((prevJars) => [
        ...prevJars,
        { id: Date.now(), top: 0, left: Math.random() * 100 },
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const renderHoneyJars = () => {
    return jars.map((jar) => (
      <div
        key={jar.id}
        style={{
          position: "absolute",
          top: `${jar.top}%`,
          left: `${jar.left}%`,
          transform: "translate(-50%, -50%)",
          width: "30px",
          height: "30px",
        }}
      >
        <Image src={HoneyJar} alt="Honey Jar" layout="fill" objectFit="contain" />
      </div>
    ));
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]",
        `opacity-[var(--opacity)]`,
        className,
      )}
      style={gridStyles}
      {...props}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_2px,transparent_0),linear-gradient(to_bottom,var(--light-line)_2px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [width:300vw] [transform-origin:100%_0_0] dark:[background-image:linear-gradient(to_right,var(--dark-line)_2px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_2px,transparent_0)]" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-black" />
      {renderHoneyJars()}
    </div>
  );
}
