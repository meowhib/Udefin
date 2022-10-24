# Udefin
A Udemy selfhosted courses player. It was called Udefin because it was made to play Udemy courses (Or any course just follow the structure of folders (CourseName > ListOfChapters > LessonsNames)) and inspired by Jellyfin.
Courses need to be places in the assets folder.

## Features
- Parse folder data
- Keep progress
- An accordion on the side to play the courses from (similar UI to Udemy's player)

## Requirements
- Mongodb installed
- Nodejs installed

## Upcomming features
- Take notes from the player itself
- Subtitles support
- Show progress of each course in the courses page
- Modify the name of courses (To remove uploader's name)
- Automatically/manually change the thumbnail of the course
- Custom video controls
- Ability to select folder from which the courses are played (Like Jellyfin libraries)

## Notice
- This will probably will be rewritten in Python and use files as database so it can be supported on many computers with only Python installed (which a lot of people already have).