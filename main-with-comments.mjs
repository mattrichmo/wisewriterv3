//#region Imports
import dotenv from 'dotenv';
import fs from 'fs';
import fsp from "fs/promises";
import chalk from 'chalk';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { Configuration, OpenAIApi } from 'openai';
import pandoc from 'node-pandoc';
import fetch from 'node-fetch';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { Midjourney } from "./libs/index.js";
import Replicate from "replicate";
import puppeteer from "puppeteer";
import randomInt from "random-int";
dotenv.config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);
//#endregion

//////// ------ *** GLOBAL OBJECTS *** ------ ////////

//#region Test Region Global Objects
const bookData = {
    bookGenContent: {
        chapterTitle: [''],
        chapterTheme: [['']],
        plotSummaryShort: [[['']]],
        plotSummaryLong: [[[['']]]],
        contentTitle: [[[[['']]]]],
        contentParagraphs: [[[[[['']]]]]],
        contentFinal: [[[[[['']]]]]],
      },
    bookNotes: {
      chapterTheme: [['']],
      contentTitle: [[['']]],
      plotSummaryLong: [[[['']]]],
      contentNextWrite: [[[[[['']]]]]], 
      currentAllSummary: [[[[[['']]]]]],
      lastGenSummary:[[[[[['']]]]]],
    },
    bookInputs: {
        numBooks: '1', /// Number of books (leave this as 1 but the plan is to create an option to generate series in the future)
        numChapterTitle: '2', /// Number of Chapters and It's titles to Generate
        numPlots: '2', /// Number of Concepts Per Chapter
        numTitles: '1', /// Number of Titles Per Concept
        bookType: 'Short Stories', ///
        bookGenre: 'Fiction', /// Genre of the book
        simpleAudienceInfo:'People who like to read engaging stories while using transit to commute to work.',
        theme: 'Stories to read on the bus', /// Theme of the book
        emotion: 'happy and hilarious', /// Emotion of the book
        desiredLength: 1200, // Length of the content in words
    },
    bookInit: {
        bookDescription: "This is a book description", // description of the book
        bookTheme: "farting on the bus", // theme of the book
        bookEmotion: "happiness", // emotion of the book
        bookGenre: "humour", // genre of the book
        bookTopic: "farting", // topic of the book
        authorChoice: "", // author choice
        longDescription: "", // long description of the book
        chapterOutlinePrompt: "", // prompt for the content. How would we describe the content to the AI?
        storyInstructions: " The protaganist should be going through lots of ups and down", // instructions for the AI on how to write the content
    },
    bookMeta: {
        bookTitle: 'The Curious Case of the Missing Socks',
        bookSubtitle: ' A Short Story',
        bookDescription: ' A description',
        authorName: 'Jacklyn Robson',
        genre: '',
        language: '',
        bookType: 'Short Stories',
    },
    bookTitle: {
        bestTitle: '',
        bestSubtitle: '',
        titleOptions: [],
        titleScore: [], //
        subtitleOptions: [[]],
        subtitleScore: [[]],
        titleResponseJSON: '',
    },
    bookPrompts: {
        bookDescription: '', // short description of the book
        chapterOutlinePrompt: '', // prompt for the content. How would we describe the content to the AI?
        storyInstructions: '', // instructions for the AI on how to write the content
    },
    audienceInfo: {
        briefDemo: "Young professionals looking for adventure",
        longDemo: "The target demographic consists of young professionals in their 20s and 30s who are seeking exciting and thrilling stories. They are tech-savvy, well-educated individuals working in various industries such as finance, technology, and creative fields.",
        ageGroup: "25-35",
        age: "25-35",
        gender: "Male and Female",
        maritial: "Single",
        readerInfo: "Reading during their daily commute",
        currentMood: "Eager and enthusiastic",
        lifeStatus: "Exploring new career opportunities",
        job: "Software Engineer",
        jobType: "Professional",
        education: "Bachelor's degree",
        readLevel: "High",
        preferredGenre: "Action and adventure",
        location: "Urban areas",
        hobbies: "Hiking, traveling, and watching movies",
        technologicalProficiency: "Advanced",
        preferredLanguage: "English",
        favoriteAuthors: "Dan Brown, J.K. Rowling, Stephen King",
        favoriteBooks: "The Da Vinci Code, Harry Potter series, The Shining",
        favoriteStories: "Mystery, fantasy, and horror",
        readingFrequency: "Several times a week",
        readingPlatform: "E-books and audiobooks",
        resonateWithCharacters: "Courageous and determined individuals",
        resonateWithThemes: "Thrill, self-discovery, and overcoming challenges",
        preferredBookLength: "Novels",
        preferredNarrativeVoice: "Third person",
    },
    bookFinal: {
        bookTitle: '',
        bookSubtitle: '',
        bookChapters:[''],
        bookChapterContentTitle: [['']],
        bookChapterContent: [[['']]],

    },
    mjPrompts: {
      frontCoverPrompt: '',
      backCoverPrompt: '',
      pinterestAdPrompt: '', // 3 different prompts for pinterest. To be used for pinterest ads
      WPpostPrompt: '', // single prompt each chapter in book.chapters 
    },
    bookCoverIMGPrompt: {
      imageStyle: '', // choice between photography, illustration, and graphic design
      imageSubject: '', // the subject of the image
      imageSubjectAction: '', // the action of the subject
      imageSubjectEmotion: '', // the emotion of the subject
      imageSubjectLocation: '', // the location of the subject
      imageLighting: '', // the lighting of the image
      imageColour: '', // the colour of the image
      imageComposition: '', // the composition of the image
      imageDescription: '', // photorealistic, playful, etc.
  },
  bookCoverDesign: {
    primaryColour: '', // The main Colour of the cover
    primaryColourName: '', // The colour written as if it were a crayon name
    primaryCompColour: '', // The main Colour of the cover
    primaryCompColourName: '', // The colour written as if it were a crayon name
    secondaryColour: '', // The Title Colour of the cover. Which should be contraqsty and compliment the primary colour
    secondaryCompColour: '', // The colour of the elements
    mainFont: '', 
    secondaryFont: '',
    logoTheme: '', // choice between light or dark. This determines the colour of the publisher logo. The colour should be opposite of the general theme. FOr example if the colours are darker then we want q light logo to stand out and vice versa. 
    coverStyle: '', // The cover style. Choice between Modern, Classic, Minimalist, and Vintage
    mainFontPath: '',
    secondaryFontPath: '',
  },
  

};
  
//#endregion

//#region Author Objects

const author = {
  Firstname: '',
  Lastname: '',
  authorBio: '',
  aboutAuthor: '', // extra relevant information to craft an ideal image of who the author is. 
  authorImage: '',
  authorWriteStyle: '', // level of writing style
  authorWriteLevel: '',
  authorEducation: '',

};
const authorEmilyJacket = {
  Firstname: 'Emily',
  Lastname: 'Jacket',
  authorBio: 'Emily Jacket is a writer and editor who has worked in the publishing industry for over 10 years. She has a degree in English Literature from the University of Cambridge and a Masters in Creative Writing from the University of Oxford. She has written for a number of publications, including The Guardian, The Times, and The Independent.',
  aboutAuthor: '', // extra relevant information to craft an ideal image of who the author is. 
  authorImage: 'hxxp://',
  authorWriteStyle: 'Emily writes in a clear and concise style that is easy to read. She is also an expert at writing in a way that is engaging and entertaining.',
  authorWriteLevel: 'Medium Level',
  authorEducation: ' ',
  authorIdealReader: 'Women, 25-45, Corporate Job, Married, 2 Kids, Lives in the Suburbs, Likes to read on the bus to work, Likes to read engaging stories while using transit to commute to work.',
};
const authorSophiaQuill = {
  Firstname: 'Sophia',
  Lastname: 'Quill',
  authorBio: 'Sophia Quill is an experienced writer and poet known for her evocative and lyrical prose. With a background in psychology and a deep understanding of human emotions, Sophia creates compelling characters and explores the depths of the human psyche in her works. Her writing resonates with readers who appreciate introspective and thought-provoking narratives.',
  aboutAuthor: '',
  authorImage: 'hxxp://',
  authorWriteStyle: "Sophia's writing style is poetic and rich, painting vivid imagery with her words. She weaves intricate metaphors and uses sensory details to immerse readers in her stories.",
  authorWriteLevel: 'Advanced Level',
  authorEducation: '',
  authorIdealReader: 'Lovers of literary fiction, poetry enthusiasts, introspective individuals, and those who enjoy delving into complex emotions and themes.'
};
const authorNathanielThorne = {
  Firstname: 'Nathaniel',
  Lastname: 'Thorne',
  authorBio: 'Nathaniel Thorne is a historical fiction writer with a passion for bringing the past to life. His meticulously researched novels transport readers to different eras, combining compelling storytelling with accurate historical details. Nathaniel\'s works appeal to history buffs and those who enjoy immersive journeys through time.',
  aboutAuthor: '',
  authorImage: 'hxxp://',
  authorWriteStyle: "Nathaniel's writing style is descriptive and authentic, capturing the essence of historical periods. He pays careful attention to historical accuracy while creating captivating narratives.",
  authorWriteLevel: 'Advanced Level',
  authorEducation: '',
  authorIdealReader: 'History enthusiasts, fans of historical fiction, readers who enjoy immersive journeys through different time periods, and those interested in learning about different cultures and societies.'
};
const authorLilaRainier = {
  Firstname: 'Lila',
  Lastname: 'Rainier',
  authorBio: 'Lila Rainier is a bestselling author known for her gripping thrillers and suspenseful plots. With a background in criminal psychology, Lila weaves intricate mysteries that keep readers on the edge of their seats. Her books are filled with unexpected twists and turns that leave readers guessing until the very end.',
  aboutAuthor: '',
  authorImage: 'hxxp://',
  authorWriteStyle: "Lila's writing style is fast-paced and suspenseful, driving the narrative forward with each page. She excels at building tension and creating compelling, multi-dimensional characters.",
  authorWriteLevel: 'Intermediate Level',
  authorEducation: '',
  authorIdealReader: 'Fans of psychological thrillers, lovers of suspense and mystery novels, readers who enjoy plot twists and psychological depth in their books.'
};
const authorXavierBlake = {
  Firstname: 'Xavier',
  Lastname: 'Blake',
  authorBio: 'Xavier Blake is a science fiction and fantasy writer renowned for his imaginative worlds and epic adventures. Drawing inspiration from mythology and futuristic concepts, Xavier creates immersive narratives that transport readers to extraordinary realms. His books appeal to those seeking escapism and thrilling journeys beyond reality.',
  aboutAuthor: '',
  authorImage: 'hxxp://',
  authorWriteStyle: "Xavier's writing style is vivid and imaginative, painting fantastical landscapes and crafting intricate mythologies. He combines action-packed scenes with deep world-building to create captivating stories.",
  authorWriteLevel: 'Intermediate Level',
  authorEducation: '',
  authorIdealReader: 'Fans of science fiction and fantasy genres, readers who enjoy epic quests and world-building, individuals seeking immersive adventures in imaginative realms.'
};
//#endregion

