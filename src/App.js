import React from "react";
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import './App.css';
import Kanban from './components/Kanban';

const App = () => {
  return (
      <BrowserRouter>
        <Switch>
          <Route path='/' component={Kanban} />
        </Switch>
      </BrowserRouter> 
  );
};

export default App;