import React, { useEffect, useState } from "react";
import "./End.css";
import arrow from "/img/arrow.svg";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";

export default function End() {
  const navigate = useNavigate();

  const [workTime, setWorkTime] = useState("loading...");
  const [restTime, setRestTime] = useState("loading...");
  const [tasks, setTasks] = useState("loading...");

  useEffect(() => {
    invoke("get_today_time", { label: "WORK" })
      .then((res) => setWorkTime(res))
      .catch((err) => {
        console.error("Ошибка загрузки времени работы:", err);
        setWorkTime("0:00");
      });

    invoke("get_today_time", { label: "REST" })
      .then((res) => setRestTime(res))
      .catch((err) => {
        console.error("Ошибка загрузки времени отдыха:", err);
        setRestTime("0:00");
      });

    invoke("get_today_tasks")
      .then((res) => setTasks(res))
      .catch((err) => {
        console.error("Ошибка загрузки задач:", err);
        setTasks("0/0");
      });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        staggerChildren: 0.2,
        when: "beforeChildren"
      }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="End"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1 id="title_end" variants={itemVariants}>
        Statistics Of The Day
      </motion.h1>
      <motion.div className="End_info" variants={containerVariants}>
        <motion.div className="End_info_element" variants={itemVariants}>
          <p>Work</p>
          <h1>{workTime}</h1>
        </motion.div>
        <motion.div className="End_info_element" variants={itemVariants}>
          <p>Rest</p>
          <h1>{restTime}</h1>
        </motion.div>
        <motion.div className="End_info_element" variants={itemVariants}>
          <p>Tasks</p>
          <h1>{tasks}</h1>
        </motion.div>
      </motion.div>
      <motion.div className="container_button" variants={itemVariants}>
        <button id="button_continue" onClick={() => navigate("/start")}>
          <img src={arrow} alt="arrow" />
        </button>
      </motion.div>
    </motion.div>
  );
}