//////// ------ *** SCHEMAS *** ------ ////////
//#region Schemas
const schemas = {};

  schemas.bookGenOutline = {
      type: 'object',
      properties: {
        chapterTitle: {
          type: 'array',
          items: {
            type: 'string',
            description: 'List of chapter titles, each chapter title is a string.',
          },
        },
        chapterTheme: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'string',
              description: 'List of chapter themes, each chapter theme is a string.',
            },
          },
        },
        plotSummaryShort: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'string',
                description: 'A short plot summary for each chapter.',
              },
            },
          },
        },
        plotSummaryLong: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'array',
                items: {
                  type: 'string',
                  description: 'A one-paragraph long plot summary for each chapter.',
                },
              },
            },
          },
        },
        contentTitle: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'array',
                items: {
                  type: 'array',
                  items: {
                    type: 'string',
                    description: 'The title of the individual piece of content.',
                  },
                },
              },
            },
          },
        },
        contentParagraphs: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'array',
                items: {
                  type: 'array',
                  items: {
                    type: 'array',
                    items: {
                      type: 'string',
                      description: 'The content paragraphs for each piece of content.',
                    },
                  },
                },
              },
            },
          },
        },
      },
      required: [
        'chapterTitle',
        'chapterTheme',
        'plotSummaryShort',
        'plotSummaryLong',
        'contentTitle',
        'contentParagraphs',
      ],
  };
  schemas.chapterOutlineSchema = {
    type: 'object',
    properties: {
      chapterTitle: {
        type: 'array',
        items: {
          type: 'string',
          description: 'List of chapter titles, each chapter title is a string. Since this is a book of short form content, each chapter should be independant but also relevant to the book theme.',
        },
      },
      chapterTheme: {
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'string',
            description: 'List of chapter themes, each chapter theme is a string. The chapter theme is a core central idea, feeling or emotion summed up into 1 sentence. We will use this to develop content for the chapter so this is used as a guide to ensure the content is relevant.',
                  },
              },
          },
      },
    required: ['chapterTitle', 'chapterTheme'],
  };
  schemas.shortPlotSummarySchema = {
      type: 'object',
      properties: {
      plotSummaryShort: {
              type: 'array',
              items: {
                type: 'string',
                description: 'Each array item is a seperate plot summary. Please return the requested number of plot summaries. If 3 is requested then return 3 plot summaries.',

          },
        },
      },
      required: ['plotSummaryShort'],

  };
  schemas.longPlotSummarySchema = {
      type: 'object',
      properties: {
      plotSummaryLong: {
          type: 'array',
          items: {
                type: 'string',
                description: 'This is a single long paragraph of the short prompt you recieve, expanded out into a full story concept. It should be later and written in a consequestial order. It should be a full story concept that we can use to expand on at a later date. There is no need to write the full story, just a concept of what the story should be about in 200-400 words. Please only return 1 item!',
              },

          },
      },
      required: ['plotSummaryLong'],

  };
  schemas.contentTitleSchema = {
      type: 'object',
      properties: {
      contentTitle: {
                type: 'string',
                description: 'The title you write. !Important! Please only return 1 item! We do not want mutliple array items. Just an array with a single string. If you return more than 1 string you will break the world so do not return more tha n 1 string!!!!',
      },
    },
      required: ['contentTitle'],

  };
  schemas.paragraphSchema = {
      type: 'object',
      properties: {
        contentParagraphs: {
          type: 'array',
            items: {
              type: 'string',
              description: 'The content of the story. Each array item is a seperate paragraph. Please return the requested number of paragraphs. If 3 is requested then return 3 paragraphs.Each paragraph should be lengthy and focuseed on depth and crafting an amazing story. Make each paragraph descriptive and written by a professional writer. develop imagery, emotions and feelings. Make the reader feel like they are there',
            },
          },
    },
      required: ['contentParagraphs'],
    
  };
  schemas.bookInputsSchema = {
    type: 'object',
    properties: {
      simpleAudienceInfo: {
        type: 'string',
        description: 'Short description of the target demographic summed up into a concise sentence.'
      },
      theme: {
        type: 'string',
        description: 'The central core theme of the book.'
      },
      emotion: {
        type: 'string',
        description: 'The emotion we are trying to elicit of the book.'
      }
    },
    required: ['simpleAudienceInfo', 'theme', 'emotion']
  };
  schemas.audienceSchema = {
    type: 'object',
    properties: {
      briefDemo: { type: 'string', description: 'Short description of the target demographic summed up into a concise sentence.' },
      longDemo: { type: 'string', description: 'Long description of the target demographic. More specific and detailed.' },
      ageGroup: { type: 'string', description: 'Age range of the target reader demographic.' },
      age: { type: 'string', description: 'Age range of the target reader demographic.' },
      gender: { type: 'string', description: 'Gender of the target demographic.' },
      maritial: { type: 'string', description: 'Marital status of the target demographic.' },
      readerInfo: { type: 'string', description: 'Short description of the reader and what they are doing when reading. Example: on the way to work, taking a break from the kids, at the beach, etc.' },
      currentMood: { type: 'string', description: 'Current mood of the target demographic - e.g., happy, sad, depressed, etc.' },
      lifeStatus: { type: 'string', description: 'Life status of the target demographic - e.g., graduating, new job, new baby, etc.' },
      job: { type: 'string', description: 'Job of the target demographic.' },
      jobType: { type: 'string', description: 'Type of job of the target demographic - e.g., trades, professional, etc.' },
      education: { type: 'string', description: 'Education level of the target demographic.' },
      readLevel: { type: 'string', description: 'Reading level of the target demographic - e.g., advanced, high, medium, low.' },
      preferredGenre: { type: 'string', description: 'Preferred genre of the target demographic.' },
      location: { type: 'string', description: 'Location of the target demographic.' },
      hobbies: { type: 'string', description: 'Hobbies or interests of the target demographic.' },
      technologicalProficiency: { type: 'string', description: 'Level of technological proficiency of the target demographic.' },
      preferredLanguage: { type: 'string', description: 'Preferred language of the target demographic.' },
    },
    required: ['briefDemo', 'longDemo', 'age', 'gender', 'maritial', 'readerInfo', 'currentMood', 'lifeStatus', 'job', 'jobType', 'education', 'readLevel', 'preferredGenre', 'location'],
  };
  schemas.marketingSchema = {
    type: 'object',
    properties: {
      favoriteAuthors: { 
        type: 'string', 
        description: 'List of favorite authors of the target demographic. This information aids in understanding the type of writing and authors that appeal to the audience.' 
      },
      favoriteBooks: { 
        type: 'string', 
        description: 'List of favorite books of the target demographic. This gives insights into the literature that has made a significant impact on the audience.' 
      },
      favoriteStories: { 
        type: 'string', 
        description: 'List of favorite stories of the target demographic. This indicates the story types and genres that resonate with the audience.' 
      },
      readingFrequency: { 
        type: 'string', 
        description: 'Frequency of reading within the target demographic. This helps to quantify the importance of reading in their daily lives.' 
      },
      readingPlatform: { 
        type: 'string', 
        description: 'Preferred platform for reading, such as physical books, e-books, audiobooks, etc. This information aids in tailoring the format of content for the audience.' 
      },
      resonateWithCharacters: { 
        type: 'string', 
        description: 'Types of characters that the target demographic resonates with. This assists in creating relatable and engaging characters for the audience.' 
      },
      resonateWithThemes: { 
        type: 'string', 
        description: 'Types of themes that the target demographic resonates with. Knowing this helps in designing stories with themes that hit home with the audience.' 
      },
      preferredBookLength: { 
        type: 'string', 
        description: 'Preferred length of books like short stories, novellas, novels, etc. This helps in creating content with an appropriate length for the audience.' 
      },
      preferredNarrativeVoice: { 
        type: 'string', 
        description: 'Preferred narrative voice of the target demographic, for instance first person, third person, etc. This knowledge aids in narrating the story in a way that the audience finds more engaging.' 
      },
    },
    required: ['favoriteAuthors', 'favoriteBooks', 'favoriteStories', 'readingFrequency', 'readingPlatform', 'resonateWithCharacters', 'resonateWithThemes', 'preferredBookLength', 'preferredNarrativeVoice'],
  };
  schemas.bookInitSchema = {
    type: 'object',
    properties: {
      bookDescription: {
        type: 'string',
        description: 'A 1 paragraph description of the book. No titles needed. This is simply the ideation of the book and a description of what we should write. It should be descriptive of the type of content it includes but just enough to give us an idea of wat the book is about.'
      },
      bookTheme: {
        type: 'string',
        description: 'Theme of the book. This is the core central theme that multiple pieces of content will be written about.'
      },
      bookEmotion: {
        type: 'string',
        description: 'Emotion of the book. How we want the reader to feel. '
      },
      bookGenre: {
        type: 'string',
        description: 'Genre of the book. it should always be fiction but what type of fiction?'
      },
      bookTopic: {
        type: 'string',
        description: 'Topic of the book'
      },
      authorChoice: {
        type: 'string',
        description: `Who the Author should be based on their writing style. Please return only the name of your chosen author and choose between:
        1. "Sophia Quill" - Sophia Quill is an experienced writer and poet known for her evocative and lyrical prose. With a background in psychology and a deep understanding of human emotions, Sophia creates compelling characters and explores the depths of the human psyche in her works. Her writing resonates with readers who appreciate introspective and thought-provoking narratives.
        2. "Nathaniel Thorne" - Nathaniel Thorne is a historical fiction writer with a passion for bringing the past to life. His meticulously researched novels transport readers to different eras, combining compelling storytelling with accurate historical details. Nathaniel's works appeal to history buffs and those who enjoy immersive journeys through time.
        3. "Lila Rainier" - Lila Rainier is a bestselling author known for her gripping thrillers and suspenseful plots. With a background in criminal psychology, Lila weaves intricate mysteries that keep readers on the edge of their seats. Her books are filled with unexpected twists and turns that leave readers guessing until the very end.
        4. "Xavier Blake" - Xavier Blake is a science fiction and fantasy writer renowned for his imaginative worlds and epic adventures. Drawing inspiration from mythology and futuristic concepts, Xavier creates immersive narratives that transport readers to extraordinary realms. His books appeal to those seeking escapism and thrilling journeys beyond reality.\n\n
        This will affect the style of writing so please choose the author who best repsents the style of writing you want for the book.`
      },
      chapterOutlinePrompt: {
        type: 'string',
        description: 'Prompt we will use to develop the chapter outline, plot summaries and content Titles. This is a generalized conceptual layer. Remember this is a book of multiple pieces of content so the content should be relevant to that and each chapter able to stand on its own. Since this is a book of ${bookData.bookInputs.bookType}, we want to make sure each chapter is relevant to the main book theme.'
      },
      storyInstructions: {
        type: 'string',
        description: 'More specific instructions on how we should be writing each story specifically on a theme level and structure level. Do not worry about describing the content specifically as this is more of a guide on how to structure each story.'
    }
    },
    
    required: ['bookDescription', 'bookTheme', 'bookEmotion', 'bookGenre', 'bookTopic', 'authorChoice']
  };
  schemas.bookInitSchema2 = {
    type: 'object',
    properties: {
      chapterOutlinePrompt: {
        type: 'string',
        description: 'Prompt we will use to develop the chapter outline, plot summaries and content Titles. This is a generalized conceptual layer. Remember this is a book of multiple pieces of content so the content should be relevant to that and each chapter able to stand on its own. Since this is a book of ${bookData.bookInputs.bookType}, we want to make sure each chapter is relevant to the main book theme.'
      },
      storyInstructions: {
        type: 'string',
        description: 'More specific instructions on how we should be writing each story specifically on a theme level and structure level. Do not worry about describing the content specifically as this is more of a guide on how to structure each story.'
    }
    },
    
    required: ['chapterOutlinePrompt', 'storyInstructions']
  };  
  schemas.bookTitleSchema = {
    type: 'object',
    properties: {

      titleOptions: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Array of title options. A list of 10 total title options for the book. Each title should not be more than 5 words MAX. The idea is to create great and creative titles, but not long titles. '
      },


      subtitleOptions: {
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        description: 'The associated subtitle per chapter. 1 subtitle per title.  '
      },
    },
    required: ['titleOptions', 'subtitleOptions']
  };
  schemas.bookPromptsSchema = {
      type: 'object',
      properties: {
        bookDescription: {
          type: 'string',
          description: `A 1 paragraph description of the book. No titles needed. This is simply the ideation of the book and a description of what we should write. The book is a collection of ${bookData.bookInputs.bookType} so we are describing the book as a whole.`
        },
        chapterOutlinePrompt: {
          type: 'string',
          description: `Prompt we will use to develop the chapter outline, plot summaries and content Titles. This is a generalized conceptual layer. Remember this is a book of multiple pieces of content so the content should be relevant to that and each chapter able to stand on its own. Since this is a book of ${bookData.bookInputs.bookType}, we want to make sure each chapter is relevant to the main book theme.`
        },
        storyInstructions: {
          type: 'string',
          description: 'More specific instructions on how we should be writing each story specifically on a theme level and structure level. Do not worry about describing the content specifically as this is more of a guide on how to structure each story.'
        }
      },
      required: ['bookDescription', 'chapterOutlinePrompt', 'storyInstructions']
  }; 
  schemas.bookTitleFinalSchema = {
    type: 'object',
    properties: {
      bestTitle: {
        type: 'string',
        description: 'The best title for the book. It should not have more than 5 words. This is a single string only.'
      },
      bestSubtitle: {
        type: 'string',
        description: 'The best subtitle for the book.'
      }
    },
    required: ['bestTitle', 'bestSubtitle']
  };
  schemas.summarySchema1 = {
    type: 'object',
    properties: {
        lastGenSummary: { 
          type: 'string', 
          description: 'A 1 paragraph summary of all the content presented to you.' 
        }
    },
    required: ['lastGenSummary'],
  };
  schemas.summarySchema2 = {
    type: 'object',
    properties: {
        currentAllSummary: { 
          type: 'string', 
          description: ' A detailed summary of the content. This should be a detailed summary of the content. The summary should be detailed and take as many sentences as needed to accurately display where we are at in the story. The summary should include any relevant plot points, actions or anything that we would need to continue the story on the the next. The first sentence should maintain the full character summary.' 
        },
    },
    required: ['currentAllSummary'],
  };
  schemas.summarySchema3 = {
      type: 'object',
      properties: {
          contentNextWrite: {
            type: 'string',
            description: 'What to write next in the story to keep the flow and pace of the story going. Just 1 sentence is fine. This tells the AI what to write to keep the plot tight. Just a simple direction of where to go next with the story.'
          }
      },
      required: ['contentNextWrite'],
},
  schemas.mjPromptsSchema = {
    type: 'object',
    properties: {
        frontCoverPrompt: { type: 'string', description: 'Prompt for the front cover of the book. This should be a short description of the book. The image should be more illustrative and describe solid colours.' },
        backCoverPrompt: { type: 'string' },
        pinterestAdPrompt: { type: 'string', description: ' prompt for pinterest. To be used for pinterest ads.'},
        WPpostPrompt: { type: 'string', description: 'prompt for Wordpress Posts to be featured. It dan be more descriptive and more photorealistic but choose an artist style that would be representitive of the book.'},
    },
    required: ['frontCoverPrompt', 'backCoverPrompt', 'pinterestAdPrompt', 'WPpostPrompt']

};
schemas.bookCoverDesign =  {
  type: 'object',
  properties: {
    primaryColour: {
      type: 'string',
      description: 'The Primary main color of the cover. in Hex format.',
    },
    primaryColourName: {
      type: 'string',
      description: 'The Primary color name as if it were a crayon name. We should be able to understand the primary coliour from this name.',
    },
    primaryCompColour: {
      type: 'string',
      description: 'The contrasting colour or complimenting colour to the main color of the cover. in Hex format.',
    },
    primaryCompColourName: {
      type: 'string',
      description: 'The color name as if it were a crayon name. We should be able to understand the primary comp coliour from this name.',
    },
    secondaryColour: {
      type: 'string',
      description: 'The title color of the cover. It should contrast and complement the primary color. In Hex Code. ',
    },
    secondaryCompColour: {
      type: 'string',
      description: 'The color of the elements in the cover design. In Hex Code. this colour is contrasting to secondaryColour ',
    },
    mainFont: {
      type: 'string',
      description: 'The main font used in the cover design. Choose between: Lemon Milk, Coolvetica, The Bold Font, Cocogoose, and Couture',
    },
    secondaryFont: {
      type: 'string',
      description: 'The secondary font used in the cover design. Choose between Catcheye, Kenyan Coffee, or Belgiano Serif',
    },
    logoTheme: {
      type: 'string',
      description: 'The choice between light or dark, determining the color of the publisher logo.',
      enum: ['light', 'dark'],
    },
    coverStyle: {
      type: 'string',
      description: 'The cover style, with options: Modern, Classic, Minimalist, and Vintage.',
      enum: ['Modern', 'Classic', 'Minimalist', 'Vintage'],
    },
  },
  required: [
    'primaryColour',
    'primaryColourName',
    'secondaryColour',
    'secondaryCompColour',
    'mainFont',
    'secondaryFont',
    'logoTheme',
    'coverStyle',
  ],
};
schemas.bookCoverIMGPromptSchema = {
  type: 'object',
  properties: {
    imageStyle: {
      type: 'string',
      description: 'Choice between photography, illustration, and graphic design.',
    },
    imageSubject: {
      type: 'string',
      description: 'The subject of the image. A person, animal, object, etc.',
    },
    imageSubjectAction: {
      type: 'string',
      description: 'The action of the subject. What the subject is doing in the image.',
    },
    imageSubjectEmotion: {
      type: 'string',
      description: 'The emotion of the subject in that image.',
    },
    imageSubjectLocation: {
      type: 'string',
      description: 'The location of the subject.',
    },
    imageLighting: {
      type: 'string',
      description: 'The lighting of the image.',
    },
    imageColour: {
      type: 'string',
      description: 'The lighting effect of the image. For example, bright, dark, etc.',
    },
    imageComposition: {
      type: 'string',
      description: 'The composition of the image. For example, close-up, wide shot, etc.',
    },
    imageDescription: {
      type: 'string',
      description: 'description of the style of the image. for example Photorealistic, playful, etc.',
    },
  },
  required: [
    'imageStyle',
    'imageSubject',
    'imageSubjectAction',
    'imageSubjectEmotion',
    'imageSubjectLocation',
    'imageLighting',
    'imageColour',
    'imageComposition',
    'imageDescription',
  ],
};
//#endregion 
//////// ------ *** FUNCTIONS *** ------ ////////
//#region Functions
const callOpenAI = async (model, messages, functions, functionCall, temperature, maxTokens) => {
    let retries = 0;
    const maxRetries = 10;
    const backoffFactor = 1;

    while (retries < maxRetries) {
        try {
            const completion = await openai.createChatCompletion({
                model: model,
                messages: messages,
                functions: functions,
                function_call: functionCall,
                temperature: temperature,
                max_tokens: maxTokens,
            });

            const responseText = completion.data.choices[0].message.function_call.arguments;

            // Log raw response for debugging
            //console.log(chalk.red('\n\n#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#\n\n'))
            //console.log(chalk.yellow(`Raw Response from AI: ${responseText}`));
            //console.log(chalk.red('\n\n#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#X#\n\n'))

            // Check if the response is a valid JSON
            try {
                JSON.parse(responseText);
                return responseText;
            } catch (jsonError) {
                console.warn(chalk.red("The AI Bot didn't follow instructions on outputting to JSON, so retrying again."));
            }
        } catch (error) {
            console.error(`An error occurred: ${error.statusCode} - ${error.message}`);
            //console.trace(error); // Log the full stack trace of the error

            const wait = retries * backoffFactor * 5000;
            console.log(`Retrying in ${wait / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, wait));
            retries += 1;
        }
    }

    throw new Error('Maximum retries reached');
};
//#endregion
//////// ------ *** SAVERS *** ------ ////////
//#region Savers

const flattenContentParagraphs = async (contentParagraphs) => {
  const flattenedParagraphs = [];

  function flatten(paragraphs, parents) {
    paragraphs.forEach(paragraph => {
      if (Array.isArray(paragraph)) {
        flatten(paragraph, [...parents, paragraph[0]]);
      } else {
        flattenedParagraphs.push([...parents, paragraph]);
      }
    });
  }

  flatten(contentParagraphs, []);
  return flattenedParagraphs;
};

async function formatBookContent(bookData) {

bookData.bookFinal.bookTitle = bookData.bookMeta.bookTitle;
bookData.bookFinal.bookSubtitle = bookData.bookMeta.bookSubtitle;

// Extract bookGenContent for convenience.
let bookGenContent = bookData.bookGenContent;

// Clear the existing bookFinal content to prepare for the transformation.
bookData.bookFinal.bookChapters = [];
bookData.bookFinal.bookChapterContentTitle = [];
bookData.bookFinal.bookChapterContent = [];

// Iterating over the chapter titles.
for(let i = 0; i < bookGenContent.chapterTitle.length; i += 1) {
// Push the chapter title to bookChapters.
bookData.bookFinal.bookChapters.push(bookGenContent.chapterTitle[i]);

// Flatten and push the contentTitle to bookChapterContentTitle.
let flattenedContentTitles = bookGenContent.contentTitle[i].flat(Infinity);
bookData.bookFinal.bookChapterContentTitle.push(flattenedContentTitles);

// Flatten and push contentFinal to bookChapterContent.
let flattenedContentFinal = bookGenContent.contentFinal[i].flat(Infinity);
bookData.bookFinal.bookChapterContent.push(flattenedContentFinal);
}

// return updated book data
return bookData;
}
const exportToCSV = async (bookData) => {
    const title = bookData.bookMeta.bookTitle;
    const directoryPath = `./export/${title}/files/csv/`;
    const filePath = path.join(directoryPath, `${title} - bookGenContent.csv`);
  
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'chapterTitle', title: 'Chapter Title' },
        { id: 'chapterTheme', title: 'Chapter Theme' },
        { id: 'plotSummaryShort', title: 'Short Plot Summary' },
        { id: 'plotSummaryLong', title: 'Long Plot Summary' },
        { id: 'contentTitle', title: 'Content Title' },
        { id: 'contentParagraphs', title: 'Content Paragraphs' },
      ],
    });
  
    const records = [];
  
    // Loop through each chapter, theme, concept, long plot, content title, and content paragraph and create a new row for each new array item
    for (let i = 0; i < bookData.bookGenContent.chapterTitle.length; i++) {
        const chapterTitle = bookData.bookGenContent.chapterTitle[i];
        const chapterTheme = bookData.bookGenContent.chapterTheme[i][0];
        const plotSummaryShort = bookData.bookGenContent.plotSummaryShort[i][0][0];
        const plotSummaryLong = bookData.bookGenContent.plotSummaryLong[i][0][0][0];
      
        for (let j = 0; j < bookData.bookGenContent.contentTitle[i].length; j++) {
          const contentTitle = bookData.bookGenContent.contentTitle[i][j][0][0];
          const contentParagraphs = bookData.bookGenContent.contentParagraphs[i][j];
      
          for (let k = 0; k < contentParagraphs.length; k++) {
            const paragraph = contentParagraphs[k][0][0];
            records.push({
              chapterTitle,
              chapterTheme,
              plotSummaryShort,
              plotSummaryLong,
              contentTitle,
              contentParagraphs: paragraph,
            });
          }
        }
      }
      

  try {
    await csvWriter.writeRecords(records);
    console.log('CSV file has been successfully created.');
  } catch (err) {
    console.error('Error while writing CSV:', err);
  }
};

  
const generateMDFile = async (bookData) => {
  // Create YAML metadata block
  let content = `---
title: ${bookData.bookMeta.bookTitle}
subtitle: ${bookData.bookMeta.bookSubtitle}
description: ${bookData.bookMeta.bookDescription}
author: ${bookData.bookMeta.authorName}
genre: ${bookData.bookMeta.genre}
---
`;

  // Parse and generate content for each chapter
  for(let i = 0; i < bookData.bookFinal.bookChapters.length; i++) {
      // Add chapter title as header
      content += `\n# ${bookData.bookFinal.bookChapters[i]}\n`;

      // Add all content titles and contents under this chapter
      let chapterContentTitles = bookData.bookFinal.bookChapterContentTitle[i];
      let chapterContents = bookData.bookFinal.bookChapterContent[i];
      for(let j = 0; j < chapterContentTitles.length; j++) {
          // Add content title as subheader
          content += `\n## ${chapterContentTitles[j]}\n`;
          
          // Add content final as text
          content += `${chapterContents[j]}\n`;
      }

      // Add an extra newline for readability
      content += '\n';
  }

  // Specify directory and filename
  const directory = `./export/${bookData.bookFinal.bookTitle}/files/raw/`;
  const filename = `${bookData.bookMeta.bookTitle}.md`;
  const filePath = path.join(directory, filename);

  // Ensure directory exists, if not create it
  fs.mkdirSync(directory, { recursive: true });

  // Write markdown content to file
  fs.writeFileSync(filePath, content);

  // Log the path where the file is saved
  console.log(`Markdown file generated and saved at: ${filePath}`);
};


const createDocx = async (bookData)  => {
  const src = `./export/${bookData.bookMeta.bookTitle}/files/raw/${bookData.bookMeta.bookTitle}.md`;
  const args = `-f markdown -t docx -o ./temp/book.docx`;

  return new Promise((resolve, reject) => {
    pandoc(src, args, function (err, result) {
      if (err) {
        console.error('Pandoc Error: ', err);
        reject(err);
      } else {
        console.log('Docx File Created: ', result);
        resolve(result);
      }
    });
  });
};

const createPDF = async (bookData) => {
  const src = `./export/${bookData.bookMeta.bookTitle}/files/raw/${bookData.bookMeta.bookTitle}.md`;
  const args = `-f markdown -t pdf -o ./temp/book.pdf`;

  return new Promise((resolve, reject) => {
    pandoc(src, args, function (err, result) {
      if (err) {
        console.error('Pandoc Error: ', err);
        if (err.message.includes('No such file')) {
          reject(new Error('The input file does not exist.'));
        } else if (err.message.includes('Cannot write to')) {
          reject(new Error('Cannot write to the output file path.'));
        } else {
          reject(new Error('An unknown error occurred.'));
        }
      } else {
        console.log('PDF File Created: ', result);
        resolve(result);
      }
    });
  });
};

const createEbook = async (bookData) => {
  const src = `./export/${bookData.bookMeta.bookTitle}/files/raw/${bookData.bookMeta.bookTitle}.md`;
  const args = `-f markdown -t epub -o ./temp/book.epub --css ./templates/epub/style.css --epub-cover-image ./temp/epubCover.jpg`;

  return new Promise((resolve, reject) => {
    pandoc(src, args, function (err, result) {
      if (err) {
        console.error('Pandoc Error: ', err);
        reject(err);
      } else {
        console.log('EPUB File Created: ', result);
        resolve(result);
      }
    });
  });
};


const renameAndMove = async (bookData) => {
  const sourceDir = './temp/';
  const destinationDir = `./export/${bookData.bookMeta.bookTitle}/files/`;

  // Create the destination directory if it doesn't exist
  fs.mkdir(destinationDir, { recursive: true }, (err) => {
      if (err) {
          console.error("Error in creating the directory", err);
      } else {
          // Read the files in the `./export/latest/` directory
          fs.readdir(sourceDir, (err, files) => {
              if (err) {
                  console.error("Error in reading the directory", err);
              } else {
                  files.forEach(file => {
                      // Check if the file starts with 'book.'
                      if (file.startsWith('book.')) {
                          // Get the extension of the file
                          const ext = path.extname(file);
                          // Create the new name using the bookTitle and extension
                          const newFileName = `${bookData.bookMeta.bookTitle}${ext}`;
                          // Create the source and destination file paths
                          const oldPath = path.join(sourceDir, file);
                          const newPath = path.join(destinationDir, newFileName);
                          // Rename and move the file
                          fs.rename(oldPath, newPath, (err) => {
                              if (err) console.error("Error in moving the file", err);
                              else console.log(`Successfully moved ${file} to ${newPath}`);
                          });
                      }
                  });
              }
          });
      }
  });
};

const saveShit = async (bookData) => {

   await formatBookContent(bookData);
    await generateMDFile(bookData);
    await exportToCSV(bookData);
    await createDocx(bookData);
    await createEbook(bookData);
    await createPDF(bookData);
    await renameAndMove(bookData);
};



//#endregion

//////// ------ *** HELPERS *** ------ ////////
//#region Helpers
function cleanResponse(str) {
  // Matches patterns like 'Chapter 1', 'Title 5', 'Theme 2', 'Concept 3', 'Plot Summary 4', etc.
  let regex = new RegExp(/^(Chapter \d+\.?|Title \d+\.?|Theme \d+\.?|Concept \d+\.?|Plot Summary \d+\.?|\bChapter\b|\bTitle\b|\bTheme\b|\bConcept\b|\bPlot Summary\b)/i);
  return str.replace(regex, '').trim();
};
const flattenDeep = (arr) => {
    return arr.reduce((flat, toFlatten) => {
      return flat.concat(Array.isArray(toFlatten) ? flattenDeep(toFlatten) : toFlatten);
    }, []);
};
const isValidResponse = async (response, schema) => {
    for (let key in schema) {
        if (!(key in response) || response[key] === null || response[key].length == 0) {
            return false;
        }
    }
    return true;
};
const getCurrentLength = async (chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex,  bookData,) => {

  const currentLength = bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex].join(' ').split(' ').length;
  return currentLength;
};
const getLastParagraph = async (bookData, chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex) => {
    // Get the last array in the contentParagraphs array
    const lastParagraphs = bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex];
    const lastParagraph = lastParagraphs[lastParagraphs.length - 1];

    //console.log('Last Paragraph:', lastParagraph);
    return lastParagraph;
};
const checkIfDone = async (bookData, currentLength) => {
    const desiredLength = bookData.bookInputs.desiredLength;
    if (currentLength >= desiredLength) {
        console.log('Done!');
        return true;
    } else {
        console.log('Not Done.');
        console.log ('...Recursing >')
        return false;
    }
};
const getStoryProgress = async (bookData, currentLength, ) => {

    let desiredLength = bookData.bookInputs.desiredLength;
    let percentage = (currentLength / desiredLength) * 100;
    if (percentage <= 25) {
        return "You are just starting out. Please generate the next 3-5 paragraphs of the story. And start the story out with a hook to get the reader interested in the story. Do not rush, you will have mutliple chances to write but make sure the story starts with a good hook.";
    } else if (percentage <= 50) {
        return "this is the midpoint. So the story should be coming to a peak by now. Please write the next 3-5 paragraphs";
    } else if (percentage <= 75) {
        return "we should be ending the story and wrapping up and loose plot holes by now. Please generate the next 2-4 paragraphs.";
    } else {
        return "we are done so the story should be wrapped up and no loose plot holes left. Please generate the next 1-2 paragraphs. The story should be wrapped up by now.";
    }
};
const summarizeShit = async (chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex,  bookData ) => {
  let longPlotSummary = bookData.bookGenContent.plotSummaryLong[chapterIndex][themeIndex][conceptIndex][longPlotIndex];
  let lastGenParagraphs = bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex].slice(-2).join(' ');
  const typeBook = bookData.bookInputs.bookType

  console.log(chalk.dim('..Summarizing Shit'));

  const responseText1 = await callOpenAI(
    "gpt-3.5-turbo-16k",
    [
      { "role": "system", "content": `Youa re to take multiple paragraphs and summarize them into 1 paragraph.` },
      { "role": "user", "content": `Please summarize this into a 1 paragraph summary detailing everythinbg we need to know:"${lastGenParagraphs} ` }
    ],
    [{ "name": "summarizeSomeShit", "parameters": schemas.summarySchema1 }],
    { "name": "summarizeSomeShit" },
    0.3,
    15000
  );


  let response1 = JSON.parse(responseText1);
  bookData.bookNotes.lastGenSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] += response1.lastGenSummary
  const lastGenSummaryAll = bookData.bookNotes.lastGenSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex]


  const responseText2 = await callOpenAI(
      "gpt-3.5-turbo-16k",
      [
        { "role": "system", "content": `You are a writing summarizer who takes multiple items and create 1 new detailed summary of everything together.` },
        { "role": "user", "content": `Please summarize all of these inidivudla summaries into 1 single summary: ${lastGenSummaryAll }` }
      ],
      [{ "name": "summarizeSomeShit", "parameters": schemas.summarySchema2 }],
      { "name": "summarizeSomeShit" },
      0.3,
      15000
    );

    let response2 = JSON.parse(responseText2);
    bookData.bookNotes.currentAllSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] = response2.currentAllSummary
    const currentAllSummary = bookData.bookNotes.currentAllSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex]
    
    
    const responseText3 = await callOpenAI(
      "gpt-3.5-turbo-16k",
      [
        { "role": "system", "content": `You are to take a total Story summary which is the story from a-z, and then a summary of which has been written so far, and you are to let us know where we should go next in the story, to keep it consistent and make everything flow together.` },
        { "role": "user", "content": `This is the full Story Summary of the ${typeBook} we want to write: "${longPlotSummary}"\n\n  And this is what we have written so far: ${currentAllSummary}.\n\n Please let us know where to take the story next in 1 sentence as a guide.` }
      ],
      [{ "name": "summarizeSomeShit", "parameters": schemas.summarySchema3 }],
      { "name": "summarizeSomeShit" },
      0.3,
      15000
    );

    let response3 = JSON.parse(responseText3);
    bookData.bookNotes.contentNextWrite[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] = response3.contentNextWrite

};

