# Udefin
A selfhosted courses player. Folder structure: Course > Chapters > Lessons 
Courses need to be places in the assets/courses folder.

## Features
- Parse folder data
- Track progress and play lessons from where you left off
- An accordion on the side to play the courses from (similar UI to Udemy's player)
- Edit course information (name, topic, etc...)
- Show progress of each course in the courses page

## Installation
- Clone the repo and cd into it
- Run `npm install` to install the dependencies
- Install mongodb and run it
- Run `node index.js` to start the server (it runs on port 3000 by default)

## Upcomming features
- React.js front-end (Currently working on this)
- Subtitles support (Currently working on this)
- Imbed resources (pdfs, files) in the accordion
- Take notes from the player itself
- Custom video controls
- Ability to select folder from which the courses are played (Like Jellyfin libraries)