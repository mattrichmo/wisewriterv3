# Wisewriter V3
A linear process of book ideation, audience research, book development, art development, and then package into an Epub, Docx, and PDF

# Book Ideation
The intent of this phase is to generate variance yet consistency with the LLM. We will use book ideation

## Audience Research 
A simple OpenAI function to develop a reader demographic 

## Marketing Demographic 
Takes the audience information and returns similar books, eithors etc

## Book Details 
The AI chooses from a list of pre defined authors which will determine the write style of the book. Edit the Author object for different selections. 

## Book Title Creation 
Generates a list then recursively chooses the best one and if there isnt a good title, run again. 

# Book Content Generatetion 

## Chapter Outline
Generates a number of chapters (as chosen in the bookInputs) in an array and a chapter theme for each chapter. 

## Small Plot Summary Genertion 
Then generates a number of chosen small plot summaries for each chapter in a 2d Array. 

## Long Plot Summary Generation
Then generates a long paragraph of the story in a linear easy to follow format from lest to right. on the 3d array. 

## Chapter Title Creation 
Then generates a number of titles in an array on the 4th level. 

## Content Generation 
Looks at the desired input for the content length, then depending on how far into the story we write, we ask the AI to generate between 1-8 paragraphs. We check the length, and if its not at the desired length then we sent that response to the AI to summarize into a single paragraph and ask the AI where in the story we should go next, and then send a recursive call to the AI with the long Plot Summary (as a map), the current summary of ebverything we just wrote, and the last paragraph we wrote and the insutrrctions for the next part of the story, then join it into a single string. 

# Book Cover Creation 

## Cover Design Detail 
We use Open AI to generate a number of design details, including which combination of google font we should use, we then download those google fonts and place them in a folder. We also ask for colour palletes for this book. 

## Book Cover PRompt Generation 
We ask the AI to to generate a number of image prompts based on certain parameters of the book. 

## Cover Image Generation 
We then use a discord bot to send a request to our discord server to speak to the midourney bot. Once the image is genersted, we then upscale it and then download. 

## Upscale using REAL-esrgan
Upscale the image to a large 300 ppi style image. 

## Create cover using HTML Canvas
We then take the upscaled image, and the fonts, and the 'style' (pre-defined templates), and put it together. There are a number of steps here to ensure that whatever title we choose does not overflow the cover, and that aesthically it looks good. 

# Book Creation 

## Create Epub, DOCX, & PDF
We format the book, and take the generated image to a final epub book. 

# Book Sale 

## Upload to Amazon
Using Pupeteer we then upload the new ebook to amazon and set it as a draft for us to quality check. # wisewriterv3
