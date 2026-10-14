import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell, navigation } from './components/AppShell';
import { Overview } from './pages/Overview';
import { FoundationPage } from './pages/FoundationPage';
const DataManager = React.lazy(() => import('./pages/DataManager').then(module => ({ default: module.DataManager })));
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><Routes><Route element={<AppShell/>}><Route index element={<Overview/>}/>{navigation.filter(item => item.path !== '/' && item.path !== '/data-manager').map(item => <Route key={item.path} path={item.path} element={<FoundationPage title={item.label}/>}/>)}<Route path="/data-manager" element={<React.Suspense fallback={<p>Loading Data Manager…</p>}><DataManager/></React.Suspense>}/><Route path="*" element={<FoundationPage title="Page not found"/>}/></Route></Routes></BrowserRouter></React.StrictMode>);
