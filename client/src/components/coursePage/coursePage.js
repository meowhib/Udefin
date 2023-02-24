import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import Accordion from "./accordion";

const coursePage = () => {
  let { courseId } = useParams();

  const [courseData, setCourseData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState("");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:3000/courses/' + courseId, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const json = await res.json();
        setCourseData(json);
      } catch (err) {
        setError(err);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);   
  
  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
      return <p>{error.message}</p>;
  }

  return (
    <>
      <div className="container-fluid p-0">
        <div className="row gx-0">
          <div className="col-xl-8">
            <div className="video-container ratio ratio-16x9 bg-primary">
              <video id="video" controls autoplay>
                <source id="videoSource" src={ "http://localhost:3000/video/" + courseId } type="video/mp4" />
              </video>
            </div>
            <div className="video-info-container py-3">
              <h3 id="videoTitle">{courseData.name}</h3>
            </div>
          </div>
          <div className="col-xl-4">
            <div class="vh-100 position-relative">
              <Accordion chapters={ courseData.chapters }/>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default coursePage;