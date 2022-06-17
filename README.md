# Web Recording Booth

This is a repo for a project where we needed to set up a recording booth. Users run the booth themselves and make a short recording based on a theme.  Once they finish recording, they can accept a set of terms and conditions, provide their name and email address, and upload their recording.  They also have the option at any point to start over.  

I used the [*Simple Recorder.js demo*](https://addpipe.com/simple-recorderjs-demo/) as the basis for audio recording in the browser. I use Node and Express to run a server to save the files and and serve them back for download.  There is little to no security as we ran this on our own iPad device and did not make it available to the public.  

I also experimented with the *idb-keyval* package to save the recordings locally in case the upload crashes.  I had to mix it in as a module which is why the app.js is listed as a module in index.html.  If you use it, just be careful not to forget to occasionally clear the local storage once your recordings are saved and backed up.

There have been some changes to the web browser since Recorder.js was built.  The navigator.getUserMedia method will only work in a secure context, aka HTTPS.  I followed [these instructions](https://stackoverflow.com/questions/11744975/enabling-https-on-express-js) to get my server to use HTTPS.  This is not a great solution, as it makes the user proceed through a few warnings to get to the page, but it works nonetheless.  
