import './App.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import RedZoneELO from './leaderboard/RedZoneELO';

function App() {
  return (
    <Router>
      <Routes>
        <Route path = '/' Component={() => {
          window.location.href = "https://gttribe.github.io/site/";
          return null;
        }}/>
        <Route path = '/home' element={<Home/>}/>
        <Route path='/elo' element={<RedZoneELO/>}/>
      </Routes>
    </Router>
  );
}

export default App;
