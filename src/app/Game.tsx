"use client";

import { useState, useEffect, useRef } from "react";
import { getGroqCompletion, generateImageFal, getGeminiVision, getGeminiText } from "./ai";
import {
  generateThemePrompt,
  generateElementsPrompt,
  generateArtStylePrompt,
  generateArtCategoriesPrompt,
  generateImagePrompt,
  generateCritiquePrompt,
} from "./prompts";
import MusicPlayer from "./musicPlayer";
import styles from "./Game.module.css";

type SelectableButton = {
  text: string;
  selected: boolean;
};

type GameProps = {
  onPlayAgain: () => void;
};

export default function Game({ onPlayAgain }: GameProps) {
  const [theme, setTheme] = useState<string>("");
  const [artStyle, setArtStyle] = useState<string>("");
  const [artCategoriesLeft, setArtCategoriesLeft] = useState<SelectableButton[]>([]);
  const [artCategoriesRight, setArtCategoriesRight] = useState<SelectableButton[]>([]);
  const [selectedArtCategoriesLeft, setSelectedArtCategoriesLeft] = useState<string[]>([]);
  const [selectedArtCategoriesRight, setSelectedArtCategoriesRight] = useState<string[]>([]);
  const [elementsLeft, setElementsLeft] = useState<SelectableButton[]>([]);
  const [elementsRight, setElementsRight] = useState<SelectableButton[]>([]);
  const [selectedElementsLeft, setSelectedElementsLeft] = useState<string[]>([]);
  const [selectedElementsRight, setSelectedElementsRight] = useState<string[]>([]);
  const [imgLeft, setImgLeft] = useState<string>("");
  const [imgRight, setImgRight] = useState<string>("");
  const [commentLeft, setCommentLeft] = useState<string>("");
  const [valueLeft, setValueLeft] = useState<string>("");
  const [commentRight, setCommentRight] = useState<string>("");
  const [valueRight, setValueRight] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(40);
  const [timeUp, setTimeUp] = useState<boolean>(false);
  const [currentPlayer, setCurrentPlayer] = useState<"left" | "right">("left");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingLeft, setIsGeneratingLeft] = useState(false);
  const [isGeneratingRight, setIsGeneratingRight] = useState(false);
  const musicPlayerRef = useRef<MusicPlayer | null>(null);

  useEffect(() => {
    const tracks = ["/Autumn Whispers.mp3", "/Backdoor.mp3", "/Echoes20Freedom.mp3"];
    musicPlayerRef.current = new MusicPlayer(tracks);
  }, []);

  useEffect(() => {
    generateThemeAndArtStyleAndCategories();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime > 0) {
          return prevTime - 1;
        } else {
          clearInterval(timer);
          return 0;
        }
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      if (currentPlayer === "left" && (selectedArtCategoriesLeft.length === 0 || selectedElementsLeft.length === 0)) {
        setTimeUp(true);
      } else if (currentPlayer === "right" && (selectedArtCategoriesRight.length === 0 || selectedElementsRight.length === 0)) {
        setTimeUp(true);
      }
    }
  }, [timeLeft, selectedArtCategoriesLeft, selectedArtCategoriesRight, selectedElementsLeft, selectedElementsRight, currentPlayer]);

  const generateThemeAndArtStyleAndCategories = async () => {
    const [generatedTheme, generatedArtStyle, generatedArtCategories] = await Promise.all([
      getGroqCompletion("", 32, generateThemePrompt, 0.8, 0.9),
      getGroqCompletion("", 32, generateArtStylePrompt, 0.8, 0.9),
      getGroqCompletion("", 128, generateArtCategoriesPrompt, 0.8, 0.9),
    ]);
    setTheme(generatedTheme.trim());
    setArtStyle(generatedArtStyle.trim());

    const artCategoryArray = generatedArtCategories.split(",");
    const artCategories = artCategoryArray.map((text: string) => ({
      text: text.trim(),
      selected: false,
    }));
    setArtCategoriesLeft(artCategories);
    setArtCategoriesRight(artCategories);
    setSelectedArtCategoriesLeft([]);
    setSelectedArtCategoriesRight([]);

    generateElements(generatedTheme);
  };

  const generateElements = async (theme: string) => {
    const elementString = await getGroqCompletion(
      theme,
      256,
      generateElementsPrompt,
      0.8,
      0.9
    );
    const elementArray = elementString.split(",");
    const elements = elementArray.map((text: string) => ({
      text: text.trim(),
      selected: false,
    }));

    setElementsLeft(elements);
    setElementsRight(elements);
    setSelectedElementsLeft([]);
    setSelectedElementsRight([]);
  };

  const handleSelectArtCategoryLeft = (index: number) => {
    const updatedArtCategories = artCategoriesLeft.map((category, i) => {
      if (i === index) {
        return { ...category, selected: !category.selected };
      }
      return category;
    });
    setArtCategoriesLeft(updatedArtCategories);
    setSelectedArtCategoriesLeft(
      updatedArtCategories
        .filter((category) => category.selected)
        .map((category) => category.text)
    );
  };

  const handleSelectArtCategoryRight = (index: number) => {
    const updatedArtCategories = artCategoriesRight.map((category, i) => {
      if (i === index) {
        return { ...category, selected: !category.selected };
      }
      return category;
    });
    setArtCategoriesRight(updatedArtCategories);
    setSelectedArtCategoriesRight(
      updatedArtCategories
        .filter((category) => category.selected)
        .map((category) => category.text)
    );
  };

  const handleSelectElementLeft = (index: number) => {
    if (selectedElementsLeft.length < 5) {
      const updatedElements = elementsLeft.map((element, i) => {
        if (i === index) {
          return { ...element, selected: !element.selected };
        }
        return element;
      });
      setElementsLeft(updatedElements);
      setSelectedElementsLeft(
        updatedElements
          .filter((element) => element.selected)
          .map((element) => element.text)
      );
    }
  };

  const handleSelectElementRight = (index: number) => {
    if (selectedElementsRight.length < 5) {
      const updatedElements = elementsRight.map((element, i) => {
        if (i === index) {
          return { ...element, selected: !element.selected };
        }
        return element;
      });
      setElementsRight(updatedElements);
      setSelectedElementsRight(
        updatedElements
          .filter((element) => element.selected)
          .map((element) => element.text)
      );
    }
  };

  const generateImageLeft = async () => {
    setIsGeneratingLeft(true);
    const imageDescription = await getGroqCompletion(
      `Describe an artwork in the style of ${artStyle} that belongs to the following categories: ${selectedArtCategoriesLeft.join(
        ", "
      )} and includes: ${selectedElementsLeft.join(", ")}`,
      256,
      generateImagePrompt,
      0.8,
      0.9
    );
    const imageUrl = await generateImageFal(imageDescription, "landscape_16_9");
    setImgLeft(imageUrl);

    const critiquePrompt =
      "Briefly describe the artwork in approximately 200 words. Be opinionated about its merits or failings.";
    const critique = await getGeminiVision(critiquePrompt, imageUrl);
    setCommentLeft(critique);

    const minValue = 1000;
    const maxValue = 100000;
    const valueNumber = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
    setValueLeft(`$${valueNumber}`);

    setCurrentPlayer("right");
    setTimeLeft(40);
    setIsGeneratingLeft(false);
  };

  const generateImageRight = async () => {
    setIsGeneratingRight(true);
    const imageDescription = await getGroqCompletion(
      `Describe an artwork in the style of ${artStyle} that belongs to the following categories: ${selectedArtCategoriesRight.join(
        ", "
      )} and includes: ${selectedElementsRight.join(", ")}`,
      256,
      generateImagePrompt,
      0.8,
      0.9
    );
    const imageUrl = await generateImageFal(imageDescription, "landscape_16_9");
    setImgRight(imageUrl);

    const critiquePrompt =
      "Briefly describe the artwork in approximately 200 words. Be opinionated about its merits or failings.";
    const critique = await getGeminiVision(critiquePrompt, imageUrl);
    setCommentRight(critique);

    const minValue = 1000;
    const maxValue = 100000;
    const valueNumber = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
    setValueRight(`$${valueNumber}`);

    setIsGeneratingRight(false);
  };

  const playAgain = () => {
    onPlayAgain();
  };

  const restartGame = () => {
    onPlayAgain();
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      musicPlayerRef.current?.pause();
    } else {
      musicPlayerRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    musicPlayerRef.current?.nextTrack();
  };

  const previousTrack = () => {
    musicPlayerRef.current?.previousTrack();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Theme: {theme}</h2>
      <h3 className={styles.subtitle}>Art Style: {artStyle}</h3>
      <div className={styles.playerContainer}>
        <div className={styles.playerSection}>
          <h4 className={styles.artCategoryTitle}>Player 1 Art Categories</h4>
          <div className={styles.artCategoryGrid}>
            {artCategoriesLeft.map((category, index) => (
              <button
                key={index}
                className={`${styles.artCategoryButton} ${
                  category.selected ? styles.artCategoryButtonSelected : styles.artCategoryButtonUnselected
                }`}
                onClick={() => handleSelectArtCategoryLeft(index)}
                disabled={currentPlayer !== "left"}
              >
                {category.text}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.playerSection}>
          <h4 className={styles.artCategoryTitle}>Player 2 Art Categories</h4>
          <div className={styles.artCategoryGrid}>
            {artCategoriesRight.map((category, index) => (
              <button
                key={index}
                className={`${styles.artCategoryButton} ${
                  category.selected ? styles.artCategoryButtonSelected : styles.artCategoryButtonUnselected
                }`}
                onClick={() => handleSelectArtCategoryRight(index)}
                disabled={currentPlayer !== "right"}
              >
                {category.text}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className={styles.timer}>Time Left: {timeLeft} seconds</p>
      <div className={styles.playerContainer}>
        <div className={styles.playerSection}>
          <h4 className={styles.playerTitle}>Player 1</h4>
          <div className={styles.elementGrid}>
            {elementsLeft.map((element, index) => (
              <button
                key={index}
                className={`${styles.elementButton} ${
                  element.selected
                    ? styles.elementButtonSelected
                    : styles.elementButtonUnselected
                }`}
                onClick={() => handleSelectElementLeft(index)}
                disabled={currentPlayer !== "left"}
              >
                {element.text}
              </button>
            ))}
          </div>
          <div className={styles.generateButtonContainer}>
            <button
              className={styles.generateButton}
              onClick={generateImageLeft}
              disabled={selectedArtCategoriesLeft.length === 0 || selectedElementsLeft.length < 5 || currentPlayer !== "left" || isGeneratingLeft}
            >
              {isGeneratingLeft ? "Generating artwork..." : "Generate Image"}
            </button>
          </div>
          {imgLeft && (
            <div>
              <img src={imgLeft} alt="Generated Artwork" className={styles.resultImage} />
              <p className={styles.score}>Comment: {commentLeft}</p>
              <p className={styles.score}>Value: {valueLeft}</p>
            </div>
          )}
        </div>
        <div className={styles.playerSection}>
          <h4 className={styles.playerTitle}>Player 2</h4>
          <div className={styles.elementGrid}>
            {elementsRight.map((element, index) => (
              <button
                key={index}
                className={`${styles.elementButton} ${
                  element.selected
                    ? styles.elementButtonSelected
                    : styles.elementButtonUnselected
                }`}
                onClick={() => handleSelectElementRight(index)}
                disabled={currentPlayer !== "right"}
              >
                {element.text}
              </button>
            ))}
          </div>
          <div className={styles.generateButtonContainer}>
            <button
              className={styles.generateButton}
              onClick={generateImageRight}
              disabled={selectedArtCategoriesRight.length === 0 || selectedElementsRight.length < 5 || currentPlayer !== "right" || isGeneratingRight}
            >
              {isGeneratingRight ? "Generating artwork..." : "Generate Image"}
            </button>
          </div>
          {imgRight && (
            <div>
              <img src={imgRight} alt="Generated Artwork" className={styles.resultImage} />
              <p className={styles.score}>Comment: {commentRight}</p>
              <p className={styles.score}>Value: {valueRight}</p>
            </div>
          )}
        </div>
      </div>
      <div className={styles.generateButtonContainer}>
        <button
          className={styles.generateButton}
          onClick={playAgain}
          disabled={!imgLeft || !imgRight || isGeneratingLeft || isGeneratingRight}
        >
          Play Again
        </button>
      </div>
      {timeUp && (
        <div>
          <p className={styles.timeUpMessage}>Time is up! You did not select any art categories or elements.</p>
          <button className={styles.playAgainButton} onClick={restartGame}>
            Start New Round
          </button>
        </div>
      )}
      <div className={styles.musicPlayer}>
        <button
          className={styles.musicPlayerButton}
          onClick={previousTrack}
          >
          Previous
          </button>
          <button
                 className={styles.musicPlayerButton}
                 onClick={togglePlayPause}
               >
          {isPlaying ? "Pause" : "Play"}
          </button>
          <button
                 className={styles.musicPlayerButton}
                 onClick={nextTrack}
               >
          Next
          </button>
          </div>
          </div>
          );
          }
          