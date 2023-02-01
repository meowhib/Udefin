# Udefin
A selfhosted video courses player. A solution for anyone that downloads courses and learns offline. Keeps track of where you left off in lessons just like online websites do.

## Features
- Parse folder data and structure them
- Tracks progress and plays lessons from where you left off
- An accordion on the side to play the courses from (similar UI to Udemy's player)
- Edit course information (name, topic, etc...)
- Show progress of each course in the courses page

## Requirements
- Node.js
- MongoDB

## Getting started
1. Clone the repository
```bash
git clone https://github.com/meowhib/Udefin.git
```

2. Install dependencies
```bash
npm install
```

3. Start the application
```bash
npm start
```

If you want to run MongoDB on docker you can follow the following instructions:
```bash
docker run -d -p 27017:27017 -v /path/to/data:/data/db mongo
```

## Upcomming features
- React.js front-end (Currently working on this)
- Subtitles support (Currently working on this)
- Imbed resources (pdfs, files) in the accordion
- Docker image
- Custom video controls
- Ability to select folder from which the courses are played (Like Jellyfin libraries)