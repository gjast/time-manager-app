import React, { useEffect, useState } from "react";
import "./Info.css";
import arrow from "/img/arrow.svg";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";

export default function Info() {
  const navigate = useNavigate();
  const [dayList, setDayList] = useState([]);

  useEffect(() => {
    invoke("get_all_days")
      .then((res) => {
        const entries = Object.entries(res);

        // Сортировка по дате по убыванию
        entries.sort((a, b) => {
          const [dayA, monthA, yearA] = a[0].split(".").map(Number);
          const [dayB, monthB, yearB] = b[0].split(".").map(Number);
          return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
        });

        setDayList(entries);
      })
      .catch((err) => {
        console.error("Ошибка загрузки данных:", err);
      });
  }, []);

  return (
    <div className="Info">
      <header>
        <button id="button_back" onClick={() => navigate(-1)}>
          <img src={arrow} alt="back" />
        </button>
        <h1>ALL TASKS</h1>
      </header>

      <div className="Container_info">
        {dayList.map(([date, data], index) => (
          <motion.div
            key={date}
            className="Info_task"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
						  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <h1 id="task_time">{date}</h1>
            <div className="Info_task_text">
              <h1 className="info_element">WORK: {data.work}</h1>
              <h1 className="info_element">REST: {data.relax}</h1>
              <h1 className="info_element">TASKS: {data.tasks}</h1>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
