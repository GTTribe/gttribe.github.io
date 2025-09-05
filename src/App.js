import './App.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Leaderboard from './leaderboard/Leaderboard';
import Generate from './leaderboard/Generate';

function App() {
  return (
    <Router>
      <Routes>
        <Route path = '/' Component={() => {
          window.location.href = "https://gttribe.github.io/site/";
          return null;
        }}/>
        <Route path = '/home' element={<Home/>}/>
        <Route path='/rz9' element={<Leaderboard/>}/>
        <Route path='/elo/generate' element={<Generate/>}/>
      </Routes>
    </Router>
  );
}

export default App;