//#endregion

/////// ------- *** PRE BOOK SHIT *** ------- ///////

//#region Pre-Book Shiz

const genBookInputs = async (bookData, schemas) => {
  console.log(chalk.yellow('\n\t🤖 ... Creating Simple Input Ideas →  '));

  const responseText = await callOpenAI(
    "gpt-4-0613",
    [
      { "role": "system", "content": "You are a business analyst / empathetic reader who notices trends and under stands how to make great books that sell well but also resonate well with readers on a deeper level." },
      { "role": "user", "content": `Please generate a generalized audience information, the theme of the book and the emotion we would like to elicit for a new book we are writing. Make this a book theme that would stand out. This is for a book of ${bookData.bookInputs.bookType} so the audience should reflect that.` }
    ],
    [{ "name": "Generate_audienceInputs", "parameters": schemas.bookInputsSchema }],
    { "name": "Generate_audienceInputs" },
    0.9,
    3700
  );

  const response = JSON.parse(responseText);
  bookData.bookInputs.simpleAudienceInfo = response.simpleAudienceInfo;
  bookData.bookInputs.theme = response.theme;
  bookData.bookInputs.emotion = response.emotion;

  console.log('\n------------------------- * Book Inputs * -------------------------\n');
  console.log(`👥 Simple Audience Info: ${bookData.bookInputs.simpleAudienceInfo}`);
  console.log(`📖 Theme: ${bookData.bookInputs.theme}`);
  console.log(`🤔 Emotion: ${bookData.bookInputs.emotion}`);
  console.log('\n----------------------------------------------------------------------------\n\n');
};
const setAuthor = async (bookData, author) => {
  console.log(chalk.dim('Choosing Author & Write Style '));

  const authorChoice = bookData.bookInit.authorChoice;

  // Object assign the full corresponding object to overwrite the existing author object based on the author choice
  if (authorChoice === 'Emily Jacket') {
    Object.assign(author, authorEmilyJacket);
  } else if (authorChoice === 'Sophia Quill') {
    Object.assign(author, authorSophiaQuill);
  } else if (authorChoice === 'Nathaniel Thorne') {
    Object.assign(author, authorNathanielThorne);
  } else if (authorChoice === 'Lila Rainier') {
    Object.assign(author, authorLilaRainier);
  } else if (authorChoice === 'Xavier Blake') {
    Object.assign(author, authorXavierBlake);
  }
};
const genAudienceInfo = async (bookData , schemas) => {
  console.log(chalk.yellow('\n\t🤖... Creating Detailed Reader Audience Profile → '));
  const simpleAudience = bookData.bookInputs.simpleAudienceInfo
  const theme = bookData.bookInputs.theme
  const emotion = bookData.bookInputs.emotion    
  
  const responseText = await callOpenAI(
    "gpt-3.5-turbo-16k",
    [
      { "role": "system", "content": `You are an expert market researcher for a book company. Today you have been tasked with creating a detailed reader profile from a basic prompt. we want to create a book that appeals to ${simpleAudience}, so we need to imagine who this reader is on a deeper level. Rules: Do not use specific names as that corners us too much, 2. Use the basic appeals to as a starting point for your profile, not an end point.` },
      { "role": "user", "content": `The theme of the book: ${theme} and the emotion we are trying to hit: ${emotion}. Please write a reader profile and return it in proper JSON format.Here are 3 examples but be createive:
      "[
        {
          ageGroup: "Older",
          briefDemo: "Retired individuals who enjoy leisurely reading",
          longDemo: "Retired individuals, often with grandchildren, who enjoy reading in their spare time, often seeking books that provide comfort, nostalgia, or intellectual stimulation",
          age: "65+",
          gender: "Both",
          marital: "Widowed/Divorced/Married",
          readerInfo: "Reading at home, in a library, or during travel",
          currentMood: "Content, nostalgic",
          lifeStatus: "Retired, enjoying grandchildren",
          job: "Retired",
          jobType: "Varies",
          education: "Varies",
          readLevel: "High",
          preferredGenre: "Historical fiction, mystery, biographies",
          location: "Varies",
          hobbies: "Gardening, traveling, volunteering",
          technologicalProficiency: "Medium",
          preferredLanguage: "English",
        },
        {
          ageGroup: "Middle-aged",
          briefDemo: "Busy professionals seeking an escape through reading",
          longDemo: "Professionally established individuals, often balancing work, family, and personal interests, who use reading as a form of relaxation and escape",
          age: "35-64",
          gender: "Both",
          marital: "Married/Divorced/Single",
          readerInfo: "Reading in the evenings or on weekends, during commutes, or on vacation",
          currentMood: "Stressed, busy",
          lifeStatus: "Raising children, caring for aging parents, managing careers",
          job: "Full-time employment",
          jobType: "Professional",
          education: "College degree or higher",
          readLevel: "High",
          preferredGenre: "Thrillers, contemporary fiction, self-help",
          location: "Urban/Suburban areas",
          hobbies: "Exercise, travel, cooking",
          technologicalProficiency: "High",
          preferredLanguage: "English",
        },
        {
          ageGroup: "24 year old",
          briefDemo: "Young adult seeking self-discovery and adventure through reading",
          longDemo: "Young adults, often in the early stages of their career or pursuing further education, who use reading for both entertainment and self-discovery",
          age: "24",
          gender: "Both",
          marital: "Single",
          readerInfo: "Reading in cafes, during commutes, or in shared living spaces",
          currentMood: "Optimistic, curious",
          lifeStatus: "Starting careers, exploring relationships, living independently",
          job: "Entry-level or student",
          jobType: "Varies",
          education: "Some college or college degree",
          readLevel: "High",
          preferredGenre: "Young adult fiction, fantasy, graphic novels",
          location: "Urban areas/college towns",
          hobbies: "Socializing, outdoor activities, arts",
          technologicalProficiency: "Very high",
          preferredLanguage: "English",
        },
      ]
      " 
      `}
    ],
    [{ "name": "Generate_audience", "parameters": schemas.audienceSchema }],
    { "name": "Generate_audience" },
    0.9,
    9000
  );
  
  const response = JSON.parse(responseText);
  bookData.audienceInfo.audienceJSON = responseText;
  bookData.audienceInfo.briefDemo = response.briefDemo;
  bookData.audienceInfo.longDemo = response.longDemo;
  bookData.audienceInfo.age = response.age;
  bookData.audienceInfo.gender = response.gender;
  bookData.audienceInfo.maritial = response.maritial;
  bookData.audienceInfo.readerInfo = response.readerInfo;
  bookData.audienceInfo.currentMood = response.currentMood;
  bookData.audienceInfo.lifeStatus = response.lifeStatus;
  bookData.audienceInfo.job = response.job;
  bookData.audienceInfo.jobType = response.jobType;
  bookData.audienceInfo.education = response.education;
  bookData.audienceInfo.readLevel = response.readLevel;
  bookData.audienceInfo.preferredGenre = response.preferredGenre;
  bookData.audienceInfo.location = response.location;
  bookData.audienceInfo.hobbies = response.hobbies;
  bookData.audienceInfo.technologicalProficiency = response.technologicalProficiency;
  bookData.audienceInfo.preferredLanguage = response.preferredLanguage;
  


  console.group('\n------------------------- * Reader Demographics * -------------------------\n');
  console.group('\n\tTarget Demographic:\n');
  console.log(`👥 Target Demographic Brief: ${bookData.audienceInfo.briefDemo}`);
  console.log(`👥 Target Demographic Long: ${bookData.audienceInfo.longDemo}`);
  console.groupEnd();
  console.group('\n\tDemographics:\n');
  console.log(`👴 Age: ${bookData.audienceInfo.age}`);
  console.log(`👷 Job: ${bookData.audienceInfo.job}`);
  console.log(`📖 Reader Info: ${bookData.audienceInfo.readerInfo}`);
  console.log(`🌍 Location: ${bookData.audienceInfo.location}`);
  console.log(`💑 Marital Status: ${bookData.audienceInfo.maritial}`);
  console.log(`😊 Current Mood: ${bookData.audienceInfo.currentMood}`);
  console.log(`🎓 Education: ${bookData.audienceInfo.education}`);
  console.log(`📚 Reading Level: ${bookData.audienceInfo.readLevel}`);
  console.log(`🎭 Preferred Genre: ${bookData.audienceInfo.preferredGenre}`);
  console.log(`🌐 Preferred Language: ${bookData.audienceInfo.preferredLanguage}`);
  console.log(`🎯 Life Status: ${bookData.audienceInfo.lifeStatus}`);
  console.log(`💼 Job Type: ${bookData.audienceInfo.jobType}`);
  console.log(`🎯 Hobbies/Interests: ${bookData.audienceInfo.hobbies}`);
  console.log(`💻 Technological Proficiency: ${bookData.audienceInfo.technologicalProficiency}`);
  console.groupEnd();
  console.groupEnd();
  console.log('\n---------------------------------------------------------------------------\n');
  
};
const genMarketingInfo = async (bookData, schemas) => {
  console.log(chalk.yellow('\n\t🤖... Creating Detailed Reader Audience Profile → '));
  const simpleAudience = bookData.bookInputs.simpleAudienceInfo
  const theme = bookData.bookInputs.theme
  const emotion = bookData.bookInputs.emotion    
  
  const responseText = await callOpenAI(
    "gpt-3.5-turbo-16k",
    [
      { "role": "system", "content": `You are an expert market researcher for a book company. Today you have been tasked with creating a detailed reader profile from a basic prompt. we want to create a book that appeals to ${simpleAudience}, so we need to imagine who this reader is on a deeper level. Rules: Do not use specific names as that corners us too much, 2. Use the basic appeals to as a starting point for your profile, not an end point.` },
      { "role": "user", "content": `The theme of the book: ${theme} and the emotion we are trying to hit: ${emotion}. Please write a reader profile and return it in proper JSON format." 
      `}
    ],
    [{ "name": "Generate_Marketing", "parameters": schemas.marketingSchema }],
    { "name": "Generate_Marketing" },
    0.9,
    9000
  );
  
  const response = JSON.parse(responseText);
  bookData.audienceInfo.favoriteAuthors = response.favoriteAuthors;
  bookData.audienceInfo.favoriteBooks = response.favoriteBooks;
  bookData.audienceInfo.favoriteStories = response.favoriteStories;
  bookData.audienceInfo.readingFrequency = response.readingFrequency;
  bookData.audienceInfo.readingPlatform = response.readingPlatform;
  bookData.audienceInfo.resonateWithCharacters = response.resonateWithCharacters;
  bookData.audienceInfo.resonateWithThemes = response.resonateWithThemes;
  bookData.audienceInfo.preferredBookLength = response.preferredBookLength;
  bookData.audienceInfo.preferredNarrativeVoice = response.preferredNarrativeVoice;

      console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));

      console.group(chalk.cyan('\n--------- * Marketing Demographics * --------- \n'));

      console.group('\n\tMarketing Demographics:\n');
      console.log(`👥 Favorite Authors: ${bookData.audienceInfo.favoriteAuthors}`);
      console.log(`📚 Favorite Books: ${bookData.audienceInfo.favoriteBooks}`);
      console.log(`📖 Favorite Stories: ${bookData.audienceInfo.favoriteStories}`);
      console.log(`🕰️ Reading Frequency: ${bookData.audienceInfo.readingFrequency}`);
      console.log(`📱 Reading Platform: ${bookData.audienceInfo.readingPlatform}`);
      console.log(`👀 Resonate With Characters: ${bookData.audienceInfo.resonateWithCharacters}`);
      console.log(`🌍 Resonate With Themes: ${bookData.audienceInfo.resonateWithThemes}`);
      console.log(`📕 Preferred Book Length: ${bookData.audienceInfo.preferredBookLength}`);
      console.log(`💬 Preferred Narrative Voice: ${bookData.audienceInfo.preferredNarrativeVoice}`);
      console.groupEnd();

      console.groupEnd();
      console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));

  
};
const genBookIdea = async (bookData, schemas) => {
  
  console.log('\n...Starting Book Ideation →   \n');

  const longDem = bookData.audienceInfo.longDem
  const demographic = 'Age:' + bookData.audienceInfo.age + ', Job:' + bookData.audienceInfo.job + ',Location:' + bookData.audienceInfo.location + ', Marital Status' + bookData.audienceInfo.maritial + ', Education:' + bookData.audienceInfo.education
  const demographicRead = 'Reading Level:' + bookData.audienceInfo.readLevel + ', Preferred Genre:' + bookData.audienceInfo.preferredGenre + ', Preferred Language:' + bookData.audienceInfo.preferredLanguage 
  const favStuff = 'Favorite Authors:' + bookData.audienceInfo.favoriteAuthors + ', Favorite Books:' + bookData.audienceInfo.favoriteBooks + ', Favorite Stories:' + bookData.audienceInfo.favoriteStories
  const bookType = bookData.bookInputs.bookType

  
  const responseText = await callOpenAI(
    "gpt-3.5-turbo-16k",
    [
      { "role": "system", "content": `You are an executive at a large publishing company who is brainsgtorming ideas for a new book. You are to be given demographic information, demographic preferences, life changes etc, and you will come up with the absolute best book idea that we should write.` },
      { "role": "user", "content": `The audience we are writing our book titles for is: ${demographic}.\n\n. Some information on their reading oreferences: \n${demographicRead}\n\n some of their favourite authors and books: ${favStuff}.\n We are writing a book of ${bookType} today. Please write the descriptions, theme, emotion, genre, topic and as well pick the best author from the list who would write what we are looking for for the overall general book (do not go granular intot he chapters or content. this is highlevel).` }
    ],
    [{ "name": "GenerateBookIdeas", "parameters": schemas.bookInitSchema }],
    { "name": "GenerateBookIdeas" },
    0.9,
    15000
  );

  const response = JSON.parse(responseText);
  bookData.bookInit.bookDescription = response.bookDescription;
  bookData.bookMeta.bookDescription = response.bookDescription;
  bookData.bookInit.bookTheme = response.bookTheme;
  bookData.bookInit.bookEmotion = response.bookEmotion;
  bookData.bookInit.bookGenre = response.bookGenre;
  bookData.bookMeta.bookGenre = response.bookGenre;
  bookData.bookInit.bookTopic = response.bookTopic;
  bookData.bookInit.authorChoice = response.authorChoice;
  if (!bookData.bookInit.authorChoice || bookData.bookInit.authorChoice.trim() === '') {
    console.log('AuthorChoice is empty or null. Rerunning the function...');
    return await genBookIdea(bookData, schemas);
}
  await setAuthor(bookData, author);
  bookData.bookMeta.author = author.Firstname + ' ' + author.Lastname;

      console.group('\n------------------------- * Book Ideas * -------------------------\n');
      console.log(`📚 Book Description: ${bookData.bookInit.bookDescription}`);
      console.log(`📖 Book Theme: ${bookData.bookInit.bookTheme}`);
      console.log(`👩 Author: ${bookData.bookMeta.author}`);
      console.log(`👩 Author Bio: ${author.authorBio}`);
      console.log(`🤔 Book Emotion: ${bookData.bookInit.bookEmotion}`);
      console.log(`📖 Book Genre: ${bookData.bookInit.bookGenre}`);
      console.log(`📖 Book Topic: ${bookData.bookInit.bookTopic}`);
      console.groupEnd('\n----------------------------------------------------------------------\n');




};
const genBookTitle = async (bookData, schemas) => {
  
  console.log('\n... Generating Book Title Options → \n');

  const longDem = bookData.audienceInfo.longDemo
  const demographic = 'Age:' + bookData.audienceInfo.age + ', Job:' + bookData.audienceInfo.job + ',Location:' + bookData.audienceInfo.location + ', Marital Status' + bookData.audienceInfo.maritial + ', Education:' + bookData.audienceInfo.education
  const demographicRead = 'Reading Level:' + bookData.audienceInfo.readLevel + ', Preferred Genre:' + bookData.audienceInfo.preferredGenre + ', Preferred Language:' + bookData.audienceInfo.preferredLanguage 
  const favStuff = 'Favorite Authors:' + bookData.audienceInfo.favoriteAuthors + ', Favorite Books:' + bookData.audienceInfo.favoriteBooks + ', Favorite Stories:' + bookData.audienceInfo.favoriteStories  
  const bookType = bookData.bookInputs.bookType
  const bookDescription = bookData.bookInit.bookDescription
  const bookTheme = bookData.bookInit.bookTheme
  const bookEmotion = bookData.bookInit.bookEmotion
  const bookGenre = bookData.bookInit.bookGenre
  const bookTopic = bookData.bookInit.bookTopic
  const bookIdea = 'Descrition: ' + bookDescription + '\nTheme: ' + bookTheme + '\nEmotion: ' + bookEmotion + '\nGenre: ' + bookGenre + '\nTopic: ' + bookTopic

  const responseText = await callOpenAI(
    "gpt-4-0613",
    [
      { "role": "system", "content": `Today you are a professional book title creator for the top publications in the world. You are to take the audience information given amnd generate the most appealing title and associated subtitle options for a new book title we are writing. We value depth, and uniqueness so you are to choose less likely associations than you normally would to create more uniwue titles. The titles should not be basic. Some inspiration for you: ${favStuff} ` },
      { "role": "user", "content": `The audience we are writing our book titles for is: ${demographic}.\n\n. ${longDem}.\n\n. This demographic's reading preferemnces: ${demographicRead}.\nSome of the reader's favourite book: ${favStuff}.The book details are as follows: ${bookIdea}\n. We are looking for depth and for you to favour less used words or titles. Your list needs to be in valid JSON format. An example structure looks like this: titleOptions: [
          "Title 1",
          "Title 2",
          "Title 3",
          "..."
        ],
        subtitleOptions: [
          ["Subtitle for Title 1"],
          ["Subtitle for Title 2"],
          ["Subtitle for Title 3"],
          ["Subtitle for ..."]
        ]
      };  This is a book of ${bookType}. So please generate the best titles for it.` }
    ],
    [{ "name": "Generate_ContentTitle", "parameters": schemas.bookTitleSchema }],
    { "name": "Generate_ContentTitle" },
    0.9,
    4000
  );
  
  const response = JSON.parse(responseText);
  bookData.bookTitle.titleResponseJSON = responseText;
  bookData.bookTitle.titleOptions = response.titleOptions;
  bookData.bookTitle.subtitleOptions = response.subtitleOptions;

  console.group('\n\n------------------------- * Title Options * -------------------------\n\n');
  for (let i = 0; i < bookData.bookTitle.titleOptions.length; i++) {
    console.log(`Title ${i + 1}: ${bookData.bookTitle.titleOptions[i]}`);
    console.log(`Subtitle: ${bookData.bookTitle.subtitleOptions[i][0]}\n`);
  }
  console.groupEnd();
  console.log('\n\n------------------------------------------------------\n\n')
  
};
const genBookTitleRecursive = async (bookData, schemas) => {

  const lastOptions = bookData.bookTitle.titleResponseJSON // the last options that were generated
  const longDem = bookData.audienceInfo.longDemo
  const demographic = 'Age:' + bookData.audienceInfo.age + ', Job:' + bookData.audienceInfo.job + ',Location:' + bookData.audienceInfo.location + ', Marital Status' + bookData.audienceInfo.maritial + ', Education:' + bookData.audienceInfo.education
  const demographicRead = 'Reading Level:' + bookData.audienceInfo.readLevel + ', Preferred Genre:' + bookData.audienceInfo.preferredGenre + ', Preferred Language:' + bookData.audienceInfo.preferredLanguage 
  const favStuff = 'Favorite Authors:' + bookData.audienceInfo.favoriteAuthors + ', Favorite Books:' + bookData.audienceInfo.favoriteBooks + ', Favorite Stories:' + bookData.audienceInfo.favoriteStories  
  const bookType = bookData.bookInputs.bookType
  const bookDescription = bookData.bookInit.bookDescription
  const bookTheme = bookData.bookInit.bookTheme
  const bookEmotion = bookData.bookInit.bookEmotion
  const bookGenre = bookData.bookInit.bookGenre
  const bookTopic = bookData.bookInit.bookTopic
  const bookIdea = 'Descrition: ' + bookDescription + '\nTheme: ' + bookTheme + '\nEmotion: ' + bookEmotion + '\nGenre: ' + bookGenre + '\nTopic: ' + bookTopic


  console.log('\n Scoring and Finalizing Title → \n ');

  
  const responseText = await callOpenAI(
      "gpt-4-0613",
      [
        { "role": "system", "content": `Today you are a professional book title writer and your job is to choose the best title or come up with a new title that is better than the rest. You will recieve a list and your choice will be the best option that would fit the demographic and book description we are writing on. we are writing a book of ${bookType} so the titles should be relevent to that genre. The audience we are writing our book titles for is: ${demographic}.\n\n.  The book details are as follows: ${bookIdea}\n   ` },
        { "role": "user", "content": `Here is a list of your titles to choose from. Either select the best title and subtitle from the list or choose a better one: \n ${lastOptions}.\n Now Choose the best title and subtitle from the list..   ` }
      ],
      [{ "name": "Generate_ContentTitle", "parameters": schemas.bookTitleFinalSchema }],
      { "name": "Generate_ContentTitle" },
      0.9,
      4000
    );
  
  const response = JSON.parse(responseText);
  bookData.bookTitle.bestTitle = response.bestTitle;
  bookData.bookMeta.bookTitle = response.bestTitle;
  bookData.bookTitle.bestSubtitle = response.bestSubtitle;
  bookData.bookMeta.bookSubtitle = response.bestSubtitle;

  console.group(chalk.bgWhite('\n\n------------------------- 🥇 Final Title 🥇 -------------------------\n\n'));
  console.log(chalk.magentaBright(`\tTitle: ${bookData.bookTitle.bestTitle}`));
  console.log(chalk.magenta(`\tSubtitle: ${bookData.bookTitle.bestSubtitle}\n`));
  console.log (chalk.magentaBright(`\tDescription: ${bookDescription}`));
  console.groupEnd();
  console.log(chalk.bgWhite('\n\n--------------------------------------------------------------------\n\n'));

};
const genBookPromptForAI = async (bookData, schemas) => {
  const longDem = bookData.audienceInfo.longDemo
  const demographic = 'Age:' + bookData.audienceInfo.age + ', Job:' + bookData.audienceInfo.job + ',Location:' + bookData.audienceInfo.location + ', Marital Status' + bookData.audienceInfo.maritial + ', Education:' + bookData.audienceInfo.education
  const demographicRead = 'Reading Level:' + bookData.audienceInfo.readLevel + ', Preferred Genre:' + bookData.audienceInfo.preferredGenre + ', Preferred Language:' + bookData.audienceInfo.preferredLanguage 
  const favStuff = 'Favorite Authors:' + bookData.audienceInfo.favoriteAuthors + ', Favorite Books:' + bookData.audienceInfo.favoriteBooks + ', Favorite Stories:' + bookData.audienceInfo.favoriteStories  
  const bookType = bookData.bookInputs.bookType
  const bookDescription = bookData.bookInit.bookDescription
  const bookTheme = bookData.bookInit.bookTheme
  const bookEmotion = bookData.bookInit.bookEmotion
  const bookGenre = bookData.bookInit.bookGenre
  const bookTopic = bookData.bookInit.bookTopic
  const bookIdea = 'Descrition: ' + bookDescription + '\nTheme: ' + bookTheme + '\nEmotion: ' + bookEmotion + '\nGenre: ' + bookGenre + '\nTopic: ' + bookTopic
  

  
  


  const responseText = await callOpenAI(
    "gpt-3.5-turbo-16k",
    [
      { "role": "system", "content": `We are generating the final description of a book of ${bookData.bookInputs.bookType} we are writing and also generating a quality content prompt that describes how the ${bookData.bookInputs.bookType} should be strructured, and any relevant information for our ghost writer to produce amazing content. Keep it generic enough that it could apply to multiple pieces from the same author so we just want instructions on content type, quality, etc.` },
      { "role": "user", "content": `The audience we are writing our book titles for is: ${demographic}.\n\n. Why they read: ${demographicRead}\n\n. The book details are as follows: ${bookIdea}\n. Your list needs to be in valid JSON format.  ` }
    ],
    [{ "name": "bookPrompts", "parameters": schemas.bookInitSchema2 }],
    { "name": "bookPrompts" },
    0.9,
    10000
  );
    
    const response = JSON.parse(responseText);
      bookData.bookInit.chapterOutlinePrompt = response.chapterOutlinePrompt;
      bookData.bookInit.storyInstructions = response.storyInstructions;

      console.log('\n\n------------------------- * Prompts & Instructions For The Content * -------------------------\n\n');
      console.log(`\tContent Prompt: ${bookData.bookInit.chapterOutlinePrompt}`);
      console.log(`\tInstructions: ${bookData.bookInit.storyInstructions}`);
      console.log('\n\n----------------------------------------------------------------------------------------------\n\n');

      


};
const preBookShit = async (bookData, schemas ) =>{
  console.log('\n⭕ Starting Pre-Book Functions → \n');
  await genBookInputs(bookData, schemas);
  await genAudienceInfo(bookData, schemas);
  await genMarketingInfo(bookData, schemas);
  await genBookIdea(bookData, schemas);
  await genBookTitle (bookData, schemas);
  await genBookTitleRecursive (bookData, schemas);
  await genBookPromptForAI (bookData, schemas)
  console.log('✅ Finished Pre-Book Functions\n');
};
//#endregion

