import React from 'react';
import CoursesPage from './components/coursesPage/coursesPage';
import CoursePage from './components/coursePage/coursePage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';

const App = () => {

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<CoursesPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CoursePage />} />
      </>
    )
  );

  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
