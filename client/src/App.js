import React from 'react';
import CoursePage from './components/coursePage';
import CoursesBannersHolder from './components/coursesBannersHolder';
import 'bootstrap/dist/css/bootstrap.min.css';
import { createBrowserRouter, createRoutesFromElements, Outlet, Route, RouterProvider } from 'react-router-dom';

const App = () => {

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
      <Route path="/" element={<CoursesBannersHolder />} />
      <Route path="/courses" element={<CoursesBannersHolder />} />
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