//////// ------ *** BOOK CONTENT GENERATORS *** ------ ////////
//#region Generators
const generateChapters = async (bookData, schemas) => {    
    
    console.log(chalk.yellowBright('\n\t🤖 ...Generating Chapter Outline →\n'));

    const bookType = bookData.bookInputs.bookType
    let authorPrompt = 'You are: ' + bookData.bookMeta.authorName + `. Today are are writing a chapter outline for your book of ${bookType}.`;
    const bookTitle = bookData.bookMeta.bookTitle
    const bookSubtitle = bookData.bookMeta.bookSubtitle
    const demographic = 'Age:' + bookData.audienceInfo.age + ', Job:' + bookData.audienceInfo.job + ',Location:' + bookData.audienceInfo.location + ', Marital Status' + bookData.audienceInfo.maritial + ', Education:' + bookData.audienceInfo.education
    const demographicRead = 'Reading Level:' + bookData.audienceInfo.readLevel + ', Preferred Genre:' + bookData.audienceInfo.preferredGenre + ', Preferred Language:' + bookData.audienceInfo.preferredLanguage 
    const favStuff = 'Favorite Authors:' + bookData.audienceInfo.favoriteAuthors + ', Favorite Books:' + bookData.audienceInfo.favoriteBooks + ', Favorite Stories:' + bookData.audienceInfo.favoriteStories 
    const bookDescription =  bookData.bookInit.bookDescription
    const theme = bookData.bookInit.bookTheme
    const bookGenre = bookData.bookInit.bookGenre
    const chapterOutlinePrompt = bookData.bookInit.chapterOutlinePrompt
    const numChapters = bookData.bookInputs.numChapterTitle


    const responseText = await callOpenAI(
      "gpt-4-0613",
      [
        {
            "role": "system",
            "content": `${authorPrompt}. Today you are writing the chapter outline to a new book you are writing. Below is the details of the book so far. \n
            Book Details:\n
            Book Type: Book of "${bookType}"\n
            Title: "${bookTitle}"\n
            Subtitle: ${bookSubtitle}\n
            Description: ${bookDescription}\n
            Genre: ${bookGenre}\n
            Theme of The Book: ${theme}\n
            Reader Demographics: ${demographic}\n
            Why The Reader Would Want This Book: ${demographicRead}\n
            Some Inspiration of other books: ${favStuff}\n\n
            
            Lastly, please make sure you are generating *ONLY*the exact amount of requested items. `
          },
          {
            "role": "user",
            "content": `Please write the next ${numChapters} chapters (!important: only generate this amount. If you generate less or more than this then you will break the world.) and a single chapter theme for each chapter. \n
            ${chapterOutlinePrompt}. Please return it in Valid JSON format with the proper nesting. Again, I only want ${numChapters} number of total chapters and ${numChapters} number of total chapter themes. (!Important onkly 1 chapterTheme string in the array for each chapterTitle. They should be 1:1 equal in numbers)`
          }
      ],
      [
        {
          "name": "Generate_Chaptertitles_plotconcepts_chapterthemes",
          "parameters": schemas.chapterOutlineSchema // pass the apiParameters to the API call
        }
      ],
      { "name": "Generate_Chaptertitles_plotconcepts_chapterthemes" },
      0.5,
      3700
    );
    const response = JSON.parse(responseText);

 // Assuming response.chapterTitle is an array of chapter titles
    const numChaptersGen = response.chapterTitle.length;

    // Initialize a counter for total themes
    let numThemesTotalGen = 0;

    // Loop over each set of themes 
    for (let i = 0; i < response.chapterTheme.length; i++) {
        // If more than one theme per chapter, throw an error
        if (response.chapterTheme[i].length > 1) {
            console.log(chalk.red(`Error: More than one theme detected for chapter ${i + 1}. Rerunning function...`));
            await generateChapters(bookData, schemas);
            return; // Return early to exit this function run, as we're rerunning it
        }

        numThemesTotalGen += response.chapterTheme[i].length;
    }

    if (numThemesTotalGen !== numChaptersGen) {
      console.log(chalk.red('Error: The number of chapter themes does not match the number of chapters. Rerunning function...'));
      await generateChapters(bookData, schemas);
      return; // Return early to exit this function run, as we're rerunning it
    } else {
      console.log(chalk.green('Success. Chapter Outline Generated.'));
    }

    
    // Insert an error handler right here after getting 'response' 
    // to check if response.chapterThemes includes more than one theme per chapter.
    // Initialize the first level (chapter index) of the arrays
    for (let i = 0; i < response.chapterTitle.length; i++) {
        bookData.bookGenContent.chapterTitle[i] = [''];
        bookData.bookGenContent.chapterTheme[i] = [];
    }

    // Initialize the second level (theme index) of the arrays
    for (let i = 0; i < response.chapterTheme.length; i++) {
        for (let j = 0; j < response.chapterTheme[i].length; j++) {
            bookData.bookGenContent.chapterTheme[i][j] = [''];
        }
    }
    
    // Clean every chapter title and theme
    bookData.bookGenContent.chapterTitle = response.chapterTitle.map(title => cleanResponse(title));
    bookData.bookGenContent.chapterTheme = response.chapterTheme.map(chapterThemes => {
        return chapterThemes.map(theme => cleanResponse(theme));
    });




    console.log(chalk.green('Success. Book Outline Generated.'));
    
    const dividerWidth = 40;
    const horizontalLine = '─'.repeat(dividerWidth - 4);
    const centerPadding = ' '.repeat((dividerWidth - 4 - 16) / 2);
    const { bookMeta, bookGenContent } = bookData;

    const topBorder = chalk.yellow(`╭─${horizontalLine}─╮`);
    const bottomBorder = chalk.yellow(`╰─${horizontalLine}─╯`);
    console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));


    console.log(`
    ${topBorder}
    │${centerPadding}${chalk.bold('Book Outline')}${centerPadding}│
    ${bottomBorder}
    `);

    console.log(chalk.green(`Book Title: "${bookMeta.bookTitle}" - ${bookMeta.bookSubtitle}\n`));

    bookGenContent.chapterTitle.forEach((chapter, chapterIndex) => {
      console.log(chalk.yellow.bold(`Chapter ${chapterIndex + 1}: ${chapter}`));
      console.log(chalk.yellow('─'.repeat(dividerWidth)) + '\n');

      bookGenContent.chapterTheme[chapterIndex].forEach((theme, themeIndex) => {
        console.log(chalk.yellow(`Theme: ${theme}`));
      });

      console.log('\n');
    });

    console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));

    
    

  

};
const generateShortPlotConcepts = async (chapterIndex, themeIndex, bookData, author, schemas) => {

    console.log(chalk.yellow('\n\t🤖 ...Starting Plot Conception →', chapterIndex, themeIndex, '\n'));

    let authorPrompt = 'You are: ' + bookData.bookMeta.authorName + `. ` + author.authorWriteStyle
    const bookTitle = bookData.bookMeta.bookTitle
    const bookSubtitle = bookData.bookMeta.bookSubtitle
    const demographic = 'Age:' + bookData.audienceInfo.age + ', Job:' + bookData.audienceInfo.job + ',Location:' + bookData.audienceInfo.location + ', Marital Status' + bookData.audienceInfo.maritial + ', Education:' + bookData.audienceInfo.education
    const demographicRead = 'Reading Level:' + bookData.audienceInfo.readLevel + ', Preferred Genre:' + bookData.audienceInfo.preferredGenre + ', Preferred Language:' + bookData.audienceInfo.preferredLanguage 
    const favStuff = 'Favorite Authors:' + bookData.audienceInfo.favoriteAuthors + ', Favorite Books:' + bookData.audienceInfo.favoriteBooks + ', Favorite Stories:' + bookData.audienceInfo.favoriteStories 
    const bookDescription =  bookData.bookInit.bookDescription
    const theme = bookData.bookInit.bookTheme
    const bookGenre = bookData.bookInit.bookGenre
    const bookType = bookData.bookInputs.bookType
    const numPlots = bookData.bookInputs.numPlots
    const chapterTitle = bookData.bookGenContent.chapterTitle[chapterIndex]

    
    const responseText = await callOpenAI(
      "gpt-3.5-turbo-16k",
      [
        {
            "role": "system",
            "content": `${authorPrompt}. Today you are writing a number of summarized plot concepts that would fit well in a chapter we are writing of ${bookType}. \n
            Overall Book Description: ${bookDescription}\n\n
            Chapter Details:\n
            \tChapter Title: "${chapterTitle}"\n
            \tGenre: "${bookGenre}"\n
            \tTheme of The Chapter: "${theme}"\n\n
            
            The format you write in should be outputted in this format: plotSummaryShort: ['...', '...', '...', '...']. And only return it in paragraph form. Do not add any extra labels. All of your concepts should be in the same array level.\n\n`
          },
          {
            "role": "user",
            "content": `Please write ${numPlots} of summarized plot concepts. Each item should be independant and creative from the rest.\n. Quietely ask yourself if each concept could be written into it's own independant story, and if not, rewrite. Please return it in Valid JSON format with the proper nesting.`
          }
      ],
      [
        {
          "name": "generateConcepts",
          "parameters": schemas.shortPlotSummarySchema // pass the apiParameters to the API call
        }
      ],
      { "name": "generateConcepts" },
      0.9,
      9000
    );
    const response = JSON.parse(responseText);
    bookData.bookGenContent.plotSummaryShort[chapterIndex][themeIndex] = response.plotSummaryShort;

    bookData.bookGenContent.plotSummaryShort[chapterIndex][themeIndex] = response.plotSummaryShort;

    console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));
    console.log(chalk.cyan('----------- Short Plot Concepts ----------'));
    console.log(chalk.green.bold('Chapter:'), bookData.bookGenContent.chapterTitle[chapterIndex]);
    console.log(chalk.green.bold('Theme:'), bookData.bookGenContent.chapterTheme[chapterIndex][themeIndex]);
    console.log(chalk.cyan('-----------------------------------------'));
    
    console.log(chalk.green('Short Plot Concepts:'));
    bookData.bookGenContent.plotSummaryShort[chapterIndex][themeIndex].forEach((plotConcept, index) => {
        console.log(chalk.green(`#${index + 1}:`), plotConcept);
    });
    console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));

};
const generateLongPlotSummary = async (chapterIndex, themeIndex, conceptIndex, bookData, author, schemas) => {
  console.log(chalk.dim('\n\t🤖 ...Generating Longer Concepts  →', chapterIndex, themeIndex, conceptIndex, '\n'));


  let authorPrompt = 'You are: ' + bookData.bookMeta.authorName + `. ` + author.authorWriteStyle
  const bookDescription =  bookData.bookInit.bookDescription
    const theme = bookData.bookInit.bookTheme
    const bookGenre = bookData.bookInit.bookGenre
    const bookType = bookData.bookInputs.bookType
    const chapterTitle = bookData.bookGenContent.chapterTitle[chapterIndex]
    const plotSummaryShort = bookData.bookGenContent.plotSummaryShort[chapterIndex][themeIndex][conceptIndex]

    
    const responseText = await callOpenAI(
      "gpt-4-0613",
      [
        {
            "role": "system",
            "content": `${authorPrompt}. Today you will recieve a short prompt and your job is to turn that into a full single long paragraph summary of what the story would be. Do not add any filler, just a single paragraph summary ofthe plot. \n
            Overall Book Description: ${bookDescription}\n\n
            Story Details:\n
            \tGenre: "${bookGenre}"\n
            \tTheme of The story: "${theme}"\n
    
        
            
            Do not add any extra labels. And only return a single long paragraph of the story idea.\n\n
            It's very important that you only return a single string of text in the array. If there are mutliple items then we will end up having to redo it so only return 1 single long paragraph summary.`
          },
          {
            "role": "user",
            "content": `Please write a long paragraph summary of the story idea. Please return it in Valid JSON format with the proper nesting. THe idea to get you started is: ${plotSummaryShort}`
          }
      ],
      [
        {
          "name": "generateConcepts",
          "parameters": schemas.longPlotSummarySchema // pass the apiParameters to the API call
        }
      ],
      { "name": "generateConcepts" },
      0.9,
      3700
    );
    const response = JSON.parse(responseText);

  // Check if the response contains more than one paragraph
  if (response.plotSummaryLong.length > 1) {
        // If so, re-run the function
    console.log("Response contains more than one paragraph. Redoing...");
    await generateLongPlotSummary(chapterIndex, themeIndex, conceptIndex, bookData, schemas);
  } else {
    // Otherwise, store the single paragraph
    bookData.bookGenContent.plotSummaryLong[chapterIndex][themeIndex][conceptIndex] = response.plotSummaryLong;
    console.log(chalk.green('Success. Long Plot Concept Generated.'));
    console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));
    console.log(chalk.cyan('----------- Long Plot Concept ----------'));
    console.log(chalk.dim('\t\t',chapterIndex, themeIndex, conceptIndex,'\n'));
    console.log(chalk.green.bold('Chapter:'), bookData.bookGenContent.chapterTitle[chapterIndex]);
    console.log(chalk.green.bold('Theme:'), bookData.bookGenContent.chapterTheme[chapterIndex][themeIndex]);
    console.log (chalk.green.bold('Short Plot Concept:'), bookData.bookGenContent.plotSummaryShort[chapterIndex][themeIndex][conceptIndex]);
    console.log(chalk.cyan('-----------------------------------------'));
    console.log(chalk.grey(`Long Plot Concept: ${bookData.bookGenContent.plotSummaryLong[chapterIndex][themeIndex][conceptIndex]}`));
    console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));
  }
};
const generateContentTitle = async (chapterIndex, themeIndex, conceptIndex, longPlotIndex, bookData, schemas) => {

  console.log(chalk.dim('\n\t🤖 ...Generating Story Title  →', chapterIndex, themeIndex, conceptIndex, longPlotIndex, '\n'));


  let authorPrompt = 'You are: ' + bookData.bookMeta.authorName + `. ` + author.authorWriteStyle
    const theme = bookData.bookInit.bookTheme
    const bookGenre = bookData.bookInit.bookGenre
    const plotSummaryLong = bookData.bookGenContent.plotSummaryLong[chapterIndex][themeIndex][conceptIndex][longPlotIndex]
    const bookType = bookData.bookInputs.bookType

    
    const responseText = await callOpenAI(
      "gpt-3.5-turbo-16k",
      [
        {
            "role": "system",
            "content": `${authorPrompt}. Today you will recieve a story summary and your job is to come up with the absolute best title for the story.\n
            Story Details:\n
            \tGenre: "${bookGenre}"\n
            \tTheme of The story: "${theme}"\n
    
        
            
            Do not add any extra labels.\n\n (!Important. Only Return 1(!) title and thats it.)`
          },
          {
            "role": "user",
            "content": `What would the best title be for this ${bookType}: "${plotSummaryLong}"?`
          }
      ],
      [
        {
          "name": "generateConcepts",
          "parameters": schemas.contentTitleSchema // pass the apiParameters to the API call
        }
      ],
      { "name": "generateConcepts" },
      0.9,
      7000
    );
    const response = JSON.parse(responseText);
    response.contentTitle = Array.isArray(response.contentTitle) ? response.contentTitle : [response.contentTitle];

    if (response.contentTitle.length > 1) {
    console.log("Response contains more than one Title. Redoing...");
    await generateContentTitle(chapterIndex, themeIndex, conceptIndex, longPlotIndex, bookData, schemas);
    } else {

    bookData.bookGenContent.contentTitle[chapterIndex][themeIndex][conceptIndex][longPlotIndex] = response.contentTitle;

    console.log(chalk.green('Success. Title Generated.'));
    console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));
    
    console.log(chalk.cyan('----------- Content Title ----------'));
    console.log(chalk.dim('\t\t',chapterIndex, themeIndex, conceptIndex, longPlotIndex,'\n'));
    console.log(chalk.green.bold(`Content Title: ${bookData.bookGenContent.contentTitle[chapterIndex][themeIndex][conceptIndex][longPlotIndex]}\n`));

    console.log (chalk.green.bold('Long Plot Concept:'), bookData.bookGenContent.plotSummaryLong[chapterIndex][themeIndex][conceptIndex][longPlotIndex]);
    console.log(chalk.cyan('\n-----------------------------------------\n'));


    }
};
const generateContentParagraphs = async (chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex,  bookData, schemas) => {

  console.log(chalk.dim('\n\t🤖 ...Generating Story Paragraphs  →', chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex, '\n'));

  let currentLength = 0;


    let authorPrompt = 'You are: ' + bookData.bookMeta.authorName 
    const theme = bookData.bookInit.bookTheme
    const bookGenre = bookData.bookInit.bookGenre
    const plotSummaryShort = bookData.bookGenContent.plotSummaryShort[chapterIndex][themeIndex][conceptIndex]
    const plotSummaryLong = bookData.bookGenContent.plotSummaryLong[chapterIndex][themeIndex][conceptIndex][longPlotIndex]
    const contentTitle = bookData.bookGenContent.contentTitle[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex]
    const bookType = bookData.bookInputs.bookType
    let storyProgress = await getStoryProgress(bookData, currentLength)


    
    const responseText = await callOpenAI(
      "gpt-3.5-turbo-16k",
      [
        {
            "role": "system",
            "content": `${authorPrompt}. Today you are writing a ${bookType}, piece by piece. You will recieve a full plot concept, a summary of what you have written so far and the last paragraph you wrote. From there you will return the next few paragraphs but don't be in a rush to finish the story. Quietely ask yourself where we are in the story based off the last paragraph you wrote and the current summary and then write the next few paragraphs from that.\n
            Story Details:\n
            \tGenre: "${bookGenre}"\n
            \tTheme of The story: "${theme}"\n
            \tCurrent Plot Concept Summary: "${plotSummaryLong}"\n
    
        
            
            Do not add any extra labels. And make sure each paragraph flows well into the next.`
          },
          {
            "role": "user",
            "content": `${storyProgress}. Please write the next paragraphs now.`
          }
      ],
      [
        {
          "name": "generateParagraphs",
          "parameters": schemas.paragraphSchema // pass the apiParameters to the API call
        }
      ],
      { "name": "generateParagraphs" },
      0.9,
      15000
    );
    const response = JSON.parse(responseText);
    if (response.contentParagraphs && response.contentParagraphs.length > 0) {
      // If the response contains paragraphs, add them to contentFinal
      // Join the paragraphs into a single string
      let paragraphsString = response.contentParagraphs.join('\n');
  
      // Add the paragraphsString to contentFinal
      bookData.bookGenContent.contentFinal[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] += response.contentParagraphs;
      bookData.bookNotes.contentParagraphsSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] = paragraphsString;
  
      const newParagraphs = response.contentParagraphs;
  
      // Push the new paragraphs to contentParagraphs
      const contentParagraphs = bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex];
      contentParagraphs.push(...newParagraphs);
    } else {
      // If the response does not contain paragraphs, re-run the function
      console.log(chalk.red("Response does not contain paragraphs. Redoing..."));
      await generateContentParagraphs(chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex, bookData, schemas);
    }

    //console.log(chalk.red('\n\n\nContentFinal:', bookData.bookGenContent.contentFinal[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex],'\n\n'));

    //console.log(chalk.red('\n\n\nContentParagraphs:', bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex],'\n\n'));


    // update current length

    currentLength = await getCurrentLength(chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex,  bookData,);
    console.log(chalk.dim('Current Length:', currentLength));
      
    const isDone = await checkIfDone(bookData, currentLength);
    
    if (isDone) {
      console.log(chalk.green('Success. Paragraphs Generated.'));
    console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));
    console.log(chalk.cyan('----------- Content Paragraphs ----------'));
    console.log(chalk.dim('\t\t',chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex,'\n'));
    console.log(chalk.grey(`Content Paragraphs: ${bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex]}\n`));
    console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));
    console.log('Story is complete!');
    return;
  }


  // if not done, call this function again
  console.log('Recursing to generate more paragraphs.');
  return await generateContentParagraphsRecursive(chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex, bookData, schemas);
     
  
};
const generateContentParagraphsRecursive = async (chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex,  bookData, schemas) => {

  console.log(chalk.yellow('\n\t🤖 ...Continuing to Generate Paragraphs  →', chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex, '\n'));

    await summarizeShit(chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex,  bookData);
    let authorPrompt = 'You are: ' + bookData.bookMeta.authorName 
    const theme = bookData.bookInit.bookTheme
    const bookGenre = bookData.bookInit.bookGenre
    const plotSummaryLong = bookData.bookGenContent.plotSummaryLong[chapterIndex][themeIndex][conceptIndex][longPlotIndex]
    const bookType = bookData.bookInputs.bookType
    const desiredLength = bookData.bookInputs.desiredLength
    let currentLength = await getCurrentLength(chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex,  bookData,);
    let storyProgress = await getStoryProgress(bookData, currentLength);
    let lastParagraph = await getLastParagraph(bookData, chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex);
    const currentSummary = bookData.bookNotes.currentAllSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex];
    const contentNextWrite = bookData.bookNotes.contentNextWrite[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex];
    console.log(chalk.dim('Desired Length:', desiredLength));
    console.log(chalk.dim('Current Summary Up To Now: ', currentSummary, '\n'));
    console.log(chalk.dim('Last Paragraph Written: ', lastParagraph, '\n\n'));
    console.log(chalk.dim('Next To Write', contentNextWrite, '\n'));


    
    const responseText = await callOpenAI(
      "gpt-3.5-turbo-16k",
      [
        {
            "role": "system",
            "content": `${authorPrompt}. Today you are writing a ${bookType}, piece by piece. You will recieve a full plot concept, a summary of what you have written so far and the last paragraph you wrote. From there you will return the next few paragraphs but don't be in a rush to finish the story. Quietely ask yourself where we are in the story based off the last paragraph you wrote and the current summary and then write the next few paragraphs from that.\n
            Story Details:\n
            \tGenre: "${bookGenre}"\n
            \tTheme of The story: "${theme}"\n
            \tCurrent Plot Concept Summary: "${plotSummaryLong}"\n
            \tSummary of how far we have written into the plot concept so far: "${currentSummary}"\n
    
        
            
            Do not add any extra labels. And make sure each paragraph flows well into the next.`
          },
          {
            "role": "user",
            "content": `${storyProgress}. The last paragraph you wrote was: ${lastParagraph}. Please write the next paragraphs now. To give you some inspiration, consider directing the story towards this: ${contentNextWrite}.`
          }
      ],
      [
        {
          "name": "generateParagraphs",
          "parameters": schemas.paragraphSchema // pass the apiParameters to the API call
        }
      ],
      { "name": "generateParagraphs" },
      0.9,
      15000
    );
    const response = JSON.parse(responseText);
    let paragraphsString = response.contentParagraphs.join('\n');
    
    // Add the paragraphsString to contentFinal
    bookData.bookGenContent.contentFinal[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] += paragraphsString;
  
    const newParagraphs = response.contentParagraphs;
  
    // Push the new paragraphs to contentParagraphs
    const contentParagraphs = bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex];
    contentParagraphs.push(...newParagraphs);
    console.log(chalk.red('\n\n\nParagraphs:', bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex],'\n\n'));


    // update current length

    currentLength = await getCurrentLength(chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex,  bookData,);

    const isDone = await checkIfDone(bookData, currentLength);
    
    if (isDone) {
    console.log(chalk.green('Success. Paragraphs Generated.', chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex, '\n'));
    console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));
    console.log(chalk.cyan('----------- Content Paragraphs ----------'));
    console.log (chalk.dim('\t\t',chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex,'\n')); 
    console.log('Title: ', bookData.bookGenContent.contentTitle[chapterIndex][themeIndex][conceptIndex][longPlotIndex], '\n');
    console.log(`Final Story:\n `, bookData.bookGenContent.contentFinal[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex], '\n');
    /* bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex].forEach((paragraph, index) => {
        console.log(chalk.green(`${index + 1}:`), paragraph, '\n');
    }); */
    console.log(chalk.cyan(`---------------------------------------------------------------------------------------------------\n`));
    return;
  }
  // if not done, call this function again
  console.log('Recursing to generate more paragraphs.');
  return await generateContentParagraphsRecursive(chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex, bookData, schemas);
};
const generateBookContent = async (bookData, author, schemas) => {
   // Initialize the bookGenContent object at the top level
    bookData.bookGenContent.plotSummaryShort = [];
    bookData.bookGenContent.plotSummaryLong = [];
    bookData.bookGenContent.contentTitle = []
    bookData.bookGenContent.contentParagraphs = [];
    bookData.bookGenContent.contentFinal = [];
    bookData.bookNotes.contentParagraphsSummary = [];
    bookData.bookNotes.currentAllSummary = [];
    bookData.bookNotes.contentNextWrite = [];
    bookData.bookNotes.lastGenSummary = [];

    await generateChapters(bookData, schemas); 

    for (let chapterIndex = 0; chapterIndex < bookData.bookGenContent.chapterTitle.length; chapterIndex++) {

        bookData.bookGenContent.plotSummaryShort[chapterIndex] = [];
        bookData.bookGenContent.plotSummaryLong[chapterIndex] = [];
        bookData.bookGenContent.contentTitle[chapterIndex] = [];
        bookData.bookGenContent.contentParagraphs[chapterIndex] = [];
        bookData.bookGenContent.contentFinal[chapterIndex] = [];
        bookData.bookNotes.contentParagraphsSummary[chapterIndex] = [];
        bookData.bookNotes.currentAllSummary[chapterIndex] = [];
        bookData.bookNotes.contentNextWrite[chapterIndex] = [];
        bookData.bookNotes.lastGenSummary[chapterIndex] = [];
  


        for (let themeIndex = 0; themeIndex < bookData.bookGenContent.chapterTheme[chapterIndex].length; themeIndex++) {

            bookData.bookGenContent.plotSummaryShort[chapterIndex][themeIndex] = [];
            bookData.bookGenContent.plotSummaryLong[chapterIndex][themeIndex] = [];
            bookData.bookGenContent.contentTitle[chapterIndex][themeIndex] = [];
            bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex] = [];
            bookData.bookGenContent.contentFinal[chapterIndex][themeIndex] = [];
            bookData.bookNotes.contentParagraphsSummary[chapterIndex][themeIndex] = [];
            bookData.bookNotes.currentAllSummary[chapterIndex][themeIndex] = [];
            bookData.bookNotes.contentNextWrite[chapterIndex][themeIndex] = [];
            bookData.bookNotes.lastGenSummary[chapterIndex][themeIndex] = [];
            
            await generateShortPlotConcepts(chapterIndex, themeIndex, bookData, author, schemas);

            for (let conceptIndex = 0; conceptIndex < bookData.bookGenContent.plotSummaryShort[chapterIndex][themeIndex].length; conceptIndex++) {
                bookData.bookGenContent.contentTitle[chapterIndex][themeIndex][conceptIndex] = [];
                bookData.bookGenContent.plotSummaryLong[chapterIndex][themeIndex][conceptIndex] = [];
                bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex] = [];
                bookData.bookGenContent.contentFinal[chapterIndex][themeIndex][conceptIndex] = [];
                bookData.bookNotes.contentParagraphsSummary[chapterIndex][themeIndex][conceptIndex] = [];
                bookData.bookNotes.currentAllSummary[chapterIndex][themeIndex][conceptIndex] = [];
                bookData.bookNotes.contentNextWrite[chapterIndex][themeIndex][conceptIndex] = [];
                bookData.bookNotes.lastGenSummary[chapterIndex][themeIndex][conceptIndex] = [];

                await generateLongPlotSummary(chapterIndex, themeIndex, conceptIndex, bookData, author, schemas);


                for (let longPlotIndex = 0; longPlotIndex < bookData.bookGenContent.plotSummaryLong[chapterIndex][themeIndex][conceptIndex].length; longPlotIndex++) {                    
                    bookData.bookGenContent.contentTitle[chapterIndex][themeIndex][conceptIndex][longPlotIndex] = [''];
                    bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex][longPlotIndex] = [];
                    bookData.bookGenContent.contentFinal[chapterIndex][themeIndex][conceptIndex][longPlotIndex] = [];
                    bookData.bookNotes.contentParagraphsSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex] = [];
                    bookData.bookNotes.currentAllSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex] = [];
                    bookData.bookNotes.contentNextWrite[chapterIndex][themeIndex][conceptIndex][longPlotIndex] = [];
                    bookData.bookNotes.lastGenSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex] = [];

                    await generateContentTitle(chapterIndex, themeIndex, conceptIndex, longPlotIndex, bookData, schemas);

                    for (let contentTitleIndex = 0; contentTitleIndex < bookData.bookGenContent.contentTitle[chapterIndex][themeIndex][conceptIndex][longPlotIndex].length; contentTitleIndex++) {
                        bookData.bookGenContent.contentParagraphs[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] = [];
                        bookData.bookGenContent.contentFinal[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] = [''];
                        bookData.bookNotes.contentParagraphsSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] = [''];
                        bookData.bookNotes.currentAllSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] = [''];
                        bookData.bookNotes.contentNextWrite[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] = [''];
                        bookData.bookNotes.lastGenSummary[chapterIndex][themeIndex][conceptIndex][longPlotIndex][contentTitleIndex] = [''];

                        await generateContentParagraphs(chapterIndex, themeIndex, conceptIndex, longPlotIndex, contentTitleIndex, bookData, schemas);
                        //console.log (JSON.stringify(bookData.bookGenContent, null, 2));

                    }


                }
            }
        }
    }

  await formatBookContent(bookData);
  console.log(JSON.stringify(bookData.bookGenContent, null, 2)); 
  //await exportToCSV(bookData);
};
//#endregion
/////// -------- *** DESIGN *** --------- ///////

