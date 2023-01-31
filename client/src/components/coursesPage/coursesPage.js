import React, { useState, useEffect } from 'react';
import CourseBanner from './courseBanner';

const coursesBannersHolder = () => {
    const [courses, setCourses] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
          setIsLoading(true);
          setError(null);
          try {
            const res = await fetch('http://localhost:3000/courses', {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const json = await res.json();
            setCourses(json);
          } catch (err) {
            setError(err);
          }
          setIsLoading(false);
        }
        fetchData();
    }, []);    

    
    const handleDelete = async (id) => {
        try {
            setIsLoading(true);
            setError(null);
            await fetch(`http://localhost:3000/courses/${id}`, {
                method: 'DELETE',
                mode: 'cors',
                headers: {
                'Content-Type': 'application/json',
                },
            })
            .then(() => {
                setCourses(courses.filter((course) => course._id !== id));
            });
        } catch (err) {
            setError(err);
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error.message}</p>;
    }

    return (
        <div className="courses-banners-holder">
            <div className='container'>
                <h1>Courses</h1>
                <div className='row'>
                    {courses.map((course) => {
                        return (
                            <CourseBanner key={ course._id } course={ course } onDelete={ handleDelete }/>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default coursesBannersHolder;