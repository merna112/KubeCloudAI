import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { persistor, store } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';

createRoot(document.getElementById('root')).render(
  <PersistGate persistor={persistor}>
  <Provider store={store}>
    <App/>
  </Provider>
  </PersistGate> 
);