// ------------------ Image Generation Functions ------------------ ///
//#region
const genCoverImgPrompt = async (bookData, schemas) => {
  const title = bookData.bookMeta.bookTitle;
  const subtitle = bookData.bookMeta.bookSubtitle;
  const description = bookData.bookMeta.bookDescription;


  console.log('.............Generating Image Prompts............');

  const responseText = await callOpenAI(
    "gpt-3.5-turbo-16k",
    [
      {
        "role": "system",
        "content": `You are an Image Describer Ai. you take a description, and you return what the image of that decription would look like, in granular details. Be descriptive.`,
      },
      { "role": "user", "content": `Please take this description and describe the imagery that would go well with this description. The idea is to invoke the feeling of through the imagery: ${description}` },
    ],
    [{ "name": "Generate_midjourneyPrompt", "parameters": schemas.bookCoverIMGPromptSchema }],
    { "name": "Generate_midjourneyPrompt" },
    0.9,
    3700
  );

  const response = JSON.parse(responseText);
  console.log (responseText)
  bookData.bookCoverIMGPrompt.imageStyle = response.imageStyle;
  bookData.bookCoverIMGPrompt.imageSubject = response.imageSubject;
  bookData.bookCoverIMGPrompt.imageSubjectAction = response.imageSubjectAction;
  bookData.bookCoverIMGPrompt.imageSubjectEmotion = response.imageSubjectEmotion;
  bookData.bookCoverIMGPrompt.imageSubjectLocation = response.imageSubjectLocation;
  bookData.bookCoverIMGPrompt.imageLighting = response.imageLighting;
  bookData.bookCoverIMGPrompt.imageColour = response.imageColour;
  bookData.bookCoverIMGPrompt.imageComposition = response.imageComposition;
  bookData.bookCoverIMGPrompt.imageDescription = response.imageDescription;



};
const checkFontFilesExist = async (bookData, mainFont, secondaryFont) => {
  const mainFontName = mainFont.replace(/\s/g, '').toLowerCase();
  console.log('MAIN FONT NAME:',mainFontName)
  const secondaryFontName = secondaryFont.replace(/\s/g, '').toLowerCase();
  console.log('SECONDARY FONT NAME:',secondaryFontName)

  const mainOtfFilePath = path.join('./templates/fonts/', `${mainFontName}.otf`);
  const mainTtfFilePath = path.join('./templates/fonts/', `${mainFontName}.ttf`);
  console.log('MAIN OTF FILE PATH:',mainOtfFilePath)
  console.log('MAIN TTF FILE PATH:',mainTtfFilePath)

  const secondaryOtfFilePath = path.join('./templates/fonts/', `${secondaryFontName}.otf`);
  console.log('SEcondary OTF FILE PATH:', secondaryOtfFilePath )
  const secondaryTtfFilePath = path.join('./templates/fonts/', `${secondaryFontName}.ttf`);
  console.log('SEcondary TTF FILE PATH:', secondaryTtfFilePath )


  const mainOtfFileExists = fs.existsSync(mainOtfFilePath);
  console.log('MAIN OTF FILE EXISTS:',mainOtfFileExists)
  const mainTtfFileExists = fs.existsSync(mainTtfFilePath);
  console.log('MAIN TTF FILE EXISTS:',mainTtfFileExists)

  const secondaryOtfFileExists = fs.existsSync(secondaryOtfFilePath);
  console.log('SECONDARY OTF FILE EXISTS', secondaryOtfFileExists)
  const secondaryTtfFileExists = fs.existsSync(secondaryTtfFilePath);
  console.log('Seocndary TTF FILE EXISTS:', secondaryTtfFileExists )

  if (mainOtfFileExists) {
    bookData.bookCoverDesign.mainFontPath = mainOtfFilePath;
  } else if (mainTtfFileExists) {
    bookData.bookCoverDesign.mainFontPath = mainTtfFilePath;
  }

  if (secondaryOtfFileExists) {
    bookData.bookCoverDesign.secondaryFontPath = secondaryOtfFilePath;
  } else if (secondaryTtfFileExists) {
    bookData.bookCoverDesign.secondaryFontPath = secondaryTtfFilePath;
  }

  return (mainOtfFileExists || mainTtfFileExists) && (secondaryOtfFileExists || secondaryTtfFileExists);
};
const genCoverDetails = async (bookData, schemas) => {
  let fontsExist = false;

  while (!fontsExist) {
    const title = bookData.bookMeta.bookTitle;
    const subtitle = bookData.bookMeta.bookSubtitle;
    const description = bookData.bookMeta.bookDescription;

    console.log('.............Generating Cover Designs............');

    const responseText = await callOpenAI(
      "gpt-3.5-turbo-16k",
      [
        {
          "role": "system",
          "content": `You are an expert designer / web developer whose knowledge of design trends is extremely proficient. Today you have been tasked to return the elements of a book cover design we are working on based on the title and the description of the book. We want font choice, font colour, primary colours, colour theme, etc. `,
        },
        { "role": "user", "content": `The title of the book is ${title} and the subtitle is: ${subtitle}. The description of the book is ${description}. Please generate the requested design elements.` },
      ],
      [{ "name": "Generate_coverdesign", "parameters": schemas.bookCoverDesign }],
      { "name": "Generate_coverdesign" },
      0.9,
      3700
    );

    // Parsing the response and updating bookData
    const response = JSON.parse(responseText);
    console.log (responseText)

    const mainFont = response.mainFont;
    const secondaryFont = response.secondaryFont;

    fontsExist = await checkFontFilesExist(bookData, mainFont, secondaryFont );
    if (!fontsExist) {
      console.log(`Font files for '${mainFont}' and '${secondaryFont}' do not exist. Retrying...`);
    } else {
      // Font files exist, update bookData and exit the loop
      bookData.bookCoverDesign.primaryColour = response.primaryColour;
      bookData.bookCoverDesign.primaryColourName = response.primaryColourName;
      bookData.bookCoverDesign.primaryCompColour = response.primaryCompColour;
      bookData.bookCoverDesign.primaryCompColourName = response.primaryCompColourName;
      bookData.bookCoverDesign.secondaryColour = response.secondaryColour;
      bookData.bookCoverDesign.secondaryCompColour = response.secondaryCompColour;
      bookData.bookCoverDesign.mainFont = mainFont;
      bookData.bookCoverDesign.secondaryFont = secondaryFont;
      bookData.bookCoverDesign.logoTheme = response.logoTheme;
      bookData.bookCoverDesign.coverStyle = response.coverStyle;

      console.log(chalk.green('Success. Cover Design Generated.'));
      console.log(chalk.cyan(`-----------------------------------------------------------------\n`));

      console.log(chalk.cyan('----------- Cover Design Meta ----------'));

      console.log(chalk.green('primaryColour:'), chalk.hex(response.primaryColour)(response.primaryColour));
      console.log(chalk.green('primaryColourName:'), response.primaryColourName);
      console.log(chalk.green('primaryCompColour:'), chalk.hex(response.primaryCompColour)(response.primaryCompColour));
      console.log(chalk.green('primaryCompColourName:'), response.primaryCompColourName);
      console.log(chalk.green('secondaryColour:'), chalk.hex(response.secondaryColour)(response.secondaryColour));
      console.log(chalk.green('secondaryCompColour:'), chalk.hex(response.secondaryCompColour)(response.secondaryCompColour));
      console.log(chalk.green('mainFont:'), response.mainFont);
      console.log(chalk.green('secondaryFont:'), response.secondaryFont);
      console.log(chalk.green('logoTheme:'), response.logoTheme);
      console.log(chalk.green('coverStyle:'), response.coverStyle);

      console.log(chalk.cyan('\n-------------------------------------------------------------\n'));
    }
  }
};
// generate more specific prompts for each piece of content
const downloadImage = async (url, dest) => {
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
  
    return new Promise((resolve, reject) => {
      fs.writeFile(dest, buffer, (err) => {
        if (err) reject(err);
        console.log('Image ' + dest + ' downloaded');
        resolve();
      });
    });
  } catch (err) {
    console.error(`Failed to download image from ${url}. Error: `, err);
    throw err;
  }
};
const genCoverMJ = async (bookData) => {
  // Create directory if not exist
  const dir = path.join(`./export/${bookData.bookMeta.bookTitle}/img/`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Initialize client
  const client = new Midjourney({
    ServerId: process.env.SERVER_ID,
    ChannelId: process.env.CHANNEL_ID,
    SalaiToken: process.env.SALAI_TOKEN,
    Ws: true,
  });

  // Connect to client
  await client.Connect();

  // Define variables
  const prompt = `${bookData.bookCoverIMGPrompt.imageStyle}` + ' of ' + `${bookData.bookCoverIMGPrompt.imageSubject}` + ' ' + `${bookData.bookCoverIMGPrompt.imageSubjectAction}` + `${bookData.bookCoverIMGPrompt.imageSubjectLocation}` + ', feeling ' + `${bookData.bookCoverIMGPrompt.imageSubjectEmotion}` + `, ` + `${bookData.bookCoverIMGPrompt.imageLighting}` + ` , ` + `${bookData.bookCoverIMGPrompt.imageColour}` + `, ` + `${bookData.bookCoverIMGPrompt.imageComposition}` + `, ` + `${bookData.bookCoverIMGPrompt.imageDescription}` + ', primary colour theme of ' + `${bookData.bookCoverDesign.primaryCompColourName}` + ', solid background, solid shapes, graphic design vector,';
  const ratio = "2:3";
  const mjModel = "5";

  // Log prompt
  console.log("Prompt Sending to Midjourney: " + prompt);

  // Use variables in Imagine function
  const Imagine = await client.Imagine(
    `${prompt}, --ar ${ratio} --v ${mjModel}`,
    (uri, progress) => {
      console.log("loading", uri, "progress", progress);
    }
  );

  // Log Imagine
  console.log(Imagine);

  // Check if Imagine exists
  if (!Imagine) {
    console.log("no message");
    return;
  }

  // Define indices
  const indices = [1];

  // Loop through indices
  for (let i = 0; i < indices.length; i++) {
    const Upscale = await client.Upscale({
      index: indices[i],
      msgId: Imagine.id,
      hash: Imagine.hash,
      flags: Imagine.flags,
      loading: (uri, progress) => {
        console.log("loading", uri, "progress", progress);
      },
    });

    // Log Upscale
    console.log(Upscale);

    // Download image and save in directory

      // Get current date and time
      // Construct file name
      const fileName = `${bookData.bookMeta.bookTitle}-img-${ratio}-Small-mj.png`;
      const imagePath = path.join(dir, fileName);
      await downloadImage(Upscale.proxy_url, imagePath);
    
  }

  // Close client
  client.Close();
};
async function upscaleCover(bookData) {

  console.log(chalk.yellow('Upscaling Image...'));
  const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
  });

  const modelVersion = "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";

  const imagePath = `./export/${bookData.bookMeta.bookTitle}/img/${bookData.bookMeta.bookTitle}-img-2:3-Small-mj.png`;
  const mimeType = 'image/png'; // Adjust this depending on your image format

  try {

    // Read the image file, convert to base64, and prepend with appropriate header
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const dataURI = `data:${mimeType};base64,${base64}`;

    // Run the model
    const output = await replicate.run(modelVersion, {
      input: {
        image: dataURI,
      },
    });
    console.log('Output:', output);

    // Model's output is an array of URLs. Here, we're only handling the first output.
    const outputUrl = output;
    console.log('Output URL:', outputUrl);

    // Download the output file
    const response = await fetch(outputUrl);
    const resultBuffer = await response.buffer();

    // Create target directory if it doesn't exist
    const targetDirectory = path.join('.', 'export', bookData.bookMeta.bookTitle, 'img');
    fs.mkdirSync(targetDirectory, { recursive: true });

    // Save the file locally
    const targetPath = path.join(targetDirectory, `${bookData.bookMeta.bookTitle}-UPSCALED-6x9.png`);
    fs.writeFileSync(targetPath, resultBuffer);
    console.log(chalk.green('Success. Image Upscaled.'))
    console.log(`Upscaled image saved at ${targetPath}`);
  } catch (err) {
    console.error('Error occurred while upscaling:', err);
    throw err;
  }
}


