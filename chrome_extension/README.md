Voila
======

Voila is an application which is aimed at improving the user experience when 
consuming long videos. It provides a way for a user to see interesting or 
engaging parts of a video based on the analysis of video watching patterns 
of other users. 

It also provides an option to summarize the video for the user 
automatically. On the client-side, a chrome extension logs video watching 
patterns as the user consumes streaming video content, such as video on 
YouTube. The logs of watch patterns are then sent to a web-service that 
performs analysis to discover sections of the video which are more engaging. 

When there are sufficient samples of such watch patterns from users, 
the extension displays a heat-map under the video indicating degree to which 
various sections were watched. This helps new users by indicating visually, 
the more and less watched sections of a video, allowing one to move between 
these sections, thereby improving productivity and the user experience. The 
videos are also analyzed offline to create an initial summary video which then 
is dynamically changed based on the user patterns as collected by the Chrome 
extension. As a secondary effect, it may also reduce the amount of video traffic 
that is transferred.
