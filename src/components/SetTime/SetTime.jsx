import React, { useState } from "react";
import "./SetTime.css";
import arrow from "/img/arrow.svg";
import ScrollPicker from "../ScrollPicker/ScrollPicker";
import { useNavigate, useLocation } from "react-router-dom";

const SetTime = () => {
  const location = useLocation();
  const text = location.state?.text || "WORK";

  const navigate = useNavigate();

  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);


const handleNext = () => {
  const now = Date.now();
  const durationInSeconds = hour * 3600 + minute * 60;
  const endTime = now + durationInSeconds * 1000;

  localStorage.setItem("timerEndTime", endTime.toString());
  localStorage.setItem("timerLabel", text); // если тебе нужно слово WORK/REST и т.д.

  navigate("/main");
};


  return (
    <div className="SetTime">
      <header>
       
        <h1>{text}</h1>
      </header>

      <div className="SetTime_timer">
        <div className="timer">
          <ScrollPicker color="red" start={0} count={24} onChange={setHour} />
          <span className="dot-color">:</span>
          <ScrollPicker
            color="var(--text-color)"
            start={0}
            count={60}
            format={(n) => n.toString().padStart(2, "0")}
            onChange={setMinute}
          />
        </div>
        <button className="button_cont" onClick={handleNext}>
          <img src={arrow} />
        </button>
      </div>
    </div>
  );
};

export default SetTime;
