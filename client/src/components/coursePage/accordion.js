import React, { useState } from "react";

const Accordion = ({ chapters }) => {
  const [open, setOpen] = useState(false);
  return (
    <div class="accordion" id="accordion">
      {chapters.map((chapter, index) => (
        <div class="accordion-item">
          <h2 class="accordion-header" id={`heading${index}`}>
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${index}`} aria-expanded="true" aria-controls={`collapse${index}`}>
              {chapter.name}
            </button>
          </h2>
          <div id={`collapse${index}`} class="accordion-collapse collapse" aria-labelledby={`heading${index}`} data-bs-parent="#accordion">
            <div class="accordion-body p-0">
              {chapter.lessons.map((lesson) => (
                <div class="card">
                  <div class="card-body">
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