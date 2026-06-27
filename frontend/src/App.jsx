import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Admin from './pages/Admin'
import Home from './pages/Home'
import Form from './pages/Form'
 
const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/admin' element={<Admin />} />
          <Route path='/form/:token' element={<Form />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}
 
export default App
 
