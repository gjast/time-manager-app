// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import StartPage from './components/StartPage/StartPage.jsx'
import SetTime from './components/SetTime/SetTime.jsx'
import { invoke } from '@tauri-apps/api/core'
import './App.css'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MainWindow from './components/MainWindow/MainWindow.jsx'
import CreateTasks from './components/CreateTasks/CreateTasks.jsx'
import {ThemeProvider } from './Contex/ThemeContex.jsx' 
import End from './components/End/End.jsx'
import Info from './components/Info/Info.jsx'

function Redirector() {
  const navigate = useNavigate()

  useEffect(() => {
    const check = async () => {
      try {
        await invoke('check_data_file')
        const exists = await invoke('check_today_exists')
        console.log('check_today_exists:', exists)

        if (exists) {
          navigate('/set', { state: { text: 'WORK' } })
        } else {
          navigate('/')
        }
      } catch (err) {
        console.error('Ошибка при проверке даты:', err)
        navigate('/')
      }
    }

    check()
  }, [])

  return null
}

function App() {
  return (
    <main className="App">
      <ThemeProvider> 
        <Router>
          <Redirector />
          <Routes>
            <Route path="/" element={<StartPage />} />
            <Route path="/set" element={<SetTime />} />
            <Route path="/main" element={<MainWindow />} />
            <Route path="/create" element={<CreateTasks />} />
            <Route path='/end' element={<End/>} />
            <Route path='/info' element={<Info/>}/>
          </Routes>
        </Router>
      </ThemeProvider>
    </main>
  )
}

export default App
