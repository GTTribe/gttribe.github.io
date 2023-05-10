import './App.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path = '/' Component={() => {
          window.location.href = "https://gttribe.github.io/site/";
          return null;
        }}/>
        <Route path = '/home' element={<Home/>}/>
      </Routes>
    </Router>
  );
}

export default App;
