# Udefin
A Udemy selfhosted courses player. It was called Udefin because it was made to play Udemy courses (Or any course just follow the structure of folders (CourseName > ListOfChapters > LessonsNames)) and inspired by Jellyfin.
Courses need to be places in the assets/courses folder.

## Features
- Parse folder data
- Keep progress and play lessons from where you left off
- An accordion on the side to play the courses from (similar UI to Udemy's player)
- Edit course information (name, topic, etc...)

## Requirements
- Mongodb installed
- Nodejs installed

## Installation
- Clone the repo and cd into it
- Run `npm install` to install the dependencies
- Install mongodb and run it
- Run `node index.js` to start the server (it runs on port 3000 by default)

Currently that's the only way to install it, I will make a docker image soon.

## Upcomming features
- Take notes from the player itself
- Imbed resources (pdfs, files) in the accordion
- Subtitles support
- Show progress of each course in the courses page
- Custom video controls
- Ability to select folder from which the courses are played (Like Jellyfin libraries)

## Notice
- This will probably will be rewritten in Python and use files as database so it can be supported on many computers with only Python installed (which a lot of people already have).