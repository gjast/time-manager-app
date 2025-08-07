import React, { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./CreateTasks.css";
import arrow from "/img/arrow.svg";
import plus from "/img/plus.svg";
import info from "/img/info.svg";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function CreateTasks() {
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const modalRef = useRef(null);
  const navigate = useNavigate();

  const updateTasksInFile = (tasks) => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;

    invoke("update_today_tasks", { completed, total }).catch((err) =>
      console.error("Ошибка записи задач в файл:", err)
    );
  };

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    setTasks(savedTasks);
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowModal(false);
        setNewTask("");
      }
    };

    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal]);

  const handleAddTask = () => {
    if (newTask.trim() === "") return;

    const newTaskObj = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
    };

    const updated = [...tasks, newTaskObj];
    setTasks(updated);
    updateTasksInFile(updated);

    setNewTask("");
    setShowModal(false);
  };

  const handleToggleCompleted = (id) => {
    const updated = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updated);
    updateTasksInFile(updated);
  };

  return (
    <div className="CreateTasks">
      <header>
        <motion.button
          id="button_back"
          onClick={() => navigate(-1)}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <img src={arrow} alt="arrow" />
        </motion.button>

        <h1>TASKS ON TODAY</h1>
      </header>

      <div className="tasks_container">
        {tasks.length === 0 && <p id="no_tasks">No tasks yet</p>}
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`task-item ${task.completed ? "completed" : ""}`}
            onDoubleClick={() => handleToggleCompleted(task.id)}
          >
            <p id="task_number">{index + 1}</p>
            <p id="task_text">{task.text}</p>
          </div>
        ))}
      </div>

      <motion.button
        id="button_plus"
        onClick={() => setShowModal(true)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <img src={plus} alt="plus" />
      </motion.button>

      <motion.button
        id="button_info"
        onClick={() => navigate("/info")}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <img src={info} alt="info" />
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="modal-box"
              ref={modalRef}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <textarea
                placeholder="New task"
                className="modal-textarea"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                autoFocus
              />
              <div className="button-container">
                <motion.button
                  onClick={handleAddTask}
                  className="add-button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  Add
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
