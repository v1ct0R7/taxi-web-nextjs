import { useContext } from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import Home from './pages/Home/Home'
import Track from './pages/Track/Track'
import Offers from './pages/Offers/Offers'
import { StoreContext } from './context/storeContext'

const App = () => {
  const { errorMessage, setErrorMessage } = useContext(StoreContext);

  return (
    <>
      <Navbar />
      {errorMessage && <div className="app-alert" role="alert">{errorMessage}<button onClick={() => setErrorMessage("")} aria-label="Mbyll mesazhin">×</button></div>}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/ride' element={<Track />} />
        <Route path='/offers' element={<Offers />} />
        <Route path='*' element={<Home />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
