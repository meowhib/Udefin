import React, { useState } from "react";

const Accordion = ({ chapters, lessonClickHandler }) => {
  const onLessonClick = (lessonId) => {
    return () => {
      lessonClickHandler(lessonId);
    }
  };

  return (
    <div className="accordion" id="accordion">
      {chapters.map((chapter, chapterIndex) => (
        <div key={ chapterIndex } className="accordion-item">
          <h2 className="accordion-header" id={`heading${chapterIndex}`}>
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${chapterIndex}`} aria-expanded="true" aria-controls={`collapse${chapterIndex}`}>
              {chapter.name}
            </button>
          </h2>
          <div id={`collapse${chapterIndex}`} className="accordion-collapse collapse" aria-labelledby={`heading${chapterIndex}`} data-bs-parent="#accordion">
            <div className="accordion-body p-0">
              {chapter.lessons.map((lesson, lessonIndex) => (
                <div key={ lessonIndex } className="card" onClick={onLessonClick(lesson._id)}>
                  <div className="card-body">
                    {lesson.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Accordion;