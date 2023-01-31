import React from 'react';
import { Link } from 'react-router-dom';

const courseBanner = ({course, onDelete}) => {
    const handleClick = () => {
        onDelete(course._id);
    };

    return (
        <div className="col-sm-12 col-md-6 col-lg-4 col-xl-3 col-xxl-3">
            <div className='card position-relative'>
                <div className='card-body'>
                    <Link to={`/courses/${course._id}`}><h5 className='card-title'>{course.name}</h5></Link>
                    <h2>{course.overAllProgress}</h2>  
                    <button className="btn btn-primary" onClick={handleClick}>Delete</button>
                </div>
                <div className='progress' style={{"border-top-left-radius": 0,"border-top-right-radius": 0,"height": "8px",}}>
                    <div className='progress-bar bg-primary' style={{"width": "10%"}}>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default courseBanner;