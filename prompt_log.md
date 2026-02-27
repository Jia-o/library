## prompt log

It must list which AI model(s)/tools you used, document the development process from start to finish (including which parts of the code were written or substantially 
modified by you), and include important, non-trivial prompts. As a whole, this file should make it obvious that you invested roughly 5–6 hours of work.

Models:
- ChatGPT
- Gemini

Prompts:
- given these inspo library images, you will code a virtual space turning those images 3d where the user can use arrow keys to walk around the library.
- make the library have 16 "tables" and on each table put a placeholder jar which will eventually be replaced with an animated jar that gives you books. first, give me a plan of how you will code this
- it just shows a white screen with the index.html instructions when i run it? the content on main.js doesn't appear. im opening it with live server on vscode and the page has this error: 'Uncaught TypeError: Failed to resolve module specifier "three". Relative references must start with either "/", "./", or "../".'
- there looks like a horizontal white wall i want to remove. here is everything i know about it: it is visible when you first enter the room that disappears once you walk past it, it reppears when you're on one half of the room but not the other, it is glowey and white, removing the hemilight makes it a darker colour, it splits the room exactly in half. im not sure what this may be (a light, fog, etc)
- gave it my hw4, asked it to learn what it does, asked it to transfer backend onto finished javascript file

Non-AI:
- basically the entre index.html file
- inspo images and background images
- nudging positioning to debug overlapping objects
- changing colours
