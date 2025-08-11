import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./MainWindow.css";
import { invoke } from "@tauri-apps/api/core";
import { ThemeContext } from "../../Contex/ThemeContex";

export default function MainWindow() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [label, setLabel] = useState("");
  const [headerTime, setHeaderTime] = useState("0:00");
  const [headerTasks, setHeaderTasks] = useState("0/0");

  // Хранит предыдущее значение минут, чтобы инкремент вызывался только при изменении минут
  const prevMinutesRef = useRef(null);
  
  // Ref для аудио элемента
  const audioRef = useRef(null);
  const soundTimeoutRef = useRef(null);

  // Функция для воспроизведения звука
  const playTimerEndSound = () => {
    // Создаем аудио контекст для генерации простого звукового сигнала
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const playBeep = (frequency, duration, delay = 0) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      }, delay);
    };
    
    // Воспроизводим последовательность звуков в течение 4 секунд
    playBeep(800, 0.2, 0);
    playBeep(600, 0.2, 500);
    playBeep(800, 0.2, 1000);
    playBeep(600, 0.2, 1500);
    playBeep(800, 0.2, 2000);
    playBeep(600, 0.2, 2500);
    playBeep(800, 0.2, 3000);
    playBeep(600, 0.2, 3500);
    playBeep(800, 0.2, 4000);

    // Автоматически останавливаем через 4 секунды
    soundTimeoutRef.current = setTimeout(() => {
      stopSound();
    }, 4000);
  };

  // Функция для остановки звука
  const stopSound = () => {
    if (soundTimeoutRef.current) {
      clearTimeout(soundTimeoutRef.current);
      soundTimeoutRef.current = null;
    }
  };

  const fetchDataFromFile = async () => {
    if (label === "WORK" || label === "REST") {
      try {
        const timeFromFile = await invoke("get_today_time", { label });
        setHeaderTime(timeFromFile);
      } catch (err) {
        console.error("Ошибка при получении времени из файла:", err);
      }
    }
    try {
      const tasksFromFile = await invoke("get_today_tasks");
      setHeaderTasks(tasksFromFile);
    } catch (err) {
      console.error("Ошибка при получении задач из файла:", err);
    }
  };

  useEffect(() => {
    const storedLabel = localStorage.getItem("timerLabel");
    if (storedLabel) {
      setLabel(storedLabel);
    }
  }, []);

  useEffect(() => {
    if (!label) return;

    // Получаем или создаём timerEndTime (через 25 минут от now, если нет)
    let storedEndTime = localStorage.getItem("timerEndTime");
    if (!storedEndTime) {
      const defaultEnd = Date.now() + 25 * 60 * 1000;
      localStorage.setItem("timerEndTime", defaultEnd.toString());
      storedEndTime = defaultEnd.toString();
    }

    const endTime = parseInt(storedEndTime, 10);

    const updateTimer = () => {
      const now = Date.now();
      const diffInSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
      setSecondsLeft(diffInSeconds);

      // Если таймер дошел до 0, воспроизводим звук
      if (diffInSeconds === 0 && prevMinutesRef.current !== null) {
        playTimerEndSound();
        return;
      }

      if (diffInSeconds <= 0) return; // Таймер закончился

      const currentMinutes = Math.floor((diffInSeconds % 3600) / 60);

      // Инкрементируем только при изменении минут (и если label правильный)
      if (
        prevMinutesRef.current !== null &&
        currentMinutes !== prevMinutesRef.current &&
        (label === "WORK" || label === "REST")
      ) {
        invoke("increment_today_time", { label })
          .then(() => console.log(`+1 минута к ${label}`))
          .catch((err) =>
            console.error("Ошибка при обновлении времени:", err)
          );
        fetchDataFromFile();
      }

      prevMinutesRef.current = currentMinutes;
    };

    updateTimer(); // сразу обновим

    // Интервал — обновляем каждую минуту
    const interval = setInterval(updateTimer, 1000 * 60);

    return () => {
      clearInterval(interval);
      prevMinutesRef.current = null; // сброс при размонтировании
      stopSound(); // останавливаем звук при размонтировании
    };
  }, [label]);

  useEffect(() => {
    fetchDataFromFile();
  }, [label]);

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);

  const handleStop = () => {
    stopSound(); // Останавливаем звук
    localStorage.removeItem("timerEndTime");
    localStorage.removeItem("timerLabel");
    prevMinutesRef.current = null;

    const nextLabel = label === "WORK" ? "REST" : "WORK";
    navigate("/set", { state: { text: nextLabel } });
  };

  const handleGoToTasks = () => {
    stopSound(); // Останавливаем звук
    navigate("/create");
  };

  const handleEnd = () => {
    stopSound(); // Останавливаем звук
    navigate("/end");
  };

  return (
    <div className="MainWindow">
      <header>
        <div className="header_time">
          <h1>{label}</h1>
          <p>{headerTime}</p>
        </div>
        <div className="header_task">
          <h1>TASKS</h1>
          <p>{headerTasks}</p>
        </div>
      </header>

      <div
        className="MainWindow_Timer"
        onDoubleClick={() => {
          toggleTheme();
          console.log(theme);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.h1
            key={hours}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            id="hour"
          >
            {hours}
          </motion.h1>
        </AnimatePresence>

        <span className="colon">:</span>

        <AnimatePresence mode="wait">
          <motion.h1
            key={minutes}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            id="minute"
          >
            {minutes.toString().padStart(2, "0")}
          </motion.h1>
        </AnimatePresence>
      </div>

      <div className="bottom_buttons">
        <button id="b_tasks" onClick={handleGoToTasks}>
          tasks
        </button>
        <button id="b_stop" onClick={handleStop}>
          stop
        </button>
        <button id="b_end" onClick={handleEnd}>
          end
        </button>
      </div>
    </div>
  );
}