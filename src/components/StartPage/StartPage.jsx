import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StartPage.css';
import arrow from '/img/arrow.svg';
import { invoke } from '@tauri-apps/api/core';

const StartPage = () => {
  const navigate = useNavigate();


  const handleClick = async () => {
    localStorage.removeItem('tasks')
    try {
      await invoke('add_today_date');
      navigate('/set');
    } catch (err) {
      console.error('Ошибка при добавлении даты:', err);
    }
  };

  return (
    <div className="StartPage">
      <h1>NOTHING</h1>
      <button onClick={handleClick}>
        <p>Start the working day</p>
        <img src={arrow} alt="arrow" />
      </button>
    </div>
  );
};

export default StartPage;