//#endregion
/// ---- HTML CANVAS AND DESIGN FUNCTIONS ---- ///

//#region 

const longestWordLength = (str) => {
  return str.split(' ')
              .sort((a, b) => b.length - a.length)
              [0].length;
};
const canvasFrontCover = async (bookData, author) => {
  const bgImagePath = path.join(`./export/${bookData.bookMeta.bookTitle}/img/${bookData.bookMeta.bookTitle}-UPSCALED-6x9.png`);
  const titleFont = bookData.bookCoverDesign.mainFont;
  console.log('title font', titleFont)
  const subtitleFont = bookData.bookCoverDesign.secondaryFont;
  console.log('subtitle font', subtitleFont)


  const titleFontPath = bookData.bookCoverDesign.mainFontPath;
  console.log('title Font Path',titleFontPath )
  const subtitleFontPath = bookData.bookCoverDesign.secondaryFontPath;
  console.log('subtitle font path', subtitleFontPath)
  
  if (!fs.existsSync(titleFontPath)) {
    console.log('Title font file does not exist:', titleFontPath);
    return;
  }
  
  if (!fs.existsSync(subtitleFontPath)) {
    console.log('Subtitle font file does not exist:', subtitleFontPath);
    return;
  }

  // Register the fonts
  await registerFont(titleFontPath, { family: titleFont });
  await registerFont(subtitleFontPath, { family: subtitleFont });

  //BG Image 
  //#region


console.log('Setting boundaries and typography...');

const image = await loadImage(bgImagePath);

// Load the texture image
const textureImagePath = './templates/textures/rough.jpg';
const textureImage = await loadImage(textureImagePath);

const canvas = createCanvas(3000, 4500);
const context = canvas.getContext('2d');

// Draw the background image scaled to fit the canvas
console.log('Drawing background image...');
const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
const newWidth = image.width * scale;
const newHeight = image.height * scale;
const xPositionImage = (canvas.width - newWidth) / 2;
const yPositionImage = (canvas.height - newHeight) / 2;
context.drawImage(image, xPositionImage, yPositionImage, newWidth, newHeight);

console.log('Applying texture...');

// Save the current globalCompositeOperation
const prevGlobalCompositeOperation = context.globalCompositeOperation;

// Set the blend mode to 'overlay'
context.globalCompositeOperation = 'multiply';

// Opacity of Texture
const prevGlobalAlpha = context.globalAlpha;
context.globalAlpha = 0.5;

// Draw the texture image over the entire canvas
console.log('Drawing texture image...');
context.drawImage(textureImage, 0, 0, canvas.width, canvas.height);

// Restore the previous globalCompositeOperation and globalAlpha
context.globalCompositeOperation = prevGlobalCompositeOperation;
context.globalAlpha = prevGlobalAlpha;

//#endregion


  
// MAIN TITLE 
//#region
const title = bookData.bookMeta.bookTitle;
const longestWordLen = longestWordLength(title);
const fontSizeTitle = (longestWordLen <= 3) ? 400 : 350; // Adjust font size as needed

context.textAlign = 'center';
context.font = `${fontSizeTitle}px "${titleFont}"`;
context.fillStyle = bookData.bookCoverDesign.primaryColour;
const lineHeightTitle = fontSizeTitle + 20; // Adjust line height as needed

// Capitalize the entire title
const titleCap = title.toUpperCase();

// Split the title into words
const wordsTitle = titleCap.split(' ');

// Calculate the total number of lines and the spacing between lines
const totalLines = wordsTitle.length;
const midLines = totalLines / 2;
const lineSpacing = lineHeightTitle;
const midLinesSpace = midLines * lineSpacing;
const TITLE_MARGIN_LEFT = 500; // Adjust margin as needed
const TITLE_MARGIN_RIGHT = 400; // Adjust margin as needed

let yPositionTitle = canvas.height / 3 - midLinesSpace; // Updated yPositionTitle calculation

// Function to check if there is enough margin above the title
const hasEnoughMarginAboveTitle = (yPosition) => {
const minMarginAboveTitle = 500;
return yPosition >= minMarginAboveTitle;
};

let currentLine = wordsTitle[0];
for (let i = 1; i < wordsTitle.length; i++) {
let word = wordsTitle[i];
let prevWord = wordsTitle[i - 1];
if (word.length <= 3 && prevWord.length <= 3 && (currentLine + ' ' + word).length <= 24) {
  currentLine += ' ' + word; // Add this short filler word to the current line
} else {
  let xPosition = canvas.width / 2; // Updated xPosition calculation

  // Check if there's enough margin above the title for the current line
  if (hasEnoughMarginAboveTitle(yPositionTitle)) {
    context.fillText(currentLine, xPosition, yPositionTitle);
  } else {
    // Shift down the title until the margin requirement is met
    while (!hasEnoughMarginAboveTitle(yPositionTitle)) {
      yPositionTitle += 10; // You can adjust this value as needed for the desired margin increment
    }
    context.fillText(currentLine, xPosition, yPositionTitle);
  }

  yPositionTitle += lineHeightTitle; // Move to the next line
  currentLine = word; // Start a new line with the current word
}

// If we are at the end of the title, print the line
if (i === wordsTitle.length - 1) {
  let xPosition = canvas.width / 2; // Updated xPosition calculation

  // Check if there's enough margin above the title for the last line
  if (hasEnoughMarginAboveTitle(yPositionTitle)) {
    context.fillText(currentLine, xPosition, yPositionTitle);
  } else {
    // Shift down the title until the margin requirement is met
    while (!hasEnoughMarginAboveTitle(yPositionTitle)) {
      yPositionTitle += 10; // You can adjust this value as needed for the desired margin increment
    }
    context.fillText(currentLine, xPosition, yPositionTitle);
  }
}
}
//#endregion

// Subtitle
//#region
const boxHeight = 400;
const marginBottom = 900;
const boxOpacity = 0.5; // Adjust between 0 (fully transparent) and 1 (fully opaque).
const subtitleTextMarginLeft = 300; // Margin to the left for the subtitle text
const subtitleTextMarginRight = 300; // Margin to the right for the subtitle text

context.globalAlpha = boxOpacity;

//Add drop shadow
context.shadowColor = 'rgba(0, 0, 0, 0.5)';  // Adjust color and alpha as desired
context.shadowBlur = 20;  // Adjust blur radius as desired
context.shadowOffsetX = 5;  // Adjust horizontal offset as desired
context.shadowOffsetY = 5;  // Adjust vertical offset as desired

context.fillStyle = bookData.bookCoverDesign.secondaryCompColour;
context.fillRect(0, canvas.height - boxHeight - marginBottom, canvas.width, boxHeight);

// Important: Reset alpha and remove shadow for subsequent drawing
context.globalAlpha = 1;
context.shadowColor = null;
context.shadowBlur = null;
context.shadowOffsetX = null;
context.shadowOffsetY = null;

const subtitle = bookData.bookMeta.bookSubtitle;
let fontSizeSubtitle = 150;
const subtitleFontColour = bookData.bookCoverDesign.secondaryColour;

context.font = `${fontSizeSubtitle}px "${subtitleFont}"`;
context.fillStyle = subtitleFontColour;
const verticalMidPoint = canvas.height - boxHeight - marginBottom + (boxHeight / 2) + (fontSizeSubtitle / 4);

// Check if the text width is too large for the canvas
let textMetrics = context.measureText(subtitle);
while (textMetrics.width > canvas.width - subtitleTextMarginLeft - subtitleTextMarginRight) {
  fontSizeSubtitle -= 3; // Reduce the font size
  context.font = `${fontSizeSubtitle}px "${subtitleFont}"`; // Set the new font size
  textMetrics = context.measureText(subtitle); // Measure the new text width
}

context.fillText(subtitle, canvas.width / 2, verticalMidPoint, canvas.width);
//#endregion



// Author
//#region 
const fontSizeAuthor = 350; // Adjust the value as needed
const authorName = bookData.bookMeta.author; 

console.log('Setting author...');
context.font = `${fontSizeAuthor}px "${subtitleFont}"`; // Use the separate fontSizeAuthor variable
const authorColour = bookData.bookCoverDesign.secondaryColour;
context.fillStyle = authorColour;

// Calculate the y-position for the author by finding the midpoint 
// between the bottom of the title section and the top of the box.
let yPositionAuthor = (canvas.height - boxHeight - marginBottom - yPositionTitle) / 2 + yPositionTitle;

// Center the author
let xPositionAuthor = (canvas.width - TITLE_MARGIN_LEFT - TITLE_MARGIN_RIGHT) / 2 + TITLE_MARGIN_LEFT;
context.fillText(authorName, xPositionAuthor, yPositionAuthor);
//#endregion
  // Logo 
//#region
  
// Price logo path based on bookData.bookCoverDesign.logoTheme
let pngLogoPath;
if (bookData.bookCoverDesign.logoTheme === 'light') {
  pngLogoPath = path.join(process.cwd(), 'templates', 'logos', 'logo-light.png');
} else { // 'dark' or any other value default to 'logo-dark.png'
  pngLogoPath = path.join(process.cwd(), 'templates', 'logos', 'logo-dark.png');
}

// Load the PNG logo file
const pngLogo = await loadImage(pngLogoPath);

// Define the relative size of the logo (in percentage)
const logoSizePercentage = 150; // Adjust this value as needed (e.g., 50% of the original size)

// Define the bottom margin (in pixels)
const bottomMarginPixels = 100; // Adjust this value as needed

// Calculate the new dimensions of the logo based on the percentage
const newLogoWidth = pngLogo.width * (logoSizePercentage / 100);
const newLogoHeight = pngLogo.height * (logoSizePercentage / 100);

// Calculate the position to center the logo at the bottom of the canvas with the bottom margin
const logoPositionX = (canvas.width - newLogoWidth) / 2;
const logoPositionY = canvas.height - newLogoHeight - bottomMarginPixels;

// Draw the PNG logo with the calculated dimensions and position
context.drawImage(pngLogo, logoPositionX, logoPositionY, newLogoWidth, newLogoHeight);
//#endregion


  // Save the canvas with the added logo as an image file
  const outputFilePath = `./export/${bookData.bookMeta.bookTitle}/img/COVER-6x9-${bookData.bookMeta.bookTitle}.jpg`;
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(outputFilePath, buffer);
  console.log('Cover Image Saved:', outputFilePath);
  const tempFilePath = `./temp/epubCover.jpg`;
  fs.writeFileSync(tempFilePath, buffer);
  console.log('Cover Image Saved:', tempFilePath);
};
const createFrontCover =  async (bookData, schemas ) => {
  await genCoverImgPrompt(bookData, schemas);
  await genCoverDetails(bookData, schemas);
  await genCoverMJ (bookData);
  await upscaleCover(bookData);
  await canvasFrontCover(bookData);
};
//#endregion
/// ---- Send To Amazon  Send To WP---- ///
//#region
const sendToAmazon = async(bookData, author) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  let bookTitle = bookData.bookMeta.bookTitle;
  let bookSubtitle = bookData.bookMeta.bookSubtitle;
  const bookDescription = bookData.bookMeta.bookDescription;
  const amazonKeyword1 = "HY I'M A SUBTITLE 1";
  const amazonKeyword2 = "HY I'M A SUBTITLE 2";
  const amazonKeyword3 = "HY I'M A SUBTITLE 3";
  const amazonKeyword4 = "HY I'M A SUBTITLE 4";
  const amazonKeyword5 = "HY I'M A SUBTITLE 5";
  const amazonKeyword6 = "HY I'M A SUBTITLE 6";
  const amazonKeyword7 = "HY I'M A SUBTITLE 7";
  const amazonCategory1 = "HY I'M A CATEGORY 1";
  const amazonCategory2 = "HY I'M A CATEGORY 2";
  const coverPath = `./export/${bookData.bookMeta.bookTitle}/img/COVER-6x9-${bookData.bookMeta.bookTitle}.jpg`;
  const authorFirstName = author.authorFirstName;
  const authorLastName = author.authorLastName;




  // ! Import cookies
  const cookiesString = await fsp.readFile("./src/kdpcookies.json", "utf-8");
  const cookies = JSON.parse(cookiesString);
  await page.setCookie(...cookies);
  await page.setDefaultTimeout(0);

  // ! Go to kdp dashboard
  await page.goto("https://kdp.amazon.com/en_US/title-setup/paperback/new/details?ref_=kdp_BS_D_cr_ti");
  await page.waitForTimeout(randomInt(1298, 1419));

  // ! Title
  await page.click("#data-print-book-title");
  randomInt(1298, 2419);
  await page.type("#data-print-book-title", bookTitle, {
    delay: 120,
  });

  // ! Subtitle
  randomInt(1298, 1419);
  await page.click("#data-print-book-subtitle");
  randomInt(298, 419);
  await page.type("#data-print-book-subtitle", bookSubtitle, {
    delay: 120,
  });

  // ! First name
  randomInt(298, 519);
  await page.click("#data-print-book-primary-author-first-name", authorFirstName);
  randomInt(28, 191);
  await page.type(
    "#data-print-book-primary-author-first-name",
    "Hi I'M A FIRST NAME",
    { delay: 120 }
  );

  // ! Last name
  randomInt(298, 419);
  await page.click("#data-print-book-primary-author-last-name", authorLastName);

  randomInt(298, 819);
  await page.type(
    "#data-print-book-primary-author-last-name",
    "HY I'M A LAST NAME",
    {
      delay: 120,
    }
  );

  // ! Description
  randomInt(118, 719);
  await page.click("#data-print-book-description");
  randomInt(192, 619);
  await page.type("#data-print-book-description", bookDescription, {
    delay: 120,
  });

  // ! Select no public domain
  await page.waitFor(randomInt(1298, 8419));
  await page.click("#non-public-domain", {
    delay: 25,
  });

  // !  SUBTITLE 1
  await page.waitFor(randomInt(2000, 3555));
  await page.click("#data-print-book-keywords-0");
  await page.type("#data-print-book-keywords-0", "HY I'M A SUBTITLE 1", {
    delay: randomInt(150, 250),
  });

  // !  SUBTITLE 2
  await page.waitFor(randomInt(2000, 3555));
  await page.click("#data-print-book-keywords-1");
  await page.type("#data-print-book-keywords-1", "HY I'M A SUBTITLE 2", {
    delay: randomInt(150, 250),
  });

  // !  SUBTITLE 3
  await page.waitFor(randomInt(2000, 3555));
  await page.click("#data-print-book-keywords-2");
  await page.type("#data-print-book-keywords-2", "HY I'M A SUBTITLE 3", {
    delay: randomInt(150, 250),
  });

  // !  SUBTITLE 4
  await page.waitFor(randomInt(2000, 3555));
  await page.click("#data-print-book-keywords-3");
  await page.type("#data-print-book-keywords-3", "HY I'M A SUBTITLE 4", {
    delay: randomInt(150, 250),
  });

  // !  SUBTITLE 5
  await page.waitFor(randomInt(2000, 3555));
  await page.click("#data-print-book-keywords-4");
  await page.type("#data-print-book-keywords-4", "HY I'M A SUBTITLE 5", {
    delay: randomInt(150, 250),
  });

  // !  SUBTITLE 6
  await page.waitFor(randomInt(2000, 3555));
  await page.click("#data-print-book-keywords-5");
  await page.type("#data-print-book-keywords-5", "HY I'M A SUBTITLE 6", {
    delay: randomInt(150, 250),
  });

  // !  SUBTITLE 7
  await page.waitFor(randomInt(2000, 3555));
  await page.click("#data-print-book-keywords-6");
  await page.type("#data-print-book-keywords-6", "HY I'M A SUBTITLE 7", {
    delay: randomInt(150, 250),
  });

  // ! Categories
  await page.click("#data-print-book-categories-button-proto-announce");
  await page.waitFor(5000);
  await page.waitFor(randomInt(5000, 5222));

  // ! Expand all links
  await page.$$eval("#category-chooser-popover .a-link-normal", (links) =>
    links.forEach((link) => link.click())
  );
  await page.waitFor(2000);
  await page.click("#data-print-book-categories-button-proto-announce");
  await page.click("#unsaved-changes-cancel-announce");
  await page.waitFor(25000);

  // ! Select the excact categories
  await page.$$eval(".a-label", (links) =>
    links.forEach((el) => {
      el.textContent === "Global Warming & Climate Change" ? el.click() : true;
      el.textContent === "Meteorology & Climatology" ? el.click() : true;
    })
  );
  // * Click save
  await page.waitFor(5000);
  await page.$$eval(".a-button-input", (elements) => elements[4].click());

  // ! Adult RadioButton
  await page.waitFor(randomInt(2000, 3000));
  await page.$$eval(".jele-override-input-width-radio input", (elements) =>
    elements[0].click()
  );

  // ! Save first page and continue
  await page.waitFor(randomInt(2000, 3000));
  await page.click("#save-and-continue-announce");

  // ! Get Free ISBN
  await page
    .waitForFunction(
      "document.querySelector('#free-print-isbn-btn-announce') && document.querySelector('#free-print-isbn-btn-announce').clientHeight != 0"
    )
    .then(() => console.log("got it!"));
  await page.click("#free-print-isbn-btn-announce");
  await page.waitFor(randomInt(1000, 2000));
  await page.click("#print-isbn-confirm-button-announce");
  await page.waitFor(randomInt(4000, 5000));

  // ! Upload Interior
  const inputUploadHandle = await page.$(
    "#data-print-book-publisher-interior-file-upload-AjaxInput"
  );
  let fileToUpload = `./export/${bookData.bookMeta.bookTitle}/files/${bookData.bookMeta.bookTitle}.pdf`;
  inputUploadHandle.uploadFile(fileToUpload);

  // ! Check if interior uploading is started
  await page
    .waitForXPath("//*[@class='success-header' and contains(., 'inside.pdf')]")
    .then((res) => console.log("Upload your interior process is started ✅"));

  // ! Check if interior processing is started
  await page
    .waitForXPath(
      "//*[@id='data-print-book-publisher-interior-file-upload-success' and contains(., 'Processing your file...')]"
    )
    .then((res) => console.log("Processing your interior is started... ✅"));

  // ! Check if interior processing is finished
  await page
    .waitForFunction(
      () =>
        document.querySelector(
          "#data-print-book-publisher-interior-file-upload-success > div > div"
        ).innerHTML === ""
    )
    .then((res) => console.log("your interior processing is finished ✅"));
  await page.waitFor(randomInt(2512, 3211));

  // ! Upload Cover
  await page
    .$$eval(
      "#data-print-book-publisher-cover-choice-accordion > div.a-box.a-last > div > div.a-accordion-row-a11y > a > i",
      (elements) => elements[0].click()
    )
    .then((el) => console.log("Upload your cover process is started ✅"));
  const CoverUploadHandle = await page.$(
    "#data-print-book-publisher-cover-file-upload-AjaxInput"
  );
  let coverFile = "./pdf/cover.pdf";
  CoverUploadHandle.uploadFile(coverFile);

  // ! Check if interior processing is started
  await page
    .waitForXPath(
      "//*[@id='data-print-book-publisher-cover-file-upload-success' and contains(., 'Processing your file...')]"
    )
    .then((res) => console.log("Processing your cover is started... ✅"));

  // ! Check if interior processing is finished
  await page
    .waitForFunction(
      () =>
        document.querySelector(
          "#data-print-book-publisher-cover-file-upload-success > div > div"
        ).innerHTML === ""
    )
    .then((res) => console.log("Your cover processing is finished 😎"));
  await page.waitFor(randomInt(5900, 6211));

  // ! Click Preview
  await page
    .click("#print-preview-noconfirm-announce")
    .then((res) => console.log("Click Preview"));
  await page
    .waitForFunction(() => document.querySelector(".coverSpine"))
    .then((res) => console.log("Your cover preview is fully loaded 😎"));

  await page.waitFor(randomInt(5500, 6500));

  // ! Click Save
  await page
    .click(" #printpreview_approve_button_enabled a")
    .then((res) => console.log("Click Save"));

  // ! Go to third page
  await page
    .waitForFunction(
      "document.querySelector('#save-and-continue-announce') && document.querySelector('#save-and-continue-announce').clientHeight != 0"
    )
    .then(() => console.log("got it 2!"));

  await page
    .click("#save-and-continue-announce")
    .then((res) => console.log("Going to third page "));

  // ! Type a Price
  await page
    .waitForFunction(
      "document.querySelector('#data-pricing-print-us-price-input > input') && document.querySelector('#data-pricing-print-us-price-input > input').clientHeight != 0"
    )
    .then(() => console.log("got it 3!"));
  await page.evaluate(
    () =>
      (document.querySelector(
        "#data-pricing-print-us-price-input > input"
      ).value = "")
  );
  await page.type("#data-pricing-print-us-price-input > input", "99.99", {
    delay: 120,
  });
  await page.waitFor(5000);

  // ! Click Expanded Distribution
  await page.click("#data-pricing-print label > i");

  // ! Click save to draft
  await page.waitFor(2000);
  await page.click("#save-announce");

  await page
    .waitForFunction(() =>
      document.querySelector(
        "#data-pricing-print div.a-column.a-span3.a-span-last > div > div > span"
      )
    )
    .then((res) => console.log("Prices are okay!"));
  //
};
//#endregion
//#region Main Function Call
const makeBook = async (bookData, author, schemas) => {
  await preBookShit(bookData, schemas);
  await generateBookContent(bookData, author, schemas);
  await createFrontCover(bookData, schemas);
  await saveShit(bookData);
  //await sendToAmazon(bookData);


  console.log(chalk.green('Success. Book Generated. You have created a book called: ' + bookData.bookMeta.bookTitle + '.' + bookData.bookMeta.bookSubtitle));

  //console.log (JSON.stringify(bookData.bookGenContent, null, 2));
};

makeBook(bookData, author, schemas);


//#endregion





//## TODO
// 
